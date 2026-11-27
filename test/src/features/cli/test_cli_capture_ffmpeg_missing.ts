import { TestValidator } from "@nestia/e2e";
import { AutoMovieCliFfmpeg } from "automovie";

import { throwsError } from "../internal/predicates";

/** The production loader the resolver reads `ffmpeg-static` through. */
type FfmpegLoad = Parameters<typeof AutoMovieCliFfmpeg.resolve>[0]["load"];

/** What the test's `ffmpeg-static` exports: a path, null, or nothing installed. */
type FfmpegExport = ReturnType<FfmpegLoad> | undefined;

/**
 * A capture that plans a video finds FFmpeg in `FFMPEG_PATH`, else in the production's `ffmpeg-static`; an installed `ffmpeg-static` without a binary fails with an error naming both, and a missing one fails with the loader's own error.
 *
 * Scenarios:
 *
 * 1. `FFMPEG_PATH` set to a path is used without loading `ffmpeg-static`.
 * 2. Without it, the path `ffmpeg-static` exports is used.
 * 3. With no `ffmpeg-static` installed, the loader's error, which names `ffmpeg-static`, reaches the caller.
 * 4. An installed `ffmpeg-static` that has no binary for the platform (it exports null) throws naming `FFMPEG_PATH` and `ffmpeg-static`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the resolver with stated environments and package loaders and reads the path or the error; a resolver that loaded the package first, guessed `ffmpeg` on the search path, hid the loader's error, or refused a null export without naming both sources fails.
 * @evidence contracts/development/testing.md#independent-expectations `ffmpeg-static` documents its export as the binary's path or null on an unsupported platform; the issue's case matrix requires the null refusal to name `FFMPEG_PATH` and `ffmpeg-static`.
 * @evidence contracts/development/testing.md#distinguishing-cases The variable set, absent, and blank; the package installed with a path, with null, and missing.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_cli_capture_ffmpeg_missing`; the loader is a function of this test and no process starts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_cli_capture_ffmpeg_missing(): void {
  const loaded: string[] = [];
  const load: (binary: FfmpegExport) => FfmpegLoad =
    (binary: FfmpegExport): FfmpegLoad =>
    (id: "ffmpeg-static"): ReturnType<FfmpegLoad> => {
      loaded.push(id);
      if (binary === undefined) throw new Error(`Cannot find module '${id}'`);
      return binary;
    };

  // 1. The environment wins.
  TestValidator.equals(
    "FFMPEG_PATH",
    AutoMovieCliFfmpeg.resolve({
      env: { FFMPEG_PATH: "/opt/ffmpeg" },
      load: load("/static/ffmpeg"),
    }),
    "/opt/ffmpeg",
  );
  TestValidator.equals("ffmpeg-static is not loaded", loaded, []);

  // 2. The package's binary.
  TestValidator.equals(
    "ffmpeg-static",
    AutoMovieCliFfmpeg.resolve({ env: {}, load: load("/static/ffmpeg") }),
    "/static/ffmpeg",
  );

  // 3. Not installed: the loader's own error reaches the caller.
  TestValidator.predicate(
    "not installed: the loader's error names ffmpeg-static",
    throwsError(
      (): string =>
        AutoMovieCliFfmpeg.resolve({
          env: { FFMPEG_PATH: " " },
          load: load(undefined),
        }),
      "ffmpeg-static",
    ),
  );

  // 4. No binary for the platform.
  TestValidator.predicate(
    "no binary for the platform: names FFMPEG_PATH",
    throwsError(
      (): string =>
        AutoMovieCliFfmpeg.resolve({ env: { FFMPEG_PATH: " " }, load: load(null) }),
      "FFMPEG_PATH",
    ),
  );
  TestValidator.predicate(
    "no binary for the platform: names ffmpeg-static",
    throwsError(
      (): string => AutoMovieCliFfmpeg.resolve({ env: {}, load: load(null) }),
      "ffmpeg-static",
    ),
  );
}