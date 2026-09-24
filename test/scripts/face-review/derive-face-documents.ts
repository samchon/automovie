/**
 * Derive every published document's shape and expression from its subject's
 * recorded facts and photograph by shared rules, from the test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/derive-face-documents.ts identity \
 *     STUDY FACTS DETECTIONS POSES ANCHORS OUTPUT [EXPRESSION_STUDY [PREVIOUS_STUDY RENDER_DETECTIONS]]
 *   ttsx ... derive-face-documents.ts calibrate CALIBRATION_DETECTIONS DETECTIONS OUTPUT.json
 *   ttsx ... derive-face-documents.ts expression STUDY CALIBRATION.json REST_DETECTIONS DETECTIONS OUTPUT
 *
 * A document is a face described, not a face sculpted: every value it gets
 * here is either a recorded fact, a named proportion measured on the
 * photograph, or a named expression unit the detector reads, each carried
 * into the one control that means it by a rule shared by every subject.
 *
 * `identity` writes shape only. The population controls come from the facts
 * (`facePopulationControls`); every other shape channel starts at zero; the
 * anthropometric controls (`FACE_ANTHROPOMETRY_INDICES`) are then solved one
 * per index so the model under the photograph's camera has the photograph's
 * proportions (`solveFaceAnthropometry`). The model's landmarks are the
 * published anchors of that camera on the surface, and shape endpoints are
 * linear, so an index is read from the endpoint rows at the anchored
 * vertices on top of one real build at the starting controls (with the
 * expression of EXPRESSION_STUDY, if given, so a smile is not read as mouth
 * shape). Expression, gaze and everything else keep the study's values when
 * EXPRESSION_STUDY is given and are empty otherwise; hair, iris and material
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
  measureFaceAnthropometry,
} from "./faceAnthropometry";
import { solveFaceAnthropometry } from "./faceAnthropometrySolve";
import {
  type IFaceExpressionCalibration,
  faceExpressionObservable,
  transferFaceExpression,
} from "./faceExpressionTransfer";
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
  ] = args;
  if (output === undefined)
    throw new Error(
      "identity STUDY FACTS DETECTIONS POSES ANCHORS OUTPUT [EXPRESSION_STUDY [PREVIOUS_STUDY RENDER_DETECTIONS]]",
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
  const channels = new Map(basis.channels.map((one) => [one.id, one]));
  const build = createHumanFaceBasisBuilder(basis);
  const ids = FACE_ANTHROPOMETRY_INDICES.map((one) => one.id);
  const report: Record<string, unknown> = {};
  const derived = documents.map((document) => {
    const subject = subjectOf(document);
    const population = facePopulationControls(
      facts[subject] ?? { ageYears: null, sex: null, ancestry: null },
    );
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
    const list = view.anchors.filter((one) => one.anchor !== null);
    const built = faceShapeFitSurfacePositions(
      basis,
      build({ ...start, hair: undefined }),
      "Human",
    );
    const base = list.map((one) => faceShapeFitAnchorPoint(built, one.anchor!));
    // Anchored displacement of one endpoint, cached.
    const cache = new Map<string, number[][]>();
    const endpoint = (name: string): number[][] => {
      if (!cache.has(name)) {
        const flat = human.targets[name] ?? [];
        const rows = new Map<number, number[]>();
        for (let i = 0; i < flat.length; i += 4)
          rows.set(flat[i]!, [flat[i + 1]!, flat[i + 2]!, flat[i + 3]!]);
        cache.set(
          name,
          list.map(({ anchor }) =>
            [0, 1, 2].map((axis) =>
              anchor!.vertices.reduce(
                (sum, vertex, k) =>
                  sum + anchor!.weights[k]! * (rows.get(vertex)?.[axis] ?? 0),
                0,
              ),
            ),
          ),
        );
      }
      return cache.get(name)!;
    };
    const contribution = (
      channel: string,
      weight: number,
      n: number,
      axis: number,
    ) => {
      if (weight === 0) return 0;
      const one = channels.get(channel)!;
      const name = weight > 0 ? one.positive : one.negative;
      return name === null ? 0 : Math.abs(weight) * endpoint(name)[n]![axis]!;
    };
    const initial = FACE_ANTHROPOMETRY_INDICES.map(
      (one) => start.shape[one.channels[0]!] ?? 0,
    );
    const evaluate = (values: readonly number[]) => {
      const points: ([number, number] | undefined)[] = [];
      list.forEach((one, n) => {
        const p = [0, 1, 2].map(
          (axis) =>
            base[n]![axis]! +
            FACE_ANTHROPOMETRY_INDICES.reduce(
              (sum, index, k) =>
                sum +
                index.channels.reduce(
                  (inner, channel) =>
                    inner +
                    contribution(channel, values[k]!, n, axis) -
                    contribution(channel, initial[k]!, n, axis),
                  0,
                ),
              0,
            ),
        );
        points[one.landmark] = faceShapeFitProject(camera, p);
      });
      const measured = measureFaceAnthropometry(points);
      return ids.map((id) => measured[id]!);
    };
    const photographed = measureFaceAnthropometry(
      photo.landmarks.slice(0, 468),
    );
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
    const solution = solveFaceAnthropometry({
      controls: FACE_ANTHROPOMETRY_INDICES.map((one, k) => ({
        id: one.id,
        start: initial[k]!,
        lower: channels.get(one.channels[0]!)!.minimum,
        upper: channels.get(one.channels[0]!)!.maximum,
      })),
      targets: ids.map((id) => target[id]!),
      evaluate,
    });
    const shape = { ...start.shape };
    FACE_ANTHROPOMETRY_INDICES.forEach((one, k) => {
      for (const channel of one.channels)
        shape[channel] = Number(solution.values[k]!.toFixed(5));
    });
    report[subject] = {
      population,
      anthropometry: Object.fromEntries(
        ids.map((id, k) => [
          id,
          {
            photograph: photographed[id],
            correction: correction[id],
            model: solution.achieved[k],
            control: solution.values[k],
            held: solution.held.includes(k),
          },
        ]),
      ),
      iterations: solution.iterations,
    };
    return { ...start, shape };
  });
  write(output, study!, derived, report);
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
  throw new Error("derive-face-documents.ts identity | calibrate | expression");
