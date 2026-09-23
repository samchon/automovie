/**
 * Measure the published subjects against their reference photographs and
 * write one population receipt. Run from the test package after the steps in
 * `plan-face-likeness.ts`:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/measure-face-likeness.ts \
 *     MODELS MANIFEST DETECTIONS_DIR PORTRAIT_CAPTURES FRAME_CAPTURES OUTPUT.json
 *
 * MODELS is the `export-subject-views.ts` directory (its `views.json` and
 * `<subject>__rest.json` are hashed), MANIFEST the `manifest` output that
 * lists the missing photographs, DETECTIONS_DIR one `detect-face-likeness.py`
 * run over the photographs and both captures, and the two capture
 * directories hold `reference-yaw` and `reference-yaw-hair-mask` PNGs taken
 * with the `yaw` and `frame` pose files.
 *
 * A subject is compared only when its photograph, both renders and all
 * masks exist, the two captures used one GPU renderer, and every image shows
 * exactly one detected face; otherwise its row keeps the reason and no
 * value. The receipt records every input hash, camera and instrument so a
 * later candidate can be compared under the same condition, and the
 * population medians of `faceLikenessCompare.ts` over compared subjects.
 */
import fs from "node:fs";
import path from "node:path";

import {
  compareFaceLikeness,
  summarizeFaceLikeness,
} from "./faceLikenessCompare";
import {
  type IFaceLikenessCaptures,
  type IFaceLikenessDetections,
  faceLikenessSha256,
  indexFaceLikenessDetections,
  readFaceLikenessImage,
  readFaceLikenessJson,
  readFaceLikenessMask,
} from "./faceLikenessIo";

const RECEIPT =
  "studies/human-face/connected-basis/global-face/subject-receipt.json";
const [
  models,
  manifestFile,
  directory,
  portraitDirectory,
  frameDirectory,
  output,
] = process.argv.slice(2);
if (output === undefined || fs.existsSync(output))
  throw new Error(
    "Supply MODELS MANIFEST DETECTIONS_DIR PORTRAIT_CAPTURES FRAME_CAPTURES and a new OUTPUT.json.",
  );
const subjects = readFaceLikenessJson<{ subjects: { subject: string }[] }>(
  RECEIPT,
).subjects;
const manifest = readFaceLikenessJson<{
  missing: { subject: string; status: string }[];
}>(manifestFile!);
const detections = readFaceLikenessJson<IFaceLikenessDetections>(
  path.join(directory!, "detections.json"),
);
const byId = indexFaceLikenessDetections(detections);
const portraitCaptures = readFaceLikenessJson<IFaceLikenessCaptures>(
  path.join(portraitDirectory!, "captures.json"),
);
const frameCaptures = readFaceLikenessJson<IFaceLikenessCaptures>(
  path.join(frameDirectory!, "captures.json"),
);
if (portraitCaptures.renderer !== frameCaptures.renderer)
  throw new Error("Portrait and frame captures must share one GPU renderer.");
const views = readFaceLikenessJson<{ basis: string }>(
  path.join(models!, "views.json"),
);

const rows = subjects.map(({ subject }) => {
  const missing = manifest.missing.find((entry) => entry.subject === subject);
  if (missing !== undefined) return { subject, status: missing.status };
  const photo = byId.get(`photo:${subject}`);
  const portraitDetection = byId.get(`portrait:${subject}__reference-yaw`);
  const frameDetection = byId.get(`frame:${subject}__reference-yaw`);
  const portraitCamera = portraitCaptures.captures.find(
    (capture) => capture.model === subject && capture.view === "reference-yaw",
  );
  const frameCamera = frameCaptures.captures.find(
    (capture) => capture.model === subject && capture.view === "reference-yaw",
  );
  if (
    photo === undefined ||
    portraitCamera === undefined ||
    frameCamera === undefined
  )
    return { subject, status: "render-unavailable" };
  const files = {
    model: path.join(models!, `${subject}__rest.json`),
    portrait: path.join(portraitDirectory!, portraitCamera.file),
    portraitHair: path.join(
      portraitDirectory!,
      `${subject}__reference-yaw-hair-mask.png`,
    ),
    frame: path.join(frameDirectory!, frameCamera.file),
    frameHair: path.join(
      frameDirectory!,
      `${subject}__reference-yaw-hair-mask.png`,
    ),
  };
  const sha256 = Object.fromEntries(
    Object.entries(files).map(([key, file]) => [
      key,
      fs.existsSync(file) ? faceLikenessSha256(file) : null,
    ]),
  );
  const base = {
    subject,
    sha256: { reference: photo.sha256, ...sha256 },
    camera: { portrait: portraitCamera.camera, frame: frameCamera.camera },
  };
  if (
    Object.values(sha256).includes(null) ||
    !portraitDetection ||
    !frameDetection
  )
    return { ...base, status: "render-unavailable" };
  // A detection of an older capture with the same file name is not evidence
  // about this render.
  if (
    portraitDetection.sha256 !== sha256.portrait ||
    frameDetection.sha256 !== sha256.frame
  )
    return { ...base, status: "detection-stale" };
  const detected = {
    reference: photo.faces,
    portrait: portraitDetection.faces,
    frame: frameDetection.faces,
  };
  if (
    photo.face === null ||
    portraitDetection.face === null ||
    frameDetection.face === null
  )
    return {
      ...base,
      status: "face-detection-failed",
      detectedFaces: detected,
    };
  return {
    ...base,
    status: "measured",
    ...compareFaceLikeness({
      reference: {
        face: photo.face,
        image: readFaceLikenessImage(path.join(directory!, photo.rgb!)),
        hair: readFaceLikenessMask(path.join(directory!, photo.hairMask!)),
      },
      portrait: {
        face: portraitDetection.face,
        image: readFaceLikenessImage(files.portrait),
        hair: readFaceLikenessMask(files.portraitHair),
      },
      frame: {
        face: frameDetection.face,
        hair: readFaceLikenessMask(files.frameHair),
      },
    }),
  };
});
const measured = rows.filter(
  (row): row is Extract<(typeof rows)[number], { status: "measured" }> =>
    row.status === "measured",
);
fs.writeFileSync(
  output,
  JSON.stringify(
    {
      basis: views.basis,
      sourceReceiptSha256: faceLikenessSha256(RECEIPT),
      exportViewsSha256: faceLikenessSha256(path.join(models!, "views.json")),
      instrument: {
        ...detections.instrument,
        renderer: portraitCaptures.renderer,
        portraitPoseFileSha256: portraitCaptures.poseFileSha256,
        framePoseFileSha256: frameCaptures.poseFileSha256,
      },
      summary: summarizeFaceLikeness(measured),
      subjects: rows,
    },
    null,
    2,
  ) + "\n",
);
for (const row of rows) console.log(row.subject, row.status);
