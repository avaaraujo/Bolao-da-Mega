-- Bolão da Mega — schema multi-bolão (uma "sala" por bolão, cada uma com seu dono).
-- Admins entram por Supabase Auth (e-mail e senha); participantes entram pelo código da sala
-- e usam um link pessoal com token. Participantes nunca leem tabelas direto: só pelas funções abaixo.
-- Dados reais ficam só no banco; este arquivo não tem nenhum.

create table public.bolaos (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                       -- ex.: FIRMA-7K3Q (aleatório, não adivinhável)
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 2 and 60),
  quota_price int not null default 60 check (quota_price > 0),
  bet_price int not null default 6 check (bet_price > 0),
  pix_key text not null default '',
  pix_holder text not null default '',
  deadline date not null,
  draw_date date not null,
  status text not null default 'rascunho'
    check (status in ('rascunho', 'aberta', 'fechada', 'apostada')),
  games jsonb,                                     -- jogos confirmados pelo organizador
  created_at timestamptz not null default now()
);
create index bolaos_owner_idx on public.bolaos(owner_id);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  bolao_id uuid not null references public.bolaos(id) on delete cascade,
  token text not null unique,                      -- link pessoal secreto
  name text not null check (char_length(name) between 1 and 80),
  contact text not null default '',
  quotas int not null check (quotas > 0 and quotas <= 1000),
  numbers int[] not null default '{}',
  numbers_at timestamptz,                          -- desempate do ranking
  receipt_path text,                               -- caminho no bucket "comprovantes"
  receipt_name text,
  receipt_type text,
  receipt_uploaded_at timestamptz,
  payment text not null default 'aguardando'
    check (payment in ('aguardando', 'em_analise', 'aprovado', 'recusado')),
  reject_reason text,
  ai_check jsonb,                                  -- leitura da IA do comprovante atual (ver claim_ai_check)
  ai_checks_count int not null default 0,          -- limite de leituras pagas por participante
  created_at timestamptz not null default now(),
  constraint six_numbers check (
    cardinality(numbers) in (0, 6)
    and numbers <@ array[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,
                         31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60]
  )
);
create index participants_bolao_idx on public.participants(bolao_id);

alter table public.bolaos enable row level security;
alter table public.participants enable row level security;

-- Dono: acesso total ao que é seu.
create policy bolaos_owner on public.bolaos
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy participants_owner on public.participants
  for all to authenticated
  using (exists (select 1 from public.bolaos b where b.id = bolao_id and b.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.bolaos b where b.id = bolao_id and b.owner_id = (select auth.uid())));

-- ---------------------------------------------------------------- criar bolão
create or replace function public.create_bolao(
  p_name text, p_quota_price int, p_bet_price int, p_pix_key text, p_pix_holder text,
  p_deadline date, p_draw_date date
) returns public.bolaos
language plpgsql security invoker set search_path = public, extensions as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  prefix text;
  suffix text;
  result public.bolaos;
  tries int := 0;
begin
  if auth.uid() is null then raise exception 'Faça login para criar um bolão.'; end if;
  prefix := left(regexp_replace(upper(p_name), '[^A-Z]', '', 'g'), 5);
  if char_length(prefix) < 3 then prefix := 'BOLAO'; end if;
  loop
    suffix := '';
    for i in 1..4 loop
      suffix := suffix || substr(alphabet, 1 + (get_byte(gen_random_bytes(1), 0) % 31), 1);
    end loop;
    begin
      insert into public.bolaos (code, name, quota_price, bet_price, pix_key, pix_holder, deadline, draw_date, status)
      values (prefix || '-' || suffix, trim(p_name), p_quota_price, p_bet_price, coalesce(p_pix_key, ''),
              coalesce(p_pix_holder, ''), p_deadline, p_draw_date, 'aberta')
      returning * into result;
      return result;
    exception when unique_violation then
      tries := tries + 1;
      if tries > 10 then raise; end if;
    end;
  end loop;
end $$;

-- ---------------------------------------------------------------- visão pública da sala
-- Devolve a sala e os participantes SEM token, contato nem comprovante, e SEM números (nem jogos)
-- até o status "apostada", exceto as linhas cujo
-- token o aparelho informa (as próprias inscrições de quem está olhando).
create or replace function public.get_public_snapshot(p_code text, p_tokens text[] default '{}')
returns jsonb
language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'bolao', jsonb_build_object(
      'id', b.id, 'code', b.code, 'name', b.name, 'quotaPrice', b.quota_price, 'betPrice', b.bet_price,
      'pixKey', b.pix_key, 'pixHolder', b.pix_holder, 'deadline', b.deadline, 'drawDate', b.draw_date,
      'status', b.status),
    'games', case when b.status = 'apostada' then b.games else null end,
    'participants', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'token', case when p.token = any(p_tokens) then p.token else '' end,
        'name', p.name,
        'contact', case when p.token = any(p_tokens) then p.contact else '' end,
        'quotas', p.quotas,
        'numbers', case when p.token = any(p_tokens) or b.status = 'apostada' then to_jsonb(p.numbers) else '[]'::jsonb end,
        'numbersAt', case when p.token = any(p_tokens) or b.status = 'apostada' then p.numbers_at else null end,
        'receipt', case when p.token = any(p_tokens) and p.receipt_name is not null then
            jsonb_build_object('name', p.receipt_name, 'type', p.receipt_type, 'uploadedAt', p.receipt_uploaded_at)
          else null end,
        'payment', p.payment,
        'rejectReason', case when p.token = any(p_tokens) then p.reject_reason else null end,
        'createdAt', p.created_at) order by p.created_at)
      from public.participants p where p.bolao_id = b.id), '[]'::jsonb))
  from public.bolaos b where b.code = upper(p_code);
