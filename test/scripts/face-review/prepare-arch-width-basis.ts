/**
 * Prepare the arch width revision of the published face basis, from the
 * test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-arch-width-basis.ts STUDY REVISION OUTPUT
 *
 * The elasticity of the intercanine distance on the intercommissural width
 * is the total sample's regression slope in relative terms: Wang, Li, Yang
 * and Li, Heliyon 2024;10:e27642 (409 Chinese adults, 20 to 59 years,
 * standardized photographs): intercanine distance 39.84 +- 2.08 mm,
 * intercommissural width 49.31 +- 3.63 mm, r = 0.389; the slope r * 2.08 /
 * 3.63 mm per mm, times 49.31 / 39.84 (`prepareArchWidthBasis`).
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

import { prepareArchWidthBasis } from "./prepareArchWidthBasis";

const ARCH = { mean: 39.84, sd: 2.08 };
const MOUTH = { mean: 49.31, sd: 3.63 };
const CORRELATION = 0.389;

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
const elasticity =
  ((CORRELATION * ARCH.sd) / MOUTH.sd) * (MOUTH.mean / ARCH.mean);
const prepared = prepareArchWidthBasis({
  basis: basis.json as IAutoMovieHumanFaceBasis,
  documents: subjects.json as IAutoMovieHumanFaceBasisDocument[],
  controls: controls.json as IAutoMovieHumanFaceControlMap,
  revision,
  channel: "mouthWidth",
  skin: "Human",
  lips: "Human/lips",
  dentition: "Human.teeth_base",
  tongue: "Human.tongue01",
  elasticity,
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
  citation:
    "Wang J, Li F-L, Yang H-X, Li L-M. Heliyon 2024;10:e27642 (Table 1 total sample, Table 3 total r).",
  inputs: {
    basis: { sha256: digest(basis.bytes), bytes: basis.bytes.length },
    subjects: { sha256: digest(subjects.bytes), bytes: subjects.bytes.length },
    controls: { sha256: digest(controls.bytes), bytes: controls.bytes.length },
  },
  outputs: { basis: { sha256: digest(basisBytes), bytes: basisBytes.length } },
};
fs.writeFileSync(
  path.join(output, "arch-width-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(
  `elasticity ${elasticity.toFixed(4)}\n` +
    prepared.receipt.endpoints
      .map(
        (one) =>
          `${one.endpoint}: mouth ${(one.mouth[0] * 1000).toFixed(1)} -> ${(one.mouth[1] * 1000).toFixed(1)} mm, arch ${(one.arch[0] * 1000).toFixed(1)} -> ${(one.arch[1] * 1000).toFixed(1)} -> ${(one.after * 1000).toFixed(1)} mm (scale ${one.scale.toFixed(4)})`,
      )
      .join("\n"),
);
