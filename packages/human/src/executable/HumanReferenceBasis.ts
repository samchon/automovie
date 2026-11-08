import { convertAutoMovieRecoveryCurves } from "@automovie/recovery";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { HumanNodePaths } from "./HumanNodePaths";
import { HumanReferenceBasisVerification as V } from "./HumanReferenceBasisVerification";

/**
 * Publish the existing private f1 pack in Hermite and exact cubic Bezier bases without moving
 * an active reader's original path. Reads and writes sequential files asynchronously. Existing
 * target bytes must already match; publication never replaces a differing target or original.
 * Source manifests/verification remain historical metadata; the new basis receipt records actual
 * destination byte lengths/hashes. No source mesh, re-observation, fitting or new solver is used.
 */
export async function HumanReferenceBasis(): Promise<void> {
  const root: string = HumanNodePaths.resolve(".references/curves");
  const source: string = path.join(root, "f1");
  const originals: string[] = await files(source);
  const startedUtc: string = new Date().toISOString();
  const report: {
    schema: string;
    startedUtc: string;
    completedUtc: string | null;
    source: string;
    originalPreserved: boolean;
    files: {
      file: string;
      sourceSha256: string;
      sourceBytes: number;
      hermiteSha256: string;
      bezierSha256: string;
      bezierBytes: number;
      verification: V.Result | null;
    }[];
    curves: number;
    spans: number;
    maximumEnvelopeRatio: number;
  } = {
    schema: "human-reference-bases-v1",
    startedUtc,
    completedUtc: null,
    source,
    originalPreserved: true,
    files: [],
    curves: 0,
    spans: 0,
    maximumEnvelopeRatio: 0,
  };
  for (const relative of originals) {
    const originalFile: string = path.join(source, relative);
    const bytes: Buffer = await fs.readFile(originalFile);
    const sourceSha256: string = hash(bytes);
    let bezier: Buffer = bytes;
    let verification: V.Result | null = null;
    if (
      relative.endsWith(".json") &&
      /"type"\s*:\s*"cubicHermite"/.test(bytes.toString("utf8"))
    ) {
      const value: unknown = JSON.parse(bytes.toString("utf8")) as unknown;
      const converted: unknown = convertAutoMovieRecoveryCurves(
        value,
        "bezier",
      );
      bezier = Buffer.from(JSON.stringify(converted));

      // Verify the actual serialized destination, not only the in-memory conversion result.
      verification = V.inspect(
        value,
        JSON.parse(bezier.toString("utf8")) as unknown,
      );
      report.curves += verification.curves;
      report.spans += verification.spans;
      report.maximumEnvelopeRatio = Math.max(
        report.maximumEnvelopeRatio,
        verification.maximumEnvelopeRatio,
      );
    }
    await publish(path.join(root, "hermite/f1", relative), bytes);
    await publish(path.join(root, "bezier/f1", relative), bezier);
    if (hash(await fs.readFile(originalFile)) !== sourceSha256)
      throw new Error(
        "Original reference changed while publishing " + relative,
      );
    report.files.push({
      file: relative.replaceAll("\\", "/"),
      sourceSha256,
      sourceBytes: bytes.length,
      hermiteSha256: hash(bytes),
      bezierSha256: hash(bezier),
      bezierBytes: bezier.length,
      verification,
    });
    process.stdout.write(
      JSON.stringify({
        event: "reference-file",
        file: relative,
        curves: verification?.curves ?? 0,
        spans: verification?.spans ?? 0,
        utc: new Date().toISOString(),
      }) + "\n",
    );
  }
  const finalInventory: string[] = await files(source);
  if (JSON.stringify(finalInventory) !== JSON.stringify(originals))
    throw new Error("Original reference inventory changed during publication");
  for (const item of report.files)
    if (
      hash(await fs.readFile(path.join(source, item.file))) !==
      item.sourceSha256
    )
      throw new Error(
        "Original reference bytes changed before publication completed",
      );
  report.completedUtc = new Date().toISOString();
  for (const basis of ["hermite", "bezier"]) {
    const directory: string = path.join(root, basis, "f1");
    const note: string =
      "# Private reference basis\n\nThis directory publishes the original f1 reference in the " +
      basis +
      " basis. Cubic Bezier conversion preserves original phase intervals, closure, orientation, names, domains and metadata in real arithmetic with binary64 rounding. It adds no geometric information or fit. The copied README.md, index sizes and verification.json describe the original Hermite acquisition; basis-publication.json records this publication's actual bytes and independent position/first/second derivative checks. Reference scaffolds are diagnostics, not generated Human skin or anatomical fitting targets. The legacy ../../f1 path remains preserved for active readers.\n";
    await fs.writeFile(path.join(directory, "BASIS.md"), note);
    await fs.writeFile(
      path.join(directory, "basis-publication.json"),
      JSON.stringify({ ...report, basis }, null, 2),
    );
  }
  process.stdout.write(
    JSON.stringify({
      event: "reference-bases-complete",
      completedUtc: report.completedUtc,
      files: report.files.length,
      curves: report.curves,
      spans: report.spans,
      maximumEnvelopeRatio: report.maximumEnvelopeRatio,
      root,
    }) + "\n",
  );
}

/** Deterministic full relative file inventory; a symlink is refused rather than followed elsewhere. */
async function files(
  directory: string,
  relative: string = "",
): Promise<string[]> {
  const entries: import("node:fs").Dirent[] = await fs.readdir(
    path.join(directory, relative),
    { withFileTypes: true },
  );
  entries.sort(
    (a: import("node:fs").Dirent, b: import("node:fs").Dirent): number =>
      a.name.localeCompare(b.name),
  );
  const result: string[] = [];
  for (const entry of entries) {
    const name: string = path.join(relative, entry.name);
    if (entry.isSymbolicLink())
      throw new Error("Reference publication does not follow symlinks");
    if (entry.isDirectory()) result.push(...(await files(directory, name)));
    else if (entry.isFile()) result.push(name);
    else throw new Error("Unsupported private reference file kind");
  }
  return result;
}

/** Create a new destination or verify an existing identical publication, then read back every byte. */
async function publish(file: string, bytes: Buffer): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  try {
    await fs.writeFile(file, bytes, { flag: "wx" });
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
  if (!(await fs.readFile(file)).equals(bytes))
    throw new Error("Refusing differing reference target " + file);
}

/** Exact file identity, separate from numerical curve equivalence. */
function hash(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

if (require.main === module)
  HumanReferenceBasis().catch((error: unknown): void => {
    process.stderr.write(
      (error instanceof Error
        ? (error.stack ?? error.message)
        : String(error)) + "\n",
    );
    process.exitCode = 1;
  });
