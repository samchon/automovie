import ffmpeg from "ffmpeg-static";
import { spawnSync } from "node:child_process";

/**
 * Run the installed FFmpeg with the given arguments and wait for it.
 *
 * The binary is `FFMPEG_PATH` when set, otherwise the one `ffmpeg-static` installed. FFmpeg runs without its banner and progress, so only its errors reach this process's own output, where the command's report stays readable. It throws when no binary is found, when the binary cannot start and when it exits with a status other than zero.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which binary runs, what it prints and where, and the three refusals.
 * @evidence contracts/development/implementation.md#principled-implementation Arguments are passed as an array with no shell, so a file name with spaces or quotes reaches FFmpeg unchanged.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the binary, run it, check the outcome.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A failed start and a failing exit both throw; no partial output is reported as success.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The call starts one process and chooses no algorithm.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The video encode and the still extraction of the capture command both run through this one call.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The child process has ended before the call returns.
 */
export function runCaptureFfmpeg(args: readonly string[]): void {
  const binary: string = process.env.FFMPEG_PATH ?? ffmpeg ?? "";
  if (binary === "")
    throw new Error("Set FFMPEG_PATH; ffmpeg-static found no binary");
  const result: ReturnType<typeof spawnSync> = spawnSync(
    binary,
    ["-hide_banner", "-loglevel", "error", ...args],
    { stdio: "inherit" },
  );
  if (result.error !== undefined) throw result.error;
  if (result.status !== 0)
    throw new Error(`ffmpeg exited with ${result.status}`);
}
