/**
 * Find the FFmpeg executable a capture of a video file runs: `FFMPEG_PATH` when the environment sets it to a non-blank path, else the binary of the production's `ffmpeg-static`.
 *
 * It throws naming both `FFMPEG_PATH` and `ffmpeg-static` when neither gives a path, so a capture that plans a video says how to supply one before it touches its folder.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the order of the two sources and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation `ffmpeg-static` exports the path of the binary it downloaded, or null on a platform it has none for; the environment variable wins so a machine's own build can be used.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the variable, else load the package, else refuse.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No `ffmpeg` on the search path is guessed, because a capture records the binary it ran.
 * @evidence contracts/development/implementation.md#efficient-algorithms One module load at most.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Resolved once per capture.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a path and keeps nothing.
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
