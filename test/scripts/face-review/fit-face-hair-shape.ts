/**
 * Set each published document's hair lengths from its photograph: how far
 * the hair falls and how much of the forehead it covers. Run from the test
 * package:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/fit-face-hair-shape.ts STUDY DETECTIONS_DIR POSES ANCHORS OUTPUT
 *
 * STUDY holds `basis.json.gz` and `subjects.json`; DETECTIONS_DIR is a
 * `detect-face-likeness.py` output over the photographs (ids
 * `photo:<subject>`, with their hair masks); POSES and ANCHORS are the
 * published portrait cameras and landmark anchors. Two indices are read on
 * the photograph from its head hair (`faceHairHeadMask`, components reaching
 * above the brows, so a collar or a beard does not count) and on the
 * document's built model under the same camera from the hair the camera
 * sees (`observeFaceHairModel`), each paired with one control:
 *
 * - the drop (`faceHairDropIndex`, chin to lowest hair over inter-ocular)
 *   with a common factor on each layer's hanging lengths, left, right, nape
 *   and back;
 * - the fringe (`faceHairFringeCoverage`, the share of the forehead between
 *   the eye corners and above the upper lids that hair covers) with a
 *   factor on each layer's front length.
 *
 * The crown's length lies over the scalp and keeps its authored value. Each
 * factor is solved by a secant iteration from 1 inside [0.2, 3], the index
 * being monotone in length but not linear (the hair drapes and curls), drop
 * first. An index the photograph cannot give keeps its lengths: hair cut by
 * the frame, hair falling below where the model's neck ends (onto shoulders
 * a head model does not have), a photograph without the landmarks; so does
 * one its control cannot reach within its tolerance inside its range (short
 * hair whose end the hairline or curl sets, a style whose front roots comb
 * back). A document without hair and a subject without a photograph keep
 * theirs. OUTPUT is a new study directory with the rewritten documents and
 * `hair-shape.json`, the record.
 */
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

import {
  faceHairDropIndex,
  faceHairFringeCoverage,
  faceHairHeadMask,
  faceHairLowestRow,
} from "./faceHairLength";
import { observeFaceHairModel } from "./faceHairView";
import {
  indexFaceLikenessDetections,
  readFaceLikenessJson,
  readFaceLikenessMask,
} from "./faceLikenessIo";
import { faceShapeFitView } from "./faceShapeFitCamera";
import type { IFaceShapeFitAnchor } from "./faceShapeFitSurface";

const [study, directory, poseFile, anchorFile, output] = process.argv.slice(2);
if (output === undefined || fs.existsSync(output))
  throw new Error(
    "Supply STUDY DETECTIONS_DIR POSES ANCHORS and a new OUTPUT directory.",
  );
const basis = JSON.parse(
  gunzipSync(fs.readFileSync(path.join(study!, "basis.json.gz"))).toString(
    "utf8",
  ),
) as IAutoMovieHumanFaceBasis;
const documents = readFaceLikenessJson<IAutoMovieHumanFaceBasisDocument[]>(
  path.join(study!, "subjects.json"),
);
const photos = indexFaceLikenessDetections(
  readFaceLikenessJson(path.join(directory!, "detections.json")),
);
const poses = readFaceLikenessJson<
  Record<string, Parameters<typeof faceShapeFitView>[0]>
>(poseFile!);
const anchors = readFaceLikenessJson<{
  views: Record<
    string,
    { anchors: { landmark: number; anchor: IFaceShapeFitAnchor | null }[] }
  >;
}>(anchorFile!).views;
const build = createHumanFaceBasisBuilder(basis);
const BROWS = [105, 334];
/** Landmarks the indices read: forehead top, eye corners, upper lids, chin. */
const LANDMARKS = [10, 33, 263, 159, 386, 152];
/**
 * The two controls: which `lengthAxes` ([+X, -X, +Y, -Y, +Z, -Z]: left,
 * right, crown, nape, front, back) each factor scales, and the index
 * residual within which the photograph is met.
 */
const CONTROLS = {
  drop: { axes: new Set([0, 1, 3, 5]), reached: 0.1 },
  fringe: { axes: new Set([4]), reached: 0.05 },
} as const;
const LOWER = 0.2;
const UPPER = 3;
const record: Record<string, Record<string, unknown>> = {};

const scaled = (
  document: IAutoMovieHumanFaceBasisDocument,
  axes: ReadonlySet<number>,
  factor: number,
): IAutoMovieHumanFaceBasisDocument => ({
  ...document,
  hair: {
    ...document.hair!,
    layers: document.hair!.layers.map((layer) => ({
      ...layer,
      lengthAxes: layer.lengthAxes.map((value, axis) =>
        axes.has(axis) ? Number((value * factor).toFixed(4)) : value,
      ) as typeof layer.lengthAxes,
    })),
  },
});

