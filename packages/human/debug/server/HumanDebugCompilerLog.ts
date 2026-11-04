import fs from "node:fs";

import type { IHumanDebugCompilerState } from "../contracts/IHumanDebugCompilerState";

/** Bytes of the log tail read; a cycle's diagnostics fit well inside it. */
const TAIL: number = 1 << 20;

/** Characters of diagnostics kept per cycle. */
const OUTPUT: number = 131072;

/**
 * Read the latest cycle of the separate `ttsc --watch` log.
 *
 * The server runs no checker: the one long-running collector, `ttsc --noEmit --watch` in `test/`,
 * appends every cycle to a log, and this reads the text after the last `[ttsc] rebuilding` line.
 * The cycle passed when it holds `[ttsc] watch build complete`, failed with `[ttsc] watch build
 * failed`, and is still checking otherwise. A missing or unreadable log is `unknown`, with the
 * reason as its output. The page and the image and batch routes report it as information.
 *
 * @param log Path of the log.
 * @returns The latest cycle's state.
 */
export function HumanDebugCompilerLog(log: string): IHumanDebugCompilerState {
  let text: string;
  try {
    const size: number = fs.statSync(log).size;
    const length: number = Math.min(size, TAIL);
    const handle: number = fs.openSync(log, "r");
    try {
      const buffer: Buffer = Buffer.alloc(length);
      fs.readSync(handle, buffer, 0, length, size - length);
      text = buffer.toString("utf8");
    } finally {
      fs.closeSync(handle);
    }
  } catch (error) {
    return { phase: "unknown", output: "No checker log: " + String(error), log, cycle: null };
  }

  // Colour escapes of the terminal output are removed so the panel shows plain text.
  text = text.replace(/\x1b\[[0-9;]*m/g, "");
  const start: number = text.lastIndexOf("[ttsc] rebuilding");
  if (start < 0) return { phase: "checking", output: "", log, cycle: null };
  const cycle: string = text.slice(start).split(/\r?\n/, 1)[0]!;
  const body: string = text.slice(start + cycle.length).replace(/^\r?\n/, "");
  return {
    phase: body.includes("[ttsc] watch build complete")
      ? "passed"
      : body.includes("[ttsc] watch build failed")
        ? "failed"
        : "checking",
    output: body
      .split(/\r?\n/)
      .filter((line: string): boolean => !line.startsWith("[ttsc] watch build"))
      .join("\n")
      .slice(-OUTPUT),
    log,
    cycle,
  };
}
