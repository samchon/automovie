import { TestValidator } from "@nestia/e2e";
import { resolveAutoMovieFfmpeg } from "automovie";

import { throwsError } from "../../../internal/predicates";

/** The production loader the resolver reads `ffmpeg-static` through. */
type FfmpegLoad = Parameters<typeof resolveAutoMovieFfmpeg>[0]["load"];

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
 */
export function test_unit_cli_cli_capture_ffmpeg_missing(): void {
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

  // 3. Not installed: the loader's own error reaches the caller.
  TestValidator.predicate(
    "not installed: the loader's error names ffmpeg-static",
    throwsError(
      (): string =>
        resolveAutoMovieFfmpeg({
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
        resolveAutoMovieFfmpeg({ env: { FFMPEG_PATH: " " }, load: load(null) }),
      "FFMPEG_PATH",
    ),
  );
  TestValidator.predicate(
    "no binary for the platform: names ffmpeg-static",
    throwsError(
      (): string => resolveAutoMovieFfmpeg({ env: {}, load: load(null) }),
      "ffmpeg-static",
    ),
  );
}