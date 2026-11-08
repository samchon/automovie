import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";

/**
 * Run one FFmpeg process, retaining only the last 64 KiB of stderr. Cancellation
 * or the encoder timeout kills the child and rejection waits for process close.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Node spawn passes an argument vector without shell interpretation; close establishes process completion and AbortSignal terminates cancellation through Node's supported child-process contract.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This helper owns only encoder lifetime and bounded diagnostics; planning and frame capture remain separate.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nonzero exit and spawn/abort failures reject with actual diagnostic output, without retries or replacement output.
 * @evidence contracts/development/common.md#meaningful-documentation States process count, shell-free arguments, diagnostic bound and cancellation ownership.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each stderr chunk copies at most its own bytes plus the retained 64 KiB tail; stdout is drained and discarded.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Encoding is an effectful single invocation and is not shared.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns one child until close; abort or the finite encoder timeout kills it, the timer clears on close, stdout is drained and stderr retention is capped at 65536 bytes.
 */
export function runViewerVideoEncoder(
  executable: string,
  args: string[],
  signal?: AbortSignal,
  timeoutMs: number = 1800000,
): Promise<string> {
  return new Promise<string>(
    (
      resolve: (value: string) => void,
      reject: (reason: unknown) => void,
    ): void => {
      const child: ChildProcessWithoutNullStreams = spawn(executable, args, {
        windowsHide: true,
        signal,
        stdio: "pipe",
      });
      let diagnostic: Buffer = Buffer.alloc(0);
      let failure: Error | undefined;
      const timer: NodeJS.Timeout = setTimeout((): void => {
        failure = new Error("FFmpeg exceeded its encoder timeout");
        child.kill();
      }, timeoutMs);
      child.stdin.end();
      child.stdout.resume();
      child.stderr.on("data", (chunk: Buffer): void => {
        diagnostic = Buffer.from(
          Buffer.concat([diagnostic, chunk]).subarray(-65536),
        );
      });
      child.on("error", (error: Error): void => {
        failure = error;
      });
      child.on("close", (code: number | null): void => {
        clearTimeout(timer);
        if (failure !== undefined) reject(failure);
        else if (code !== 0)
          reject(
            new Error(`FFmpeg exited ${code}: ${diagnostic.toString("utf8")}`),
          );
        else resolve(diagnostic.toString("utf8"));
      });
    },
  );
}
