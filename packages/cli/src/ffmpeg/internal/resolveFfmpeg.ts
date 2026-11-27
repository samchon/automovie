import type { AutoMovieFfmpegStaticPath } from "./AutoMovieFfmpegStaticPath";
import type { IAutoMovieFfmpegSources } from "../IAutoMovieFfmpegSources";

/*
 * Find the FFmpeg executable a capture of a video file runs: `FFMPEG_PATH` when
 * the environment sets it to a non-blank path, else the binary of the
 * production's `ffmpeg-static`.
 *
 * A production without `ffmpeg-static` installed refuses with the loader's own
 * error, which names the package and the production; one whose `ffmpeg-static`
 * has no binary for this platform refuses naming both `FFMPEG_PATH` and
 * `ffmpeg-static`, so a capture that plans a video says how to supply one
 * before it touches its folder.
 * Parameter props: The environment and the production's loader.
 * Returns: The executable's path.
 */
export function resolveFfmpeg(props: IAutoMovieFfmpegSources): string {
  const given: string | undefined = props.env.FFMPEG_PATH?.trim();
  if (given !== undefined && given !== "") return given;
  const binary: AutoMovieFfmpegStaticPath = props.load("ffmpeg-static");
  if (binary !== null) return binary;
  throw new Error(
    "A video capture needs FFmpeg: set FFMPEG_PATH to an ffmpeg executable, or install ffmpeg-static in the production",
  );
}