import fs from "node:fs";
import path from "node:path";
import type { IBodyDrawnFrame } from "./IBodyDrawnFrame";

/**
 * Write the drawn frames of a body review into a local directory, created if
 * absent, each under the file name `captureBodyFrames` gave it. The directory
 * is the caller's selected ignored output tree; renders are not committed.
 */
export function writeBodyFrames(
  output: string,
  drawn: readonly IBodyDrawnFrame[],
): void {
  fs.mkdirSync(output, { recursive: true });
  for (const frame of drawn)
    fs.writeFileSync(path.join(output, frame.file), frame.bytes);
}
