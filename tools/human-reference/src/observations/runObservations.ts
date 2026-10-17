import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildSkin } from "../geometry/buildSkin.ts";
import { ReferenceManifest } from "../io/ReferenceManifest.ts";
import { loadGate } from "../io/loadGate.ts";
import { readManifest } from "../io/readManifest.ts";
import { sha256 } from "../io/sha256.ts";
import { writeArtifact } from "../io/writeArtifact.ts";
import { observeSections } from "./observeSections.ts";

/**
 * Runs private section extraction from a declared immutable manifest into an owned immutable artifact directory.
 *
 * @evidence contracts/common.md#principled-implementation A declared hashed native-A millimetre manifest admits fixed reference bytes before source-section extraction.
 * @evidence contracts/common.md#clear-and-simple-design Manifest IO, geometry assembly, observations and immutable artifact publication retain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms Input parsing and extraction dominate; files are read and published once per CLI invocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated work is reused only inside this operation where source identity is fixed; no cross-call or identity-dependent result cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources File operations are synchronous and outputs are immutable; source meshes and result arrays become unreachable after CLI completion.
 */
export function runObservations(args: string[]): void {
  const option = (name: string): string | undefined => {
    const index: number = args.indexOf(name);
    return index < 0 ? undefined : args[index + 1];
  };
  const manifestPath: string | undefined = option("--manifest"),
    output: string | undefined = option("--output");
  if (!manifestPath || !output)
    throw new Error(
      "Usage: --manifest <absolute input.json> --output <absolute directory> [--step <mm>]",
    );
  const manifest: ReferenceManifest = readManifest(manifestPath);
  if (manifest.pose !== "native-A")
    throw new Error(
      "Horizontal extraction does not reinterpret a diagnostic pose as native anatomy",
    );
  if (
    manifest.frame !==
    "+X subject-left, +Y up, +Z front, native root origin, mm"
  )
    throw new Error(
      "Section extraction requires the declared canonical native-root millimetre frame",
    );
  const gate: ReturnType<typeof loadGate> = loadGate(manifest);
  const result: ReturnType<typeof observeSections> = observeSections(
    buildSkin(gate.body, gate.head, "native-A"),
    Number(option("--step") ?? 2),
  );
  const artifact: ReturnType<typeof writeArtifact> = writeArtifact(
    path.resolve(output),
    "sections.json",
    {
      gate: manifest.gate,
      units: manifest.units,
      frame: manifest.frame,
      pose: manifest.pose,
      inputManifestSha256: sha256(manifestPath),
      sources: manifest.files,
      tool: { entrySha256: sha256(fileURLToPath(import.meta.url)) },
      ...result,
      limits: [
        "Dense private contour observations are not a parametric product model or a clinical population sample.",
        "Source self-crossings and display-normal observations remain explicit; neither certifies an embedded smooth reconstructed surface.",
        "The entry hash does not identify imported source modules. Retain the immutable source snapshot manifest with this artifact.",
      ],
    },
  );
  console.log(
    JSON.stringify({
      gate: manifest.gate,
      slices: result.slices.length,
      events: result.events.length,
      ...artifact,
    }),
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  runObservations(process.argv.slice(2));