$$;

-- ---------------------------------------------------------------- ações do participante
create or replace function public.join_bolao(p_code text, p_name text, p_contact text, p_quotas int)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare b public.bolaos; p public.participants;
begin
  select * into b from public.bolaos where code = upper(p_code);
  if not found then raise exception 'Bolão não encontrado.'; end if;
  if b.status <> 'aberta' then raise exception 'As inscrições estão fechadas.'; end if;
  insert into public.participants (bolao_id, token, name, contact, quotas)
  values (b.id, encode(gen_random_bytes(12), 'hex'), trim(p_name), trim(coalesce(p_contact, '')), p_quotas)
  returning * into p;
  return jsonb_build_object('id', p.id, 'token', p.token, 'name', p.name, 'contact', p.contact, 'quotas', p.quotas,
    'numbers', p.numbers, 'numbersAt', null, 'receipt', null, 'payment', p.payment, 'rejectReason', null,
    'createdAt', p.created_at, 'bolaoId', b.id);
end $$;

create or replace function public.attach_receipt(p_token text, p_path text, p_name text, p_type text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.participants
     set receipt_path = p_path, receipt_name = p_name, receipt_type = p_type,
         receipt_uploaded_at = now(), payment = 'em_analise', reject_reason = null, ai_check = null
   where token = p_token;
  if not found then raise exception 'Participante não encontrado.'; end if;
end $$;

create or replace function public.set_numbers(p_token text, p_numbers int[])
returns void
language plpgsql security definer set search_path = public as $$
declare st text;
begin
  select b.status into st from public.participants p join public.bolaos b on b.id = p.bolao_id where p.token = p_token;
  if st is null then raise exception 'Participante não encontrado.'; end if;
  if st <> 'aberta' then raise exception 'Os números não podem mais ser alterados.'; end if;
  update public.participants
     set numbers = (select coalesce(array_agg(n order by n), '{}') from unnest(p_numbers) n), numbers_at = now()
   where token = p_token;
end $$;

-- Usada pela policy de upload do bucket (anon não lê participants).
create or replace function public.token_belongs_to_bolao(p_bolao text, p_token text)
returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.participants where token = p_token and bolao_id::text = p_bolao);
$$;

-- ---------------------------------------------------------------- conferência por IA
-- Organizadores com a leitura de comprovantes por IA liberada (custa chamada de API).
create table public.ai_reviewers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.ai_reviewers enable row level security;
create policy ai_reviewers_self on public.ai_reviewers
  for select to authenticated using (user_id = (select auth.uid()));

-- Reserva a leitura de um comprovante (evita duas chamadas pagas para o mesmo arquivo).
-- false se já há resultado para esse arquivo, se outra leitura roda há menos de 2 min,
-- ou se o participante já gastou o limite. Só o servidor (service_role) chama.
create or replace function public.claim_ai_check(p_id uuid, p_path text, p_force boolean default false)
returns boolean
language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  update public.participants
     set ai_check = jsonb_build_object('state', 'running', 'path', p_path, 'startedAt', now()),
         ai_checks_count = ai_checks_count + 1
   where id = p_id
     and receipt_path = p_path
     and ai_checks_count < 8
     and (
       ai_check is null
       or ai_check->>'path' is distinct from p_path
       or (ai_check->>'state' = 'running' and (ai_check->>'startedAt')::timestamptz < now() - interval '2 minutes')
       or (p_force and ai_check->>'state' = 'done')
     )
  returning true into ok;
  return coalesce(ok, false);
end $$;

-- Só as funções de participante ficam abertas para anon; o resto é restrito.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.get_public_snapshot(text, text[]) to anon, authenticated;
grant execute on function public.join_bolao(text, text, text, int) to anon, authenticated;
grant execute on function public.attach_receipt(text, text, text, text) to anon, authenticated;
grant execute on function public.set_numbers(text, int[]) to anon, authenticated;
grant execute on function public.token_belongs_to_bolao(text, text) to anon, authenticated;
grant execute on function public.create_bolao(text, int, int, text, text, date, date) to authenticated;
grant execute on function public.claim_ai_check(uuid, text, boolean) to service_role;

-- ---------------------------------------------------------------- comprovantes (bucket privado)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comprovantes', 'comprovantes', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

-- Caminho: <bolao_id>/<token do participante>/<arquivo>
create policy comprovantes_upload on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'comprovantes'
    and public.token_belongs_to_bolao((storage.foldername(name))[1], (storage.foldername(name))[2]));

create policy comprovantes_owner_read on storage.objects
  for select to authenticated
  using (bucket_id = 'comprovantes'
    and exists (select 1 from public.bolaos b
                -- `objects.name` qualificado: sem isso, `name` vira `bolaos.name` dentro da subconsulta.
                where b.id::text = (storage.foldername(objects.name))[1] and b.owner_id = (select auth.uid())));
