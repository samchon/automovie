/**
 * Refit every published document's shared shape and expression channels to
 * its photograph's landmarks. Run from the test package:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/fit-face-landmarks.ts \
 *     STUDY ANCHORS DETECTIONS POSES OUTPUT.json [LAMBDA MU]
 *
 * STUDY holds `basis.json.gz` and `subjects.json`; ANCHORS is the
 * `anchor-face-landmarks.ts` output on the same basis, whose view of each
 * subject's camera anchors that subject's landmarks; DETECTIONS holds the
 * photographs as `photo:<subject>` (`detect-face-likeness.py`); POSES is the
 * `plan-face-likeness.ts yaw` pose file, whose camera the fit projects
 * through.
 *
 * A photograph shows one identity in one expression, and fitting either
 * alone makes the other absorb it: shape alone turns a smile into lip
 * shape, and copying a detector's blendshape scores into the basis's
 * channels assumes the two scales agree, which they measurably do not. So
 * both are fitted together by `solveFaceShapeFit`:
 *
 * - every shape channel of the basis on both endpoint sides, its landmark
 *   displacement read analytically from the sparse endpoint rows;
 * - the expression channels a still portrait uses (`EXPRESSIONS`: brows,
 *   lids, cheeks, jaw opening and the lip channels), their displacement
 *   measured by a finite difference of the real builder, because expression
 *   passes through the articulated jaw and the contact rules. Gaze, tongue,
 *   lateral jaw and the lip-closure companion are kept as the document has
 *   them.
 *
 * The face oval, a silhouette the anchors follow only approximately, counts
 * half. Landmarks are read from a hair-free build (hair does not move a face
 * landmark and costs most of the build); each step is then admitted by the
 * builder, halved toward the previous weights when refused, and the final
 * document is admitted with its hair, halved toward the original the same
 * way. Weights are rounded to five decimals. The printed table records each
 * subject's data cost before and after every step.
 */
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

import { faceLikenessInterocular } from "./faceLikenessGeometry";
import {
  type IFaceLikenessDetections,
  indexFaceLikenessDetections,
  readFaceLikenessJson,
} from "./faceLikenessIo";
import { faceShapeFitView } from "./faceShapeFitCamera";
import {
  type IFaceShapeFitVariable,
  solveFaceShapeFit,
} from "./faceShapeFitSolve";
import {
  type IFaceShapeFitAnchor,
  faceShapeFitAnchorPoint,
  faceShapeFitSurfacePositions,
} from "./faceShapeFitSurface";
import {
  faceShapeFitAsymmetry,
  faceShapeFitMirror,
} from "./faceShapeFitSymmetry";

/** MediaPipe FACEMESH_FACE_OVAL, the silhouette landmarks. */
const OVAL = new Set([
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109,
]);

/** Expression channels a still portrait's landmarks constrain. */
const EXPRESSIONS = [
  "browDown",
  "browOuterUp",
  "cheekSquint",
  "eyeBlink",
  "eyeSquint",
  "eyeWide",
  "mouthDimple",
  "mouthFrown",
  "mouthLowerDown",
  "mouthPress",
  "mouthSmile",
  "mouthStretch",
  "mouthUpperUp",
  "noseSneer",
]
  .flatMap((name) => [name + "Left", name + "Right"])
  .concat([
    "browInnerUp",
    "jawOpen",
    "mouthFunnel",
    "mouthPucker",
    "mouthRollLower",
    "mouthRollUpper",
    "mouthShrugLower",
    "mouthShrugUpper",
  ]);

/** Finite-difference step of an expression weight. */
const STEP = 0.05;

const [study, anchorFile, detectionFile, poseFile, output, lambdaText, muText] =
  process.argv.slice(2);
if (output === undefined || fs.existsSync(output))
  throw new Error(
    "Supply STUDY ANCHORS DETECTIONS POSES and a new OUTPUT.json.",
  );
// lambda = (sigma_n / sigma_p)^2 * N / N_eff: landmark noise 0.02
// inter-ocular, parameter spread 0.5, and 468 mesh landmarks carrying about
// the information of the 68-point annotation they densify, because their
// errors (detector bias, pose, expression) are strongly correlated.
const lambda = Number(lambdaText ?? String(((0.02 / 0.5) ** 2 * 468) / 68));
const mu = Number(muText ?? "0.01");
const basis = JSON.parse(
  gunzipSync(fs.readFileSync(path.join(study!, "basis.json.gz"))).toString(
    "utf8",
  ),
) as IAutoMovieHumanFaceBasis;
const documents = readFaceLikenessJson<IAutoMovieHumanFaceBasisDocument[]>(
  path.join(study!, "subjects.json"),
);
type IAnchors = { landmark: number; anchor: IFaceShapeFitAnchor | null }[];
const anchors = readFaceLikenessJson<{
  basis: string;
  views: Record<string, { anchors: IAnchors }>;
}>(anchorFile!);
if (anchors.basis !== basis.id)
  throw new Error("The anchors belong to another basis.");
