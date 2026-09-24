/**
 * Prepare the gingiva revision of the published face basis, from the test
 * CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-gingiva-basis.ts STUDY REVISION OUTPUT
 *
 * The norms are the maxillary central incisor, lateral incisor and canine
 * clinical crown heights, gingival zenith to incisal edge on casts of 384
 * young adults (178 men, 206 women, 14 to 35 years): 9.35, 7.75 and 8.68 mm
 * (Melo M, Ata-Ali F, Huertas J, et al. Revisiting the maxillary teeth in
 * 384 subjects reveals a deviation from the classical aesthetic dimensions.
 * Sci Rep 2019;9:730).
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

import { prepareGingivaBasis } from "./prepareGingivaBasis";

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
const prepared = prepareGingivaBasis({
  basis: basis.json as IAutoMovieHumanFaceBasis,
  documents: subjects.json as IAutoMovieHumanFaceBasisDocument[],
  controls: controls.json as IAutoMovieHumanFaceControlMap,
  revision,
  norms: [0.00935, 0.00775, 0.00868],
  resolution: 0.00005,
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
    norms:
      "Melo M, Ata-Ali F, Huertas J, Cobo T, Shibli JA, Galindo-Moreno P, Ata-Ali J, et al. Revisiting the maxillary teeth in 384 subjects reveals a deviation from the classical aesthetic dimensions. Sci Rep 2019;9:730, doi:10.1038/s41598-018-36770-w: clinical crown height from the gingival zenith to the incisal margin, central 9.35, lateral 7.75, canine 8.68 mm (Tables 2, abstract).",
  },
  inputs: {
    basis: { sha256: digest(basis.bytes), bytes: basis.bytes.length },
    subjects: { sha256: digest(subjects.bytes), bytes: subjects.bytes.length },
    controls: { sha256: digest(controls.bytes), bytes: controls.bytes.length },
  },
  outputs: { basis: { sha256: digest(basisBytes), bytes: basisBytes.length } },
};
fs.writeFileSync(
  path.join(output, "gingiva-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(JSON.stringify(prepared.receipt, null, 2));
