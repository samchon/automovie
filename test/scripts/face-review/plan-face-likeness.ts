/**
 * Plan the inputs of the population face likeness measurement. Run from the
 * test package:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/plan-face-likeness.ts manifest REFS OUT.json LABEL=RENDERS ...
 *   ttsx ... plan-face-likeness.ts yaw DETECTIONS OUT.json [DISTANCE]
 *   ttsx ... plan-face-likeness.ts frame DETECTIONS_DIR CAPTURES OUT.json
 *   ttsx ... plan-face-likeness.ts refine CALIBRATION POSES RENDERS OUT.json
 *
 * The published subjects and their photograph hashes come from the tracked
 * `subject-receipt.json`. The order of a run is fixed:
 *
 * 1. `export-subject-views.ts` exports the published documents, and
 *    `capture-articulation.mjs` captures `front`, `left-quarter` and
 *    `front-high` (the camera 20 degrees above).
 * 2. `manifest` lists each photograph `REFS/<subject>.*` (id
 *    `photo:<subject>`) and every non-mask render PNG of each capture
 *    directory (id `LABEL:<file stem>`) for `detect-face-likeness.py`. The
 *    labels are `calibration` for the step 1 capture and `portrait` and
 *    `frame` for the captures of steps 3 and 4, which share file names. A photograph that is absent or whose SHA-256
 *    differs from the receipt is left out and reported as missing.
 * 3. `yaw` writes a pose file of detector-calibrated yaws and, where the
 *    `front-high` render was detected, pitches (`faceLikenessPlan.ts`) at the default portrait distance, or at an
 *    optional longer distance whose narrower field keeps the same framing
 *    (a portrait lens rather than the review's close view); the capture
 *    of `reference-yaw` and `reference-yaw-hair-mask` with it is the
 *    portrait capture.
 * 4. `frame` reads the detections of the photographs and the portrait
 *    capture and writes a pose file whose distance and target hold the
 *    photograph's hair and head region (`faceLikenessFraming.ts`); the
 *    capture with it is the frame capture.
 *
 * `refine` moves each pose of POSES by the residual the detector reads
 * between the photograph and the portrait render taken at it (RENDERS, ids
 * `photo:<subject>` and `portrait:<subject>__reference-yaw`), scaled by the
 * step 1 calibration renders in CALIBRATION (`refineFaceLikenessPoses`),
 * keeping every other camera field; its `.plan.json` records the residuals.
 *
 * `measure-face-likeness.ts` then compares all of it. Every pose file keeps
 * the subjects without a plan out, so the capture page refuses them rather
 * than inventing a camera.
 */
import fs from "node:fs";
import path from "node:path";

import {
  faceLikenessRegionUnion,
  planFaceLikenessFrame,
} from "./faceLikenessFraming";
import { fitFaceLikenessSimilarity } from "./faceLikenessGeometry";
import {
  type IFaceLikenessCaptures,
  type IFaceLikenessDetections,
  faceLikenessSha256,
  indexFaceLikenessDetections,
  readFaceLikenessJson,
  readFaceLikenessMask,
} from "./faceLikenessIo";
import {
  faceLikenessHeadRegion,
  faceLikenessMaskBounds,
} from "./faceLikenessMasks";
import {
  planFaceLikenessPitches,
  planFaceLikenessYaws,
  refineFaceLikenessPoses,
} from "./faceLikenessPlan";

const RECEIPT =
  "studies/human-face/connected-basis/global-face/subject-receipt.json";
/** `capture-articulation.mjs`'s viewport, field of view and portrait camera. */
const VIEWPORT = 900;
const FOV_DEGREES = 28;
const PORTRAIT_DISTANCE = 0.62;
const PORTRAIT_TARGET: [number, number, number] = [0, 0, 0.06];
const FRAME_MARGIN = 0.1;

const subjects = readFaceLikenessJson<{
  subjects: { subject: string; source: { sha256: string } }[];
}>(RECEIPT).subjects;
const [command, ...args] = process.argv.slice(2);
const write = (file: string, value: unknown): void => {
  if (fs.existsSync(file)) throw new Error(`Refusing to overwrite ${file}.`);
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
};

