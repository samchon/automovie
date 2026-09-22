/**
 * Prepare the articulated facial basis in a new directory. Run from the test
 * package with ttsx -P tsconfig.scripts.json and three arguments: the study
 * directory holding `basis.json.gz`, `face-attachments.json.gz`,
 * `subjects.json` and `simple-controls.json`; the new revision; and a new
 * output directory. The pure preparation owner measures the articulation from
 * the source's own endpoints and admits the result through the real builder;
 * this entry only performs IO, names the source-derived configuration below
 * and records byte provenance. A successful preparation is representation
 * evidence, not population or anatomical acceptance.
 *
 * The configuration is the shared source's, cited rather than tuned:
 *
 * - The jaw pivot is the MPFB `joint-mouth` cube; the arch is the legacy
 *   `mandibular` rigid group of the teeth surface; the globes are the
 *   `leftGlobe`/`rightGlobe` groups, named from the source's anatomical left.
 * - The opening coupling is Chen et al. 2021 (Dentomaxillofac Radiol
 *   50:20190464, PMC7860955): at maximal opening the condyle translated
 *   14.3 mm forward and 3.5 mm down for 27.4 degrees of rotation, "coupled
 *   with the mandibular downward rotation by a ratio of about 0.5 mm/degree".
 *   The head frame is +Z anterior and +Y superior, so the per-degree vector is
 *   (0, -3.5/27.4, +14.3/27.4) mm.
 * - The translation limit is that study's total condylar displacement at
 *   maximal opening, |(14.3, 3.5)| = 14.72 mm: past it the envelope of motion
 *   has closed and a document asking for more is refused.
 * - `tongueOut` carried `jawOpen` whole in the source revision (the jaw-arc
 *   receipt measured the fraction at 0.99999); the carried rows are removed
 *   and the correctives that compensated the double count are retired.
 * - The source's authored globe endpoints turn about a point up to 1.85 mm
 *   from the joint cube (measured on this revision; the receipt keeps each
 *   channel's figure). The articulation turns about the cube, which sits
 *   15.2 mm behind the corneal apex inside the 13.5 to 15.3 mm range the
 *   ocular literature reports for the centre of rotation, and keeps that
 *   drift as the channel's eccentric translation so the lids the source
 *   sculpted around its globe stay coherent; the admission bound on it is
 *   3 mm, wide enough for the source's sculpt, narrow enough to refuse an
 *   endpoint that translates the globe outright.
 */
import type {
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

import {
  type IArticulatedBasisInput,
  prepareArticulatedBasis,
} from "./prepareArticulatedBasis";

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
const attachments = read("face-attachments.json.gz");
const subjects = read("subjects.json");
const controls = read("simple-controls.json");
const CHEN_2021 = { degrees: 27.4, forwardMetres: 0.0143, downMetres: 0.0035 };
const input: IArticulatedBasisInput = {
  basis: basis.json as IArticulatedBasisInput["basis"],
  attachments: attachments.json as IArticulatedBasisInput["attachments"],
  jaw: {
    pivot: "joint-mouth",
    opening: "jawOpen",
    protrusion: "jawForward",
    left: "jawLeft",
    right: "jawRight",
    surface: "Human.teeth_base",
    group: "mandibular",
    couplingPerDegree: [
      0,
      -CHEN_2021.downMetres / CHEN_2021.degrees,
      CHEN_2021.forwardMetres / CHEN_2021.degrees,
    ],
    translationLimitMetres: Math.hypot(
      CHEN_2021.forwardMetres,
      CHEN_2021.downMetres,
    ),
  },
  eyes: [
    {
      id: "leftEye",
      center: "joint-l-eye",
      surface: "Human.low-poly",
      group: "leftGlobe",
      gaze: [
        "eyeLookUpLeft",
        "eyeLookDownLeft",
        "eyeLookInLeft",
        "eyeLookOutLeft",
      ],
    },
    {
      id: "rightEye",
      center: "joint-r-eye",
      surface: "Human.low-poly",
      group: "rightGlobe",
      gaze: [
        "eyeLookUpRight",
        "eyeLookDownRight",
        "eyeLookInRight",
        "eyeLookOutRight",
      ],
    },
  ],
  attachedSurfaces: ["Human", "Human.tongue01"],
  carriers: [{ channel: "tongueOut", carried: "jawOpen" }],
  tolerances: {
    rotationDegrees: 0.01,
    slideMetres: 0.0001,
    gazeCenterMetres: 0.003,
    replayMetres: 0.000001,
  },
  revision,
  documents: subjects.json as IAutoMovieHumanFaceBasisDocument[],
  controls: controls.json as IAutoMovieHumanFaceControlMap,
};
const prepared = prepareArticulatedBasis(input);
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
  configuration: {
    jaw: input.jaw,
    eyes: input.eyes,
    attachedSurfaces: input.attachedSurfaces,
    carriers: input.carriers,
  },
  coupling: {
    source: "Chen et al. 2021, Dentomaxillofac Radiol 50:20190464, PMC7860955",
    ...CHEN_2021,
  },
  inputs: {
    basis: { sha256: digest(basis.bytes), bytes: basis.bytes.length },
    attachments: {
      sha256: digest(attachments.bytes),
      bytes: attachments.bytes.length,
    },
    subjects: { sha256: digest(subjects.bytes), bytes: subjects.bytes.length },
    controls: { sha256: digest(controls.bytes), bytes: controls.bytes.length },
  },
  outputs: { basis: { sha256: digest(basisBytes), bytes: basisBytes.length } },
};
fs.writeFileSync(
  path.join(output, "articulation-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    {
      ...receipt,
      residuals: undefined,
      dropped: receipt.dropped.length,
      replayWorstMm: undefined,
    },
    null,
    2,
  ),
);
