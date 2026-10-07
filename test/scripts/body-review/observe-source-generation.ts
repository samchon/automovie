/**
 * Measure two real source generations through the person builder and static
 * writer, using an actual saved numerical person and the standard body's
 * eighteen review states. From test/:
 *
 * ttsx -P tsconfig.scripts.json scripts/body-review/observe-source-generation.ts BASELINE CANDIDATE PERSON_JSON OUTPUT [STATE_NAME]
 *
 * PERSON_JSON is a saved person or the publisher's subjects.json; the latter
 * contributes its first actual person. Declared body driver-domain changes,
 * paired ear/neck controls and oral closure states add actual authoring inputs.
 * Each refusal remains a record. No expected snapshot, test assertion or
 * synthetic source fixture is constructed. Model, Float32, replay and GLB
 * readings are numerical observations, not appearance or clinical acceptance.
 * STATE_NAME selects one of those actual declared authoring states; omission
 * reads the entire population. Actual/neutral builds also export the same
 * production public rest, axes and evaluated-document witness for source
 * authoring. Previous output readings are preserved and never silently mixed.
 * STATE_NAME=source-neutral-frame reads neutral landmark/rig source through
 * the same public helpers without constructing a model. Actual neutral skin
 * crossings are reported separately from this source registration witness.
 */
import { measureAutoMovieMeshCrossings } from "@automovie/engine";
import { evaluateHumanBodyLandmarks } from "@automovie/human/body/basis/evaluateHumanBodyLandmarks";
import { humanBodyBasisWeights } from "@automovie/human/body/basis/humanBodyBasisWeights";
import { resolveHumanBodySkeleton } from "@automovie/human/body/basis/resolveHumanBodySkeleton";
import { gltfMaterialExtensions } from "@automovie/human/common/export/gltfMaterialExtensions";
import { createHumanPersonGenerationBuilder } from "@automovie/human/human/build/createHumanPersonGenerationBuilder";
import { joinHumanPersonGeneration } from "@automovie/human/human/build/joinHumanPersonGeneration";
import { meshOfHumanPart } from "@automovie/human/human/build/meshOfHumanPart";
import { parseHumanPersonDocument } from "@automovie/human/human/document/parseHumanPersonDocument";
import { serializeHumanPersonDocument } from "@automovie/human/human/document/serializeHumanPersonDocument";
import { exportHumanPerson } from "@automovie/human/human/export/exportHumanPerson";
import type { IAutoMovieHumanPersonBodyView } from "@automovie/human/human/structures/IAutoMovieHumanPersonBodyView";
import type { IAutoMovieHumanPersonDocument } from "@automovie/human/human/structures/IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonGeneration } from "@automovie/human/human/structures/IAutoMovieHumanPersonGeneration";
import type { IAutoMovieHumanPersonGenerationBuild } from "@automovie/human/human/structures/IAutoMovieHumanPersonGenerationBuild";
import type { IAutoMovieHumanPersonHeadView } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadView";
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import { WebIO } from "@gltf-transform/core";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

import { standardBodyReviewStates } from "./standardBodyReviewDocuments";

/** One actual numerical authoring state, in the original document's units. */
interface ISourceObservationState {
  name: string;
  group: "actual" | "standard" | "driver" | "face" | "expression" | "return";
  document: IAutoMovieHumanPersonDocument;
}

/** Geometry readings retain resident vertex numbering, not a fitted target. */
interface ISourcePartReading {
  id: string;
  vertices: number;
  triangles: number;
  positionsSha256: string;
  normalsSha256: string | null;
  minimumMetres: number[];
  maximumMetres: number[];
}

/** Actual source geometry comparison; mismatched topology stays unread. */
interface ISourcePartDifference {
  id: string;
  readable: boolean;
  reason?: string;
  maximumPositionDifferenceMetres?: number;
  rmsPositionDifferenceMetres?: number;
  float32ChangedComponents?: number;
  float32MaximumPositionDifferenceMetres?: number;
}

/** One builder/writer result, including refusal and caller ownership. */
interface ISourceEvaluationReading {
  generation: string;
  admitted: boolean;
  reason?: string;
  milliseconds: number;
  callerUnchanged: boolean;
  parts?: ISourcePartReading[];
  boundary?: IAutoMovieHumanPersonGenerationBuild["boundary"];
  replayModelBytesEqual?: boolean;
  glbSha256?: string;
  glbPrimitives?: number;
  glbVertices?: number;
  glbReimported?: boolean;
}

