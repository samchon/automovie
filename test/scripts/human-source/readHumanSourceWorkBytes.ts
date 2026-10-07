import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { IHumanSourceGenerationInput } from "./structures/IHumanSourceGenerationInput.ts";

/**
 * Read an actual consumed raw authoring asset and record precisely those bytes.
 * The logical work namespace is independent of the execution directory.
 * Acquisition establishes rights; this read establishes compilation content.
 */
export function readHumanSourceWorkBytes(
  inputs: IHumanSourceGenerationInput[],
  work: string,
  relative: string,
  role: string,
): Buffer {
  const bytes = fs.readFileSync(path.join(work, relative));
  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
  inputs.push({
    role,
    path: `work/${relative}`,
    revision: null,
    bytes: bytes.length,
    sha256,
  });
  return bytes;
}
