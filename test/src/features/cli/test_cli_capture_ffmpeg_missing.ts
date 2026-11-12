import { TestValidator } from "@nestia/e2e";
import { resolveAutoMovieFfmpeg } from "automovie";

import { throwsError } from "../internal/predicates";

/**
 * A capture that plans a video finds FFmpeg in `FFMPEG_PATH`, else in the production's `ffmpeg-static`, and without either fails with an error naming both.
 *
 * Scenarios:
 *
 * 1. `FFMPEG_PATH` set to a path is used without loading `ffmpeg-static`.
 * 2. Without it, the path `ffmpeg-static` exports is used.
 * 3. A blank `FFMPEG_PATH` with no `ffmpeg-static` installed throws naming `FFMPEG_PATH` and `ffmpeg-static`.
 * 4. An installed `ffmpeg-static` that has no binary for the platform (it exports null) throws the same way.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the resolver with stated environments and package loaders and reads the path or the error; a resolver that loaded the package first, guessed `ffmpeg` on the search path, or refused without naming both sources fails.
 * @evidence contracts/development/testing.md#independent-expectations `ffmpeg-static` documents its export as the binary's path or null on an unsupported platform; the issue's case matrix requires the error to name `FFMPEG_PATH` and `ffmpeg-static`.
 * @evidence contracts/development/testing.md#distinguishing-cases The variable set, absent, and blank; the package installed with a path, with null, and missing.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_cli_capture_ffmpeg_missing`; the loader is a function of this test and no process starts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_cli_capture_ffmpeg_missing(): void {
  const loaded: string[] = [];
  const load: (binary: unknown) => (id: string) => unknown =
    (binary: unknown): ((id: string) => unknown) =>
    (id: string): unknown => {
      loaded.push(id);
      if (binary === undefined) throw new Error(`Cannot find module '${id}'`);
      return binary;
    };

  // 1. The environment wins.
  TestValidator.equals(
    "FFMPEG_PATH",
    resolveAutoMovieFfmpeg({
      env: { FFMPEG_PATH: "/opt/ffmpeg" },
      load: load("/static/ffmpeg"),
    }),
    "/opt/ffmpeg",
  );
  TestValidator.equals("ffmpeg-static is not loaded", loaded, []);

  // 2. The package's binary.
  TestValidator.equals(
    "ffmpeg-static",
    resolveAutoMovieFfmpeg({ env: {}, load: load("/static/ffmpeg") }),
    "/static/ffmpeg",
  );

  // 3 and 4. Neither.
  for (const [what, binary] of [
    ["not installed", undefined],
    ["no binary for the platform", null],
  ] as const) {
    TestValidator.predicate(
      `${what}: names FFMPEG_PATH`,
      throwsError(
        (): string =>
          resolveAutoMovieFfmpeg({
            env: { FFMPEG_PATH: " " },
            load: load(binary),
          }),
        "FFMPEG_PATH",
      ),
    );
    TestValidator.predicate(
      `${what}: names ffmpeg-static`,
      throwsError(
        (): string => resolveAutoMovieFfmpeg({ env: {}, load: load(binary) }),
        "ffmpeg-static",
      ),
    );
  }
}
