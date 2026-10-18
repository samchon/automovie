import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Preserve the source packages' module kinds in the recovery CLI's NodeNext output.
 * The emitted engine and interface files live under lib/packages rather than their
 * original package.json ancestors. Explicit package markers restore those declared
 * kinds, allowing plain Node to load ESM tools and CommonJS numerical dependencies.
 * This build operation reads package metadata and writes generated metadata only.
 *
 * @evidence contracts/common.md#principled-implementation NodeNext selects each source package's declared module kind; equivalent output package markers preserve that selection during Node resolution.
 * @evidence contracts/common.md#clear-and-simple-design One build helper owns the two relocated package boundaries; numerical source and CLI input handling remain separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No loader hook, module monkey patch, source rewrite, private asset or numerical replacement supplies executable geometry.
 * @evidence contracts/common.md#meaningful-documentation States the relocated package boundary, NodeNext requirement, source/output roots and generated-metadata-only effects.
 * @evidence contracts/performance.md#efficient-algorithms Two bounded package manifest reads and marker writes cost O(M) for their metadata bytes; no source or dependency-tree traversal occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work Each build records its actual source manifests' module kinds once for all emitted imports.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous file operations close handles immediately; only two parsed manifests and returned marker records remain call-owned.
 */
export function writeRecoveryModuleBoundaries(
  sourceRoot: string,
  outputRoot: string,
): { package: string; type: "commonjs" | "module"; path: string }[] {
  const records: {
    package: string;
    type: "commonjs" | "module";
    path: string;
  }[] = [];
  for (const name of ["engine", "interface"]) {
    const manifest: { type?: unknown } = JSON.parse(
      fs.readFileSync(
        path.resolve(sourceRoot, "packages", name, "package.json"),
        "utf8",
      ),
    );
    const kind: unknown = manifest.type ?? "commonjs";
    if (kind !== "commonjs" && kind !== "module")
      throw new Error("A source package requires a valid Node module kind");
    const destination: string = path.resolve(
      outputRoot,
      "packages",
      name,
      "package.json",
    );
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, JSON.stringify({ type: kind }) + "\n");
    records.push({ package: name, type: kind, path: destination });
  }
  return records;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (!process.argv[2] || !process.argv[3])
    throw new Error(
      "Usage: writeRecoveryModuleBoundaries sourceRoot outputRoot",
    );
  console.log(
    JSON.stringify(
      writeRecoveryModuleBoundaries(process.argv[2], process.argv[3]),
    ),
  );
}
