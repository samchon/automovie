/**
 * Prepare the population revision of the published face basis, from the
 * test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-population-basis.ts STUDY ROWS.json.gz REVISION OUTPUT
 *
 * STUDY is the published global-face study directory (basis.json.gz,
 * subjects.json, simple-controls.json), ROWS what `population_rows.py` wrote
 * from `extract-face-population.py`'s samples, REVISION the new basis
 * identity and OUTPUT a new directory that receives basis.json.gz, the
 * restamped subjects and controls, and population-receipt.json.
 *
 * `verify-population-basis.ts` then replays every sampled corner through the
 * builder against the samples themselves.
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

import {
  type IPopulationRows,
  preparePopulationBasis,
} from "./preparePopulationBasis";

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
const read = (file: string): { bytes: Buffer; json: unknown } => {
  const bytes = fs.readFileSync(file);
  return {
    bytes,
    json: JSON.parse(
      (file.endsWith(".gz") ? gunzipSync(bytes) : bytes).toString("utf8"),
    ),
  };
};
const basis = read(path.join(studyDirectory, "basis.json.gz"));
const subjects = read(path.join(studyDirectory, "subjects.json"));
const controls = read(path.join(studyDirectory, "simple-controls.json"));
const rows = read(rowsPath);
const prepared = preparePopulationBasis({
  basis: basis.json as IAutoMovieHumanFaceBasis,
  documents: subjects.json as IAutoMovieHumanFaceBasisDocument[],
  controls: controls.json as IAutoMovieHumanFaceControlMap,
  rows: rows.json as IPopulationRows,
  revision,
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
  source: {
    ...{ basis: prepared.receipt.source },
    mpfbCommit: "817587ceb2ea03ea17a5b47e04396cbb4ddfa2d5",
    systemAssets:
      "makehuman_system_assets_cc0.zip, 280737770 bytes (system-assets-receipt.json)",
    sampling:
      "extract-face-population.py: race {equal mixture, african, asian, caucasian} x gender {0, 0.5, 1} x age {0.25, 0.5, 1}; muscle and weight 0.5",
  },
  model:
    "MPFB TargetService.calculate_target_stack_from_macro_info_dict: race-gender-age and universal-gender-age-muscle-weight targets weighted by products of their components, which is multilinear in the ancestry shares and in each side of the dimorphism and age channels.",
  inputs: {
    basis: { sha256: digest(basis.bytes), bytes: basis.bytes.length },
    subjects: { sha256: digest(subjects.bytes), bytes: subjects.bytes.length },
    controls: { sha256: digest(controls.bytes), bytes: controls.bytes.length },
    rows: { sha256: digest(rows.bytes), bytes: rows.bytes.length },
  },
  outputs: { basis: { sha256: digest(basisBytes), bytes: basisBytes.length } },
};
fs.writeFileSync(
  path.join(output, "population-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(JSON.stringify(receipt, null, 2));
