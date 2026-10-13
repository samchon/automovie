import { TestValidator } from "@nestia/e2e";
import { utf8 } from "../internal/designReference/utf8";
import { dxf } from "../internal/designReference/dxf";
import { inspect } from "../internal/designReference/inspect";
import { stage } from "../internal/designReference/stage";
import { refuses } from "../internal/designReference/refuses";

/**
 * DXF group-code/value records close named sections and one terminal EOF while keeping the extent unsupported.
 *
 * Scenarios:
 *
 * 1. Admit the adjacent supported grammar and independently stated facts.
 * 2. Refuse every malformed family input at its owning native parsing stage.
 */
export const test_production_design_reference_dxf = (): void => {
  TestValidator.equals(
    "token-only and unclosed DXF remain refusals",
    [
      inspect("memo.dxf", utf8("memo: $ACADVER means version")) === null,
      refuses("open.dxf", utf8("0\nSECTION\n2\nHEADER\n0\nEOF")),
      refuses(
        "code.dxf",
        utf8("0\nSECTION\n2\nHEADER\n-1\nvalue\n0\nENDSEC\n0\nEOF"),
      ),
      refuses(
        "nested.dxf",
        utf8(
          "0\nSECTION\n2\nHEADER\n0\nSECTION\n2\nINNER\n0\nENDSEC\n0\nENDSEC\n0\nEOF",
        ),
      ),
    ],
    [true,true,true,true],
  );
  TestValidator.equals("LF and CRLF drawings remain unmeasured", [inspect("a.dxf",dxf()),inspect("b.dxf",dxf("\r\n"))], [{media:"image/vnd.dxf"},{media:"image/vnd.dxf"}]);
  TestValidator.equals(
    "native parser stages retain exact family and refusal identity",
    {
      dxfOddRecords: stage(
        "odd.dxf",
        utf8("0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nEOF\n9"),
      ),
      dxfSectionName: stage(
        "section-name.dxf",
        utf8("0\nSECTION\n9\nX\n0\nENDSEC\n0\nEOF"),
      ),
      dxfNoEof: stage(
        "no-eof.dxf",
        utf8("0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nEXTRA"),
      ),
      dxfNoSection: stage("no-section.dxf", utf8("9\n$ACADVER\n1\nAC1027")),
    },
    {
      dxfOddRecords: "DXF:records",
      dxfSectionName: "DXF:section",
      dxfNoEof: "DXF:closure",
      dxfNoSection: "DXF:closure",
    },
  );

};
