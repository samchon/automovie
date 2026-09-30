/**
 * Prepare the population revision of the published face basis, from the
 * test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-population-basis.ts STUDY ROWS.json.gz REVISION OUTPUT
 *
 * STUDY is the published global-face study directory (basis.json.gz,
 * subjects.json, simple-controls.json), ROWS the population rows (`IPopulationRows`)
 * an external Blender and MPFB session's samples reduce to, REVISION the new basis
 * identity and OUTPUT a new directory that receives basis.json.gz, the
 * restamped subjects and controls, and population-receipt.json.
 *
 * `verify-population-basis.ts` then replays every sampled corner through the
 * builder against the samples themselves.
 */
import fs from "node:fs";
import path from "node:path";

import {
  type IPopulationRows,
  preparePopulationBasis,
} from "./preparePopulationBasis";
import { readFaceBasisStudy } from "./readFaceBasisStudy";
import { readFaceStudyFile } from "./readFaceStudyFile";
import { writeFaceBasisRevision } from "./writeFaceBasisRevision";

const [studyDirectory, rowsPath, revision, output] = process.argv.slice(2);
if (
  studyDirectory === undefined ||
  rowsPath === undefined ||
  revision === undefined ||
  output === undefined ||
  fs.existsSync(output)
)
  throw new Error(
    "Supply the study directory, the population rows, the new revision and a new output directory.",
  );
const { basis, subjects, controls } = readFaceBasisStudy(fs, studyDirectory);
const rows = readFaceStudyFile<IPopulationRows>(
  fs,
  path.dirname(rowsPath),
  path.basename(rowsPath),
);
const prepared = preparePopulationBasis({
  basis: basis.json,
  documents: subjects.json,
  controls: controls.json,
  rows: rows.json,
  revision,
});
const { receipt } = writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "population-receipt.json",
  prepared,
  inputs: { basis, subjects, controls, rows },
  fields: {
    source: {
      ...{ basis: prepared.receipt.source },
      mpfbCommit: "817587ceb2ea03ea17a5b47e04396cbb4ddfa2d5",
      systemAssets:
        "makehuman_system_assets_cc0.zip, 280737770 bytes (system-assets-receipt.json)",
      sampling:
        "external MPFB sampling in Blender: race {equal mixture, african, asian, caucasian} x gender {0, 0.5, 1} x age {0.25, 0.5, 1}; muscle and weight 0.5",
    },
    model:
      "MPFB TargetService.calculate_target_stack_from_macro_info_dict: race-gender-age and universal-gender-age-muscle-weight targets weighted by products of their components, which is multilinear in the ancestry shares and in each side of the dimorphism and age channels.",
  },
  recorded: new Date(),
});
console.log(JSON.stringify(receipt, null, 2));