/** The transient built model is not an expected answer or persisted fixture. */
interface ISourceEvaluation {
  reading: ISourceEvaluationReading;
  model?: IAutoMovieModel;
}

/** Exact compressed source bytes that the production builder received. */
interface ISourceGenerationInput {
  generation: IAutoMovieHumanPersonGeneration;
  files: Record<string, string>;
}

const sha = (bytes: Uint8Array | string): string =>
  createHash("sha256").update(bytes).digest("hex");
const floats = (values: readonly number[]): Float32Array =>
  Float32Array.from(values);
const floatSha = (values: readonly number[]): string =>
  sha(new Uint8Array(floats(values).buffer));
const readGeneration = (directory: string): ISourceGenerationInput => {
  const files: Record<string, string> = {};
  const read = <T>(name: string): T => {
    const bytes = fs.readFileSync(path.join(directory, name));
    files[name] = sha(bytes);
    return JSON.parse(gunzipSync(bytes).toString("utf8")) as T;
  };
  const generation = joinHumanPersonGeneration(
    read<IAutoMovieHumanPersonHeadView>("head.json.gz"),
    read<IAutoMovieHumanPersonBodyView>("body.json.gz"),
  );
  return { generation, files };
};
const forGeneration = (
  document: IAutoMovieHumanPersonDocument,
  generation: IAutoMovieHumanPersonGeneration,
): IAutoMovieHumanPersonDocument => ({
  ...document,
  face: { ...document.face, basis: generation.face.id },
  body: { ...document.body, basis: generation.body.id },
});
const partReading = (id: string, mesh: IAutoMovieMesh): ISourcePartReading => {
  const minimumMetres = [Infinity, Infinity, Infinity];
  const maximumMetres = [-Infinity, -Infinity, -Infinity];
  for (let at = 0; at < mesh.positions.length; at++) {
    const axis = at % 3;
    minimumMetres[axis] = Math.min(minimumMetres[axis], mesh.positions[at]);
    maximumMetres[axis] = Math.max(maximumMetres[axis], mesh.positions[at]);
  }
  return {
    id,
    vertices: mesh.positions.length / 3,
    triangles: (mesh.indices?.length ?? mesh.positions.length / 3) / 3,
    positionsSha256: floatSha(mesh.positions),
    normalsSha256: mesh.normals === null ? null : floatSha(mesh.normals),
    minimumMetres,
    maximumMetres,
  };
};
const differences = (
  baseline: IAutoMovieModel,
  candidate: IAutoMovieModel,
): ISourcePartDifference[] => {
  const old = new Map(
    baseline.parts.map((part) => [part.id, meshOfHumanPart(part)]),
  );
  const candidateIds = new Set(candidate.parts.map((part) => part.id));
  const readings = candidate.parts.map((part): ISourcePartDifference => {
    const before = old.get(part.id);
    const after = meshOfHumanPart(part);
    if (
      before === undefined ||
      before.positions.length !== after.positions.length ||
      JSON.stringify(before.indices) !== JSON.stringify(after.indices)
    )
      return {
        id: part.id,
        readable: false,
        reason: "No identical resident topology correspondence.",
      };
    let maximum = 0,
      squares = 0,
      float32Maximum = 0,
      changed = 0;
    for (let at = 0; at < before.positions.length; at += 3) {
      let distanceSquared = 0,
        float32DistanceSquared = 0;
      for (let axis = 0; axis < 3; axis++) {
        const delta = after.positions[at + axis] - before.positions[at + axis];
        distanceSquared += delta * delta;
        const f32 =
          Math.fround(after.positions[at + axis]) -
          Math.fround(before.positions[at + axis]);
        float32DistanceSquared += f32 * f32;
        if (f32 !== 0) changed++;
      }
      maximum = Math.max(maximum, Math.sqrt(distanceSquared));
      float32Maximum = Math.max(
        float32Maximum,
        Math.sqrt(float32DistanceSquared),
      );
      squares += distanceSquared;
    }
    return {
      id: part.id,
      readable: true,
      maximumPositionDifferenceMetres: maximum,
      rmsPositionDifferenceMetres: Math.sqrt(
        squares / (before.positions.length / 3),
      ),
      float32ChangedComponents: changed,
      float32MaximumPositionDifferenceMetres: float32Maximum,
    };
  });
  for (const id of old.keys())
    if (!candidateIds.has(id))
      readings.push({
        id,
        readable: false,
        reason:
          "Baseline-only part removed from candidate; no corresponding resident topology.",
      });
  return readings;
};

