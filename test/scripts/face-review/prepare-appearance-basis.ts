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
import fs from "node:fs";

import { parseFaceBasisRevisionArguments } from "./parseFaceBasisRevisionArguments";
import { prepareAppearanceBasis } from "./prepareAppearanceBasis";
import { readFaceBasisStudy } from "./readFaceBasisStudy";
import { writeFaceBasisRevision } from "./writeFaceBasisRevision";

const { studyDirectory, revision, output } = parseFaceBasisRevisionArguments(
  process.argv.slice(2),
  fs.existsSync,
);
const { basis, subjects, controls } = readFaceBasisStudy(fs, studyDirectory);
const ENAMEL_LAB: [number, number, number] = [
  (73.5 + 73.02) / 2,
  (2.2 - 0.54) / 2,
  (11.9 + 14.5) / 2,
];
const prepared = prepareAppearanceBasis({
  basis: basis.json,
  documents: subjects.json,
  controls: controls.json,
  revision,
  ocular: { roughness: 0 },
  enamel: { lab: ENAMEL_LAB },
});
const { receipt } = writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "appearance-receipt.json",
  prepared,
  inputs: { basis, subjects, controls },
  fields: {
    citations: {
      enamel:
        "Maxillary central incisor enamel L* 73.5 +- 7.6, a* 2.2 +- 1.8, b* 11.9 +- 8.4 (Color and translucency of enamel in vital maxillary central incisors, J Prosthet Dent 2022, PMC9381640); maxillary central incisors of Chinese adults L* 73.02 +- 4.41, a* -0.54 +- 4.21, b* 14.50 +- 3.23 (PMC10155942).",
      ocularSurface:
        "The precorneal tear film is an optically smooth surface; roughness 0 leaves the highlight of a point light to the renderer's own roughness floor.",
    },
  },
  recorded: new Date(),
});
console.log(JSON.stringify(receipt, null, 2));
