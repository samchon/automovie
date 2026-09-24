/**
 * Set each published document's hair shape from its photograph: how much of
 * the face the hair leaves open, how far it falls and how much of the
 * forehead it covers. Run from the test package:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/fit-face-hair-shape.ts STUDY DETECTIONS_DIR POSES ANCHORS FACTS SHOULDERS OUTPUT
 *
 * STUDY holds `basis.json.gz` and `subjects.json`; DETECTIONS_DIR is a
 * `detect-face-likeness.py` output over the photographs (ids
 * `photo:<subject>`, with their hair masks); POSES and ANCHORS are the
 * published portrait cameras and landmark anchors; FACTS the recorded subject
 * facts and SHOULDERS `population/shoulder-drop-norms.json`
 * (`derive-shoulder-drop-norms.py`). Three indices are read on
 * the photograph from its head hair (`faceHairHeadMask`, components reaching
 * above the brows, so a collar or a beard does not count) and on the
 * document's built model under the same camera from the hair the camera
 * sees (`observeFaceHairModel`), each paired with one control:
 *
 * - the face cover (`faceHairFaceCoverage`, the share of the face oval below
 *   the brows that hair covers, over the oval's landmarks the model anchors)
 *   with a factor on each parted layer's comb reach, the distance along a
 *   lock over which it keeps the direction it is combed in before its flow
 *   takes it: combed hair lies on the scalp and holds its direction, which a
 *   free fibre keeps only over its elastogravity length (Goldstein, Warren
 *   and Ball, Phys. Rev. Lett. 108, 078101, 2012), so a longer reach carries
 *   front locks aside and back before they fall, and the face opens;
 * - the drop (`faceHairDropIndex`, chin to lowest hair over inter-ocular)
 *   with a common factor on each layer's hanging lengths, left, right, nape
 *   and back;
 * - the fringe (`faceHairFringeCoverage`, the share of the forehead and
 *   eyes between the eye corners and above the lower lids that hair covers)
 *   with a factor on each layer's front length.
 *
 * The crown's length lies over the scalp and keeps its authored value. Each
 * factor is solved by a secant iteration from 1 inside its range ([0.2, 8]
 * for the reach, [0.2, 3] for the lengths), the index being monotone in it
 * but not linear (the hair drapes and curls), in that order: where the front
 * locks fall decides which hair is lowest. An index the photograph cannot give keeps its lengths: hair cut by
 * the frame, hair falling further below the chin than the shoulders sit
 * (ANSUR II: the acromion 79.1 mm below menton in men, 71.3 mm in women, in
 * the model's own inter-ocular units), where it lies on shoulders a head
 * model does not have, a photograph without the landmarks; so does
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
  FACE_HAIR_OVAL,
  type IFaceHairShoulderNorms,
  faceHairDropIndex,
  faceHairFaceCoverage,
  faceHairFringeCoverage,
  faceHairHeadMask,
  faceHairLowestRow,
  faceHairShoulderDrop,
} from "./faceHairLength";
import { observeFaceHairModel } from "./faceHairView";
import {
  indexFaceLikenessDetections,
  readFaceLikenessJson,
  readFaceLikenessMask,
} from "./faceLikenessIo";
import { faceShapeFitView } from "./faceShapeFitCamera";
import type { IFaceShapeFitAnchor } from "./faceShapeFitSurface";

const [
  study,
  directory,
  poseFile,
  anchorFile,
  factsFile,
  shoulderFile,
  output,
] = process.argv.slice(2);
if (output === undefined || fs.existsSync(output))
  throw new Error(
    "Supply STUDY DETECTIONS_DIR POSES ANCHORS FACTS SHOULDERS and a new OUTPUT directory.",
  );
const facts = readFaceLikenessJson<{
  subjects: Record<string, { sex: "female" | "male" | null }>;
}>(factsFile!).subjects;
const shoulders = readFaceLikenessJson<IFaceHairShoulderNorms>(shoulderFile!);
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
const BROWS = [105, 334] as const;
/**
 * Landmarks the indices read: forehead top, eye corners, lower lids, chin,
 * brows. The face oval's are read where the model anchors them.
 */
const LANDMARKS = [10, 33, 263, 145, 374, 152, ...BROWS];
type Layer = NonNullable<
  IAutoMovieHumanFaceBasisDocument["hair"]