async function main(): Promise<void> {
  const [baselineDirectory, candidateDirectory, personFile, output, stateName] =
    process.argv.slice(2);
  if (!baselineDirectory || !candidateDirectory || !personFile || !output)
    throw new Error("Expected BASELINE CANDIDATE PERSON_JSON OUTPUT.");
  const baselineInput = readGeneration(baselineDirectory);
  const candidateInput = readGeneration(candidateDirectory);
  const baseline = baselineInput.generation;
  const candidate = candidateInput.generation;
  const inputBytes = fs.readFileSync(personFile, "utf8");
  const parsed = JSON.parse(inputBytes) as Record<string, unknown>;
  const people = parsed.people;
  const actual = parseHumanPersonDocument(
    Array.isArray(people) ? JSON.stringify(people[0]) : inputBytes,
  );
  if (stateName === "source-neutral-frame") {
    const document = forGeneration(actual, candidate);
    if (
      Object.keys(document.body.shape).length !== 0 ||
      (document.body.pose ?? []).length !== 0 ||
      (document.body.shoulders ?? []).length !== 0 ||
      (document.body.toes ?? []).length !== 0 ||
      (document.body.anatomicalMotion ?? []).length !== 0
    )
      throw new Error(
        "Source-neutral-frame needs the actual saved body-neutral input with no performance request.",
      );
    const before = JSON.stringify(document);
    const weights = humanBodyBasisWeights(candidate.body, document.body);
    const landmarks = evaluateHumanBodyLandmarks(candidate.body, weights);
    const rig = resolveHumanBodySkeleton(candidate.body, landmarks);
    const surface = candidate.body.surfaces[0];
    const mesh: IAutoMovieMesh = {
      positions: surface.positions,
      indices: surface.indices,
      normals: null,
      uvs: null,
      skin: null,
    };
    const crossings = measureAutoMovieMeshCrossings(mesh, mesh, {
      allPairs: true,
    });
    fs.mkdirSync(output, { recursive: true });
    const target = path.join(
      output,
      `${candidate.id}-source-neutral-frame.json`,
    );
    if (fs.existsSync(target))
      throw new Error(
        "Source-frame observation preserves its previous output.",
      );
    fs.writeFileSync(
      target,
      JSON.stringify(
        {
          generation: candidate.id,
          bodyBasis: candidate.body.id,
          bodyInputSha256: candidateInput.files,
          sourcePersonInputSha256: sha(inputBytes),
          document,
          documentSha256: sha(serializeHumanPersonDocument(document)),
          coordinateFrame:
            "canonical body/source metres; +X left, +Y up, +Z anterior; no model placement or ground translation",
          bodySourceState: {
            shape: document.body.shape,
            pose: weights.pose,
            weights: [...weights.weights],
            activations: weights.activations,
          },
          landmarks,
          sourceJointDefinitions: candidate.body.joints,
          sourceToeRays: candidate.body.toeRays,
          skeleton: rig.skeleton,
          sourceResolvedRest: [...rig.rest],
          sourceAxes: rig.axes,
          sourceRestFrames: rig.frames,
          sourceGeometryObservation: {
            crossingPairs: crossings.length,
            geometryAdmission:
              crossings.length === 0
                ? "not run"
                : "neutral self-crossing observed",
          },
          modelBuilt: false,
          callerUnchanged: before === JSON.stringify(document),
          runtime: {
            pid: process.pid,
            execPath: process.execPath,
            version: process.version,
          },
          qualification:
            "Actual neutral source-frame evaluation by public weights/landmark/skeleton owners. Geometry admission and normal model construction are separate; no accepted model, clinical joint centre, pose support, GLB or GPU result is claimed.",
        },
        null,
        2,
      ),
    );
    console.log(
      "source-neutral-frame",
      candidate.id,
      rig.rest.size,
      "rest",
      Object.keys(landmarks).length,
      "landmarks",
      crossings.length,
      "ordered source crossings",
    );
    return;
  }
  const states: ISourceObservationState[] = [
    { name: "actual-saved-person", group: "actual", document: actual },
  ];
  const standard = standardBodyReviewStates();
  for (const [name, state] of Object.entries(standard)) {
    const body = {
      ...actual.body,
      shape: state.shape,
      pose: state.pose,
      shoulders: state.shoulders,
    };
    states.push({ name, group: "standard", document: { ...actual, body } });
  }
  const baseDriverLimits = new Map(
    baseline.face.channels
      .filter((channel) => channel.id.startsWith("driver:"))
      .map((channel) => [channel.positive, channel.maximum]),
  );
  const changedDrivers = new Set(
    candidate.face.channels
      .filter(
        (channel) =>
          channel.id.startsWith("driver:") &&
          channel.maximum !== baseDriverLimits.get(channel.positive),
      )
      .map((channel) => channel.positive),
  );
  const changedChannels = candidate.body.channels.filter(
    (channel) =>
      changedDrivers.has(channel.positive) ||
      (channel.negative !== null && changedDrivers.has(channel.negative)),
  );
  for (const channel of changedChannels) {
    for (const [side, value] of [
      ["minimum", channel.minimum],
      ["maximum", channel.maximum],
    ] as const) {
      for (const [phase, weight] of [
        ["intermediate", value / 2],
        ["endpoint", value],
      ] as const) {
        states.push({
          name: `${channel.id}/${side}/${phase}`,
          group: "driver",
          document: {
            ...actual,
            body: {
              ...actual.body,
              shape: { [channel.id]: weight },
              pose: [],
              shoulders: [],
            },
          },
        });
      }
    }
  }
  const pairChannels = candidate.face.channels.filter(
    (channel) =>
      /ear|neck/iu.test(channel.id) &&
      /left|right/iu.test(channel.id) &&
      !channel.id.startsWith("driver:"),
  );
  for (const channel of pairChannels)
    states.push({
      name: `${channel.id}/endpoint`,
      group: "face",
      document: {
        ...actual,
        face: {
          ...actual.face,
          shape: { ...actual.face.shape, [channel.id]: channel.maximum },
        },
      },
    });
  const jaw = candidate.face.channels.find(
    (channel) => channel.id === "jawOpen",
  );
  const close = candidate.face.channels.find(
    (channel) => channel.id === "mouthClose",
  );
  if (jaw !== undefined && close !== undefined)
    for (const weight of [
      jaw.minimum,
      (jaw.minimum + jaw.maximum) / 2,
      jaw.maximum,
    ])
      states.push({
        name: `jawOpen/${weight}/mouthClose`,
        group: "expression",
        document: {
          ...actual,
          face: {
            ...actual.face,
            expression: {
              ...actual.face.expression,
              jawOpen: weight,
              mouthClose: close.maximum,
            },
          },
        },
      });
  states.push({
    name: "return-to-actual-saved-person",
    group: "return",
    document: actual,
  });
  const selected =
    stateName === undefined
      ? states
      : states.filter((state) => state.name === stateName);
  if (selected.length === 0)
    throw new Error(`No actual authoring state named ${stateName}.`);
  fs.mkdirSync(output, { recursive: true });
  if (fs.existsSync(path.join(output, "readings.ndjson")))
    throw new Error(
      "Observation needs a new output directory; previous source readings are preserved.",
    );
  fs.writeFileSync(
    path.join(output, "candidate.person.json.gz"),
    gzipSync(JSON.stringify(candidate) + "\n", { level: 9 }),
  );
  fs.writeFileSync(
    path.join(output, "documents.json"),
    JSON.stringify(
      states.map((state) => ({
        ...forGeneration(state.document, candidate),
        id: state.name,
        name: state.name,
      })),
      null,
      1,
    ) + "\n",
  );
  const buildBaseline = createHumanPersonGenerationBuilder({
    generation: baseline,
  });
  const buildCandidate = createHumanPersonGenerationBuilder({
    generation: candidate,
  });
  const io = new WebIO().registerExtensions(gltfMaterialExtensions);
  const evaluate = async (
    state: ISourceObservationState,
    generation: IAutoMovieHumanPersonGeneration,
    build: ReturnType<typeof createHumanPersonGenerationBuilder>,
  ): Promise<ISourceEvaluation> => {
    const started = Date.now();
    const document = forGeneration(state.document, generation);
    const before = JSON.stringify(document);
    const reading: ISourceEvaluationReading = {
      generation: generation.id,
      admitted: false,
      milliseconds: 0,
      callerUnchanged: true,
    };
    let model: IAutoMovieModel | undefined;
    try {
      const result = build(document);
      reading.admitted = true;
      model = result.model;
      reading.parts = result.model.parts.map((part) =>
        partReading(part.id, meshOfHumanPart(part)),
      );
      reading.boundary = result.boundary;
      if (state.group === "actual" || state.name === "neutral") {
        const rig = resolveHumanBodySkeleton(
          generation.body,
          result.body.landmarks,
        );
        fs.writeFileSync(
          path.join(output, `${generation.id}-${state.name}-public-rest.json`),
          JSON.stringify(
            {
              generation: generation.id,
              faceBasis: generation.face.id,
              bodyBasis: generation.body.id,
              document,
              documentSha256: sha(serializeHumanPersonDocument(document)),
              sourceInputSha256:
                generation === baseline
                  ? baselineInput.files
                  : candidateInput.files,
              evaluatedBodyDocument: result.body.evaluatedDocument,
              skeleton: result.body.skeleton,
              bones: result.body.bones,
              landmarks: result.body.landmarks,
              sourceJointDefinitions: generation.body.joints,
              sourceToeRays: generation.body.toeRays,
              sourceResolvedRest: [...rig.rest],
              sourceAxes: rig.axes,
              sourceRestFrames: rig.frames,
              qualification:
                "Actual production public rig witness; no imaged anatomical joint centre or biological registration inferred.",
            },
            null,
            1,
          ) + "\n",
        );
      }
      const replay = build(
        parseHumanPersonDocument(serializeHumanPersonDocument(document)),
      );
      reading.replayModelBytesEqual =
        JSON.stringify(replay.model) === JSON.stringify(result.model);
      if (
        state.group === "standard" ||
        state.group === "actual" ||
        state.group === "expression"
      ) {
        const written = await exportHumanPerson(result.model);
        reading.glbSha256 = sha(written.glb);
        const imported = await io.readBinary(written.glb);
        const primitives = imported
          .getRoot()
          .listMeshes()
          .flatMap((mesh) => mesh.listPrimitives());
        reading.glbPrimitives = primitives.length;
        reading.glbVertices = primitives.reduce(
          (sum, primitive) =>
            sum + (primitive.getAttribute("POSITION")?.getCount() ?? 0),
          0,
        );
        reading.glbReimported = true;
        if (state.group === "actual")
          fs.writeFileSync(
            path.join(output, `${generation.id}.glb`),
            written.glb,
          );
      }
      return { reading, model: result.model };
    } catch (error) {
      reading.reason = error instanceof Error ? error.message : String(error);
      return { reading, model };
    } finally {
      reading.milliseconds = Date.now() - started;
      reading.callerUnchanged = before === JSON.stringify(document);
    }
  };
  for (const state of selected) {
    const a = await evaluate(state, baseline, buildBaseline);
    const b = await evaluate(state, candidate, buildCandidate);
    const record = {
      name: state.name,
      group: state.group,
      document: forGeneration(state.document, candidate),
      baseline: a.reading,
      candidate: b.reading,
      differences:
        a.model !== undefined && b.model !== undefined
          ? differences(a.model, b.model)
          : null,
    };
    fs.appendFileSync(
      path.join(output, "readings.ndjson"),
      JSON.stringify(record) + "\n",
    );
    console.log(
      state.name,
      `baseline=${a.reading.reason ?? (a.reading.admitted ? "admitted" : "unread")}`,
      `candidate=${b.reading.reason ?? (b.reading.admitted ? "admitted" : "unread")}`,
    );
  }
  fs.writeFileSync(
    path.join(output, "identity.json"),
    JSON.stringify(
      {
        baseline: baseline.id,
        candidate: candidate.id,
        baselineInputSha256: baselineInput.files,
        candidateInputSha256: candidateInput.files,
        actualPersonSha256: sha(inputBytes),
        states: selected.length,
        standardStates: selected.filter((state) => state.group === "standard")
          .length,
        convention:
          "Measurements of actual final resident meshes and static GLB readback, not rendered appearance or clinical qualification; source-conditioned topology differences remain unread.",
      },
      null,
      1,
    ) + "\n",
  );
}
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
