/**
 * Publish existing neutral source geometry for registration authoring.
 *
 * The source-frame mode retains its landmark/skeleton and crossing record.
 * The paired-exterior mode uses the existing source-partition reader and
 * publishes only its mesh/origin incidence plus original cut provenance.
 * Neither mode constructs a Face model or evaluates an authored shape.
 * STATE_NAME=source-neutral-frame reads neutral landmark/rig source through
 * the same public helpers; its neutral skin crossings remain a separate
 * source geometry observation. source-paired-exterior publishes the exact
 * existing mesh and original sourcePartition/cut identities.
 */
import { measureAutoMovieMeshCrossings } from "@automovie/engine";
import { evaluateHumanBodyLandmarks } from "@automovie/human/body/basis/evaluateHumanBodyLandmarks";
import { humanBodyBasisWeights } from "@automovie/human/body/basis/humanBodyBasisWeights";
import { resolveHumanBodySkeleton } from "@automovie/human/body/basis/resolveHumanBodySkeleton";
import { findHumanPersonSkinSurface } from "@automovie/human/human/build/findHumanPersonSkinSurface";
import { serializeHumanPersonDocument } from "@automovie/human/human/document/serializeHumanPersonDocument";
import type { IAutoMovieHumanPersonDocument } from "@automovie/human/human/structures/IAutoMovieHumanPersonDocument";
import type { IAutoMovieMesh } from "@automovie/interface";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { IHumanSourceObservationGenerationInput } from "./IHumanSourceObservationGenerationInput";
import { readHumanBodyLayerSourceExterior } from "./readHumanBodyLayerSourceExterior";

const sha = (bytes: Uint8Array | string): string =>
  createHash("sha256").update(bytes).digest("hex");

/** Write one real neutral source artifact while preserving previous epochs. */
export function writeHumanSourceNeutralObservation(
  input: IHumanSourceObservationGenerationInput,
  document: IAutoMovieHumanPersonDocument,
  sourcePersonInputSha256: string,
  output: string,
  stateName: "source-neutral-frame" | "source-paired-exterior",
): void {
  const candidate = input.generation;
  if (
    Object.keys(document.body.shape).length !== 0 ||
    (document.body.pose ?? []).length !== 0 ||
    (document.body.shoulders ?? []).length !== 0 ||
    (document.body.toes ?? []).length !== 0 ||
    (document.body.anatomicalMotion ?? []).length !== 0
  )
    throw new Error(
      (stateName === "source-neutral-frame" ? "Source-neutral-frame" : "Source-paired-exterior") +
      " needs the actual saved body-neutral input with no performance request.",
    );
  if (stateName === "source-paired-exterior") {
    const before = JSON.stringify(document);
    const exterior = readHumanBodyLayerSourceExterior(candidate);
    const face = findHumanPersonSkinSurface(candidate.face.surfaces).surface;
    const body = findHumanPersonSkinSurface(candidate.body.surfaces).surface;
    const target = path.join(output, `${candidate.id}-source-paired-exterior.json`);
    const receipt = path.join(output, `${candidate.id}-source-paired-exterior.receipt.json`);
    if (fs.existsSync(target) || fs.existsSync(receipt))
      throw new Error("Source paired exterior publication preserves previous outputs.");
    const bytes = JSON.stringify(exterior);
    const producerInputs: Record<string, string> = {};
    for (const name of [
      "observe-source-generation.ts",
      "IHumanSourceObservationGenerationInput.ts",
      "readHumanSourceObservationGeneration.ts",
      "writeHumanSourceNeutralObservation.ts",
      "readHumanBodyLayerSourceExterior.ts",
    ]) {
      const file = path.resolve(__dirname, name);
      producerInputs[file] = sha(fs.readFileSync(file));
    }
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(target, bytes, { flag: "wx" });
    fs.writeFileSync(receipt, JSON.stringify({
      schema: "automovie-source-paired-exterior/1",
      state: "complete",
      generation: candidate.id,
      faceBasis: candidate.face.id,
      bodyBasis: candidate.body.id,
      bodyInputSha256: input.files,
      sourcePersonInputSha256,
      document,
      documentSha256: sha(serializeHumanPersonDocument(document)),
      coordinateFrame: "canonical body/source metres; +X left, +Y up, +Z anterior; no model placement or ground translation",
      exteriorFile: path.basename(target),
      exteriorSha256: sha(bytes),
      sourcePartitions: { face: face.sourcePartition, body: body.sourcePartition },
      producerInputs,
      modelBuilt: false,
      callerUnchanged: before === JSON.stringify(document),
      runtime: { pid: process.pid, execPath: process.execPath, version: process.version },
      qualification: "Existing paired neutral source positions, indices and sample/cut incidence only. Original partitions are checked by their maintained owner; no cap, weld, new skin, field, Face construction, clinical joint centre or model/F32/GPU acceptance is authored. Declared producer bytes are recorded; a complete resolved-reference graph is not regenerated by this receipt.",
    }), { flag: "wx" });
    console.log("source-paired-exterior", candidate.id, exterior.mesh.positions.length / 3,
      "vertices", (exterior.mesh.indices?.length ?? 0) / 3, "triangles");
    return;
  }
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
        bodyInputSha256: input.files,
        sourcePersonInputSha256: sourcePersonInputSha256,
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
}
