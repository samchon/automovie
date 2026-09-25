/**
 * Derive every published document's shape and expression from its subject's
 * recorded facts and photograph by shared rules, from the test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/derive-face-documents.ts identity [--fine] \
 *     STUDY FACTS DETECTIONS POSES ANCHORS OUTPUT [EXPRESSION_STUDY [PREVIOUS_STUDY RENDER_DETECTIONS]]
 *   ttsx ... derive-face-documents.ts calibration-study STUDY POSE.json OUTPUT
 *   ttsx ... derive-face-documents.ts calibrate CALIBRATION_DETECTIONS DETECTIONS OUTPUT.json
 *   ttsx ... derive-face-documents.ts expression STUDY CALIBRATION.json REST_DETECTIONS DETECTIONS OUTPUT
 *
 * A document is a face described, not a face sculpted: every value it gets
 * here is either a recorded fact, a named proportion measured on the
 * photograph, or a named expression unit the detector reads, each carried
 * into the one control that means it by a rule shared by every subject.
 *
 * `identity` writes shape, and of expression only the controls an index
 * reads as a state of the face (`lipParting`). The population controls come from the facts
 * (`facePopulationControls`), or with `--fine` stay at the source's
 * midpoint so the document is its fine controls alone; every other shape
 * channel starts at zero; the anthropometric controls
 * (`FACE_ANTHROPOMETRY_INDICES`) are then solved one per index so the model
 * under the photograph's camera has the photograph's proportions
 * (`solveFaceAnthropometry`), and in turn with them the controls of what a
 * frontal photograph cannot measure (`FACE_UNSEEN_INDICES`: the profile, the
 * head behind the face and the ears), set to the subject's population at
 * their sex and age (`faceUnseenNorm`) and read on the skin at rest; without
 * a recorded sex or ancestry they keep their start. The model's landmarks are the
 * published anchors of that camera on the surface, and shape endpoints are
 * linear, so an index is read from the endpoint rows at the anchored
 * vertices on top of one real build at the starting controls (with the
 * expression of EXPRESSION_STUDY, if given, so a smile is not read as mouth
 * shape). Expression, gaze and everything else keep the study's values when
 * EXPRESSION_STUDY is given and are empty otherwise, except an expression
 * index's own control; hair, iris and material
 * values are the study's.
 *
 * The anchors stand in for the detector on the model, and they are not it:
 * a contour landmark the detector puts on the render's visible silhouette
 * slides over the surface as the face widens, where an anchor stays on its
 * vertex. PREVIOUS_STUDY (an earlier `identity` output) and RENDER_DETECTIONS
 * (the detector on its product renders, ids `portrait:<subject>__reference-yaw`)
 * close that loop: each index's target is the photograph's value plus what
 * the anchored model said minus what the render showed for the previous
 * documents, so the render, read by the photograph's own instrument, is what
 * the proportions are matched on.
 *
 * `calibration-study` writes the reference head's calibration documents
 * (`faceExpressionCalibrationDocuments`) beside STUDY's basis, with a pose
 * file placing every one at POSE.json's camera, for
 * `capture-editor-views.mjs`.
 *
 * `calibrate` turns the product-editor renders of the reference head, one per
 * expression channel and weight (ids `cal:cal-<channel>-<percent>` and
 * `cal:cal-rest`), into the shared increment curves, and decides from the
 * photographs' scores which units the curves can carry
 * (`faceExpressionObservable`).
 *
 * `expression` sets each document's expression from its photograph's scores
 * and the scores its own identity reads at rest (REST_DETECTIONS, ids
 * `rest:<subject>`), keeping its shape.
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
  FACE_ANTHROPOMETRY_INDICES,
  FACE_ANTHROPOMETRY_LOWER_EDGE,
  FACE_ANTHROPOMETRY_UPPER_EDGE,
  type IFaceAnthropometryIndex,
  faceAnthropometryWeights,
  measureFaceAnthropometry,
} from "./faceAnthropometry";
import {
  solveFaceAnthropometry,
  solveFaceNorms,
} from "./faceAnthropometrySolve";
import {
  type IFaceExpressionCalibration,
  faceExpressionCalibrationDocuments,
  faceExpressionObservable,
  faceExpressionRestNoise,
  transferFaceExpression,
} from "./faceExpressionTransfer";
import { faceIncisalEdges } from "./faceIncisalEdges";
import { readFaceLikenessImage } from "./faceLikenessIo";
import { measureFaceLikenessTeeth } from "./faceLikenessTeeth";
import {
  type IFacePopulationFacts,
  facePopulationControls,
} from "./facePopulationFacts";
import { faceShapeFitProject, faceShapeFitView } from "./faceShapeFitCamera";
import {
  type IFaceShapeFitAnchor,
  faceShapeFitAnchorPoint,
  faceShapeFitSurfacePositions,
} from "./faceShapeFitSurface";
import {
  FACE_UNSEEN_INDICES,
  faceMidlineTriangles,
  faceUnseenNorm,
  faceUnseenParts,
  measureFaceUnseen,
} from "./faceUnseenNorms";

const [command, ...args] = process.argv.slice(2);
const json = <T>(file: string): T =>
  JSON.parse(
    (file.endsWith(".gz")
      ? gunzipSync(fs.readFileSync(file))
      : fs.readFileSync(file)
    ).toString("utf8"),
  ) as T;
interface IDetection {
  id: string;
  rgb?: string;
  face: {
    landmarks: [number, number][];
    blendshapes: Record<string, number>;
  } | null;
}
const detections = (file: string) =>
  new Map(
    json<{ images: IDetection[] }>(file).images.map((one) => [one.id, one]),
  );
const subjectOf = (document: IAutoMovieHumanFaceBasisDocument) =>
  document.id.replace(/-connected$/u, "");
const write = (
  output: string,
  study: string,
  documents: unknown,
  report: unknown,
) => {
  fs.mkdirSync(output, { recursive: true });
  fs.copyFileSync(
    path.join(study, "basis.json.gz"),
    path.join(output, "basis.json.gz"),
  );
  fs.writeFileSync(
    path.join(output, "subjects.json"),
    JSON.stringify(documents, null, 2) + "\n",
  );
  fs.writeFileSync(
    path.join(output, "derivation.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
};

if (command === "identity") {
  const fine = args.includes("--fine");
  const [
    study,
    factsFile,
    detectionFile,
    poseFile,
    anchorFile,
    output,
    expressionStudy,
    previousStudy,
    renderDetectionFile,
  ] = args.filter((one) => one !== "--fine");
  if (output === undefined)
    throw new Error(
      "identity [--fine] STUDY FACTS DETECTIONS POSES ANCHORS OUTPUT [EXPRESSION_STUDY [PREVIOUS_STUDY RENDER_DETECTIONS]]",
    );
  // The render-side correction: what the anchored model said minus what the
  // detector reads on the product render of the same documents.
  const previous =
    previousStudy === undefined
      ? undefined
      : json<
          Record<
            string,
            { anthropometry: Record<string, { model: number | null }> | string }
          >
        >(path.join(previousStudy, "derivation.json"));
  const renders =
    renderDetectionFile === undefined
      ? undefined
      : detections(renderDetectionFile);
  const basis = json<IAutoMovieHumanFaceBasis>(
    path.join(study!, "basis.json.gz"),
  );
  const documents = json<IAutoMovieHumanFaceBasisDocument[]>(
    path.join(study!, "subjects.json"),
  );
  const expressions =
    expressionStudy === undefined
      ? new Map<string, IAutoMovieHumanFaceBasisDocument>()
      : new Map(
          json<IAutoMovieHumanFaceBasisDocument[]>(
            path.join(expressionStudy, "subjects.json"),
          ).map((one) => [one.id, one]),
        );
  const facts = json<{ subjects: Record<string, IFacePopulationFacts> }>(
    factsFile!,
  ).subjects;
  const photos = detections(detectionFile!);
  const poses = json<Record<string, Parameters<typeof faceShapeFitView>[0]>>(
    poseFile!,
  );
  const anchors = json<{
    views: Record<
      string,
      { anchors: { landmark: number; anchor: IFaceShapeFitAnchor | null }[] }
    >;
  }>(anchorFile!);
  const human = basis.surfaces.find((one) => one.id === "Human")!;
  const incisal = faceIncisalEdges(basis);
  const dentition = basis.surfaces.find((one) => one.id === incisal.surface)!;
  const channels = new Map(basis.channels.map((one) => [one.id, one]));
  const build = createHumanFaceBasisBuilder(basis);
  const ids = FACE_ANTHROPOMETRY_INDICES.map((one) => one.id);
  const indices: readonly (IFaceAnthropometryIndex & {
    resolution?: number;
  })[] = [...FACE_ANTHROPOMETRY_INDICES, ...FACE_UNSEEN_INDICES];
  const lips = basis.contact?.lips ?? null;
  const { auricles, mastoids, scalp } = faceUnseenParts(basis, human);
  const report: Record<string, unknown> = {};
  const derived = documents.map((document) => {
    const subject = subjectOf(document);
    const recorded = facts[subject] ?? {
      ageYears: null,
      sex: null,
      ancestry: null,
    };
    const population = fine
      ? { shape: {}, ageHeld: false }
      : facePopulationControls(recorded);
    const norm = faceUnseenNorm(recorded);
    const expression = expressions.get(document.id)?.expression ?? {};
    const start: IAutoMovieHumanFaceBasisDocument = {
      ...document,
      shape: population.shape,
      expression,
    };
    const photo = photos.get(`photo:${subject}`)?.face;
    const pose = poses[subject];
    const view = anchors.views[subject];
    if (!photo || pose === undefined || view === undefined) {
      report[subject] = {
        population,
        anthropometry: "photograph, camera or anchors missing",
      };
      return start;
    }
    const camera = faceShapeFitView(pose, 900, pose.fov);
    // The anchored landmarks on the skin, and the upper incisal edge on the
    // dentition, each read on its own surface.
    const list = [
      ...view.anchors.flatMap((one) =>
        one.anchor === null
          ? []
          : [{ landmark: one.landmark, anchor: one.anchor, surface: human }],
      ),
      ...(
        [
          [FACE_ANTHROPOMETRY_UPPER_EDGE, incisal.upper],
          [FACE_ANTHROPOMETRY_LOWER_EDGE, incisal.lower],
        ] as const
      ).map(([landmark, vertex]) => ({
        landmark,
        anchor: {
          vertices: [vertex, vertex, vertex] as [number, number, number],
          weights: [1, 0, 0] as [number, number, number],
        },
        surface: dentition,
      })),
    ];
    const model = build({ ...start, hair: undefined });
    const built = new Map(
      [human, dentition].map((surface) => [
        surface,
        faceShapeFitSurfacePositions(basis, model, surface.id),
      ]),
    );
    const base = list.map((one) =>
      faceShapeFitAnchorPoint(built.get(one.surface)!, one.anchor),
    );
    // Anchored displacement of one endpoint, cached.
    const cache = new Map<string, number[][]>();
    const endpoint = (name: string): number[][] => {
      if (!cache.has(name)) {
        const rows = new Map(
          [human, dentition].map((surface) => {
            const flat = surface.targets[name] ?? [];
            const own = new Map<number, number[]>();
            for (let i = 0; i < flat.length; i += 4)
              own.set(flat[i]!, [flat[i + 1]!, flat[i + 2]!, flat[i + 3]!]);
            return [surface, own] as const;
          }),
        );
        cache.set(
          name,
          list.map(({ anchor, surface }) =>
            [0, 1, 2].map((axis) =>
              anchor.vertices.reduce(
                (sum, vertex, k) =>
                  sum +
                  anchor.weights[k]! *
                    (rows.get(surface)!.get(vertex)?.[axis] ?? 0),
                0,
              ),
            ),
          ),
        );
      }
      return cache.get(name)!;
    };
    // The jaw turns the mandible rather than displacing it by one endpoint,
    // so its effect on each anchored point is read from the model built at
    // five openings and interpolated between them.
    const openings = [0, 0.25, 0.5, 0.75, 1];
    const opened = openings.map((w) => {
      const built = build({
        ...start,
        hair: undefined,
        expression: { ...start.expression, jawOpen: w },
      });
      const positions = new Map(
        [human, dentition].map((surface) => [
          surface,
          faceShapeFitSurfacePositions(basis, built, surface.id),
        ]),
      );
      return list.map((one) =>
        faceShapeFitAnchorPoint(positions.get(one.surface)!, one.anchor),
      );
    });
    const jaw = (weight: number, n: number, axis: number): number => {
      const w = Math.min(1, Math.max(0, weight));
      const k = Math.min(openings.length - 2, Math.floor(w * 4));
      const t = (w - openings[k]!) / (openings[k + 1]! - openings[k]!);
      return (
        opened[k]![n]![axis]! +
        t * (opened[k + 1]![n]![axis]! - opened[k]![n]![axis]!) -
        opened[0]![n]![axis]!
      );
    };
    const initial = indices.map((one) => {
      const own = one.expression ? start.expression : start.shape;
      return (
        (own[one.channels[0]!] ?? 0) -
        (one.negative === undefined ? 0 : (own[one.negative[0]!] ?? 0))
      );
    });
    // The unseen form is the face at rest: the skin built without
    // expression, moved by the same endpoint rows at the vertices the
    // readings use (the triangles that reach the midsagittal plane, the
    // scalp and the auricles).
    const rest = faceShapeFitSurfacePositions(
      basis,
      build({ ...start, hair: undefined, expression: {} }),
      human.id,
    );
    const midline = faceMidlineTriangles(rest, human.indices);
    const near = new Set<number>([
      ...(lips === null ? [] : [lips.upper, lips.lower]),
      ...scalp,
      ...auricles.left,
      ...auricles.right,
      ...mastoids.left,
      ...mastoids.right,
      ...midline,
    ]);
    const rows = new Map<string, number[][]>();
    const row = (name: string): number[][] => {
      if (!rows.has(name)) {
        const flat = human.targets[name] ?? [];
        const own: number[][] = [];
        for (let i = 0; i < flat.length; i += 4)
          if (near.has(flat[i]!))
            own.push([flat[i]!, flat[i + 1]!, flat[i + 2]!, flat[i + 3]!]);
        rows.set(name, own);
      }
      return rows.get(name)!;
    };
    const unseen = (values: readonly number[]) => {
      if (norm === null || lips === null)
        return FACE_UNSEEN_INDICES.map(() => null);
      const positions = [...rest];
      const move = (channel: string, weight: number, sign: number) => {
        if (weight === 0) return;
        const one = channels.get(channel)!;
        const name = weight > 0 ? one.positive : one.negative;
        if (name === null) return;
        const scale = sign * Math.abs(weight);
        for (const [vertex, dx, dy, dz] of row(name)) {
          positions[3 * vertex!] += scale * dx!;
          positions[3 * vertex! + 1] += scale * dy!;
          positions[3 * vertex! + 2] += scale * dz!;
        }
      };
      indices.forEach((index, k) => {
        if (index.expression) return;
        for (const [channel, weight] of faceAnthropometryWeights(
          index,
          values[k]!,
        ))
          move(channel, weight, 1);
        for (const [channel, weight] of faceAnthropometryWeights(
          index,
          initial[k]!,
        ))
          move(channel, weight, -1);
      });
      const read = measureFaceUnseen({
        positions,
        indices: midline,
        stomion: positions[3 * lips.upper + 1]!,
        inferius: positions[3 * lips.lower + 1]!,
        scalp,
        auricles,
        mastoids,
        step: 0.0001,
      });
      return FACE_UNSEEN_INDICES.map((one) => read[one.id]);
    };
    // The photograph's indices under its camera, every control at `values`.
    const frontal = (values: readonly number[]) => {
      // Every anchored point's displacement from the start: each index's
      // channels at the values less the same at the start, a whole endpoint
      // row at a time.
      const shift = list.map(() => [0, 0, 0]);
      indices.forEach((index, k) => {
        for (const [weights, sign] of [
          [faceAnthropometryWeights(index, values[k]!), 1],
          [faceAnthropometryWeights(index, initial[k]!), -1],
        ] as const)
          for (const [channel, weight] of weights) {
            if (channel === "jawOpen") {
              shift.forEach((point, n) => {
                for (let axis = 0; axis < 3; ++axis)
                  point[axis]! += sign * jaw(weight, n, axis);
              });
              continue;
            }
            if (weight === 0) continue;
            const one = channels.get(channel)!;
            const name = weight > 0 ? one.positive : one.negative;
            if (name === null) continue;
            const rows = endpoint(name);
            const scale = sign * Math.abs(weight);
            shift.forEach((point, n) => {
              for (let axis = 0; axis < 3; ++axis)
                point[axis]! += scale * rows[n]![axis]!;
            });
          }
      });
      const points: ([number, number] | undefined)[] = [];
      list.forEach((one, n) => {
        const p = [0, 1, 2].map((axis) => base[n]![axis]! + shift[n]![axis]!);
        points[one.landmark] = faceShapeFitProject(camera, p);
      });
      const measured = measureFaceAnthropometry(points);
      return ids.map((id) => measured[id]!);
    };
    // The photograph's upper incisal edge where its mouth profile reads the
    // edge itself, not a bound.
    const rgb = photos.get(`photo:${subject}`)?.rgb;
    const teeth =
      rgb === undefined
        ? null
        : measureFaceLikenessTeeth(
            readFaceLikenessImage(path.join(path.dirname(detectionFile!), rgb)),
            photo.landmarks,
          );
    const photographed = measureFaceAnthropometry([
      ...photo.landmarks.slice(0, 468),
      teeth?.upper?.relation === "at" ? teeth.upper.point : undefined,
      teeth?.lower?.relation === "at" ? teeth.lower.point : undefined,
    ]);
    const before = previous?.[subject]?.anthropometry;
    const render = renders?.get(`portrait:${subject}__reference-yaw`)?.face;
    const rendered =
      render === undefined || render === null
        ? undefined
        : measureFaceAnthropometry(render.landmarks.slice(0, 468));
    const correction = Object.fromEntries(
      ids.map((id) => {
        const model =
          typeof before === "object" ? (before[id]?.model ?? null) : null;
        const seen = rendered?.[id] ?? null;
        return [id, model === null || seen === null ? 0 : model - seen];
      }),
    );
    const target = Object.fromEntries(
      ids.map((id) => [
        id,
        photographed[id] === null ? null : photographed[id]! + correction[id]!,
      ]),
    );
    const controls = indices.map((one, k) => ({
      id: one.id,
      start: initial[k]!,
      lower:
        one.negative === undefined
          ? channels.get(one.channels[0]!)!.minimum
          : -channels.get(one.negative[0]!)!.maximum,
      upper: channels.get(one.channels[0]!)!.maximum,
      resolution: one.resolution ?? 0,
    }));
    // Without an expression study the documents are the identity at rest,
    // whose renders are the expression transfer's rest reading, so a state
    // of the face is not solved there and stays at its start, zero.
    const measuredTargets = FACE_ANTHROPOMETRY_INDICES.map((one) =>
      one.expression === true && expressionStudy === undefined
        ? null
        : target[one.id]!,
    );
    const unseenTargets = FACE_UNSEEN_INDICES.map(
      (one) => norm?.[one.norm] ?? null,
    );
    // The two blocks are solved in turn (block Gauss-Seidel): the
    // photograph's indices exactly with the unseen controls where they
    // stand, then the most probable unseen form under the norms with the
    // photograph's controls where they stand (`solveFaceNorms`), until a
    // sweep leaves the unseen block where it was. The photograph's
    // measurements are met; the norms, a prior, fill what it does not show.
    // The blocks meet only through the depth a frontal camera hardly sees;
    // there is at most one sweep per unseen control.
    const split = FACE_ANTHROPOMETRY_INDICES.length;
    let values = [...initial];
    const sweeps: [number, number][] = [];
    let seen: ReturnType<typeof solveFaceAnthropometry>;
    let unseenSolution: ReturnType<typeof solveFaceNorms>;
    let moved: boolean;
    do {
      const fixed = values.slice(split);
      seen = solveFaceAnthropometry({
        controls: controls
          .slice(0, split)
          .map((one, k) => ({ ...one, start: values[k]! })),
        targets: measuredTargets,
        evaluate: (own) => frontal([...own, ...fixed]),
      });
      const front = seen.values;
      const standing = values.slice(split);
      unseenSolution = solveFaceNorms({
        controls: controls
          .slice(split)
          .map((one, j) => ({ ...one, start: standing[j]! })),
        targets: unseenTargets,
        spreads: FACE_UNSEEN_INDICES.map((one) => one.spread),
        evaluate: (own) => unseen([...front, ...own]),
      });
      moved = unseenSolution.values.some((v, j) => v !== standing[j]);
      values = [...seen.values, ...unseenSolution.values];
      sweeps.push([seen.iterations, unseenSolution.iterations]);
    } while (moved && sweeps.length < FACE_UNSEEN_INDICES.length);
    const shape = { ...start.shape };
    const posed = { ...start.expression };
    indices.forEach((one, k) => {
      for (const [channel, weight] of faceAnthropometryWeights(
        one,
        values[k]!,
      )) {
        const value = Number(weight.toFixed(5));
        if (!one.expression) shape[channel] = value;
        else if (value !== 0) posed[channel] = value;
        else delete posed[channel];
      }
    });
    report[subject] = {
      population,
      anthropometry: Object.fromEntries(
        ids.map((id, k) => [
          id,
          {
            photograph: photographed[id],
            correction: correction[id],
            model: seen.achieved[k],
            control: seen.values[k],
            held: seen.held.includes(k),
          },
        ]),
      ),
      unseen: Object.fromEntries(
        FACE_UNSEEN_INDICES.map((one, j) => [
          one.id,
          {
            norm: norm?.[one.norm] ?? null,
            model: unseenSolution.achieved[j],
            control: unseenSolution.values[j],
            held: unseenSolution.held.includes(j),
          },
        ]),
      ),
      iterations: sweeps,
    };
    return { ...start, shape, expression: posed };
  });
  write(output, study!, derived, report);
} else if (command === "calibration-study") {
  const [study, poseFile, output] = args;
  if (output === undefined)
    throw new Error("calibration-study STUDY POSE.json OUTPUT");
  const basis = json<IAutoMovieHumanFaceBasis>(
    path.join(study!, "basis.json.gz"),
  );
  const documents = faceExpressionCalibrationDocuments({
    basis: basis.id,
    channels: basis.channels
      .filter((channel) => channel.kind === "expression")
      .map((channel) => channel.id),
    weights: [0.25, 0.5, 0.75, 1],
  });
  const pose = json<unknown>(poseFile!);
  fs.mkdirSync(output, { recursive: true });
  fs.copyFileSync(
    path.join(study!, "basis.json.gz"),
    path.join(output, "basis.json.gz"),
  );
  fs.writeFileSync(
    path.join(output, "subjects.json"),
    JSON.stringify(documents, null, 2) + "\n",
  );
  fs.writeFileSync(
    path.join(output, "poses.json"),
    JSON.stringify(
      Object.fromEntries(documents.map((one) => [one.name, pose])),
      null,
      2,
    ) + "\n",
  );
} else if (command === "calibrate") {
  const [calibrationFile, photoFile, output] = args;
  if (output === undefined)
    throw new Error("calibrate CALIBRATION_DETECTIONS DETECTIONS OUTPUT.json");
  const renders = detections(calibrationFile!);
  const rest = renders.get("cal:cal-rest")?.face;
  if (!rest) throw new Error("The calibration needs its rest render.");
  const calibration: Record<string, IFaceExpressionCalibration> = {};
  const WEIGHTS = [0.25, 0.5, 0.75, 1];
  for (const [id] of renders) {
    const match = /^cal:cal-(.+)-100$/u.exec(id);
    if (match === null) continue;
    const channel = match[1]!;
    // A channel the detector has no unit for (the tongue) has nothing to
    // read, so it has no curve.
    if (rest.blendshapes[channel] === undefined) continue;
    calibration[channel] = {
      weights: [0, ...WEIGHTS],
      scores: [
        rest.blendshapes[channel] ?? null,
        ...WEIGHTS.map(
          (w) =>
            renders.get(
              `cal:cal-${channel}-${String(Math.round(w * 100)).padStart(3, "0")}`,
            )?.face?.blendshapes[channel] ?? null,
        ),
      ],
    };
  }
  const photographs = [...detections(photoFile!).entries()].flatMap(
    ([id, one]) =>
      id.startsWith("photo:") && one.face ? [one.face.blendshapes] : [],
  );
  const observable = faceExpressionObservable(calibration, photographs);
  fs.writeFileSync(
    output,
    JSON.stringify(
      { photographs: photographs.length, calibration, observable },
      null,
      2,
    ) + "\n",
  );
} else if (command === "expression") {
  const [study, calibrationFile, restFile, detectionFile, output] = args;
  if (output === undefined)
    throw new Error(
      "expression STUDY CALIBRATION.json REST_DETECTIONS DETECTIONS OUTPUT",
    );
  const documents = json<IAutoMovieHumanFaceBasisDocument[]>(
    path.join(study!, "subjects.json"),
  );
  const { calibration, observable } = json<{
    calibration: Record<string, IFaceExpressionCalibration>;
    observable: string[];
  }>(calibrationFile!);
  const rest = detections(restFile!);
  const photos = detections(detectionFile!);
  const noise = faceExpressionRestNoise(
    [...rest.entries()].flatMap(([id, one]) =>
      id.startsWith("rest:") && one.face ? [one.face.blendshapes] : [],
    ),
  );
  const report: Record<string, unknown> = {};
  const derived = documents.map((document) => {
    const subject = subjectOf(document);
    const photo = photos.get(`photo:${subject}`)?.face;
    const own = rest.get(`rest:${subject}`)?.face;
    if (!photo || !own) {
      report[subject] = "photograph or rest render missing";
      return { ...document, expression: {} };
    }
    const rows = transferFaceExpression({
      calibration,
      observable,
      photo: photo.blendshapes,
      rest: own.blendshapes,
      noise,
    });
    report[subject] = rows;
    return {
      ...document,
      expression: Object.fromEntries(
        rows
          .filter((one) => one.weight > 0)
          .map((one) => [one.channel, Number(one.weight.toFixed(4))]),
      ),
    };
  });
  write(output, study!, derived, report);
} else
  throw new Error(
    "derive-face-documents.ts identity | calibration-study | calibrate | expression",
  );
