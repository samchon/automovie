/**
 * Find the FFmpeg executable a capture of a video file runs: `FFMPEG_PATH` when
 * the environment sets it to a non-blank path, else the binary of the
 * production's `ffmpeg-static`.
 *
 * It throws naming both `FFMPEG_PATH` and `ffmpeg-static` when neither gives a
 * path, so a capture that plans a video says how to supply one before it
 * touches its folder.
 */
export function resolveAutoMovieFfmpeg(props: {
  /** The environment, read for `FFMPEG_PATH`. */
  env: Readonly<Record<string, string | undefined>>;

  /** Loads a package from the production, throwing when it is not installed. */
  load: (id: string) => unknown;
}): string {
  const given: string | undefined = props.env.FFMPEG_PATH?.trim();
  if (given !== undefined && given !== "") return given;
  let binary: unknown = null;
  try {
    binary = props.load("ffmpeg-static");
  } catch {
    binary = null;
  }
  if (typeof binary === "string" && binary !== "") return binary;
  throw new Error(
    "A video capture needs FFmpeg: set FFMPEG_PATH to an ffmpeg executable, or install ffmpeg-static in the production",
  );
}
