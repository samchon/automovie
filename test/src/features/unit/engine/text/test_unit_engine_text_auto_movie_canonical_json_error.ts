import { AutoMovieCanonicalJsonError } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieCanonicalJsonError` names its refusal category and code.
 *
 * Scenarios:
 *
 * 1. The message states the category and the detail.
 * 2. The error is a `TypeError` carrying a fixed code and its own name.
 */
export function test_unit_engine_text_auto_movie_canonical_json_error(): void {
  const error: AutoMovieCanonicalJsonError = new AutoMovieCanonicalJsonError(
    "cyclic-value",
    "loop",
  );
  TestValidator.equals(
    "the message names the category and the detail",
    error.message,
    "AutoMovie canonical JSON refused cyclic-value: loop",
  );
  TestValidator.predicate(
    "a typed error with a fixed code and name",
    error instanceof TypeError &&
      error.code === "automovie-canonical-json-invalid" &&
      error.name === "AutoMovieCanonicalJsonError" &&
      error.category === "cyclic-value",
  );
}
