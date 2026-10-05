import type { IAutoMovieHumanBasisSourcePartition } from "@automovie/human/common/basis/IAutoMovieHumanBasisSourcePartition";

import { defineHumanSourceSkinLandmarks } from "./defineHumanSourceSkinLandmarks.ts";
import { buildHumanSourceLipMarginChain } from "./buildHumanSourceLipMarginChain.ts";
import { findHumanSourceLipMarginPairs } from "./findHumanSourceLipMarginPairs.ts";
import { registerHumanSourceTeeth } from "./registerHumanSourceTeeth.ts";
import { splitHumanSourceToes } from "./splitHumanSourceToes.ts";
import type { IHumanSourceP1 } from "./structures/IHumanSourceP1.ts";
import type { IHumanSourceP1Input } from "./structures/IHumanSourceP1Input.ts";

/**
 * Build the P1 pair from the generation. The face keeps its published
 * topology, rows and metadata, gains a source partition and declares the head
 * skin landmarks and regions chosen on the generation
 * (`defineHumanSourceHeadLandmarks`, `defineHumanSourceHeadRegions`), and its
 * contact gains the vermilion margin chains beside the central pair
 * (`buildHumanSourceLipMarginChain`), and it carries the periocular
 * registration (`defineHumanSourcePeriocular`).
 * The body becomes the source complement of the same cut, with the
 * generation's neutral and weights, its endpoints re-addressed
 * (`unavailableTargets` names the ones without a value on the new support),
 * its vein overlay vertices re-addressed, and its named skin points declared
 * on the new vertices (`defineHumanSourceSkinLandmarks`). When the sample
 * carries the default rig's toe phalanx weights, the body also declares the
 * per-ray toe bones and splits each vertex's toes weight between them
 * (`splitHumanSourceToes`). Both partitions
 * share one parent tree and one ordered intersection table, as
 * `IAutoMovieHumanBasisSourcePartition` requires.
 */
export function assembleHumanSourceP1(input: IHumanSourceP1Input): IHumanSourceP1 {
  const { face, body, generation, cut, topology } = input;
  const parentTriangles = Array.from(topology.triangles);
  const partition = (samples: number[], parents: number[]): IAutoMovieHumanBasisSourcePartition => ({
    generation: generation.id,
    originalVertices: cut.originalVertices,
    parentTriangles,
    intersections: cut.intersections.map(({ a, b, t }) => ({ a, b, t })),
    samples,
    parents,
  });
  const short = generation.id.slice(0, 12);
  const contact = face.contact;
  if (contact === undefined) throw new Error("The published face has no contact to add lip margin chains to.");
  const lipsSurface = face.surfaces.find((s) => s.id === contact.lips.surface);
  const lipsRegion = lipsSurface?.regions.find((r) => r.id.endsWith("/lips"));
  if (lipsSurface === undefined || lipsRegion === undefined) throw new Error("The published face has no lips region on its contact surface.");
  const margin = findHumanSourceLipMarginPairs(lipsSurface.positions, lipsRegion.indices, face.articulation!.jaw.axis);
  const chain = buildHumanSourceLipMarginChain(lipsSurface.positions, lipsRegion.indices, face.articulation!.jaw.axis, margin, contact.lips);
  const p1Face = {
    ...face,
    id: `human-source-g1-${short}-p1-face`,
    skinLandmarks: input.headLandmarks,
    skinRegions: { ...input.headRegions, ...registerHumanSourceTeeth(face).regions },
    contact: { ...contact, margin: { upper: chain.upper, lower: chain.lower } },
    periocular: input.periocular,
    surfaces: face.surfaces.map((s) =>
      s.id === "Human" ? { ...s, sourcePartition: partition(Array.from(cut.faceToG1), Array.from(cut.p1FaceParents)) } : s,
    ),
  };

  const bodySurface = body.surfaces[0];
  const count = cut.p1BodyToG1.length;
  const positions: number[] = [];
  const boneIndices: number[] = [];
  const weights: number[] = [];
  for (const g of cut.p1BodyToG1) {
    for (let c = 0; c < 3; c++) positions.push(generation.skin.positions[3 * g + c]);
    for (let k = 0; k < 4; k++) {
      boneIndices.push(generation.weights.boneIndices[4 * g + k]);
      weights.push(generation.weights.weights[4 * g + k]);
    }
  }
  const p1Of = new Map<number, number>();
  cut.p1BodyToG1.forEach((g, j) => p1Of.set(g, j));
  let droppedOverlayVertices = 0;
  const overlays = bodySurface.overlays?.map((overlay) => {
    if (overlay.kind !== "veins") return overlay;
    const vertices: number[] = [];
    for (const v of overlay.vertices) {
      const j = p1Of.get(cut.r16ToSource[v]);
      if (j === undefined) droppedOverlayVertices++;
      else vertices.push(j);
    }
    return { ...overlay, vertices };
  });
  const indices = Array.from(cut.p1BodyIndices);
  const unavailableTargets = Object.keys(input.bodyRows.unavailable);
  const toes =
    input.toeRays === null || input.sampleRays === null
      ? null
      : splitHumanSourceToes(input.toeRays, { joints: bodySurface.skin.joints, boneIndices, weights }, (j) => cut.p1BodyToG1[j], input.sampleRays);
  const p1Body = {
    ...body,
    id: `human-source-g1-${short}-p1-body`,
    ...(unavailableTargets.length === 0 ? {} : { unavailableTargets }),
    skinLandmarks: defineHumanSourceSkinLandmarks(body, generation, cut).skinLandmarks,
    ...(input.toeRays === null ? {} : { toeRays: input.toeRays }),
    surfaces: [
      {
        id: bodySurface.id,
        positions,
        sourcePartition: partition(Array.from(cut.p1BodyToG1), Array.from(cut.p1BodyParents)),
        indices,
        targets: input.bodyRows.p1Targets,
        regions: [{ id: bodySurface.regions[0].id, material: bodySurface.regions[0].material, indices, uvs: Array.from(cut.p1BodyUv) }],
        skin: { joints: bodySurface.skin.joints, boneIndices, weights },
        ...(toes === null ? {} : { toeSplit: toes.split }),
        ...(bodySurface.sag === undefined ? {} : { sag: bodySurface.sag }),
        ...(bodySurface.relief === undefined ? {} : { relief: bodySurface.relief }),
        ...(overlays === undefined ? {} : { overlays }),
      },
    ],
  };
  return {
    face: p1Face,
    body: p1Body,
    marginChain: chain.record,
    checks: {
      p1BodyVertices: count,
      p1BodyTriangles: indices.length / 3,
      unavailableTargets: unavailableTargets.length,
      droppedOverlayVertices,
      ...(toes === null ? { toeSplit: "not sampled" } : Object.fromEntries(Object.entries(toes.record).map(([key, value]) => [`toeSplit ${key}`, value as number | string]))),
      mushCarried: bodySurface.mush !== undefined ? "dropped (vertex-addressed, not re-derived)" : "absent",
    },
  };
}