const photos = indexFaceLikenessDetections(
  readFaceLikenessJson<IFaceLikenessDetections>(detectionFile!),
);
const poses = readFaceLikenessJson<
  Record<
    string,
    {
      yaw: number;
      pitch: number;
      distance: number;
      target: [number, number, number];
    }
  >
>(poseFile!);
const build = createHumanFaceBasisBuilder(basis);
const human = basis.surfaces.find((surface) => surface.id === "Human")!;
const shape = basis.channels.filter((channel) => channel.kind === "shape");
const expression = basis.channels.filter((channel) =>
  EXPRESSIONS.includes(channel.id),
);
const pairs: [string, string][] = [
  ...shape.flatMap((channel): [string, string][] =>
    channel.id.startsWith("left") &&
    shape.some((other) => other.id === "right" + channel.id.slice(4))
      ? [[channel.id, "right" + channel.id.slice(4)]]
      : [],
  ),
  ...expression.flatMap((channel): [string, string][] =>
    channel.id.endsWith("Left")
      ? [[channel.id, channel.id.slice(0, -4) + "Right"]]
      : [],
  ),
];

// A channel without a left/right partner whose field is not mirror
// symmetric (a lateral slide) has a population spread five times narrower.
const mirror = faceShapeFitMirror(human.positions);
const paired = new Set(pairs.flat());
const priorOf = (channel: string, endpoint: string | null) =>
  paired.has(channel) || endpoint === null
    ? 1
    : faceShapeFitAsymmetry(human.targets[endpoint] ?? [], mirror) > 0.5
      ? 25
      : 1;
console.log(
  "held symmetry-breaking endpoints",
  shape.flatMap((channel) =>
    [channel.positive, channel.negative].filter(
      (endpoint) => endpoint !== null && priorOf(channel.id, endpoint) > 1,
    ),
  ),
);

/**
 * Shape endpoints are linear: their displacement at one view's anchors is
 * read from the sparse rows of the anchored vertices.
 */
const shapeMovesFor = (list: IAnchors) => {
  const needed = new Set(list.flatMap((one) => one.anchor?.vertices ?? []));
  const rows = new Map<string, Map<number, [number, number, number]>>();
  for (const [endpoint, flat] of Object.entries(human.targets)) {
    const map = new Map<number, [number, number, number]>();
    for (let i = 0; i < flat.length; i += 4)
      if (needed.has(flat[i]!))
        map.set(flat[i]!, [flat[i + 1]!, flat[i + 2]!, flat[i + 3]!]);
    rows.set(endpoint, map);
  }
  const displacement = (endpoint: string | null) =>
    list.map(({ anchor }): [number, number, number] => {
      const map = endpoint === null ? undefined : rows.get(endpoint);
      if (anchor === null || map === undefined) return [0, 0, 0];
      return [0, 1, 2].map((axis) =>
        anchor.vertices.reduce(
          (sum, vertex, k) =>
            sum + anchor.weights[k]! * (map.get(vertex)?.[axis] ?? 0),
          0,
        ),
      ) as [number, number, number];
    });
  return shape.map((channel) => ({
    channel,
    positive: displacement(channel.positive),
    negative: channel.negative === null ? null : displacement(channel.negative),
    positivePrior: priorOf(channel.id, channel.positive),
    negativePrior: priorOf(channel.id, channel.negative),
  }));
};

/** Landmark points of a document's hair-free build, or null when refused. */
const landmarksAt = (
  list: IAnchors,
  document: IAutoMovieHumanFaceBasisDocument,
) => {
  let model;
  try {
    model = build({ ...document, hair: null });
  } catch {
    return null;
  }
  const positions = faceShapeFitSurfacePositions(basis, model, "Human");
  return list.map(({ anchor }) =>
    anchor === null
      ? ([0, 0, 0.2] as [number, number, number])
      : faceShapeFitAnchorPoint(positions, anchor),
  );
};

/** Blend two channel records by a fraction, dropping zeros and rounding. */
const blend = (
  before: Record<string, number>,
  after: Record<string, number>,
  fraction: number,
) =>
  Object.fromEntries(
    [...new Set([...Object.keys(before), ...Object.keys(after)])]
      .map((id) => {
        const from = before[id] ?? 0;
        return [
          id,
          Number((from + fraction * ((after[id] ?? 0) - from)).toFixed(5)),
        ] as const;
      })
      .filter(([, value]) => value !== 0),
  );