if (command === "manifest") {
  const [refs, output, ...renders] = args;
  if (refs === undefined || output === undefined || renders.length === 0)
    throw new Error("manifest REFS OUT.json LABEL=RENDERS ...");
  const images: { id: string; path: string; photo: boolean }[] = [];
  const missing: { subject: string; status: string }[] = [];
  for (const { subject, source } of subjects) {
    const file = fs
      .readdirSync(refs)
      .find((name) => path.parse(name).name === subject);
    if (file === undefined)
      missing.push({ subject, status: "reference-unavailable" });
    else if (faceLikenessSha256(path.join(refs, file)) !== source.sha256)
      missing.push({ subject, status: "reference-sha-mismatch" });
    else
      images.push({
        id: `photo:${subject}`,
        path: path.resolve(refs, file),
        photo: true,
      });
  }
  for (const entry of renders) {
    const [, label, directory] =
      /^(calibration|portrait|frame)=(.+)$/.exec(entry) ?? [];
    if (label === undefined || directory === undefined)
      throw new Error(`A render entry is LABEL=DIRECTORY: ${entry}`);
    for (const capture of readFaceLikenessJson<IFaceLikenessCaptures>(
      path.join(directory, "captures.json"),
    ).captures)
      if (!capture.view.endsWith("hair-mask"))
        images.push({
          id: `${label}:${path.parse(capture.file).name}`,
          path: path.resolve(directory, capture.file),
          photo: false,
        });
  }
  write(output, { images, missing });
} else if (command === "yaw") {
  const [detections, output, distanceText] = args;
  if (detections === undefined || output === undefined)
    throw new Error("yaw DETECTIONS OUT.json [DISTANCE]");
  // A longer distance keeps the portrait's framing with a narrower field:
  // tan(fov / 2) scales by the review distance over the new one.
  const distance = Number(distanceText ?? PORTRAIT_DISTANCE);
  const fov =
    (360 / Math.PI) *
    Math.atan(
      (Math.tan((FOV_DEGREES * Math.PI) / 360) * PORTRAIT_DISTANCE) / distance,
    );
  const byId = indexFaceLikenessDetections(
    readFaceLikenessJson<IFaceLikenessDetections>(detections),
  );
  const transform = (id: string) => byId.get(id)?.face?.transform ?? null;
  const plan = planFaceLikenessYaws(
    subjects.map(({ subject }) => ({
      subject,
      photo: transform(`photo:${subject}`),
      front: transform(`calibration:${subject}__front`),
      quarter: transform(`calibration:${subject}__left-quarter`),
    })),
  );
  const pitches = new Map(
    planFaceLikenessPitches(
      subjects.map(({ subject }) => ({
        subject,
        photo: transform(`photo:${subject}`),
        front: transform(`calibration:${subject}__front`),
        high: transform(`calibration:${subject}__front-high`),
      })),
    ).map((row) => [row.subject, row.pitch]),
  );
  const poses: Record<string, unknown> = {};
  for (const row of plan.rows)
    if (row.yaw !== null)
      poses[row.subject] = {
        yaw: row.yaw,
        pitch: pitches.get(row.subject) ?? 0,
        distance,
        target: PORTRAIT_TARGET,
        ...(distance === PORTRAIT_DISTANCE ? {} : { fov }),
      };
  write(output, poses);
  write(output.replace(/\.json$/, ".plan.json"), plan);
} else if (command === "refine") {
  const [calibrationFile, poseFile, renderFile, output] = args;
  if (output === undefined)
    throw new Error("refine CALIBRATION POSES RENDERS OUT.json");
  const calibration = indexFaceLikenessDetections(
    readFaceLikenessJson<IFaceLikenessDetections>(calibrationFile!),
  );
  const renders = indexFaceLikenessDetections(
    readFaceLikenessJson<IFaceLikenessDetections>(renderFile!),
  );
  const poses = readFaceLikenessJson<
    Record<string, { yaw: number; pitch: number }>
  >(poseFile!);
  const of = (
    index: ReturnType<typeof indexFaceLikenessDetections>,
    id: string,
  ) => index.get(id)?.face?.transform ?? null;
  const rows = refineFaceLikenessPoses(
    Object.entries(poses).map(([subject, pose]) => ({
      subject,
      pose,
      photo: of(renders, `photo:${subject}`),
      render: of(renders, `portrait:${subject}__reference-yaw`),
      front: of(calibration, `calibration:${subject}__front`),
      quarter: of(calibration, `calibration:${subject}__left-quarter`),
      high: of(calibration, `calibration:${subject}__front-high`),
    })),
  );
  write(
    output,
    Object.fromEntries(
      rows.map((row) => [
        row.subject,
        { ...poses[row.subject], yaw: row.yaw, pitch: row.pitch },
      ]),
    ),
  );
  write(output.replace(/\.json$/, ".plan.json"), rows);
} else if (command === "frame") {
  const [directory, captures, output] = args;
  if (directory === undefined || captures === undefined || output === undefined)
    throw new Error("frame DETECTIONS_DIR CAPTURES OUT.json");
  const byId = indexFaceLikenessDetections(
    readFaceLikenessJson<IFaceLikenessDetections>(
      path.join(directory, "detections.json"),
    ),
  );
  const cameras =
    readFaceLikenessJson<IFaceLikenessCaptures>(captures).captures;
  const poses: Record<string, unknown> = {};
  for (const { subject } of subjects) {
    const photo = byId.get(`photo:${subject}`);
    const render = byId.get(`portrait:${subject}__reference-yaw`);
    const camera = cameras.find(
      (capture) =>
        capture.model === subject && capture.view === "reference-yaw",
    )?.camera;
    if (!photo?.face || !render?.face || camera === undefined) continue;
    if (render.width !== VIEWPORT || render.height !== VIEWPORT)
      throw new Error(`Render ${render.id} is not the ${VIEWPORT} px capture.`);
    const hair = faceLikenessMaskBounds(
      readFaceLikenessMask(path.join(directory, photo.hairMask!)),
    );
    const head = faceLikenessHeadRegion(
      photo.face.landmarks,
      photo.width,
      photo.height,
    );
    poses[subject] = planFaceLikenessFrame({
      camera,
      renderToReference: fitFaceLikenessSimilarity(
        render.face.landmarks,
        photo.face.landmarks,
      ),
      region: faceLikenessRegionUnion(hair === null ? [head] : [head, hair]),
      viewport: VIEWPORT,
      fovDegrees: camera.fov ?? FOV_DEGREES,
      margin: FRAME_MARGIN,
    });
  }
  write(output, poses);
} else throw new Error("Command must be manifest, yaw, refine or frame.");
