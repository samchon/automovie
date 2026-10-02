import fs from "node:fs";
import path from "node:path";

/**
 * Write the drawn frames of a body review into a local directory, created if
 * absent, each under the file name `captureBodyFrames` gave it. The directory
 * is under the ignored `.shots` tree: renders never go into the repository.
 */
export function writeBodyFrames(
  output: string,
  drawn: readonly { file: string; bytes: Buffer }[],
): void {
  fs.mkdirSync(output, { recursive: true });
  for (const frame of drawn)
    fs.writeFileSync(path.join(output, frame.file), frame.bytes);
}
