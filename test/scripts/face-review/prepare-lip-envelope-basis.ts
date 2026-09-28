/**
 * Prepare the lip envelope revision of the published face basis, from the
 * test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-lip-envelope-basis.ts STUDY REVISION OUTPUT
 *
 * The vermilion heights of adults not chosen for their looks (`NORMS`,
 * millimetres, mean and standard deviation) give each population's ratio of
 * vermilion height to mouth width with its standard deviation (the ratio of
 * the means; the delta method on independent heights and widths), and the
 * reference interval is the union of each population's mean plus and minus
 * two standard deviations (`prepareLipEnvelopeBasis`).
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

import { prepareLipEnvelopeBasis } from "./prepareLipEnvelopeBasis";

/** ls-sto, sto-li and ch-ch as [mean, SD] in millimetres. */
const NORMS: Record<
  string,
  { upper: [number, number]; lower: [number, number]; width: [number, number] }
> = {
  "European men (3D Facial Norms, 19 to 25)": {
    upper: [7.9, 1.8],
    lower: [9.2, 2.2],
    width: [50.4, 3.8],
  },
  "European women (3D Facial Norms, 19 to 25)": {
    upper: [7.6, 1.4],
    lower: [9.1, 1.9],
    width: [47.7, 3.3],
  },
  "Kenyan men (Nairobi, 18 to 30)": {
    upper: [13.7, 1.3],
    lower: [13.8, 0.9],
    width: [55.9, 3.3],
  },
  "Kenyan women (Nairobi, 18 to 30)": {
    upper: [13.4, 0.9],
    lower: [13.6, 1.0],
    width: [52.0, 4.0],
  },
  "Hong Kong Chinese men (3dMD, 18 to 35)": {
    upper: [10.2, 1.85],
    lower: [10.98, 1.59],
    width: [49.7, 3.72],
  },
  "Hong Kong Chinese women (3dMD, 18 to 35)": {
    upper: [9.09, 1.69],
    lower: [9.79, 1.64],
    width: [45.18, 3.52],
  },
  "Korean women (3D, 20 to 39)": {
    upper: [6.91, 1.26],
    lower: [9.58, 1.41],
    width: [44.45, 2.87],
  },
};

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
// Each population's ratio with its standard deviation, and the union of
// the two-deviation intervals.
const ratios = Object.entries(NORMS).map(([population, one]) => {
  const ratio = (height: [number, number]) => {
    const mean = height[0] / one.width[0];
    const spread =
      mean * Math.hypot(height[1] / height[0], one.width[1] / one.width[0]);
    return { mean, spread };
  };
  return { population, upper: ratio(one.upper), lower: ratio(one.lower) };
});
const interval = (measure: "upper" | "lower"): [number, number] => [
  Math.min(...ratios.map((one) => one[measure].mean - 2 * one[measure].spread)),
  Math.max(...ratios.map((one) => one[measure].mean + 2 * one[measure].spread)),
];
const basis = read("basis.json.gz");
const subjects = read("subjects.json");
const controls = read("simple-controls.json");
const prepared = prepareLipEnvelopeBasis({
  basis: basis.json as IAutoMovieHumanFaceBasis,
  documents: subjects.json as IAutoMovieHumanFaceBasisDocument[],
  controls: controls.json as IAutoMovieHumanFaceControlMap,
  revision,
  surface: "Human",
  lips: "Human/lips",
  skin: "Human/skin",
  channels: { upper: "upperLipHeight", lower: "lowerLipHeight" },
  intervals: { upper: interval("upper"), lower: interval("lower") },
  depth: 0.004,
  step: 0.05,
  reach: 3,
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
  populations: ratios,
  citations: {
    european:
      "Wong/Weinberg et al., 3D Facial Norms compared with Farkas (PMC6571015), supplementary tables S17 (ch-ch), S22 (ls-sto) and S23 (sto-li): 3dMD, ages 19 to 25, 320 men and 575 women.",
    kenyan:
      "Virdi SS, Wertheim D, Naini FB, Maxillofac Plast Reconstr Surg 2019;41:9 (PMC6384287): direct anthropometry, Nairobi university sample aged 18 to 30, 36 men and 36 women; African-American means (Farkas, Katic and Forrest 2007) agree but carry no deviations.",
    chinese:
      "Jayaratne YSN et al., 3dMD, Hong Kong Chinese aged 18 to 35, 51 men and 52 women.",
    korean:
      "Kwon SH et al., Ann Dermatol 2021;33:52-60 (PMC7875215): 3D, Korean women aged 20 to 39, 48.",
    excluded:
      "Samples chosen for attractiveness, facial harmony or occlusion, orthodontic and surgical patients.",
  },
  inputs: {
    basis: { sha256: digest(basis.bytes), bytes: basis.bytes.length },
    subjects: { sha256: digest(subjects.bytes), bytes: subjects.bytes.length },
    controls: { sha256: digest(controls.bytes), bytes: controls.bytes.length },
  },
  outputs: { basis: { sha256: digest(basisBytes), bytes: basisBytes.length } },
};
fs.writeFileSync(
  path.join(output, "lip-envelope-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(JSON.stringify(prepared.receipt, null, 2));
