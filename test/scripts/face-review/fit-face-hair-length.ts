/**
 * Scale each published document's hair lengths so its hair falls as far as
 * its photograph's. Run from the test package:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/fit-face-hair-length.ts STUDY DETECTIONS_DIR POSES ANCHORS OUTPUT
 *
 * STUDY holds `basis.json.gz` and `subjects.json`; DETECTIONS_DIR is a
 * `detect-face-likeness.py` output over the photographs (ids
 * `photo:<subject>`, with their hair masks); POSES and ANCHORS are the
 * published portrait cameras and landmark anchors. The hair drop index
 * (`faceHairDropIndex`) is read on the photograph from its head hair
 * (`faceHairHeadMask`, components reaching above the brows) and on the
 * document's built model under the same camera, the chin and eye corners
 * from their anchors and the hair from its lowest numerical-hair vertex the
 * skin does not hide from the camera (hair behind the neck is not in the
 * photograph either). One
 * control answers for it: a common factor on every layer's hanging lengths
 * (left, right, nape and back; the crown's and the front's lie over the
 * scalp and keep their authored values), so only how far the hair falls
 * comes from the photograph. The factor is solved by a
 * secant iteration from 1 inside [0.2, 3], the drop being monotone in length
 * but not linear (the hair drapes over the shoulders' absence and curls);
 * a photograph whose hair is cut by its frame or falls below the model's
 * neck (onto shoulders the head model does not have), a drop the hanging
 * lengths cannot reach within 0.1 inter-ocular inside their range (short
 * hair whose end the hairline or curl sets), a document without hair and a
 * subject without a photograph keep their lengths. OUTPUT is a new study
 * directory with the rewritten documents and `hair-length.json`, the record.
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
  faceHairHeadMask,
  faceHairLowestRow,
} from "./faceHairLength";
import {
  indexFaceLikenessDetections,
  readFaceLikenessJson,
  readFaceLikenessMask,
} from "./faceLikenessIo";
import { faceShapeFitProject, faceShapeFitView } from "./faceShapeFitCamera";
import {
  type IFaceShapeFitAnchor,
  faceShapeFitAnchorPoint,
  faceShapeFitSurfacePositions,
} from "./faceShapeFitSurface";

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
const human = basis.surfaces.find((one) => one.id === "Human")!;
const BROWS = [105, 334];
/**
 * The `lengthAxes` whose hair hangs: left, right, nape and back
 * ([+X, -X, +Y, -Y, +Z, -Z] indices 0, 1, 3, 5). The crown's and the front's
 * lie over the scalp and set the head's outline and fringe, not how far the
 * hair falls.
 */
const HANGING = new Set([0, 1, 3, 5]);
/** The drop residual, inter-ocular units, within which the photograph is met. */
const REACHED = 0.1;
const record: Record<string, unknown> = {};

const scaled = (
  document: IAutoMovieHumanFaceBasisDocument,
  factor: number,
): IAutoMovieHumanFaceBasisDocument => ({
  ...document,
  hair: {
    ...document.hair!,
    layers: document.hair!.layers.map((layer) => ({
      ...layer,
      lengthAxes: layer.lengthAxes.map((value, axis) =>
        HANGING.has(axis) ? Number((value * factor).toFixed(4)) : value,
      ) as typeof layer.lengthAxes,
    })),
  },
});

