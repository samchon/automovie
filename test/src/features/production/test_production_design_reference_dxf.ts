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
 * 2. Refuse every authored malformed family input at its owning production parsing stage.
 *
 * @evidence contracts/testing.md#behavioral-verification Inspects authored DXF text through production container dispatch, requiring null for an unselected memo, complete unmeasured LF/CRLF drawings and typed exact-stage refusal of malformed record/section/closure inputs.
 * @evidence contracts/testing.md#independent-expectations Paired integer group codes, named nonnested sections, ENDSEC and terminal EOF define the supported DXF framing contract independently of inspector output. Geometry/entity semantics and measured drawing extent are deliberately not proved.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts token-only noncandidate and valid LF/CRLF drawings with unclosed/nested sections, negative group code, odd record count, absent section name, missing EOF and no section; legal upper-code/whitespace/trailing boundaries belong to the adjacent DXF unit.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit owns all cases and reaches the actual production inspector through existing typed-refusal helpers with in-memory UTF-8 bytes; no native parser process or dynamic registration runs.
 */
export function test_production_design_reference_dxf(): void {
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

}
