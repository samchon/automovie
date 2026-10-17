import path from "node:path";
import { parseArgs } from "node:util";

import type { ReferenceManifest } from "../io/ReferenceManifest.ts";
import { readManifest } from "../io/readManifest.ts";
import { extractLimbFamilies } from "./extractLimbFamilies.ts";

/**
 * Runs the limb observation producer with caller-selected private input and output paths.
 * Requires --manifest and --output; --spacing supplies diagnostic millimetres and defaults to two.
 *
 * @evidence contracts/common.md#principled-implementation Delegates hash-bound input admission and exact source observations without introducing a second source path or posture conversion.
 * @evidence contracts/common.md#clear-and-simple-design Parses only this producer's three explicit CLI arguments and calls its sole operation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No developer path, reference identity, private bytes or product test is embedded in the CLI.
 * @evidence contracts/common.md#meaningful-documentation Documents required paths, resolution units and the default sampling choice.
 * @evidence contracts/performance.md#efficient-algorithms Argument lookup is bounded by the short CLI; source observation costs remain with extractLimbFamilies.
 * @evidence contracts/performance.md#reuse-equivalent-work The admitted manifest and requested output directory pass directly to the producer without rereading geometry here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Creates no child process, watcher or handle; the called producer owns its temporary source geometry.
 */
export function main(args: string[]): void {
  const parsed: ReturnType<typeof parseArgs> = parseArgs({
    args,
    options: {
      manifest: { type: "string" },
      output: { type: "string" },
      spacing: { type: "string", default: "2" },
    },
    strict: true,
    allowPositionals: false,
  });
  const manifestPath: unknown = parsed.values.manifest;
  const output: unknown = parsed.values.output;
  if (
    typeof manifestPath !== "string" ||
    typeof output !== "string" ||
    !path.isAbsolute(manifestPath) ||
    !path.isAbsolute(output)
  )
    throw new Error(
      "Usage: limbs/main.ts --manifest <private-input.json> --output <private-output-directory> [--spacing <mm>]",
    );
  const manifest: ReferenceManifest = readManifest(manifestPath);
  const spacingMm: number = Number(parsed.values.spacing);
  console.log(JSON.stringify(extractLimbFamilies(manifest, output, spacingMm)));
}

main(process.argv.slice(2));