const derived = documents.map((original) => {
  const subject = original.id.replace(/-connected$/u, "");
  const photo = photos.get(`photo:${subject}`);
  const pose = poses[subject];
  const view = anchors[subject];
  const anchored = Object.fromEntries(
    LANDMARKS.map((k) => [
      k,
      view?.anchors.find((one) => one.landmark === k)?.anchor ?? null,
    ]),
  );
  if (
    original.hair === undefined ||
    original.hair === null ||
    original.hair.layers.length === 0 ||
    photo?.face === undefined ||
    photo.face === null ||
    typeof photo.hairMask !== "string" ||
    pose === undefined ||
    Object.values(anchored).some((one) => one === null)
  ) {
    record[subject] = {
      result: "unchanged: no hair, photograph, camera or anchors",
    };
    return original;
  }
  const points = photo.face.landmarks;
  const head = faceHairHeadMask(
    readFaceLikenessMask(path.join(directory!, photo.hairMask)),
    Math.min(...BROWS.map((k) => points[k]![1])),
  );
  const camera = faceShapeFitView(pose, 900, pose.fov);
  const indices = (
    mask: Parameters<typeof faceHairLowestRow>[0],
    at: (k: number) => readonly [number, number],
    clipped: boolean,
  ) => {
    const lowest = faceHairLowestRow(mask);
    return {
      drop: faceHairDropIndex({
        chin: at(152),
        eyes: [at(33), at(263)],
        lowest,
        clipped: clipped && lowest !== null && lowest >= mask.height - 1,
      }),
      fringe: faceHairFringeCoverage({
        mask,
        top: at(10),
        eyes: [at(33), at(263)],
        lids: [at(159), at(386)],
      }),
    };
  };
  const target = indices(head, (k) => points[k]!, true);
  const observe = (document: IAutoMovieHumanFaceBasisDocument) => {
    const seen = observeFaceHairModel({
      basis,
      build,
      document,
      view: camera,
      anchors: anchored as Record<number, IFaceShapeFitAnchor>,
    });
    const at = (k: number) => seen.landmarks[k]!;
    return {
      ...indices(seen.hair, at, false),
      neck: faceHairDropIndex({
        chin: at(152),
        eyes: [at(33), at(263)],
        lowest: seen.neck,
        clipped: false,
      })!,
    };
  };
  record[subject] = {};
  let document = original;
  for (const name of ["drop", "fringe"] as const) {
    const control = CONTROLS[name];
    const goal = target[name];
    const start = observe(document);
    if (goal === null) {
      record[subject]![name] = "unchanged: the photograph gives no index";
      continue;
    }
    if (name === "drop" && goal > start.neck) {
      record[subject]![name] = {
        photograph: goal,
        neck: start.neck,
        result: "unchanged: the photograph's hair falls below the model's neck",
      };
      continue;
    }
    // A document already within the tolerance keeps its lengths.
    if (Math.abs(start[name]! - goal) <= control.reached) {
      record[subject]![name] = {
        photograph: goal,
        before: start[name],
        after: start[name],
        factor: 1,
      };
      continue;
    }
    const value = (factor: number) =>
      observe(scaled(document, control.axes, factor))[name]!;
    let a = 1;
    let fa = start[name]! - goal;
    let b = fa > 0 ? 0.8 : 1.25;
    let fb = value(b) - goal;
    for (
      let k = 0;
      k < 6 && Math.abs(fb) > control.reached / 5 && fb !== fa;
      ++k
    ) {
      const next = Math.min(
        UPPER,
        Math.max(LOWER, b - (fb * (b - a)) / (fb - fa)),
      );
      if (next === b) break;
      [a, fa] = [b, fb];
      b = next;
      fb = value(b) - goal;
    }
    const [factor, residual] = Math.abs(fb) <= Math.abs(fa) ? [b, fb] : [a, fa];
    const row = {
      photograph: goal,
      before: start[name],
      after: goal + residual,
      factor,
    };
    if (Math.abs(residual) > control.reached) {
      record[subject]![name] = {
        ...row,
        result: "unchanged: the control does not reach the photograph",
      };
      console.log(
        subject,
        name,
        "unreached",
        goal.toFixed(2),
        factor.toFixed(3),
      );
      continue;
    }
    record[subject]![name] = row;
    document = scaled(document, control.axes, factor);
    console.log(
      subject,
      name,
      "photo",
      goal.toFixed(2),
      "model",
      start[name]!.toFixed(2),
      "->",
      (goal + residual).toFixed(2),
      "factor",
      factor.toFixed(3),
    );
  }
  return document;
});
fs.mkdirSync(output, { recursive: true });
fs.copyFileSync(
  path.join(study!, "basis.json.gz"),
  path.join(output, "basis.json.gz"),
);
fs.writeFileSync(
  path.join(output, "subjects.json"),
  JSON.stringify(derived, null, 2) + "\n",
);
fs.writeFileSync(
  path.join(output, "hair-shape.json"),
  JSON.stringify(record, null, 2) + "\n",
);
