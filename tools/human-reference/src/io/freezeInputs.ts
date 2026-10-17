import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { ReferenceManifest } from "./ReferenceManifest.ts";
import { readManifest } from "./readManifest.ts";
import { sha256 } from "./sha256.ts";
import { writeArtifact } from "./writeArtifact.ts";

/**
 * Copies every declared input into an owned run before publishing its input manifest.
 * Complete byte hashes are checked before copying and again against live inputs after copying.
 * A failed freeze publishes no manifest and leaves previously valid artifacts intact.
 *
 * @evidence contracts/common.md#principled-implementation Copies only complete bytes matching declared hashes, binds parsed manifest bytes to their initial digest, then rechecks every live source before publishing the frozen manifest last.
 * @evidence contracts/common.md#clear-and-simple-design Owns data freezing only; source-tree compilation, geometry and renderer lifetimes remain separate responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not substitute a stale input, infer paths or overwrite differing existing bytes; detected mutation fails publication.
 * @evidence contracts/common.md#meaningful-documentation States the complete-byte protocol, final manifest publication and failed-freeze behavior, without claiming anatomical acceptance.
 * @evidence contracts/performance.md#efficient-algorithms Reads each live input twice for complete hash comparison and copies its bytes once; time scales with total input bytes while peak memory includes one current input and the manifest map.
 * @evidence contracts/performance.md#reuse-equivalent-work Identical frozen files are reused only after complete-byte hash comparison; no cross-run memory cache or unsupported snapshot equivalence is assumed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous file operations close their handles; verified private copied bytes remain owned by the caller even if a later source changes, and no manifest is published for that failed freeze.
 */
export function freezeInputs(
  manifestPath: string,
  outputDir: string,
): { path: string; sha256: string } {
  if (!path.isAbsolute(outputDir))
    throw new Error("Frozen input root must be absolute");
  if (!path.isAbsolute(manifestPath))
    throw new Error("Input manifest path must be absolute");
  const manifestHash: string = sha256(manifestPath);
  const manifest: ReferenceManifest = readManifest(manifestPath, manifestHash);
  fs.mkdirSync(outputDir, { recursive: true });
  const root: string = fs.realpathSync(outputDir);
  const inputRoot: string = fs.realpathSync(manifest.root);
  const files: ReferenceManifest["files"] = {};
  const sourceFiles: { file: string; sha256: string }[] = [];
  for (const [id, entry] of Object.entries(manifest.files)) {
    const source: string = fs.realpathSync(path.resolve(inputRoot, entry.path));
    const relative: string = path.relative(inputRoot, source);
    if (
      relative === ".." ||
      relative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relative)
    )
      throw new Error(`Input leaves its root: ${id}`);
    const bytes: Buffer = fs.readFileSync(source);
    const digest: string = crypto
      .createHash("sha256")
      .update(bytes)
      .digest("hex");
    if (digest !== entry.sha256.toLowerCase())
      throw new Error(`Input changed before freeze: ${id}`);
    const name: string = `${crypto.createHash("sha256").update(id).digest("hex").slice(0, 16)}-${digest}.json`;
    const destination: string = path.join(root, name);
    if (fs.existsSync(destination)) {
      if (sha256(destination) !== digest)
        throw new Error(`Existing frozen input differs: ${id}`);
    } else fs.writeFileSync(destination, bytes, { flag: "wx" });
    files[id] = { path: name, sha256: digest };
    sourceFiles.push({ file: source, sha256: digest });
  }
  if (
    sha256(manifestPath) !== manifestHash ||
    sourceFiles.some(
      (entry: { file: string; sha256: string }): boolean =>
        sha256(entry.file) !== entry.sha256,
    )
  )
    throw new Error(
      "Live inputs changed during freeze; no manifest was published",
    );
  return writeArtifact(root, "manifest.json", { ...manifest, root, files });
}
