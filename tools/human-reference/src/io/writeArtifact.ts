import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Publishes one immutable private JSON artifact after a complete write.
 * An existing identical file is reused; different bytes leave the last valid file intact.
 * The caller exclusively owns the output namespace; each parent is admitted before creating a child.
 *
 * @evidence contracts/common.md#principled-implementation Serializes finite JSON into a uniquely owned temporary file, then publishes with an atomic no-replacement hard link in the same directory.
 * @evidence contracts/common.md#clear-and-simple-design Owns one immutable JSON publication; callers choose version directories and consumers own geometry interpretation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No existing different artifact is replaced, hidden fallback supplied or source geometry interpreted; unsupported filesystem link operations fail.
 * @evidence contracts/common.md#meaningful-documentation States finite JSON, absolute private output, immutable existing-file semantics and complete-file publication.
 * @evidence contracts/performance.md#efficient-algorithms Serializes and hashes complete output bytes once, with a complete existing-file hash only on publication contention; work and memory scale with artifact size and path depth.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing identical bytes are reused only after full SHA-256 comparison; no cross-call cache or in-flight computation is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The owned descriptor closes in finally and the uniquely owned temporary path is removed in outer finally; filesystem cleanup failure propagates and is not claimed as release.
 */
export function writeArtifact(
  outputDir: string,
  name: string,
  data: unknown,
): { path: string; sha256: string } {
  if (!path.isAbsolute(outputDir) || path.isAbsolute(name))
    throw new Error("Artifact root must be absolute and name relative");
  fs.mkdirSync(outputDir, { recursive: true });
  const root: string = fs.realpathSync(outputDir);
  const file: string = path.resolve(root, name);
  const relative: string = path.relative(root, file);
  if (
    !relative ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  )
    throw new Error("Artifact name leaves its output root");
  let parent: string = root;
  for (const segment of path
    .relative(root, path.dirname(file))
    .split(path.sep)
    .filter(Boolean)) {
    const next: string = path.join(parent, segment);
    if (!fs.existsSync(next)) fs.mkdirSync(next);
    parent = fs.realpathSync(next);
    const parentRelative: string = path.relative(root, parent);
    if (
      parentRelative === ".." ||
      parentRelative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(parentRelative)
    )
      throw new Error("Artifact parent leaves its output root");
  }
  const text: string | undefined = JSON.stringify(
    data,
    (_key: string, value: unknown): unknown => {
      if (typeof value === "number" && !Number.isFinite(value))
        throw new Error("Artifact contains a non-finite number");
      return value;
    },
  );
  if (text === undefined)
    throw new Error("Artifact has no JSON representation");
  const bytes: Buffer = Buffer.from(text);
  const digest: string = crypto
    .createHash("sha256")
    .update(bytes)
    .digest("hex");
  const temporary: string = `${file}.${process.pid}.${crypto.randomUUID()}.pending`;
  let created: boolean = false;
  try {
    const descriptor: number = fs.openSync(temporary, "wx");
    created = true;
    try {
      fs.writeFileSync(descriptor, bytes);
    } finally {
      fs.closeSync(descriptor);
    }
    try {
      fs.linkSync(temporary, file);
    } catch (error: unknown) {
      if (
        !fs.existsSync(file) ||
        crypto
          .createHash("sha256")
          .update(fs.readFileSync(file))
          .digest("hex") !== digest
      )
        throw error;
    }
  } finally {
    if (created) fs.unlinkSync(temporary);
  }
  return { path: file, sha256: digest };
}
