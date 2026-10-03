-- Bolão da Mega — schema para ativar em dezembro.
-- Rodar no SQL editor do Supabase. Storage: criar o bucket privado "comprovantes".

create table editions (
  year int primary key,
  quota_price int not null default 60,
  bet_price int not null default 6,
  pix_key text not null,
  pix_holder text not null,
  deadline date not null,
  draw_date date not null,
  status text not null default 'rascunho'
    check (status in ('rascunho', 'aberta', 'fechada', 'apostada'))
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  edition_year int not null references editions(year),
  token text not null unique, -- link pessoal secreto
  name text not null,
  contact text not null default '',
  quotas int not null check (quotas > 0),
  numbers int[] not null default '{}',
  numbers_at timestamptz, -- desempate do ranking
  receipt_path text, -- caminho no bucket "comprovantes"
  receipt_name text,
  receipt_type text,
  receipt_uploaded_at timestamptz,
  payment text not null default 'aguardando'
    check (payment in ('aguardando', 'em_analise', 'aprovado', 'recusado')),
  reject_reason text,
  created_at timestamptz not null default now(),
  constraint six_numbers check (
    cardinality(numbers) in (0, 6)
    and numbers <@ array(select generate_series(1, 60))
  )
);

create table games (
  edition_year int not null references editions(year),
  idx int not null,
  size int not null check (size between 6 and 20),
  cost int not null,
  numbers int[] not null,
  primary key (edition_year, idx)
);

-- RLS: participantes nunca leem a tabela direto. Leitura/escrita do participante
-- passa por rotas do servidor que validam o token; o admin usa service role.
alter table editions enable row level security;
alter table participants enable row level security;
alter table games enable row level security;
