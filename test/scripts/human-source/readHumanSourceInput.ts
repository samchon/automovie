import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import zlib from "node:zlib";

import type { IHumanSourceGenerationInput } from "./structures/IHumanSourceGenerationInput.ts";

/**
 * Read one compile input from the working tree, or from Git history when a
 * revision is given, and refuse it unless its bytes have the expected digest.
 * Returns the parsed JSON (gunzipped for `.gz`) and appends its identity to
 * `inputs`, so every byte the generation depends on is named in its record.
 */
export function readHumanSourceInput<T>(
  inputs: IHumanSourceGenerationInput[],
  role: string,
  repository: string,
  path: string,
  revision: string | null,
  expectedSha256: string | null,
): T {
  const bytes =
    revision === null
      ? fs.readFileSync(`${repository}/${path}`)
      : execFileSync("git", ["-C", repository, "show", `${revision}:${path}`], {
          maxBuffer: 1 << 30,
          windowsHide: true,
        });
  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
  if (expectedSha256 !== null && sha256 !== expectedSha256)
    throw new Error(
      `${role} ${path}${revision === null ? "" : "@" + revision} has digest ${sha256}, expected ${expectedSha256}.`,
    );
  inputs.push({ role, path, revision, bytes: bytes.length, sha256 });
  const text = (path.endsWith(".gz") ? zlib.gunzipSync(bytes) : bytes).toString(
    "utf8",
  );
  return JSON.parse(text) as T;
}
