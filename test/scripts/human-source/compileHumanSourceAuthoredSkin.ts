import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { assertHumanSourceWorkInputs } from "./assertHumanSourceWorkInputs.ts";
import { buildHumanSourceAuthoredHeadRegions } from "./buildHumanSourceAuthoredHeadRegions.ts";
import { buildHumanSourceAuthoredSkin } from "./buildHumanSourceAuthoredSkin.ts";
import { buildHumanSourceAuthoredTopology } from "./buildHumanSourceAuthoredTopology.ts";
import { buildHumanSourceCut } from "./buildHumanSourceCut.ts";
import { buildHumanSourceTopology } from "./buildHumanSourceTopology.ts";
import { createHumanSourceDeltaReader } from "./createHumanSourceDeltaReader.ts";
import { createHumanSourcePublication } from "./createHumanSourcePublication.ts";
import { fillHumanSourceExcludedRegions } from "./fillHumanSourceExcludedRegions.ts";
import { prepareHumanSourceLipClosure } from "./prepareHumanSourceLipClosure.ts";
import { readHumanSourceAuthoredCheckpoint } from "./readHumanSourceAuthoredCheckpoint.ts";
import { readHumanSourceAuthoredProfile } from "./readHumanSourceAuthoredProfile.ts";
import { readHumanSourceAuthoredReplay } from "./readHumanSourceAuthoredReplay.ts";
import { readHumanSourceInput } from "./readHumanSourceInput.ts";
import { readHumanSourceMirror } from "./readHumanSourceMirror.ts";
import { readHumanSourceProducerClosure } from "./readHumanSourceProducerClosure.ts";
import { readHumanSourcePublication } from "./readHumanSourcePublication.ts";
import { readHumanSourceSample } from "./readHumanSourceSample.ts";
import { regenerateHumanSourceBodyNeutral } from "./regenerateHumanSourceBodyNeutral.ts";
import { regenerateHumanSourceExcludedRegions } from "./regenerateHumanSourceExcludedRegions.ts";
import { regenerateHumanSourceLidSeat } from "./regenerateHumanSourceLidSeat.ts";
import { regenerateHumanSourceLipSeal } from "./regenerateHumanSourceLipSeal.ts";
import { regenerateHumanSourceOrbitalSkin } from "./regenerateHumanSourceOrbitalSkin.ts";
import type { IHumanSourceAuthoredCell } from "./structures/IHumanSourceAuthoredCell.ts";
import type { IHumanSourceAuthoredCompilation } from "./structures/IHumanSourceAuthoredCompilation.ts";
import type { IHumanSourceAuthoredPacket } from "./structures/IHumanSourceAuthoredPacket.ts";
import type { IHumanSourceDeltaReader } from "./structures/IHumanSourceDeltaReader.ts";
import type { IHumanSourceEditReceipt } from "./structures/IHumanSourceEditReceipt.ts";
import type { IHumanSourceExtractionReceipt } from "./structures/IHumanSourceExtractionReceipt.ts";
import type { IHumanSourceFaceExtractionReceipt } from "./structures/IHumanSourceFaceExtractionReceipt.ts";
import type { IHumanSourceGenerationInput } from "./structures/IHumanSourceGenerationInput.ts";
import type { IHumanSourceHeadGuide } from "./structures/IHumanSourceHeadGuide.ts";
import type { IHumanSourceLipSealReceipt } from "./structures/IHumanSourceLipSealReceipt.ts";
import type { IHumanSourceMirror } from "./structures/IHumanSourceMirror.ts";
import type { IHumanSourceNasalAxisReceipt } from "./structures/IHumanSourceNasalAxisReceipt.ts";
import type { IHumanSourceRecropReceipt } from "./structures/IHumanSourceRecropReceipt.ts";
import type { IHumanSourceSampleState } from "./structures/IHumanSourceSampleState.ts";

