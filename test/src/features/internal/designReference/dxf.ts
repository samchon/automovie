import { utf8 } from "./utf8";

/** Write one complete named DXF section and terminal EOF with caller-selected line endings. */
export const dxf = (eol = "\n"): Uint8Array =>
  utf8(
    [
      "0",
      "SECTION",
      "2",
      "HEADER",
      "9",
      "$ACADVER",
      "1",
      "AC1027",
      "0",
      "ENDSEC",
      "0",
      "EOF",
    ].join(eol),
  );
