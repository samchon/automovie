import {
  AutoMovieStructuredJsonError,
  parseAutoMovieStructuredJson,
} from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import { filmEffectValuesClose } from "../internal/filmEffectValuesClose";
import { nclose } from "../internal/predicates";
import { legacyImporterParseJson } from "../../../../packages/production/src/production/legacyImporterParseJson";
import { legacyImporterInvalidLegacyImportJsonError } from "../../../../packages/production/src/production/legacyImporterInvalidLegacyImportJsonError";

const outcome: (text: string) => unknown = (text: string): unknown => {
  try {
    return parseAutoMovieStructuredJson({
      record: "automovie/record.json",
      bytes: Buffer.from(text, "utf8"),
    });
  } catch (error) {
    return error instanceof AutoMovieStructuredJsonError
      ? `${error.stage}@${error.offset}${error.pointer}: ${error.message.slice(error.message.indexOf(":") + 2)}`
      : error;
  }
};

/**
 * The duplicate-aware parser names every JSON syntax refusal at its offset and
 * pointer instead of falling back to the host parser.
 *
 * Scenarios:
 *
 * 1. Every scalar and container form the grammar admits parses to the same
 *    value the host would produce, including every string escape.
 * 2. Trailing content, a missing member separator, a missing comma in an
 *    object or an array, an invalid or truncated escape, an unescaped control
 *    character, an unterminated string, an invalid number, a leading octal
 *    digit, a bare word, a non-string member name, and a truncated keyword are
 *    each refused at their exact position with the enclosing pointer.
 * 3. The import wrapper admits an existing valid scalar and retains the
 *    structured parser's typed cause and record/offset/pointer on refusal.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the public structured parser over admitted and malformed bytes, then the actual legacy import wrapper over existing valid/invalid inputs; exact values and typed cause facts catch grammar or cause loss without inspecting source text.
 * @evidence contracts/testing.md#independent-expectations Admitted values follow JSON grammar and refusals use manually counted ASCII offsets with enclosing JSON Pointers; the wrapper must preserve the canonical error class and those same diagnostics. These examples do not prove every possible grammar sequence.
 * @evidence contracts/testing.md#distinguishing-cases Covers scalars, empty containers, escapes, delimiters, malformed/truncated strings and numbers, trailing content and wrapper success/refusal. Sibling tests own duplicate members and UTF-8 ingress; filesystem verification and rollback are outside this unit.
 * @evidence contracts/testing.md#execution-ownership The named test entry runs portable parser and wrapper semantics synchronously through direct source imports; it creates no process, filesystem fixture, browser or GPU and does not claim public importer filesystem execution.
 */
export function test_production_structured_json_syntax(): void {
  TestValidator.predicate(
    "admitted syntax parses to the host value",
    (): boolean => filmEffectValuesClose([
      outcome(
        '{"a":[1,-2.5e3,true,false,null,"x\\u0041\\n\\"\\\\\\/\\b\\f\\r\\t"]}',
      ),
      outcome(" [ ] "),
      outcome("0"),
    ],
    [{ a: [1, -2500, true, false, null, 'xA\n"\\/\b\f\r\t'] }, [], 0]),
  );
  TestValidator.equals(
    "syntax refusals name the offset and enclosing pointer",
    [
      outcome("{} x"),
      outcome('{"a" 1}'),
      outcome('{"a":1 "b":2}'),
      outcome("[1 2]"),
      outcome('["\\q"]'),
      outcome('["\\u12"]'),
      outcome('[""]'),
      outcome('{"a":"open'),
      outcome("[-]"),
      outcome("[01]"),
      outcome("x"),
      outcome("{1:2}"),
      outcome("[tru]"),
    ],
    [
      "syntax@3: unexpected content after the root value",
      "syntax@5: expected ':' after member name",
      "syntax@7: expected ',' or '}'",
      "syntax@3: expected ',' or ']'",
      "syntax@3/0: invalid string escape",
      "syntax@3/0: invalid Unicode escape",
      "syntax@2/0: unescaped control character in string",
      "syntax@5/a: unterminated string",
      "syntax@1/0: invalid number",
      "syntax@2: expected ',' or ']'",
      "syntax@0: expected a JSON value",
      "syntax@1: expected an object member name",
      "syntax@1/0: expected true",
    ],
  );
  const scalar: unknown = legacyImporterParseJson(Buffer.from("0", "utf8"), "automovie/record.json");
  TestValidator.predicate(
    "the import wrapper preserves admitted scalar semantics",
    (): boolean => typeof scalar === "number" && nclose(scalar, 0, 1e-12),
  );
  let wrapped: unknown = undefined;
  try {
    legacyImporterParseJson(Buffer.from("{} x", "utf8"), "automovie/record.json");
  } catch (error) {
    wrapped = error;
  }
  TestValidator.predicate(
    "the import refusal retains the structured parser cause and context",
    (): boolean =>
      wrapped instanceof legacyImporterInvalidLegacyImportJsonError &&
      wrapped.cause instanceof AutoMovieStructuredJsonError &&
      wrapped.cause.record === "automovie/record.json" &&
      wrapped.cause.stage === "syntax" &&
      wrapped.cause.offset === 3 &&
      wrapped.cause.pointer === "",
  );
}
