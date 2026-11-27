import {
  AutoMovieEngineCanonicalJsonError,
  AutoMovieEngineCanonicalJson,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `canonicalizeJson` encodes a value as JSON with members in code-unit
 * order and absent members left out.
 *
 * Scenarios:
 *
 * 1. Members sort by code unit: `{b:1,a:2}` is `{"a":2,"b":1}`.
 * 2. An undefined member is omitted, and an undefined array slot is `null`.
 * 3. Scalars and nested containers encode as in JSON.
 * 4. A class instance is a non-plain container, and a self-referencing object is
 *    cyclic.
 */
export function test_engine_text_canonicalize_auto_movie_json(): void {
  TestValidator.equals(
    "members sort by code unit",
    AutoMovieEngineCanonicalJson.canonicalize({ b: 1, a: 2 }),
    '{"a":2,"b":1}',
  );
  TestValidator.equals(
    "an undefined member is omitted and an undefined slot is null",
    AutoMovieEngineCanonicalJson.canonicalize({
      skip: undefined,
      list: [1, undefined],
    }),
    '{"list":[1,null]}',
  );
  TestValidator.equals(
    "scalars and nesting encode as JSON",
    AutoMovieEngineCanonicalJson.canonicalize({
      t: true,
      n: null,
      s: "x",
      o: { k: [0.5] },
    }),
    '{"n":null,"o":{"k":[0.5]},"s":"x","t":true}',
  );
  const refusal: (value: unknown) => string | null = (
    value: unknown,
  ): string | null => {
    try {
      AutoMovieEngineCanonicalJson.canonicalize(value);
      return null;
    } catch (error) {
      return error instanceof AutoMovieEngineCanonicalJsonError
        ? `${error.code}|${error.name}|${error.category}|${error.message.startsWith(`AutoMovie canonical JSON refused ${error.category}: `)}`
        : "other";
    }
  };
  const cycle: { self?: unknown } = {};
  cycle.self = cycle;
  TestValidator.equals(
    "a date is non-plain and a cycle is cyclic",
    [refusal(new Date(0)), refusal(cycle)],
    [
      "automovie-canonical-json-invalid|AutoMovieCanonicalJsonError|non-plain-container|true",
      "automovie-canonical-json-invalid|AutoMovieCanonicalJsonError|cyclic-value|true",
    ],
  );
}
