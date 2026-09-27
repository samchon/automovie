/**
 * Prepare the eye depth revision of the published face basis, from the test
 * CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-eye-depth-basis.ts STUDY REVISION OUTPUT
 *
 * One unit moves the globe 5 mm along its orbit axis: two standard
 * deviations of exophthalmometry, whose adult deviations run from 1.8 mm
 * (Han Chinese, Sci Rep 2015;5:8526) to 2.3 to 3.1 mm (white and black
 * adults, Migliori and Gladstone, Am J Ophthalmol 1984;98:438, from their
 * upper limits of normal), 2.5 mm between them. The orbital aperture is
 * 40 mm wide and 35 mm high in adults (half-width 20 mm, half-height
 * 17.5 mm); the skin is anchored beyond the rim, not at its inner edge, so
 * the field's still boundary lies a centimetre outside the aperture each
 * way (half 30 by 27.5 mm): at the aperture itself the whole change ran
 * over the 5 mm between the lateral canthus and the rim, which the renders
 * showed as a hard dark slope lateral of the eye from 2.5 mm forward. The
 * envelope runs from 5 mm back to 3.75 mm forward: rendered through the
 * editor (front, three-quarter, profile and the eye close up), 0.75 reads
 * clean and 1 notches the skin lateral of the lateral canthus
 * (`prepareEyeDepthBasis`). The revision is refused unless every document
 * and both channels at their ends build.
 */
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

import { prepareEyeDepthBasis } from "./prepareEyeDepthBasis";

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
const prepared = prepareEyeDepthBasis({
  basis: basis.json as IAutoMovieHumanFaceBasis,
  documents: subjects.json as IAutoMovieHumanFaceBasisDocument[],
  controls: controls.json as IAutoMovieHumanFaceControlMap,
  revision,
  skin: "Human",
  eye: "Human.low-poly",
  attached: ["Human.eyelashes01", "Human.eyebrow001"],
  sides: [
    {
      channel: "leftEyeDepth",
      blink: "eyeBlinkLeft",
      centre: "joint-l-eye",
      target: "joint-l-eye-target",
    },
    {
      channel: "rightEyeDepth",
      blink: "eyeBlinkRight",
      centre: "joint-r-eye",
      target: "joint-r-eye-target",
    },
  ],
  unit: 0.005,
  envelope: [-1, 0.75],
  aperture: { halfWidth: 0.03, halfHeight: 0.0275 },
});
const build = createHumanFaceBasisBuilder(prepared.basis);
const refused = [
  ...prepared.documents.map((one) => ({ label: one.id, document: one })),
  ...["leftEyeDepth", "rightEyeDepth"].flatMap((channel) =>
    (({ minimum, maximum }) => [minimum, maximum])(
      prepared.basis.channels.find((one) => one.id === channel)!,
    ).map((end) => ({
      label: `${channel} ${end}`,
      document: {
        id: "end",
        name: "end",
        basis: prepared.basis.id,
        shape: { [channel]: end },
        expression: {},
      },
    })),
  ),
].flatMap(({ label, document }) => {
  try {
    build(document);
    return [];
  } catch (error) {
    return [`${label}: ${(error as Error).message}`];
  }
});
if (refused.length !== 0) throw new Error(`Refused:\n${refused.join("\n")}`);
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
  path.join(output, "eye-depth-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(JSON.stringify(prepared.receipt.sides));
