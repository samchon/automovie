import type { IAutoMovieHumanBasisSourcePartition } from "@automovie/human/common/basis/IAutoMovieHumanBasisSourcePartition";

import { defineHumanSourceSkinLandmarks } from "./defineHumanSourceSkinLandmarks.ts";
import { registerHumanSourceLipMargin } from "./registerHumanSourceLipMargin.ts";
import { registerHumanSourceTeeth } from "./registerHumanSourceTeeth.ts";
import { registerHumanSourceMaterialCharts } from "./registerHumanSourceMaterialCharts.ts";
import { splitHumanSourceToes } from "./splitHumanSourceToes.ts";
import type { IHumanSourceEndpointDomain } from "./structures/IHumanSourceEndpointDomain.ts";
import type { IHumanSourceP1 } from "./structures/IHumanSourceP1.ts";
import type { IHumanSourceP1Input } from "./structures/IHumanSourceP1Input.ts";

/**
 * Build both P1 skin surfaces from the generation's current root and cut.
 * The supplied face owns already-addressed anatomical metadata and regions,
 * while the root owns skin coordinates, cells, UVs and endpoint rows. A face
 * still naming an older topology refuses instead of replacing the new skin.
 * The face gains a source partition and declares the head
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
export function assembleHumanSourceP1(
  input: IHumanSourceP1Input,
): IHumanSourceP1 {
  const { face, body, generation, cut, topology } = input;
  const parentTriangles = Array.from(topology.triangles);
  const partition = (
    samples: number[],
    parents: number[],
  ): IAutoMovieHumanBasisSourcePartition => ({
    generation: generation.id,
    originalVertices: cut.originalVertices,
    parentTriangles,
    intersections: cut.intersections.map(({ a, b, t }) => ({ a, b, t })),
    samples,
    parents,
  });
  const short = generation.id.slice(0, 12);
  const skin = face.surfaces.find((surface) => surface.id === "Human");
  if (skin === undefined)
    throw new Error("The source face has no Human skin metadata.");
  const headOf = new Map<number, number>();
  cut.faceToG1.forEach((sample, vertex) => headOf.set(sample, vertex));
  const headPositions = Array.from(cut.faceToG1).flatMap((sample) =>
    generation.skin.positions.slice(3 * sample, 3 * sample + 3),
  );
  const headIndices: number[] = [];
  const headUv: number[] = [];
  for (let cell = 0; cell < cut.labels.length; cell++) {
    if (cut.labels[cell] !== 0) continue;
    for (let corner = 0; corner < 3; corner++) {
      const sample = cut.triangles[3 * cell + corner];
      const vertex = headOf.get(sample);
      if (vertex === undefined)
        throw new Error(`Head cell ${cell} has a sample absent from its view.`);
      headIndices.push(vertex);
      headUv.push(
        cut.cornerUv[6 * cell + 2 * corner],
        cut.cornerUv[6 * cell + 2 * corner + 1],
      );
    }
  }
  if (
    skin.positions.length !== headPositions.length ||
    skin.indices.length !== headIndices.length ||
    skin.indices.some((vertex, index) => vertex !== headIndices[index])
  )
    throw new Error(
      "P1 head metadata still names a different source topology; reauthor its registrations first.",
    );
  const headCellOf = new Map<string, number>();
  for (let at = 0; at < headIndices.length; at += 3)
    headCellOf.set(headIndices.slice(at, at + 3).join("/"), at / 3);
  const headRegions = skin.regions.map((region) => {
    const uvs: number[] = [];
    for (let at = 0; at < region.indices.length; at += 3) {
      const cell = headCellOf.get(region.indices.slice(at, at + 3).join("/"));
      if (cell === undefined)
        throw new Error(
          `Head region ${region.id} names an absent oriented source cell.`,
        );
      uvs.push(...headUv.slice(6 * cell, 6 * cell + 6));
    }
    return { ...region, uvs: region.uvs === null ? null : uvs };
  });
  const endpoints = new Set(
    face.channels.flatMap((channel) =>
      channel.negative === null
        ? [channel.positive]
        : [channel.positive, channel.negative],
    ),
  );
  for (const corrective of face.correctives ?? [])
    endpoints.add(corrective.target);
  const aliasOf = new Map<string, string>();
  for (const alias of generation.aliases)
    for (const [from, to] of Object.entries(alias.endpoints)) {
      const prior = aliasOf.get(from);
      if (prior !== undefined && prior !== to)
        throw new Error(`P1 endpoint ${from} has two current root owners.`);
      aliasOf.set(from, to);
    }
  const endpointDomains: IHumanSourceEndpointDomain[] = [];
  const missing: string[] = [];
  for (const endpoint of endpoints) {
    const skinContribution: boolean = skin.targets[endpoint] !== undefined;
    const rootEndpoint: string | null = skinContribution
      ? (aliasOf.get(endpoint) ?? endpoint)
      : null;
    const partSurfaces = generation.parts
      .filter((part) => part.surface.targets[endpoint] !== undefined)
      .map((part) => part.id);
    const landmarkContribution = generation.landmarks.some(
      (set) => set.origin === "face" && set.targets[endpoint] !== undefined,
    );
    endpointDomains.push({
      endpoint,
      skinContribution,
      rootEndpoint,
      partSurfaces,
      landmarkContribution,
    });
    if (rootEndpoint !== null && generation.targets[rootEndpoint] === undefined)
      missing.push(
        `${endpoint}: declared skin population has no current root owner ${rootEndpoint}`,
      );
    else if (
      !skinContribution &&
      partSurfaces.length === 0 &&
      !landmarkContribution
    )
      missing.push(
        `${endpoint}: no declared skin, part or landmark population`,
      );
  }
  if (missing.length !== 0)
    throw new Error(
      `P1 endpoint ownership is incomplete: ${missing.join("; ")}.`,
    );
  const headTargets: Record<string, number[]> = {};
  for (const domain of endpointDomains) {
    if (domain.rootEndpoint === null) continue;
    const rows = generation.targets[domain.rootEndpoint];
    const output: number[][] = [];
    for (let at = 0; at < rows.length; at += 4) {
      const vertex = headOf.get(rows[at]);
      if (vertex !== undefined)
        output.push([vertex, rows[at + 1], rows[at + 2], rows[at + 3]]);
    }
    headTargets[domain.endpoint] = output
      .sort((left, right) => left[0] - right[0])
      .flat();
  }
  const contact = face.contact;
  if (contact === undefined)
    throw new Error(
      "The published face has no contact to add lip margin chains to.",
    );
  const lipsSource = face.surfaces.find((s) => s.id === contact.lips.surface);
  const lipsSurface =
    lipsSource?.id === "Human"
      ? { ...lipsSource, positions: headPositions }
      : lipsSource;
  if (lipsSurface === undefined)
    throw new Error("The published face has no lips contact surface.");
  const chain = registerHumanSourceLipMargin(face, lipsSurface.positions);
  const p1Face = {
    ...face,
    id: `human-source-g1-${short}-p1-face`,
    skinLandmarks: input.headLandmarks,
    skinRegions: {
      ...input.headRegions,
      ...registerHumanSourceTeeth(face).regions,
    },
    contact: { ...contact, margin: { upper: chain.upper, lower: chain.lower } },
    periocular: input.periocular,
    surfaces: face.surfaces.map((s) =>
      s.id === "Human"
        ? {
            ...s,
            positions: headPositions,
            indices: headIndices,
            targets: headTargets,
            regions: headRegions,
            sourcePartition: partition(
              Array.from(cut.faceToG1),
              Array.from(cut.p1FaceParents),
            ),
          }
        : { ...s },
    ),
  };

  registerHumanSourceMaterialCharts(p1Face);
  const bodySurface = body.surfaces[0];
  const count = cut.p1BodyToG1.length;
  const positions: number[] = [];
  const boneIndices: number[] = [];
  const weights: number[] = [];
  for (const g of cut.p1BodyToG1) {
    for (let c = 0; c < 3; c++)
      positions.push(generation.skin.positions[3 * g + c]);
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
      : splitHumanSourceToes(
          input.toeRays,
          { joints: bodySurface.skin.joints, boneIndices, weights },
          (j) => {
            const source = cut.p1BodyToG1[j];
            if (input.sourceToNative === undefined) return source;
            const native = input.sourceToNative[source];
            if (!Number.isSafeInteger(native) || native < 0)
              throw new Error(
                `Toe support ${j} lacks its original native weight witness.`,
              );
            return native;
          },
          input.sampleRays,
        );
  const p1Body = {
    ...body,
    id: `human-source-g1-${short}-p1-body`,
    ...(unavailableTargets.length === 0 ? {} : { unavailableTargets }),
    skinLandmarks: defineHumanSourceSkinLandmarks(body, generation, cut)
      .skinLandmarks,
    ...(input.toeRays === null ? {} : { toeRays: input.toeRays }),
    surfaces: [
      {
        id: bodySurface.id,
        positions,
        sourcePartition: partition(
          Array.from(cut.p1BodyToG1),
          Array.from(cut.p1BodyParents),
        ),
        indices,
        targets: input.bodyRows.p1Targets,
        regions: [
          {
            id: bodySurface.regions[0].id,
            material: bodySurface.regions[0].material,
            indices,
            uvs: Array.from(cut.p1BodyUv),
          },
        ],
        skin: { joints: bodySurface.skin.joints, boneIndices, weights },
        ...(toes === null ? {} : { toeSplit: toes.split }),
        ...(bodySurface.sag === undefined ? {} : { sag: bodySurface.sag }),
        ...(bodySurface.relief === undefined
          ? {}
          : { relief: bodySurface.relief }),
        ...(overlays === undefined ? {} : { overlays }),
      },
    ],
  };
  return {
    face: p1Face,
    body: p1Body,
    marginChain: chain.record,
    endpointDomains,
    checks: {
      p1BodyVertices: count,
      skinEndpointDomains: endpointDomains.filter(
        (domain) => domain.skinContribution,
      ).length,
      noSkinEndpointDomains: endpointDomains.filter(
        (domain) => !domain.skinContribution,
      ).length,
      p1BodyTriangles: indices.length / 3,
      unavailableTargets: unavailableTargets.length,
      droppedOverlayVertices,
      ...(toes === null
        ? { toeSplit: "not sampled" }
        : Object.fromEntries(
            Object.entries(toes.record).map(([key, value]) => [
              `toeSplit ${key}`,
              value as number | string,
            ]),
          )),
      mushCarried:
        bodySurface.mush !== undefined
          ? "dropped (vertex-addressed, not re-derived)"
          : "absent",
    },
  };
}
