import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import type { HeadContext } from "../headneck/HeadContext.ts";
import { loadHeadContext } from "../headneck/loadHeadContext.ts";
import type { ReferenceManifest } from "../io/ReferenceManifest.ts";
import { readManifest } from "../io/readManifest.ts";
import { sha256 } from "../io/sha256.ts";
import { writeArtifact } from "../io/writeArtifact.ts";
import type { RegionFile } from "../schema/RegionFile.ts";
import { extractEar } from "./extractEar.ts";

/**
 * Extracts both ears into an immutable private output directory from a
 * byte-bound native source manifest. Its metadata.earSupportGroups map supplies
 * arrays named l and r containing source-rig names. These names never become
 * maintained geometry coefficients or a certified attachment definition.
 *
 * Both documents are computed before publishing either. The final ears.json
 * index is published only after their complete immutable writes succeed;
 * a failed run leaves previously valid files intact and no completion index.
 *
 * @evidence contracts/common.md#principled-implementation The CLI admits absolute destinations and declared source groups, then uses hash-verified source loading and complete immutable artifact publication before publishing its completion index.
 * @evidence contracts/common.md#clear-and-simple-design This entry point owns input admission, one shared context and artifact publication; regional geometry and source I/O remain separately owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The manifest supplies all private source identities, files and rig names; the maintained CLI contains no provider name, catalogue or source path.
 * @evidence contracts/common.md#meaningful-documentation The contract states metadata shape, destination ownership, publication order and failure effects.
 * @evidence contracts/performance.md#efficient-algorithms One head context is loaded and indexed for both ear extractions; dominant geometric costs are documented by the section, contour and track producers.
 * @evidence contracts/performance.md#reuse-equivalent-work Both ears reuse the same admitted source bytes, normal field and spatial index; outputs remain independent immutable documents.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The invocation owns one context and two regional documents until publication, and synchronous complete file writes retain no handles after returning or throwing.
 */
export function run(args: string[] = process.argv.slice(2)): void {
  const parsed: ReturnType<typeof parseArgs> = parseArgs({
    args,
    options: { manifest: { type: "string" }, output: { type: "string" } },
    strict: true,
  });
  const manifestValue: unknown = parsed.values.manifest;
  const outputValue: unknown = parsed.values.output;
  if (
    typeof manifestValue !== "string" ||
    typeof outputValue !== "string" ||
    !path.isAbsolute(manifestValue) ||
    !path.isAbsolute(outputValue)
  )
    throw new Error(
      "Use --manifest ABSOLUTE_PATH --output ABSOLUTE_PRIVATE_VERSION_DIRECTORY",
    );
  const manifestPath: string = manifestValue;
  const outputPath: string = outputValue;
  const manifest: ReferenceManifest = readManifest(manifestPath);
  const groups: unknown = manifest.metadata?.earSupportGroups;
  if (!groups || typeof groups !== "object" || Array.isArray(groups))
    throw new Error(
      "Declare metadata.earSupportGroups.l and .r as arrays of private source rig names",
    );
  const declared: Record<string, unknown> = groups as Record<string, unknown>;
  for (const side of ["l", "r"])
    if (
      !Array.isArray(declared[side]) ||
      !(declared[side] as unknown[]).length ||
      (declared[side] as unknown[]).some(
        (value: unknown): boolean => typeof value !== "string" || !value,
      )
    )
      throw new Error(
        `The declared ${side} ear support must be a nonempty string array`,
      );
  const context: HeadContext = loadHeadContext(manifest);
  const createdAt: string = new Date().toISOString();
  const toolFile: string = fileURLToPath(
    new URL("./extractEar.ts", import.meta.url),
  );
  const documents: RegionFile[] = (["l", "r"] as const).map(
    (side: "l" | "r"): RegionFile =>
      extractEar(context, side, declared[side] as string[], {
        createdAt,
        tool: { file: "ears/extractEar.ts", sha256: sha256(toolFile) },
      }),
  );
  const artifacts: { path: string; sha256: string }[] = documents.map(
    (document: RegionFile): { path: string; sha256: string } =>
      writeArtifact(outputPath, `${document.region}.json`, document),
  );
  const completion: ReturnType<typeof writeArtifact> = writeArtifact(
    outputPath,
    "ears.json",
    {
      schema: "human-reference-ear-observation-run-v1",
      gate: manifest.gate,
      units: manifest.units,
      frame: manifest.frame,
      pose: manifest.pose,
      createdAt,
      manifestSha256: sha256(manifestPath),
      artifacts,
      limits: documents[0].limits,
    },
  );
  console.log(
    JSON.stringify({
      ...completion,
      gate: manifest.gate,
      regions: documents.map((document: RegionFile): object => ({
        region: document.region,
        sections: document.sections.length,
        contours: document.loops.length,
        courses: document.courses.length,
      })),
    }),
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  run();
