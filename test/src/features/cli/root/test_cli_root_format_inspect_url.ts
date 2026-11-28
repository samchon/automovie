import { TestValidator } from "@nestia/e2e";
import { AutoMovieCliInspect } from "automovie";

/**
 * `AutoMovieCliInspect.formatUrl` appends the request's pairs as a query by
 * `URLSearchParams` encoding (WHATWG URL Standard, application/x-www-form-
 * urlencoded serializer), or returns the base alone for no pair.
 *
 * Scenarios:
 *
 * 1. No pair: the base.
 * 2. [["parts", "hero/torso"], ["at", "1 2"]]: "parts=hero%2Ftorso&at=1+2".
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines passing through a bare inspection URL and ordered query encoding for provided pairs.
 * @evidence contracts/development/testing.md#behavioral-verification Formats the same base without any values and with a path and a spaced time value.
 * @evidence contracts/development/testing.md#independent-expectations The explicit expected query encodes slash as %2F and space as +, keeping the input pair order.
 */
export function test_cli_root_format_inspect_url(): void {
  TestValidator.equals(
    "no pair",
    AutoMovieCliInspect.formatUrl("http://127.0.0.1:8080/", []),
    "http://127.0.0.1:8080/",
  );
  TestValidator.equals(
    "encoded pairs",
    AutoMovieCliInspect.formatUrl("http://h/", [
      ["parts", "hero/torso"],
      ["at", "1 2"],
    ]),
    "http://h/?parts=hero%2Ftorso&at=1+2",
  );
}
