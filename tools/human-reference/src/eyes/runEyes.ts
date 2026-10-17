import path from "node:path";
import { fileURLToPath } from "node:url";

import type { ReferenceManifest } from "../io/ReferenceManifest.ts";
import { readInput } from "../io/readInput.ts";
import { readManifest } from "../io/readManifest.ts";
import { writeArtifact } from "../io/writeArtifact.ts";
import type { RegionFile } from "../schema/RegionFile.ts";
import { buildEyeAnnulus } from "./buildEyeAnnulus.ts";

/**
 * Publishes immutable annular eye observations from the manifest's saved eyes input.
 * Input hash admission and output publication belong to the shared IO functions.
 * This operation does not extract a mesh, fit cubics or certify generated anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Reads hash-bound native millimetre observations and derives physical section rows through buildEyeAnnulus; explicit probe limits prevent circular validation claims.
 * @evidence contracts/common.md#clear-and-simple-design One manifest selects one identity and one output directory; both eyes share the same stated collar protocol.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no private path, provider name, identity list, source triangle or baked geometric table.
 * @evidence contracts/common.md#meaningful-documentation States manifest input identity, immutable publication and the operation's observational limits.
 * @evidence contracts/performance.md#efficient-algorithms Reads one regional JSON and builds both eyes; total time follows buildEyeAnnulus and JSON serialization, with output-sized memory.
 * @evidence contracts/performance.md#reuse-equivalent-work Loads the admitted regional document once for both eyes; output hashes bind identical immutable bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All file operations are synchronous and bounded by admitted input/output sizes; shared IO closes its writes and leaves existing differing artifacts intact.
 */
export function runEyes(
  manifestFile: string,
  outputDir: string,
): ReturnType<typeof writeArtifact> {
  const manifest: ReferenceManifest = readManifest(manifestFile);
  const source: RegionFile = readInput<RegionFile>(manifest, "eyes");
  if (
    manifest.pose !== "native-A" ||
    source.region !== "face-eyes" ||
    source.gate !== manifest.gate ||
    source.frame !== manifest.frame
  )
    throw new Error(
      "Eye observation identity, posture and frame must match its manifest",
    );
  const rowsMm: number[] = [0, 0.5, 1, 2, 3, 5, 8, 12];
  const probeRowsMm: number[] = [0.25, 0.75, 1.5, 2.5, 4, 6.5, 10, 16];
  return writeArtifact(outputDir, "eye-annular-observations.json", {
    schema: "reference-eye-annular-v1",
    gate: manifest.gate,
    units: "mm; phaseDeg is degrees",
    frame: manifest.frame,
    input: {
      id: "eyes",
      sha256: manifest.files.eyes.sha256,
      createdAt: source.createdAt,
      sources: source.sources,
    },
    role: "Source observations for fitting; not an emitted Human or spline-control catalogue",
    rowsMm,
    interpolatedProbeRowsMm: probeRowsMm,
    eyes: (["l", "r"] as const).map(
      (side): ReturnType<typeof buildEyeAnnulus> =>
        buildEyeAnnulus(source, side, rowsMm, probeRowsMm, 12),
    ),
    limits: [
      "Source collision and trim remain unqualified. Aperture extrema are not clinical canthi.",
      "Ring waypoint chords are not skin. The consumer fits and qualifies an actual continuous generator.",
      "The 12 mm collar is a local layout convention requiring joint trim and shared analytic derivatives with the head chart.",
      "Interpolated probe rows derive from the same radial input and are not independent when those paths are fitted. The 16 mm probe is outside the declared collar.",
      "Independent validation requires omitted angular sections, separate oblique cuts or identities excluded from fitting.",
    ],
  });
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const manifestIndex: number = process.argv.indexOf("--manifest");
  const outputIndex: number = process.argv.indexOf("--output");
  if (
    manifestIndex < 0 ||
    outputIndex < 0 ||
    !process.argv[manifestIndex + 1] ||
    !process.argv[outputIndex + 1]
  )
    throw new Error(
      "Usage: runEyes.ts --manifest <absolute JSON> --output <absolute immutable directory>",
    );
  console.log(
    JSON.stringify(
      runEyes(process.argv[manifestIndex + 1], process.argv[outputIndex + 1]),
    ),
  );
}
