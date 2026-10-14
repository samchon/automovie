import {
  AutoMovieStructuredJsonError,
  parseAutoMovieStructuredJson,
} from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import { filmEffectValuesClose } from "../internal/filmEffectValuesClose";

const parse: (text: string) => unknown = (text: string): unknown =>
  parseAutoMovieStructuredJson({
    record: "automovie/registry.json",
    bytes: Buffer.from(text, "utf8"),
  });

const refusal: (bytes: Uint8Array) => unknown = (bytes: Uint8Array): unknown => {
  try {
    return parseAutoMovieStructuredJson({
      record: "automovie/registry.json",
      bytes,
    });
  } catch (error) {
    return error instanceof AutoMovieStructuredJsonError
      ? [error.stage, error.offset, error.pointer]
      : error;
  }
};

/**
 * Persistent JSON has one strict UTF-8 parse owner before schema admission.
 *
 * Scenarios:
 *
 * 1. Multibyte scalar text, a literal __proto__ member and array/scalar values materialize like an independent host JSON parser.
 * 2. Invalid UTF-8, a leading BOM and a trailing comma refuse at distinct stages and exact byte positions.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the real persistent JSON ingress over valid multibyte text/prototype-sensitive names and three malformed byte inputs, asserting complete value agreement, own __proto__ membership and exact encoding-versus-syntax stage/offset/pointer distinctions.
 * @evidence contracts/testing.md#independent-expectations Native JSON.parse independently supplies the supported valid JSON tree; the authored 0x80 lies at byte five, the BOM starts at byte zero and the comma leaves the required member at byte seven. This reference compares materialized JSON data and does not prove schema validity or object prototypes.
 * @evidence contracts/testing.md#distinguishing-cases Retains cent/euro/supplementary scalar text, __proto__, numeric/boolean/null array members, invalid encoding, BOM and malformed syntax. Duplicate-name scope and the full grammar matrix belong to sibling parser tests.
 * @evidence contracts/testing.md#execution-ownership The named test_production_structured_json_utf8_ingress owns portable synchronous in-memory decoding/parsing cases; no persistent file is read/written, schema consumer installed or process started.
 */
export function test_production_structured_json_utf8_ingress(): void {
  const materialized: unknown = parse('{"text":"¢€😀","__proto__":{"safe":true},"array":[1,false,null]}');
  TestValidator.predicate(
    "materialization preserves JSON values and a literal __proto__ member",
    (): boolean => filmEffectValuesClose(materialized, JSON.parse(
      '{"text":"¢€😀","__proto__":{"safe":true},"array":[1,false,null]}',
    )),
  );
  TestValidator.predicate("__proto__ is an own JSON member", (): boolean =>
    materialized !== null && typeof materialized === "object" && Object.hasOwn(materialized, "__proto__"));
  TestValidator.equals(
    "encoding, BOM and JSON syntax stages remain distinct",
    [
      refusal(new Uint8Array([0x7b, 0x22, 0x61, 0x22, 0x3a, 0x80, 0x7d])),
      refusal(Buffer.from("\ufeff{}", "utf8")),
      refusal(Buffer.from('{"a":1,}')),
    ],
    [
      ["encoding", 5, ""],
      ["syntax", 0, ""],
      ["syntax", 7, ""],
    ],
  );
}
