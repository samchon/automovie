/**
 * Prepare the valid envelope revision of the published face basis, from the
 * test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-valid-envelope-basis.ts STUDY REVISION OUTPUT
 *
 * `LIMITS` lists every side of a shape channel whose surface stops being a
 * face inside its envelope, found by rendering each face control at both
 * ends through the product editor (front, three-quarter and profile, or the
 * region's close-up; README "Valid envelopes") and by counting faults at
 * each end (`faceSupportFaults`). A side the fault count finds ends at the
 * last 0.05 step before its first fault; a side only the renders find ends
 * at the last step of the render study that still reads as a face, each
 * `study` naming what the next step shows (`prepareValidEnvelopeBasis`).
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
  type IFaceValidLimit,
  prepareValidEnvelopeBasis,
} from "./prepareValidEnvelopeBasis";

/** Both sides of a paired control, or one control. */
const both = (
  name: string,
  side: IFaceValidLimit["side"],
  value?: number,
  study?: string,
): IFaceValidLimit[] =>
  ["left", "right"].map((one) => ({
    channel: `${one}${name}`,
    side,
    ...(value === undefined ? {} : { value, study }),
  }));
const LIMITS: IFaceValidLimit[] = [
  // The source's own folds, turned over before their authored end.
  ...both("EyeFoldHeight", "minimum"),
  ...both("EpicanthalFold", "maximum"),
  ...both("EarWing", "minimum"),
  // The source's own targets, fault-free but no longer a face.
  ...both(
    "EyelidFoldConvexity",
    "minimum",
    -0.3,
    "-0.4 overhangs the lid with a lit ridge; -1 folds back on itself",
  ),
  ...both(
    "EpicanthalFold",
    "minimum",
    -0.5,
    "-0.75 opens a dark notch at the medial canthus; -1 a dark hollow",
  ),
  ...both(
    "EarAngularOutline",
    "minimum",
    -0.2,
    "-0.3 points the helix; -1 is a pointed, non-human ear",
  ),
  ...both(
    "EarAngularOutline",
    "maximum",
    0.5,
    "0.75 squares the helix with a hard inner line",
  ),
  ...both("EarLobe", "maximum", 0.75, "1 draws the lobule into a point"),
  ...both("EarHeight", "minimum", -0.75, "-1 crushes the auricle flat"),
  {
    channel: "noseFlaring",
    side: "maximum",
    value: 0.5,
    study: "0.75 thins the alar rim into a slit",
  },
  {
    channel: "nostrilAngle",
    side: "minimum",
    value: -0.5,
    study: "-0.75 notches the alar rim",
  },
  {
    channel: "noseTipElevation",
    side: "minimum",
    value: -0.75,
    study: "-1 hangs the tip over the upper lip",
  },
  {
    channel: "browProjection",
    side: "maximum",
    value: 0.5,
    study: "0.75 turns the brow into a shelf",
  },
  // Envelopes the lip and unseen revisions extended past the authored end.
  {
    channel: "noseSeptumAngle",
    side: "maximum",
    value: 1.25,
    study: "1.5 swells the tip into a lump; 2.5 hooks the columella",
  },
  {
    channel: "noseDepth",
    side: "maximum",
    value: 1.2,
    study:
      "1.4 flattens the nasal sidewall into a plane running to the cheek; 1.94 a caricature",
  },
  {
    channel: "upperLipHeight",
    side: "minimum",
    value: -1.5,
    study: "-1.75 crumples the thinned upper lip's lower border",
  },
  {
    channel: "lowerLipHeight",
    side: "minimum",
    value: -1.25,
    study: "-1.5 notches the lower lip at the midline",
  },
  {
    channel: "mouthForwardPosition",
    side: "minimum",
    value: -1.4,
    study: "-1.6 bares the nostrils' underside above the retruded lip",
  },
];

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
const prepared = prepareValidEnvelopeBasis({
  basis: basis.json as IAutoMovieHumanFaceBasis,
  documents: subjects.json as IAutoMovieHumanFaceBasisDocument[],
  controls: controls.json as IAutoMovieHumanFaceControlMap,
  revision,
  surface: "Human",
  contact: ["Human/lips"],
  step: 0.05,
  limits: LIMITS,
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
  inputs: {
    basis: { sha256: digest(basis.bytes), bytes: basis.bytes.length },
    subjects: { sha256: digest(subjects.bytes), bytes: subjects.bytes.length },
    controls: { sha256: digest(controls.bytes), bytes: controls.bytes.length },
  },
  outputs: { basis: { sha256: digest(basisBytes), bytes: basisBytes.length } },
};
fs.writeFileSync(
  path.join(output, "valid-envelope-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(
  prepared.receipt.limits
    .map(
      (one) =>
        `${one.channel} ${one.side} ${one.from} -> ${one.to} (faults ${one.faults}; ${one.evidence})`,
    )
    .join("\n"),
);
