import { spawn } from "node:child_process";

/** Lines of FFmpeg's error output kept for a failure message. */
const TAIL: number = 12;

/**
 * Run FFmpeg once with the given arguments, resolving with its error output when it exits as `accept` allows and rejecting otherwise.
 *
 * FFmpeg writes its log, including a probe of every input, to its error output, so that text is what callers read. By default only exit status 0 is accepted; a probe that names no output exits 1 by design and accepts it. A rejection names the binary, the exit status and the last lines of the log.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is resolved, the acceptance rule and its default, and what a rejection names.
 * @evidence contracts/development/implementation.md#principled-implementation `child_process.spawn` without a shell passes each argument as it is, so a path with spaces or quotes needs no escaping.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Spawn, collect the error output, settle on exit.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A failed run is never retried, and a failure to start rejects with its cause.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the log FFmpeg writes.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each run is its own process.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The child process ends before the promise settles; its log is held until then.
 */
export function runAutoMovieFfmpeg(
  binary: string,
  args: readonly string[],
  accept: (code: number | null) => boolean = (code: number | null): boolean =>
    code === 0,
): Promise<string> {
  return new Promise<string>(
    (resolve: (log: string) => void, reject: (error: Error) => void): void => {
      const child: ReturnType<typeof spawn> = spawn(binary, [...args], {
        stdio: ["ignore", "ignore", "pipe"],
        windowsHide: true,
      });
      let log: string = "";
      child.stderr!.setEncoding("utf8");
      child.stderr!.on("data", (chunk: string): void => {
        log += chunk;
      });
      child.on("error", (error: Error): void =>
        reject(new Error(`FFmpeg ${binary} did not start`, { cause: error })),
      );
      child.on("close", (code: number | null): void => {
        if (accept(code)) resolve(log);
        else
          reject(
            new Error(
              `FFmpeg ${binary} exited with ${code}:\n${log.trimEnd().split(/\r?\n/u).slice(-TAIL).join("\n")}`,
            ),
          );
      });
    },
  );
}