for (const document of documents) {
  const subject = document.id.replace(/-connected$/u, "");
  const photo = photos.get(`photo:${subject}`);
  const pose = poses[subject];
  const view_ = anchors.views[subject];
  if (!photo?.face || pose === undefined || view_ === undefined) {
    console.log(subject, "unchanged");
    continue;
  }
  const original = structuredClone(document);
  const list = view_.anchors;
  const shapeMoves = shapeMovesFor(list);
  const landmarks = (candidate: IAutoMovieHumanFaceBasisDocument) =>
    landmarksAt(list, candidate);
  const target = photo.face.landmarks
    .slice(0, 468)
    .map((point, k) => (list[k]!.anchor === null ? null : point));
  const weight = target.map((_, k) => (OVAL.has(k) ? 0.5 : 1));
  const view = faceShapeFitView({ ...pose, pitch: pose.pitch ?? 0 });
  const costs: string[] = [];
  for (let outer = 0; outer < 3; ++outer) {
    const base = landmarks(document);
    if (base === null) break;
    const variables: IFaceShapeFitVariable[] = shapeMoves.flatMap(
      ({ channel, positive, negative, positivePrior, negativePrior }) => {
        const w = document.shape[channel.id] ?? 0;
        const sides: IFaceShapeFitVariable[] = [];
        if (channel.maximum > 0)
          sides.push({
            channel: channel.id,
            side: "positive",
            current: Math.max(w, 0),
            maximum: channel.maximum,
            displacement: positive,
            prior: positivePrior,
          });
        if (negative !== null && channel.minimum < 0)
          sides.push({
            channel: channel.id,
            side: "negative",
            current: Math.max(-w, 0),
            maximum: -channel.minimum,
            displacement: negative,
            prior: negativePrior,
          });
        return sides;
      },
    );
    for (const channel of expression) {
      const w = document.expression[channel.id] ?? 0;
      const h = w + STEP <= channel.maximum ? STEP : -STEP;
      const moved = landmarks({
        ...document,
        expression: { ...document.expression, [channel.id]: w + h },
      });
      // A channel whose small step the builder refuses keeps its weight.
      if (moved === null) continue;
      variables.push({
        channel: channel.id,
        side: "positive",
        current: w,
        maximum: channel.maximum,
        displacement: moved.map(
          (point, k) =>
            [0, 1, 2].map((a) => (point[a]! - base[k]![a]!) / h) as [
              number,
              number,
              number,
            ],
        ),
      });
    }
    const result = solveFaceShapeFit({
      base,
      target,
      weight,
      view,
      variables,
      pairs,
      lambda,
      mu,
      interocular: faceLikenessInterocular(photo.face.landmarks),
      iterations: 6,
    });
    costs.push(result.costBefore.toFixed(4), result.costAfter.toFixed(4));
    const nextShape: Record<string, number> = {};
    const nextExpression: Record<string, number> = { ...document.expression };
    variables.forEach((variable, i) => {
      const magnitude = result.magnitudes[i]!;
      if (expression.some((channel) => channel.id === variable.channel))
        nextExpression[variable.channel] = magnitude;
      else
        nextShape[variable.channel] =
          (nextShape[variable.channel] ?? 0) +
          (variable.side === "positive" ? magnitude : -magnitude);
    });
    let admitted = false;
    for (let halving = 0; halving < 6 && !admitted; ++halving) {
      const candidate = {
        ...document,
        shape: blend(document.shape, nextShape, 0.5 ** halving),
        expression: blend(document.expression, nextExpression, 0.5 ** halving),
      };
      if (landmarks(candidate) !== null) {
        document.shape = candidate.shape;
        document.expression = candidate.expression;
        admitted = true;
      }
    }
    if (!admitted) break;
  }
  // The published document keeps its hair, so hair must admit the result.
  let final = 1;
  for (; final > 1 / 64; final /= 2) {
    const candidate = {
      ...original,
      shape: blend(original.shape, document.shape, final),
      expression: blend(original.expression, document.expression, final),
    };
    try {
      build(candidate);
      document.shape = candidate.shape;
      document.expression = candidate.expression;
      break;
    } catch (error) {
      console.log(
        subject,
        "hair refused fraction",
        final,
        (error as Error).message.slice(0, 70),
      );
    }
  }
  if (!(final > 1 / 64)) {
    document.shape = original.shape;
    document.expression = original.expression;
  }
  const changes = [
    ...Object.keys({ ...original.shape, ...document.shape }).map((id) => [
      id,
      (document.shape[id] ?? 0) - (original.shape[id] ?? 0),
    ]),
    ...Object.keys({ ...original.expression, ...document.expression }).map(
      (id) => [
        id,
        (document.expression[id] ?? 0) - (original.expression[id] ?? 0),
      ],
    ),
  ] as [string, number][];
  console.log(
    subject,
    "largest changes",
    changes
      .sort((x, y) => Math.abs(y[1]) - Math.abs(x[1]))
      .slice(0, 5)
      .map(([id, value]) => `${id} ${value.toFixed(2)}`)
      .join(", "),
  );
  console.log(
    subject,
    costs.join(" "),
    "admitted fraction",
    final > 1 / 64 ? final : 0,
  );
}
fs.writeFileSync(output, JSON.stringify(documents, null, 2) + "\n");
