import path from "node:path";

import type { ReferenceManifest } from "../io/ReferenceManifest.ts";
import { readManifest } from "../io/readManifest.ts";
import { fitRegion } from "./fitRegion.ts";
import { fitSections } from "./fitSections.ts";

/**
 * Executes one explicit manifest-based reference curve fitting operation.
 * Flags select sections or a region, an absolute input manifest, a private output version and tolerance in millimetres.
 *
 * @evidence contracts/common.md#principled-implementation Validates explicit CLI inputs before the owned section or regional operation verifies declared reference hashes.
 * @evidence contracts/common.md#clear-and-simple-design One entry point selects two existing responsibilities without adding data discovery, identity defaults or workspace mutation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source paths, calibration identities, fixtures or expected outputs are hardcoded; unsupported flags fail.
 * @evidence contracts/common.md#meaningful-documentation Documents explicit manifest, output version, operation and physical tolerance; errors state rejected argument requirements.
 * @evidence contracts/performance.md#efficient-algorithms CLI parsing is linear in argument count; selected producers own curve fitting and serialization cost.
 * @evidence contracts/performance.md#reuse-equivalent-work The entry point retains no cache or in-flight work; manifest hashes and immutable output publication identify equivalent artifacts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One synchronous invocation owns its parsed arguments and operation result, with no retained timer, process or filesystem handle.
 */
export function main(args: string[]): void {
  const options: Map<string, string> = new Map();
  for (let index: number = 0; index < args.length; index += 2) {
    const flag: string = args[index],
      value: string | undefined = args[index + 1];
    if (
      !["--kind", "--manifest", "--output", "--tolerance-mm"].includes(flag) ||
      value === undefined ||
      options.has(flag)
    )
      throw new Error(`Invalid fitting argument: ${flag}`);
    options.set(flag, value);
  }
  const kind: string = options.get("--kind") ?? "sections",
    manifestPath: string = options.get("--manifest") ?? "",
    outputDir: string = options.get("--output") ?? "";
  const toleranceMm: number = Number(options.get("--tolerance-mm") ?? "0.05");
  if (
    !path.isAbsolute(manifestPath) ||
    !path.isAbsolute(outputDir) ||
    !Number.isFinite(toleranceMm) ||
    !(toleranceMm > 1e-10) ||
    !["sections", "region"].includes(kind)
  )
    throw new Error(
      "Use --kind sections|region --manifest ABSOLUTE_PATH --output ABSOLUTE_PRIVATE_VERSION --tolerance-mm FINITE_NUMBER_ABOVE_1e-10",
    );
  const manifest: ReferenceManifest = readManifest(manifestPath);
  const result: { path: string; sha256: string } =
    kind === "sections"
      ? fitSections(manifest, outputDir, toleranceMm)
      : fitRegion(manifest, outputDir, toleranceMm);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

main(process.argv.slice(2));