>["layers"][number];
const lengths =
  (axes: ReadonlySet<number>) =>
  (layer: Layer, factor: number): Layer => ({
    ...layer,
    lengthAxes: layer.lengthAxes.map((value, axis) =>
      axes.has(axis) ? Number((value * factor).toFixed(4)) : value,
    ) as Layer["lengthAxes"],
  });
/**
 * The three controls, in the order they are fitted: what each factor scales
 * (`lengthAxes` are [+X, -X, +Y, -Y, +Z, -Z]: left, right, crown, nape,
 * front, back), its range, whether the index grows with it, and the index
 * residual within which the photograph is met.
 */
const CONTROLS = {
  cover: {
    apply: (layer: Layer, factor: number): Layer =>
      layer.part === undefined
        ? layer
        : {
            ...layer,
            part: {
              ...layer.part,
              reach: Number((layer.part.reach * factor).toFixed(5)),
            },
          },
    range: [0.2, 8],
    grows: false,
    reached: 0.05,
  },
  drop: {
    apply: lengths(new Set([0, 1, 3, 5])),
    range: [0.2, 3],
    grows: true,
    reached: 0.1,
  },
  fringe: {
    apply: lengths(new Set([4])),
    range: [0.2, 3],
    grows: true,
    reached: 0.05,
  },
} as const;
const record: Record<string, Record<string, unknown>> = {};

const scaled = (
  document: IAutoMovieHumanFaceBasisDocument,
  apply: (layer: Layer, factor: number) => Layer,
  factor: number,
): IAutoMovieHumanFaceBasisDocument => ({
  ...document,
  hair: {
    ...document.hair!,
    layers: document.hair!.layers.map((layer) => apply(layer, factor)),
  },
});

const derived = documents.map((original) => {
  const subject = original.id.replace(/-connected$/u, "");
  const photo = photos.get(`photo:${subject}`);
  const pose = poses[subject];
  const view = anchors[subject];
  const anchorOf = (k: number) =>
    view?.anchors.find((one) => one.landmark === k)?.anchor ?? null;
  const anchored = Object.fromEntries(LANDMARKS.map((k) => [k, anchorOf(k)]));
  // The face oval where the model anchors it, read alike on both images.
  const contour = FACE_HAIR_OVAL.filter((k) => anchorOf(k) !== null);
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
        lids: [at(145), at(374)],
      }),
      cover:
        contour.length < 3
          ? null
          : faceHairFaceCoverage({
              mask,
              contour: contour.map(at),
              brows: [at(BROWS[0]), at(BROWS[1])],
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
      anchors: {
        ...(anchored as Record<number, IFaceShapeFitAnchor>),
        ...Object.fromEntries(contour.map((k) => [k, anchorOf(k)!])),
      },
      span: [33, 263],
    });
    const at = (k: number) => seen.landmarks[k]!;
    return {
      ...indices(seen.hair, at, false),
      shoulder:
        faceHairShoulderDrop(shoulders, facts[subject]?.sex ?? null) /
        seen.span,
    };
  };
  record[subject] = {};
  let document = original;
  for (const name of ["cover", "drop", "fringe"] as const) {
    const control = CONTROLS[name];
    const goal = target[name];
    const start = observe(document);
    if (goal === null) {
      record[subject]![name] = "unchanged: the photograph gives no index";
      continue;
    }
    if (name === "drop" && goal > start.shoulder) {
      record[subject]![name] = {
        photograph: goal,
        shoulder: start.shoulder,
        result: "unchanged: the photograph's hair falls onto the shoulders",
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
    if (
      name === "cover" &&
      document.hair!.layers.every((layer) => layer.part === undefined)
    ) {
      record[subject]![name] = {
        photograph: goal,
        before: start[name],
        result: "unchanged: no layer is parted",
      };
      continue;
    }
    const value = (factor: number) =>
      observe(scaled(document, control.apply, factor))[name]!;
    let a = 1;
    let fa = start[name]! - goal;
    // The first step moves the index toward the photograph.
    let b = fa > 0 === control.grows ? 0.8 : 1.25;
    let fb = value(b) - goal;
    for (
      let k = 0;
      k < 6 && Math.abs(fb) > control.reached / 5 && fb !== fa;
      ++k
    ) {
      const next = Math.min(
        control.range[1],
        Math.max(control.range[0], b - (fb * (b - a)) / (fb - fa)),
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
    document = scaled(document, control.apply, factor);
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
