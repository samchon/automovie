import { spawn } from "node:child_process";

import type { AutoMovieCliFfmpeg } from "../AutoMovieCliFfmpeg";

/*
 * Run FFmpeg once with the given arguments, resolving with its error output
 * when it exits as `accept` allows and rejecting otherwise.
 *
 * FFmpeg writes its log, including a probe of every input, to its error output,
 * so that text is what callers read. By default only exit status 0 is accepted;
 * a probe that names no output exits 1 by design and accepts it. A rejection
 * names the binary, the exit status and the last lines of the log.
 *
 * Output consumers, when provided, receive chunks as the child writes them. A
 * consumer failure terminates the child and rejects after it has closed.
 */
export function runFfmpeg(
  binary: string,
  args: readonly string[],
  accept: (code: number | null) => boolean = (code: number | null): boolean =>
    code === 0,
  output?: AutoMovieCliFfmpeg.IOutput,
): Promise<string> {
  return new Promise<string>(
    (resolve: (log: string) => void, reject: (error: Error) => void): void => {
      const child: ReturnType<typeof spawn> = spawn(binary, [...args], {
        stdio: [
          "ignore",
          output?.stdout === undefined ? "ignore" : "pipe",
          "pipe",
        ],
        windowsHide: true,
      });
      let log: string = "";
      let refusal: Error | undefined;
      const consume = <Chunk>(
        stream: "stdout" | "stderr",
        reader: ((chunk: Chunk) => void) | undefined,
        chunk: Chunk,
      ): void => {
        if (reader === undefined || refusal !== undefined) return;
        try {
          reader(chunk);
        } catch (cause) {
          const reason = cause instanceof Error ? cause.message : String(cause);
          refusal = new Error(
            `FFmpeg ${binary} ${stream} consumer failed: ${reason}`,
            { cause },
          );
          child.kill();
        }
      };
      child.stdout?.on("data", (chunk: Buffer): void =>
        consume("stdout", output?.stdout, chunk),
      );
      child.stderr!.setEncoding("utf8");
      child.stderr!.on("data", (chunk: string): void => {
        log += chunk;
        consume("stderr", output?.stderr, chunk);
      });
      child.on("error", (error: Error): void => {
        if (refusal === undefined)
          reject(new Error(`FFmpeg ${binary} did not start`, { cause: error }));
      });
      child.on("close", (code: number | null): void => {
        if (refusal !== undefined) reject(refusal);
        else if (accept(code)) resolve(log);
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

/*
 * Lines of FFmpeg's error output kept for a failure message.
 */
const TAIL: number = 12;
