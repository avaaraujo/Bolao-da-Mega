import { ImageResponse } from "next/og";
import { inkHoles, INK } from "./_og/riso";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** A mesma marca do favicon, em papel de ponta a ponta (o iOS arredonda os cantos). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: INK.paper,
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            width: 124,
            height: 124,
            border: `7px solid ${INK.blue}`,
            borderRadius: 14,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 15,
              top: 9,
              width: 82,
              height: 82,
              borderRadius: 999,
              background: INK.pink,
            }}
          />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={inkHoles(180, 180)} width={180} height={180} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
      </div>
    ),
    size,
  );
}
