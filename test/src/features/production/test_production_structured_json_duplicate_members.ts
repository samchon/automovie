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

const duplicate: (text: string) => unknown = (text: string): unknown => {
  try {
    return parse(text);
  } catch (error) {
    return error instanceof AutoMovieStructuredJsonError
      ? [error.stage, error.offset, error.pointer, error.member]
      : error;
  }
};

/**
 * Decoded member names are unique in every independent JSON object scope.
 *
 * Scenarios:
 *
 * 1. Root, escape-equivalent and nested repeated names refuse with exact stage/byte offset/object pointer/member.
 * 2. Sibling scopes, letter case and Unicode normalization distinctions remain separate names.
 * 3. A 258-level nested array exceeds the parser's declared depth bound.
 *
 * @evidence contracts/testing.md#behavioral-verification Parses actual authored UTF-8 JSON, requiring duplicate refusals before last-wins materialization, exact admitted sibling/case/normalization/slash/tilde trees and a syntax refusal for excessive nesting.
 * @evidence contracts/testing.md#independent-expectations ASCII texts place repeated names at bytes seven and sixteen; escape decoding makes a and u0061 the same name within one object, while separate objects and distinct Unicode sequences remain independent. Literal trees and 258 nesting levels specify outcomes without reusing parser output; the depth case checks the refusal stage, not its precise offset.
 * @evidence contracts/testing.md#distinguishing-cases Retains root/nested/escaped duplicates, same names in sibling scopes, upper/lowercase and composed/decomposed names, pointer-special names and over-depth syntax. Generic malformed grammar and UTF-8 byte stages belong to syntax/utf8_ingress tests.
 * @evidence contracts/testing.md#execution-ownership The named test_production_structured_json_duplicate_members owns all portable synchronous parser cases and its private typed arrangements, with no filesystem record, process or dynamically registered tests.
 */
export function test_production_structured_json_duplicate_members(): void {
  TestValidator.equals(
    "root and nested duplicates fail before a last-wins value can escape",
    [
      duplicate('{"a":1,"a":2}'),
      duplicate('{"a":1,"\\u0061":2}'),
      duplicate('{"outer":{"x":1,"x":2}}'),
    ],
    [
      ["duplicate", 7, "", "a"],
      ["duplicate", 7, "", "a"],
      ["duplicate", 16, "/outer", "x"],
    ],
  );
  TestValidator.predicate(
    "sibling scope, case and normalization distinctions remain admitted",
    (): boolean => filmEffectValuesClose([
      parse('{"left":{"a":1},"right":{"a":2}}'),
      parse('{"a":1,"A":2,"é":3,"é":4}'),
      parse('{"a/b":{"~x":1}}'),
    ],
    [
      { left: { a: 1 }, right: { a: 2 } },
      { a: 1, A: 2, é: 3, é: 4 },
      { "a/b": { "~x": 1 } },
    ]),
  );
  const nesting: unknown = duplicate(`${"[".repeat(258)}0${"]".repeat(258)}`);
  TestValidator.predicate(
    "pathological nesting is refused by the declared parser bound",
    (): boolean => Array.isArray(nesting) && nesting[0] === "syntax",
  );
}