/**
 * Compile the actual provider neutral into one root and both geometry views.
 * Original publications define only frozen cut lineage, never new neutral
 * coordinates. Source native bone support is transported through compaction,
 * authored bindings and shared cut stencils. Output is an intermediate source
 * stage, not a completed generation: anatomical registration,
 * contact, normal transport, editor/export and render acceptance remain open.
 * The recorded native ReferenceGraph closure and all data digests identify
 * this run independently of any moving SDK browser emit.
 * A lip-stage refusal restores the completed-eye prefix, serializes its root,
 * both views, weights and complete replay as a failed inspection checkpoint,
 * then rethrows. Full generation cannot consume that as successful compilation.
 *
 * The generation compiler passes the mirror table it already read and
 * recorded; a standalone stage run reads and records it here.
 */
export function compileHumanSourceAuthoredSkin(
  work: string,
  provider: string,
  replay: string,
  output: string,
  repository: string,
  sharedMirror?: IHumanSourceMirror,
  inspectionCheckpoint?: string,
): IHumanSourceAuthoredCompilation {
  if (fs.existsSync(output))
    throw new Error("Authored skin stage needs a new output directory.");
  const digest = (bytes: Buffer): string =>
    crypto.createHash("sha256").update(bytes).digest("hex");
  const closure = readHumanSourceProducerClosure(
    repository,
    "test/scripts/human-source/compile-authored-skin.ts",
  );
  console.log(
    "[authored-neutral-skin] producer graph collected",
    closure.inputs.length,
    "inputs",
  );
  const inputs: IHumanSourceGenerationInput[] = [...closure.inputs];
  const sample = readHumanSourceSample(path.join(work, "sample"));
  inputs.push({
    role: "verified content sample manifest",
    path: "sample/manifest.json",
    revision: null,
    bytes: sample.manifestBytes.length,
    sha256: digest(sample.manifestBytes),
  });
  const providerPublication = readHumanSourcePublication(
    provider,
    [
      "head-provider-packet.json",
      "provider-cells.json",
      "neutral-provider.f64",
      "joints-provider.f64",
    ],
    "component",
  );
  const packetBytes = providerPublication.outputs.get(
    "head-provider-packet.json",
  )!;
  const packet = JSON.parse(
    packetBytes.toString("utf8"),
  ) as IHumanSourceAuthoredPacket;
  inputs.push({
    role: "authored neutral packet",
    path: "provider/head-provider-packet.json",
    revision: null,
    bytes: packetBytes.length,
    sha256: digest(packetBytes),
  });
  for (const [name, observed] of Object.entries(sample.manifest.files)) {
    const expected = packet.sampleInputs[name];
    if (
      expected?.sha256 !== observed.sha256 ||
      expected.bytes !== observed.bytes
    )
      throw new Error(
        `Provider packet has a different original sampled input ${name}.`,
      );
    inputs.push({
      role: "verified original sample",
      path: `sample/${name}`,
      revision: null,
      ...observed,
    });
  }
  const bytes = (name: string, expected: string): Buffer => {
    const data = providerPublication.outputs.get(name);
    if (data === undefined)
      throw new Error(`Authored provider publication does not own ${name}.`);
    if (digest(data) !== expected)
      throw new Error(`Authored provider ${name} differs from its packet.`);
    inputs.push({
      role: "authored provider neutral",
      path: `provider/${name}`,
      revision: null,
      bytes: data.length,
      sha256: expected,
    });
    return data;
  };
  const nativeBytes = bytes("neutral-provider.f64", packet.positions.sha256);
  const native = new Float64Array(
    nativeBytes.buffer.slice(
      nativeBytes.byteOffset,
      nativeBytes.byteOffset + nativeBytes.byteLength,
    ),
  );
  const cells = JSON.parse(
    bytes("provider-cells.json", packet.cells.sha256).toString("utf8"),
  ) as IHumanSourceAuthoredCell[];
  bytes("joints-provider.f64", packet.bonepoints.sha256);
  const nasalAxis =
    readHumanSourceAuthoredProfile<IHumanSourceNasalAxisReceipt>(
      repository,
      packet.nasalAxisFit,
      inputs,
      "owned nasal projection chart",
    );
  const headGuide = readHumanSourceAuthoredProfile<IHumanSourceHeadGuide>(
    repository,
    packet.sourceGuide,
    inputs,
    "owned head source chart anchors",
  );
  if (!headGuide.qualification.trim())
    throw new Error(
      "Current head source chart anchors lack their acquisition qualification.",
    );
  if (packet.originalNativeCount !== sample.manifest.vertices)
    throw new Error("Provider native population differs from original sample.");
  const facePath =
    "test/studies/human-face/connected-basis/global-face/basis.json.gz";
  const face = readHumanSourceInput<IAutoMovieHumanFaceBasis>(
    inputs,
    "original published face",
    repository,
    facePath,
    null,
    null,
  );
  const body = readHumanSourceInput<IAutoMovieHumanBodyBasis>(
    inputs,
    "original published body",
    repository,
    "test/studies/human-body/connected-basis/basis.json.gz",
    null,
    null,
  );
  const crop = readHumanSourceInput<IHumanSourceRecropReceipt>(
    inputs,
    "original crop receipt",
    repository,
    "test/studies/human-face/connected-basis/global-face/preparation-receipt.json",
    null,
    null,
  );
  const extraction = readHumanSourceInput<IHumanSourceExtractionReceipt>(
    inputs,
    "original frame receipt",
    repository,
    "test/studies/human-body/connected-basis/extraction-receipt.json",
    null,
    null,
  );
  const faceExtraction =
    readHumanSourceInput<IHumanSourceFaceExtractionReceipt>(
      inputs,
      "original face extraction",
      repository,
      "test/studies/human-face/connected-basis/global-face/extraction-receipt.json",
      null,
      null,
    );
  const fine = readHumanSourceInput<IAutoMovieHumanFaceBasis>(
    inputs,
    "original fine face",
    repository,
    facePath,
    crop.connectivitySource,
    faceExtraction.compressedSha256,
  );
  const rigid = readHumanSourceInput<IAutoMovieHumanFaceBasis>(
    inputs,
    "original rigid face",
    repository,
    facePath,
    "bfbb0f885",
    "5201ba8edb6857e36e02aa62c6ccb2f22758211aa5a63b1e6d30a99e65bf728f",
  );
  const surface = (
    basis: IAutoMovieHumanFaceBasis,
  ): IAutoMovieHumanFaceBasis["surfaces"][number] => {
    const human = basis.surfaces.find((entry) => entry.id === "Human");
    if (human === undefined)
      throw new Error(`Original face ${basis.id} has no Human surface.`);
    return human;
  };
  const originalTopology = buildHumanSourceTopology(
    sample,
    extraction.frame.offset,
  );
  const original = buildHumanSourceCut({
    topology: originalTopology,
    minimumY: crop.minimumY,
    fineHead: surface(fine),
    rigidFace: surface(rigid),
    face: surface(face),
    body: body.surfaces[0],
  });
  const root = buildHumanSourceAuthoredTopology(
    native,
    cells,
    extraction.frame.offset,
  );
  const originalPolygonParents = new Int32Array(sample.loopTotal.length);
  let parent = 0;
  sample.loopTotal.forEach((total, polygon) => {
    originalPolygonParents[polygon] = parent;
    parent += total - 2;
  });
  const stage = buildHumanSourceAuthoredSkin({
    original,
    root,
    cells,
    originalPolygonParents,
    originalParentTriangles: originalTopology.triangles,
    weights: sample.weights,
    bindings: packet.appendedBindings,
  });
  readHumanSourceAuthoredProfile<unknown>(
    repository,
    packet.authoringInputs,
    inputs,
    "owned provider authoring inputs",
  );
  const authoringInputsSha256 = packet.authoringInputs.sha256;
  const replayed = readHumanSourceAuthoredReplay(
    replay,
    sample,
    root.nativeToSource,
    inputs,
    authoringInputsSha256,
  );
  // Neutral and every endpoint consume the same verified source preparation.
  const reader: IHumanSourceDeltaReader = {
    ...replayed,
    skin: (name) => {
      const delta = replayed.skin(name);
      fillHumanSourceExcludedRegions(sample, delta, root.nativeToSource);
      return delta;
    },
  };
  const replayNeutral = readHumanSourcePublication(
    replay,
    ["neutral.f64"],
    "component",
  ).outputs.get("neutral.f64")!;
  if (digest(replayNeutral) !== packet.positions.sha256)
    throw new Error(
      "Endpoint replay and neutral provider packet name different source geometry.",
    );
  console.log(
    "[authored-neutral-skin] verified replay",
    sample.manifest.states.length,
    "states",
  );
  if (inspectionCheckpoint !== undefined) {
    const checkpoint = readHumanSourceAuthoredCheckpoint({
      directory: inspectionCheckpoint,
      root,
      skin: stage,
      inputs,
      endpointStates: sample.manifest.states.length,
    });
    closure.verifyUnchanged();
    // The mirror owner's domain is the original base mesh, not subdivided
    // samples or appended provider points. Its existing complete-base check
    // remains authoritative; the normal composer already supplies that owner.
    if (sharedMirror === undefined) readHumanSourceMirror(work, inputs);
    assertHumanSourceWorkInputs(
      inputs,
      work,
      provider,
      replay,
      undefined,
      inspectionCheckpoint,
      repository,
    );
    return {
      root,
      skin: stage,
      packet,
      reader,
      inputs,
      authoringInputsSha256,
      nasalAxis,
      headGuide,
      bodyNeutralReceipt: checkpoint.bodyNeutralReceipt,
      lidSeatReceipt: checkpoint.lidSeatReceipt,
      orbitalSkinReceipt: checkpoint.orbitalSkinReceipt,
      excludedRegionReceipts: checkpoint.excludedRegionReceipts,
      editReceipt: checkpoint.editReceipt,
      movedSourceVertices: checkpoint.movedSourceVertices,
      inspectionRefusal: checkpoint.refusal,
    };
  }
  const bodyNeutralReceipt = regenerateHumanSourceBodyNeutral(
    body,
    root,
    stage,
  );
  console.log(
    "[authored-neutral-skin] body neutral complete",
    bodyNeutralReceipt.moved,
    "vertices",
  );
  const excludedRegionReceipts = regenerateHumanSourceExcludedRegions(
    sample,
    root,
    stage,
  );
  console.log(
    "[authored-neutral-skin] excluded-region neutral complete",
    excludedRegionReceipts.length,
    "regions",
  );
  const mirror = sharedMirror ?? readHumanSourceMirror(work, inputs);
  const lidSeatReceipt = regenerateHumanSourceLidSeat(
    face,
    root,
    stage,
    mirror,
  );
  console.log(
    "[authored-neutral-skin] continuous lid seat complete",
    JSON.stringify(
      lidSeatReceipt.sides.map((side) => ({
        side: side.side,
        triangles: side.displacementTriangles.length,
        moved: side.movedSourceVertices.length,
        maximumMetres: side.maximumDisplacementMetres,
      })),
    ),
  );
  const orbitalSkinReceipt = regenerateHumanSourceOrbitalSkin(
    face,
    root,
    stage,
    mirror,
  );
  console.log("[authored-neutral-skin] orbital skin complete");
  const lipClosure = prepareHumanSourceLipClosure({
    original: face,
    originalCut: original,
    skin: stage,
    sample,
    originalReader: createHumanSourceDeltaReader(sample),
    currentReader: reader,
    root,
    packet,
  });
  console.log(
    "[authored-neutral-skin] current closure rows complete",
    lipClosure.provenance,
    lipClosure.rows.length / 4,
    "rows",
  );
  const eyeRoot = root.topology.positions.slice(),
    eyeSkin = stage.positions.slice();
  const eyeHead = stage.headPositions.slice(),
    eyeBody = stage.bodyPositions.slice();
  let lipSealReceipt: IHumanSourceLipSealReceipt | undefined;
  let lipRefusal: Error | undefined;
  try {
    lipSealReceipt = regenerateHumanSourceLipSeal(
      face,
      root,
      stage,
      lipClosure,
    );
    console.log(
      "[authored-neutral-skin] lip neutral complete",
      lipSealReceipt.movedSourceVertices.length,
      "vertices",
    );
  } catch (error) {
    // Preserve the exact completed prefix even if a future lip owner refuses
    // after touching an array. All four coupled geometry views are restored.
    root.topology.positions.set(eyeRoot);
    stage.positions.set(eyeSkin);
    stage.headPositions = eyeHead;
    stage.bodyPositions = eyeBody;
    lipRefusal = error instanceof Error ? error : new Error(String(error));
    console.log(
      "[authored-neutral-skin] lip stage refused; completed-eye checkpoint continues",
      lipRefusal.message,
    );
  }
  // Published addresses of every neutral vertex an authoring stage moved over
  // the sampled source, for the coherence reading against an unedited generation.
  const excluded = new Set(
    excludedRegionReceipts.flatMap((region) => region.sourceVertices),
  );
  const moved = new Set([
    ...excluded,
    ...lidSeatReceipt.sides.flatMap((side) => side.movedSourceVertices),
    ...orbitalSkinReceipt.sides.flatMap((side) => side.movedSourceVertices),
    ...(lipSealReceipt?.movedSourceVertices ?? []),
  ]);
  const addressed = (
    samples: Int32Array,
    members: ReadonlySet<number>,
  ): number[] =>
    Array.from(samples.keys()).filter((vertex) => members.has(samples[vertex]));
  const faceToG1 = stage.partition.cut.faceToG1,
    bodyToG1 = stage.partition.cut.p1BodyToG1;
  const editReceipt: IHumanSourceEditReceipt = {
    positions: [
      { view: "head", surface: "Human", vertices: addressed(faceToG1, moved) },
      {
        view: "body",
        surface: body.surfaces[0].id,
        vertices: addressed(bodyToG1, moved),
      },
    ],
    endpoints: [],
    endpointVertices: [
      {
        view: "head",
        surface: "Human",
        vertices: addressed(faceToG1, excluded),
      },
      {
        view: "body",
        surface: body.surfaces[0].id,
        vertices: addressed(bodyToG1, excluded),
      },
    ],
    rederivedEndpoints: [],
  };
  const headRegions = buildHumanSourceAuthoredHeadRegions(
    face,
    stage.partition,
  );
  const endpointRows: Buffer[] = [],
    endpointVertices: Buffer[] = [],
    jointRows: Buffer[] = [];
  const endpointStates: IHumanSourceSampleState[] = [];
  let rowOffset = 0;
  for (const state of sample.manifest.states) {
    const delta = reader.skin(state.name);
    const values: number[] = [],
      vertices: number[] = [];
    const add = (vertex: number, x: number, y: number, z: number): void => {
      if (
        !Number.isSafeInteger(vertex) ||
        vertex < 0 ||
        vertex > 2147483647 ||
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        !Number.isFinite(z)
      )
        throw new Error(
          "Authored source endpoint has an invalid native ordinal or nonfinite delta: " +
            state.name,
        );
      if (x === 0 && y === 0 && z === 0) return;
      vertices.push(vertex);
      values.push(x, y, z);
    };
    for (let vertex = 0; vertex < root.topology.vertexCount; vertex++)
      add(
        vertex,
        delta[3 * vertex],
        delta[3 * vertex + 1],
        delta[3 * vertex + 2],
      );
    stage.partition.cut.intersections.forEach(({ a, b, t }, index) => {
      add(
        root.topology.vertexCount + index,
        (1 - t) * delta[3 * a] + t * delta[3 * b],
        (1 - t) * delta[3 * a + 1] + t * delta[3 * b + 1],
        (1 - t) * delta[3 * a + 2] + t * delta[3 * b + 2],
      );
    });
    endpointRows.push(Buffer.from(Float64Array.from(values).buffer));
    endpointVertices.push(Buffer.from(Int32Array.from(vertices).buffer));
    const landmarks = reader.landmarks(state.name);
    if (
      landmarks.length !== sample.manifest.landmarkIds.length * 3 ||
      !landmarks.every(Number.isFinite)
    )
      throw new Error(
        "Authored source endpoint has invalid finite landmark tuples: " +
          state.name,
      );
    jointRows.push(Buffer.from(landmarks.buffer));
    endpointStates.push({ ...state, rowOffset, rowCount: vertices.length });
    rowOffset += vertices.length;
    console.log(
      "[authored-neutral-skin] endpoint complete",
      endpointStates.length,
      state.name,
      vertices.length,
      "rows",
    );
  }
  // Every provider, sampled and replayed raw byte is a mutable external
  // input; the compiler graph separately protects authored source modules.
  assertHumanSourceWorkInputs(
    inputs,
    work,
    provider,
    replay,
    undefined,
    inspectionCheckpoint,
    repository,
  );
  closure.verifyUnchanged();
  const publication = createHumanSourcePublication(output);
  try {
    const files: Record<string, string> = {};
    const write = (name: string, data: Buffer | string): void => {
      const value = typeof data === "string" ? Buffer.from(data) : data;
      publication.write(name, value);
      files[name] = digest(value);
    };
    const array = (value: Float64Array | Int32Array | Uint8Array): Buffer =>
      Buffer.from(value.buffer, value.byteOffset, value.byteLength);
    const { cut } = stage.partition;
    for (const [name, data] of Object.entries({
      "root-positions.f64": stage.positions,
      "root-parent-triangles.i32": root.topology.triangles,
      "root-corner-uv.f64": root.topology.cornerUv,
      "native-to-source.i32": root.nativeToSource,
      "source-to-native.i32": root.sourceToNative,
      "head-positions.f64": stage.headPositions,
      "body-positions.f64": stage.bodyPositions,
      "head-indices.i32": stage.partition.headIndices,
      "head-uv.f64": stage.partition.headUv,
      "body-indices.i32": cut.p1BodyIndices,
      "body-uv.f64": cut.p1BodyUv,
      "head-samples.i32": cut.faceToG1,
      "body-samples.i32": cut.p1BodyToG1,
      "head-parents.i32": cut.p1FaceParents,
      "body-parents.i32": cut.p1BodyParents,
    }))
      write(name, array(data));
    write(
      "original-face-to-head.i32",
      array(stage.partition.originalFaceToHead),
    );
    write(
      "original-head-cell-to-head.i32",
      array(stage.partition.originalFaceTriangleToHead),
    );
    write("head-material-regions.json", JSON.stringify(headRegions));
    write(
      "root-weights.json",
      JSON.stringify({ bones: stage.bones, attachments: stage.attachments }),
    );
    write(
      "head-weights.json",
      JSON.stringify({
        bones: stage.headBones,
        attachments: stage.headAttachments,
      }),
    );
    write(
      "body-weights.json",
      JSON.stringify({
        bones: stage.bodyBones,
        attachments: stage.bodyAttachments,
      }),
    );
    write("frozen-cut.json", JSON.stringify(cut.intersections));
    write(
      "body-neutral-source-receipt.json",
      JSON.stringify(bodyNeutralReceipt),
    );
    write("lid-seat-source-receipt.json", JSON.stringify(lidSeatReceipt));
    write(
      "orbital-skin-source-receipt.json",
      JSON.stringify(orbitalSkinReceipt),
    );
    if (lipSealReceipt !== undefined)
      write("lip-seal-source-receipt.json", JSON.stringify(lipSealReceipt));
    if (lipRefusal !== undefined)
      write(
        "full-stage-refusal.json",
        JSON.stringify(
          {
            stage: "lip-neutral-closure",
            message: lipRefusal.message,
            stack: lipRefusal.stack,
            accepted: false,
            inspectionComponent: "completed-periocular-source",
            completeGeneration: false,
          },
          null,
          2,
        ),
      );
    write(
      "excluded-region-source-receipt.json",
      JSON.stringify(excludedRegionReceipts),
    );
    write("edit-receipt.json", JSON.stringify(editReceipt));
    write("endpoint-rows.f64", Buffer.concat(endpointRows));
    write("endpoint-rows.i32", Buffer.concat(endpointVertices));
    write("endpoint-joints.f64", Buffer.concat(jointRows));
    write("endpoint-states.json", JSON.stringify(endpointStates));
    write(
      "stage-receipt.json",
      JSON.stringify(
        {
          schema: "automovie-authored-neutral-skin-stage/1",
          completeGeneration: false,
          fullStageAccepted: lipRefusal === undefined,
          inspectionOnly: lipRefusal !== undefined,
          completedComponents: [
            "body-neutral",
            "excluded-region-neutral",
            "periocular-continuous-neutral",
            "orbital-neutral",
            "complete-source-replay",
          ],
          refusedComponents:
            lipRefusal === undefined ? [] : ["lip-neutral-closure"],
          originalNativeVertices: original.originalVertices,
          activeRootVertices: root.topology.vertexCount,
          cutVertices: cut.intersections.length,
          headVertices: stage.headPositions.length / 3,
          bodyVertices: stage.bodyPositions.length / 3,
          headTriangles: stage.partition.headIndices.length / 3,
          bodyTriangles: cut.p1BodyIndices.length / 3,
          endpointStates: endpointStates.length,
          endpointRows: rowOffset,
          originalCutChecks: original.checks,
          authoredCutChecks: cut.checks,
          inputs,
          files,
          runtime: {
            execPath: process.execPath,
            versions: process.versions,
            pid: process.pid,
          },
          qualification:
            "Actual provider neutral/root/frozen cut/head/body geometry, rig support and all sampled endpoint projections; anatomical registration/person/export/GPU/clinical acceptance pending.",
        },
        null,
        2,
      ),
    );
    console.log(
      "[authored-neutral-skin]",
      root.topology.vertexCount,
      "root",
      cut.intersections.length,
      "cut",
      stage.headPositions.length / 3,
      "head",
      stage.bodyPositions.length / 3,
      "body",
    );
    if (lipRefusal === undefined && lipSealReceipt === undefined)
      throw new Error(
        "Successful authored skin stage has no accepted lip receipt.",
      );
    publication.complete(
      digest(Buffer.from(JSON.stringify(inputs))),
      false,
      lipRefusal !== undefined,
      () => {
        closure.verifyUnchanged();
        assertHumanSourceWorkInputs(
          inputs,
          work,
          provider,
          replay,
          undefined,
          inspectionCheckpoint,
          repository,
        );
      },
    );
  } catch (error) {
    publication.refuse(error);
    throw error;
  }
  if (lipRefusal !== undefined)
    throw new Error(
      "Full authored skin stage refused; completed-eye inspection checkpoint preserved: " +
        output,
      { cause: lipRefusal },
    );
  if (lipSealReceipt === undefined)
    throw new Error(
      "Successful authored skin stage has no accepted lip receipt.",
    );
  return {
    root,
    skin: stage,
    packet,
    reader,
    inputs,
    authoringInputsSha256,
    nasalAxis,
    headGuide,
    bodyNeutralReceipt,
    lidSeatReceipt,
    orbitalSkinReceipt,
    lipSealReceipt,
    excludedRegionReceipts,
    editReceipt,
    movedSourceVertices: [...moved].sort((a, b) => a - b),
  };
}
