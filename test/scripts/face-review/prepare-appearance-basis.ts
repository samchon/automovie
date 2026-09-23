/**
 * Prepare the ocular-surface and enamel appearance revision of the published
 * face basis, from the test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-appearance-basis.ts STUDY REVISION OUTPUT
 *
 * STUDY is the published global-face study directory (basis.json.gz,
 * subjects.json, simple-controls.json), REVISION the new basis identity and
 * OUTPUT a new directory that receives basis.json.gz, restamped subjects and
 * controls, and appearance-receipt.json.
 *
 * The inputs and their sources:
 *
 * - Ocular roughness 0: the precorneal tear film that covers the cornea and
 *   the exposed conjunctiva is an optically smooth surface, which is why a
 *   portrait's eye carries a sharp image of its light source; the renderer's
 *   own lower bound on roughness decides the highlight of a point light.
 * - The enamel target is the mean of two spectrophotometric samples of
 *   maxillary central incisors: L* 73.5, a* 2.2, b* 11.9 (enamel, vital
 *   incisors, PMC9381640) and L* 73.02, a* -0.54, b* 14.50 (Chinese adults,
 *   PMC10155942), so L* 73.26, a* 0.83, b* 13.20.
 */
import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

import { prepareAppearanceBasis } from "./prepareAppearanceBasis";

const [studyDirectory, revision, output] = process.argv.slice(2);
if (
  studyDirectory === undefined ||
  revision === undefined ||
  output === undefined ||
  fs.existsSync(output)
)
  throw new Error(
    "Supply the study directory, the new revision and a new output directory.",
  );
const read = (name: string): { bytes: Buffer; json: unknown } => {
  const bytes = fs.readFileSync(path.join(studyDirectory, name));
  return {
    bytes,
    json: JSON.parse(
      (name.endsWith(".gz") ? gunzipSync(bytes) : bytes).toString("utf8"),
    ),
  };
};
const basis = read("basis.json.gz");
const subjects = read("subjects.json");
const controls = read("simple-controls.json");
const ENAMEL_LAB: [number, number, number] = [
  (73.5 + 73.02) / 2,
  (2.2 - 0.54) / 2,
  (11.9 + 14.5) / 2,
];
const prepared = prepareAppearanceBasis({
  basis: basis.json as IAutoMovieHumanFaceBasis,
  documents: subjects.json as IAutoMovieHumanFaceBasisDocument[],
  controls: controls.json as IAutoMovieHumanFaceControlMap,
  revision,
  ocular: { roughness: 0 },
  enamel: { lab: ENAMEL_LAB },
});
fs.mkdirSync(output, { recursive: true });
const basisBytes = gzipSync(JSON.stringify(prepared.basis) + "\n", {
  level: 9,
});
fs.writeFileSync(path.join(output, "basis.json.gz"), basisBytes);
fs.writeFileSync(
  path.join(output, "subjects.json"),
  JSON.stringify(prepared.documents, null, 2) + "\n",
);
fs.writeFileSync(
  path.join(output, "simple-controls.json"),
  JSON.stringify(prepared.controls, null, 2) + "\n",
);
const digest = (bytes: Buffer): string =>
  createHash("sha256").update(bytes).digest("hex");
const receipt = {
  ...prepared.receipt,
  recorded: new Date().toISOString(),
  citations: {
    enamel:
      "Maxillary central incisor enamel L* 73.5 +- 7.6, a* 2.2 +- 1.8, b* 11.9 +- 8.4 (Color and translucency of enamel in vital maxillary central incisors, J Prosthet Dent 2022, PMC9381640); maxillary central incisors of Chinese adults L* 73.02 +- 4.41, a* -0.54 +- 4.21, b* 14.50 +- 3.23 (PMC10155942).",
    ocularSurface:
      "The precorneal tear film is an optically smooth surface; roughness 0 leaves the highlight of a point light to the renderer's own roughness floor.",
  },
  inputs: {
    basis: { sha256: digest(basis.bytes), bytes: basis.bytes.length },
    subjects: { sha256: digest(subjects.bytes), bytes: subjects.bytes.length },
    controls: { sha256: digest(controls.bytes), bytes: controls.bytes.length },
  },
  outputs: { basis: { sha256: digest(basisBytes), bytes: basisBytes.length } },
};
fs.writeFileSync(
  path.join(output, "appearance-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(JSON.stringify(receipt, null, 2));
