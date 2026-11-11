import {
  decodeAutoMovieArtifactJson,
  encodeAutoMovieArtifactJson,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import { isDeepStrictEqual } from "node:util";

/**
 * Artifact JSON restores accepted plain data exactly and refuses the rest.
 *
 * Scenarios:
 * 1. Nested objects, arrays, strings, booleans, null, -0, NaN and both infinities round-trip deeply and strictly equal.
 * 2. Undefined object members are omitted, as JSON omits them.
 * 3. Typed arrays, maps, class instances, functions, undefined array elements and a `$number` member refuse.
 * 4. An unknown tag and invalid UTF-8 refuse on decode.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Encodes and decodes through the public pair and compares with Node's isDeepStrictEqual, which distinguishes -0 from 0 and treats NaN as equal to itself; a codec that lost a special number or flattened a non-plain value fails.
 * @evidence contracts/development/testing.md#independent-expectations Expectations are the input values themselves (identity on accepted data) and the documented refusals.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers every special number, nested containers, the undefined member and element boundary, each refused kind and malformed bytes. Storage and resolution belong to the other cache tests.
 * @evidence contracts/development/testing.md#execution-ownership A millisecond unit over in-memory values; no file, process or browser runs. Discovered by the test runner from its exported name.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios and the property each pins.
 */
export function test_cache_artifact_json(): void {
  const value: unknown = {
    name: "body",
    flags: [true, false, null],
    numbers: [0, -0, 1.5e-300, Number.NaN, Infinity, -Infinity],
    nested: { chains: [{ points: [[0, -0, 3]] }], empty: {} },
  };
  TestValidator.predicate(
    "round trip",
    isDeepStrictEqual(
      decodeAutoMovieArtifactJson(encodeAutoMovieArtifactJson(value)),
      value,
    ),
  );
  TestValidator.predicate(
    "undefined member",
    isDeepStrictEqual(
      decodeAutoMovieArtifactJson(
        encodeAutoMovieArtifactJson({ kept: 1, dropped: undefined }),
      ),
      { kept: 1 },
    ),
  );
  for (const [title, refused] of [
    ["typed array", { data: new Float64Array(2) }],
    ["map", new Map()],
    ["class", new (class Point {})()],
    ["function", { run: (): void => undefined }],
    ["undefined element", [1, undefined]],
    ["reserved member", { $number: "-0" }],
  ] as const)
    TestValidator.error(
      title,
      (): Uint8Array => encodeAutoMovieArtifactJson(refused),
    );
  TestValidator.error("unknown tag", (): unknown =>
    decodeAutoMovieArtifactJson(
      new TextEncoder().encode('{"x":{"$number":"one"}}'),
    ),
  );
  TestValidator.error("invalid utf-8", (): unknown =>
    decodeAutoMovieArtifactJson(Uint8Array.from([0xff])),
  );
}
