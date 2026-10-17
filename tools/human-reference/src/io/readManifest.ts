import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { ReferenceManifest } from "./ReferenceManifest.ts";

/**
 * Admits a private input document's frame, path and hash declarations before producers read it.
 * An optional expected digest binds the same parsed bytes to a caller's earlier observation.
 *
 * @evidence contracts/common.md#principled-implementation Parses one byte buffer, checks protocol and required declarations, and optionally verifies that exact buffer's digest before interpretation.
 * @evidence contracts/common.md#clear-and-simple-design Owns document admission while readBytes owns each declared file's path and byte identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No default identity, private path or coordinate conversion is supplied; invalid declarations throw.
 * @evidence contracts/common.md#meaningful-documentation States absolute input, protocol admission and optional full-byte binding; required file fields and posture remain explicit.
 * @evidence contracts/performance.md#efficient-algorithms Reads and parses one complete document and scans its named declarations; time and memory scale with document bytes and file count.
 * @evidence contracts/performance.md#reuse-equivalent-work No document cache is retained; every call observes and admits its own complete byte buffer.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous reads close their handles before return; parsed document ownership transfers to the caller and no module state is retained.
 */
export function readManifest(
  file: string,
  expectedSha256?: string,
): ReferenceManifest {
  if (!path.isAbsolute(file)) throw new Error("Manifest path must be absolute");
  const bytes: Buffer = fs.readFileSync(file);
  if (
    expectedSha256 &&
    crypto.createHash("sha256").update(bytes).digest("hex") !==
      expectedSha256.toLowerCase()
  )
    throw new Error("Manifest bytes changed before admission");
  const value: unknown = JSON.parse(bytes.toString("utf8"));
  if (typeof value !== "object" || value === null)
    throw new Error("Manifest must be an object");
  const manifest: ReferenceManifest = value as ReferenceManifest;
  if (manifest.schema !== "human-reference-input-v1" || manifest.units !== "mm")
    throw new Error("Unsupported reference manifest schema or units");
  if (
    typeof manifest.root !== "string" ||
    !path.isAbsolute(manifest.root) ||
    !fs.statSync(manifest.root).isDirectory()
  )
    throw new Error("Manifest root must be an existing absolute directory");
  if (
    typeof manifest.gate !== "string" ||
    !manifest.gate ||
    typeof manifest.frame !== "string" ||
    !manifest.frame
  )
    throw new Error("Manifest gate and frame are required");
  if (manifest.pose !== "native-A" && manifest.pose !== "diagnostic-T")
    throw new Error("Unsupported reference posture");
  if (
    !manifest.files ||
    typeof manifest.files !== "object" ||
    Array.isArray(manifest.files)
  )
    throw new Error("Manifest files must be a named map");
  for (const [id, entry] of Object.entries(manifest.files)) {
    if (
      !id ||
      !entry ||
      typeof entry.path !== "string" ||
      path.isAbsolute(entry.path) ||
      !/^[a-f0-9]{64}$/i.test(entry.sha256)
    )
      throw new Error(`Invalid reference input declaration: ${id}`);
  }
  return manifest;
}
