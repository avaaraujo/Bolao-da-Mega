import { ImageResponse } from "next/og";
import { fonts, inkHoles, INK, registration } from "./_og/riso";

export const alt = "Bolão da Mega: o título em cartaz ao lado de um volante com números carimbados de rosa.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TITLE = ["BOLÃO", "DA MEGA"];
const TITLE_SIZE = 200;
const STAMPED = [4, 11, 23, 37, 42, 58];
const CELL_W = 82;
const CELL_H = 64;
const RULE = 3;

/** O cartaz do bolão: título em duas passadas de tinta e o volante carimbado sangrando pela borda. */
export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ position: "relative", display: "flex", width: "100%", height: "100%", background: INK.paper }}>
        {/* Volante inclinado, cortado pela borda como um bilhete colado no zine. */}
        <div
          style={{
            position: "absolute",
            left: 676,
            top: 34,
            display: "flex",
            flexWrap: "wrap",
            width: CELL_W * 6 + RULE * 7,
            padding: RULE,
            gap: RULE,
            background: INK.blue,
            borderRadius: 4,
            transform: "rotate(-4deg)",
          }}
        >
          {Array.from({ length: 60 }, (_, i) => i + 1).map((n) => {
            const on = STAMPED.includes(n);
            return (
              <div
                key={n}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: CELL_W,
                  height: CELL_H,
                  background: INK.paper,
                }}
              >
                {on && (
                  <div
                    style={{
                      position: "absolute",
                      left: (CELL_W - 52) / 2,
                      top: (CELL_H - 52) / 2,
                      width: 52,
                      height: 52,
                      borderRadius: 999,
                      background: INK.pink,
                      transform: registration(n),
                    }}
                  />
                )}
                <div style={{ position: "relative", fontFamily: "Archivo", fontWeight: 600, fontSize: 30, color: INK.blueDeep }}>
                  {String(n).padStart(2, "0")}
                </div>
              </div>
            );
          })}
        </div>

        {/* Só o título, centrado na altura da folha. */}
        <div
          style={{ position: "absolute", left: 64, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}
        >
          {/* Duas passadas: azul por baixo, deslocado; rosa por cima. */}
          <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
            <div
              style={{
                position: "absolute",
                left: TITLE_SIZE * 0.04,
                top: TITLE_SIZE * 0.045,
                display: "flex",
                flexDirection: "column",
                fontFamily: "Anybody",
                fontSize: TITLE_SIZE,
                lineHeight: 0.84,
                color: INK.blue,
              }}
            >
              {TITLE.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
            <div
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                fontFamily: "Anybody",
                fontSize: TITLE_SIZE,
                lineHeight: 0.84,
                color: INK.pink,
              }}
            >
              {TITLE.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>

        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={inkHoles(1200, 630)} width={1200} height={630} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
      </div>
    ),
    { ...size, fonts: await fonts() },
  );
}
