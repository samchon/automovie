import { TestValidator } from "@nestia/e2e";

import { inspect } from "../internal/designReference/inspect";
import { stage } from "../internal/designReference/stage";
import { utf8 } from "../internal/designReference/utf8";

/**
 * DXF candidate selection and section closure retain exact record boundaries.
 *
 * Scenarios:
 *
 * 1. Admit legal whitespace, two named sections and the maximum group code.
 * 2. Refuse fractional/out-of-range codes, empty section names, absent ENDSEC
 *    and trailing records after EOF, while plain noncandidates remain null.
 *
 * @evidence contracts/testing.md#behavioral-verification Inspects DXF boundary spellings and asserts unmeasured admission, exact typed refusal stages or noncandidate null, catching permissive code coercion, empty section names or ignored trailing records.
 * @evidence contracts/testing.md#independent-expectations Authored group-code boundaries 1071/1072 and integer spelling, section framing and terminal EOF supply expectations independently of parser output; admitted drawings still carry no inferred geometric extent.
 * @evidence contracts/testing.md#distinguishing-cases Covers padded fields, adjacent sections and maximum legal code versus fractional/next code, empty name, missing ENDSEC and trailing records, plus plain and empty noncandidates; line-ending and nested-section cases belong to the DXF unit.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit calls the production inspector through existing helpers with authored UTF-8 bytes and owns all assertions, without filesystem or host effects or dynamic cases.
 */
export function test_production_design_reference_dxf_boundaries(): void {
  TestValidator.equals(
    "legal adjacent sections remain an unmeasured drawing",
    inspect("sections.dxf",utf8(" 0 \n SECTION \n 2 \n HEADER \n 1071 \n value \n 0 \n ENDSEC \n0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF")),
    { media: "image/vnd.dxf" },
  );
  TestValidator.equals(
    "drawing grammar closes all records rather than trusting a candidate token",
    [
      stage("fraction.dxf",utf8("0\nSECTION\n2\nHEADER\n1.5\nx\n0\nENDSEC\n0\nEOF")),
      stage("range.dxf",utf8("0\nSECTION\n2\nHEADER\n1072\nx\n0\nENDSEC\n0\nEOF")),
      stage("name.dxf",utf8("0\nSECTION\n2\n\n0\nENDSEC\n0\nEOF")),
      stage("end.dxf",utf8("0\nSECTION\n2\nHEADER")),
      stage("tail.dxf",utf8("0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nEOF\n9\nx")),
      inspect("plain.txt",utf8("ordinary document")),
      inspect("empty.txt",utf8("")),
    ],
    ["DXF:records","DXF:records","DXF:section","DXF:closure","DXF:closure",null,null],
  );
}