const derived = documents.map((document) => {
  const subject = document.id.replace(/-connected$/u, "");
  const photo = photos.get(`photo:${subject}`);
  const pose = poses[subject];
  const view = anchors[subject];
  if (
    document.hair === undefined ||
    document.hair === null ||
    document.hair.layers.length === 0 ||
    photo?.face === undefined ||
    photo.face === null ||
    typeof photo.hairMask !== "string" ||
    pose === undefined ||
    view === undefined
  ) {
    record[subject] = "unchanged: no hair, photograph, camera or anchors";
    return document;
  }
  const points = photo.face.landmarks;
  const mask = faceHairHeadMask(
    readFaceLikenessMask(path.join(directory!, photo.hairMask)),
    Math.min(...BROWS.map((k) => points[k]![1])),
  );
  const lowestPhoto = faceHairLowestRow(mask);
  const target = faceHairDropIndex({
    chin: points[152]!,
    eyes: [points[33]!, points[263]!],
    lowest: lowestPhoto,
    clipped: lowestPhoto !== null && lowestPhoto >= mask.height - 1,
  });
  if (target === null) {
    record[subject] = "unchanged: the photograph's hair is cut by its frame";
    return document;
  }
  const camera = faceShapeFitView(pose, 900, pose.fov);
  const anchored = (landmark: number) =>
    view.anchors.find((one) => one.landmark === landmark)?.anchor ?? null;
  const [chinAnchor, rightAnchor, leftAnchor] = [152, 33, 263].map(anchored);
  if (chinAnchor === null || rightAnchor === null || leftAnchor === null) {
    record[subject] = "unchanged: chin or eye corners not anchored";
    return document;
  }
  const drop = (factor: number): { hair: number; neck: number } => {
    const model = build(scaled(document, factor));
    const skin = faceShapeFitSurfacePositions(basis, model, "Human");
    const project = (anchor: IFaceShapeFitAnchor) =>
      faceShapeFitProject(camera, faceShapeFitAnchorPoint(skin, anchor));
    // The photograph shows only the hair the head does not hide, so the
    // model's lowest hair is its lowest vertex no skin lies in front of,
    // tested from the bottom up.
    const hair: { point: number[]; row: number }[] = [];
    for (const part of model.parts) {
      if (!part.id.startsWith("numerical-hair:")) continue;
      if (part.geometry.type !== "mesh") continue;
      const p = part.geometry.mesh.positions;
      for (let i = 0; i < p.length; i += 3) {
        const point = [p[i]!, p[i + 1]!, p[i + 2]!];
        hair.push({ point, row: faceShapeFitProject(camera, point)[1] });
      }
    }
    hair.sort((x, y) => y.row - x.row);
    // The skin's nearest depth per pixel of the 900-pixel view.
    const depth = (point: readonly number[]) =>
      [0, 1, 2].reduce(
        (sum, k) => sum + (point[k]! - camera.eye[k]!) * camera.forward[k]!,
        0,
      );
    const SIZE = 900;
    const nearest = new Float64Array(SIZE * SIZE).fill(Infinity);
    for (let t = 0; t < human.indices.length; t += 3) {
      const corners = [0, 1, 2].map((k) => {
        const v = human.indices[t + k]!;
        const point = [skin[3 * v]!, skin[3 * v + 1]!, skin[3 * v + 2]!];
        const [x, y] = faceShapeFitProject(camera, point);
        return { x, y, z: depth(point) };
      });
      const x0 = Math.max(0, Math.floor(Math.min(...corners.map((c) => c.x))));
      const x1 = Math.min(
        SIZE - 1,
        Math.ceil(Math.max(...corners.map((c) => c.x))),
      );
      const y0 = Math.max(0, Math.floor(Math.min(...corners.map((c) => c.y))));
      const y1 = Math.min(
        SIZE - 1,
        Math.ceil(Math.max(...corners.map((c) => c.y))),
      );
      const [a0, a1, a2] = corners as [
        (typeof corners)[number],
        (typeof corners)[number],
        (typeof corners)[number],
      ];
      const area =
        (a1.x - a0.x) * (a2.y - a0.y) - (a2.x - a0.x) * (a1.y - a0.y);
      if (area === 0) continue;
      for (let y = y0; y <= y1; ++y)
        for (let x = x0; x <= x1; ++x) {
          const px = x + 0.5;
          const py = y + 0.5;
          const w1 =
            ((px - a0.x) * (a2.y - a0.y) - (a2.x - a0.x) * (py - a0.y)) / area;
          const w2 =
            ((a1.x - a0.x) * (py - a0.y) - (px - a0.x) * (a1.y - a0.y)) / area;
          const w0 = 1 - w1 - w2;
          if (w0 < 0 || w1 < 0 || w2 < 0) continue;
          const z = w0 * a0.z + w1 * a1.z + w2 * a2.z;
          const at = y * SIZE + x;
          if (z < nearest[at]!) nearest[at] = z;
        }
    }
    const visible = hair.find(({ point, row }) => {
      const [x] = faceShapeFitProject(camera, point);
      const px = Math.floor(x);
      const py = Math.floor(row);
      if (px < 0 || py < 0 || px >= SIZE || py >= SIZE) return true;
      // A millimetre of slack keeps hair lying on the skin visible.
      return depth(point) <= nearest[py * SIZE + px]! + 0.001;
    });
    const chin = project(chinAnchor);
    const eyes = [project(rightAnchor), project(leftAnchor)] as const;
    let neck = -Infinity;
    for (let i = 0; i < skin.length; i += 3)
      neck = Math.max(
        neck,
        faceShapeFitProject(camera, [skin[i]!, skin[i + 1]!, skin[i + 2]!])[1],
      );
    return {
      hair: faceHairDropIndex({
        chin,
        eyes,
        lowest: visible === undefined ? null : visible.row,
        clipped: false,
      })!,
      neck: faceHairDropIndex({ chin, eyes, lowest: neck, clipped: false })!,
    };
  };
  const LOWER = 0.2;
  const UPPER = 3;
  const start = drop(1);
  // The model is a head and neck: hair the photograph shows below the neck's
  // end lies on shoulders the model does not have, so it is no measure of
  // length here.
  if (target > start.neck) {
    record[subject] = {
      photograph: target,
      neck: start.neck,
      result: "unchanged: the photograph's hair falls below the model's neck",
    };
    return document;
  }
  let a = 1;
  let fa = start.hair - target;
  const before = start.hair;
  let b = fa > 0 ? 0.8 : 1.25;
  let fb = drop(b).hair - target;
  for (let k = 0; k < 6 && Math.abs(fb) > 0.02 && fb !== fa; ++k) {
    const next = Math.min(
      UPPER,
      Math.max(LOWER, b - (fb * (b - a)) / (fb - fa)),
    );
    if (next === b) break;
    [a, fa] = [b, fb];
    b = next;
    fb = drop(b).hair - target;
  }
  const factor = Math.abs(fb) <= Math.abs(fa) ? b : a;
  // A drop the hanging lengths cannot reach inside their range is set by
  // something else (the hairline, the curl), so the lengths stay authored.
  if (Math.min(Math.abs(fa), Math.abs(fb)) > REACHED) {
    record[subject] = {
      photograph: target,
      before,
      closest: target + (Math.abs(fb) <= Math.abs(fa) ? fb : fa),
      factor,
      result: "unchanged: the hanging lengths do not reach the photograph",
    };
    console.log(
      subject,
      "photo",
      target.toFixed(2),
      "unreached",
      factor.toFixed(3),
    );
    return document;
  }
  record[subject] = {
    photograph: target,
    before,
    after:
      target +
      Math.min(Math.abs(fa), Math.abs(fb)) *
        Math.sign(Math.abs(fb) <= Math.abs(fa) ? fb : fa),
    factor,
  };
  console.log(
    subject,
    "photo",
    target.toFixed(2),
    "model",
    before.toFixed(2),
    "->",
    (target + (Math.abs(fb) <= Math.abs(fa) ? fb : fa)).toFixed(2),
    "factor",
    factor.toFixed(3),
  );
  return scaled(document, factor);
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
  path.join(output, "hair-length.json"),
  JSON.stringify(record, null, 2) + "\n",
);
