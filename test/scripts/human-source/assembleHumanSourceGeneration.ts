import crypto from "node:crypto";

import { humanSourceBodyBones } from "./humanSourceBodyBones.ts";
import { pruneHumanSourceWeights } from "./pruneHumanSourceWeights.ts";
import type { IHumanSourceAssemblyInput } from "./structures/IHumanSourceAssemblyInput.ts";
import type { IHumanSourceGeneration } from "./structures/IHumanSourceGeneration.ts";
import type { IHumanSourceGenerationStamp } from "./structures/IHumanSourceGenerationStamp.ts";

/**
 * Assemble the one-skin generation G1 from verified pieces.
 *
 * The source topology owns every neutral coordinate. Ordered cut stencils
 * interpolate that same root on both sides; published face/body neutrals and
 * their historical bakes are comparison inputs only. The upstream rig rows
 * own original support weights, with the same stencil at each cut sample.
 * All supplied endpoint and anatomical registrations must already address
 * this root. A changed source invalidates their historical acceptance.
 */
export function assembleHumanSourceGeneration(input: IHumanSourceAssemblyInput): IHumanSourceGeneration {
  const { face, body, cut, topology } = input;
  const n = cut.originalVertices;
  const total = n + cut.intersections.length;
  const bodySurface = body.surfaces[0];
  if (topology.vertexCount !== n || topology.positions.length !== 3 * n || input.rig.freshWeights.length !== n)
    throw new Error("Generation neutral requires this cut's complete canonical root.");
  const positions = new Array<number>(3 * total);
  const neutralOrigin = new Array<number>(total);
  for (let g = 0; g < total; g++) {
    const sample = g < n ? { a: g, b: g, t: 0 } : cut.intersections[g - n];
    for (let c = 0; c < 3; c++) positions[3 * g + c] =
      (1 - sample.t) * topology.positions[3 * sample.a + c] + sample.t * topology.positions[3 * sample.b + c];
    neutralOrigin[g] = g < n ? 3 : 4;
  }

  const joints = bodySurface.skin.joints;
  const rowsAt = (x: number): [string, number][] => input.rig.freshWeights[x];
  const boneIndices: number[] = [];
  const weights: number[] = [];
  const weightOrigin: number[] = [];
  for (let g = 0; g < total; g++) {
    let rows: [string, number][];
    if (g < n) {
      rows = rowsAt(g);
      weightOrigin.push(1);
    } else {
      const s = cut.intersections[g - n];
      const merged = new Map<string, number>();
      for (const [slot, w] of rowsAt(s.a)) merged.set(slot, (merged.get(slot) ?? 0) + (1 - s.t) * w);
      for (const [slot, w] of rowsAt(s.b)) merged.set(slot, (merged.get(slot) ?? 0) + s.t * w);
      rows = pruneHumanSourceWeights([...merged].filter(([, w]) => w > 0).map(([slot, w]): [string, number] => [humanSourceBodyBones[slot], w]));
      weightOrigin.push(2);
    }
    for (let k = 0; k < 4; k++) {
      const row = rows[k];
      const index = row === undefined ? 0 : joints.indexOf(row[0] as (typeof joints)[number]);
      if (row !== undefined && index < 0) throw new Error(`Weight slot ${row[0]} is not a body joint.`);
      boneIndices.push(index);
      weights.push(row === undefined ? 0 : row[1]);
    }
  }

  const targets: Record<string, number[]> = { ...input.faceRows.g1Targets };
  for (const [name, rows] of Object.entries(input.bodyRows.g1Targets)) {
    if (name in targets) throw new Error(`Endpoint ${name} exists in both face and body.`);
    targets[name] = rows;
  }
  const stamps: IHumanSourceGenerationStamp[] = [
    { derivative: "face hair domains", authoredOn: face.id, status: "stale", note: "source face input must reauthor domains on current parent/cell incidence; historical acceptance is not inherited" },
    { derivative: "face hair contact closure", authoredOn: face.id, status: "stale", note: "current source requires readdressed closure and performed contact observation" },
    { derivative: "face articulation (jaw, eyes)", authoredOn: face.id, status: "carried-by-map", note: "fitted by prepare-articulated-basis; not replayed" },
    { derivative: "face contact (lips, incisors, closure, passage, colliders, soft)", authoredOn: face.id, status: "carried-by-map", note: "face vertex terms; prepare-contact-basis not replayed" },
    { derivative: "face jaw attachment weights", authoredOn: face.id, status: "carried-by-map", note: "compared against upstream in the reproduction table" },
    { derivative: "face historical neutral bakes", authoredOn: face.id, status: "stale", note: "comparison inputs only; the current source topology owns neutral geometry" },
    { derivative: "canonical source neutral", authoredOn: "source topology", status: "regenerated", note: "one root and its frozen cut stencils define every skin coordinate" },
    { derivative: "body regional, macro and macro-pair endpoints", authoredOn: body.id, status: "regenerated", note: "new neck support from the upstream recipe; published values kept where published" },
    { derivative: "body post-extraction fields (individuality, envelope, definition, symmetry, pose and state correctives)", authoredOn: body.id, status: "stale", note: "carried on published vertices; new support listed in unavailable; producers absent or partial" },
    { derivative: "body joints, frames, couplings, pelvifemoral", authoredOn: body.id, status: "carried-by-map", note: "joint cubes compared against upstream; frames and constraints not replayed" },
    { derivative: "body sag, relief, overlays", authoredOn: body.id, status: "carried-by-map", note: "vein overlay vertices re-addressed through skin.bodyVertexToSkin" },
    { derivative: "face and body documents, simple-control maps, census and ANSUR fits", authoredOn: `${face.id} / ${body.id}`, status: "stale", note: "documents name a basis id; restamp and re-measure on this generation" },
  ];
  const upstreamDigest = input.upstream.map((u) => `${u.name}:${u.contentSha256}`).join("\n");
  const inputDigest = input.inputs.map((i) => `${i.role}:${i.sha256}`).join("\n");
  const sampleDigest = Object.entries(input.sample).map(([k, v]) => `${k}:${v}`).join("\n");
  const id = crypto.createHash("sha256").update(`${upstreamDigest}\n${sampleDigest}\n${inputDigest}`).digest("hex");
  return {
    schema: "automovie-human-source-generation/1",
    id,
    upstream: input.upstream,
    sample: input.sample,
    inputs: input.inputs,
    skin: {
      originalVertices: n,
      intersections: cut.intersections,
      positions,
      neutralOrigin,
      triangles: Array.from(cut.triangles),
      labels: Array.from(cut.labels),
      parents: Array.from(cut.parents),
      cornerUvs: Array.from(cut.cornerUv),
      faceVertexToSkin: Array.from(cut.faceToG1),
      bodyVertexToSkin: Array.from(cut.r16ToSource),
      ...(input.nativeToSource === undefined ? {} : { nativeToSource: Array.from(input.nativeToSource) }),
      ...(input.sourceToNative === undefined ? {} : { sourceToNative: Array.from(input.sourceToNative) }),
    },
    partition: {
      labels: ["head", "body"],
      plane: `published face recrop, Y >= ${cut.minimumY} m on the unbaked source neutral`,
      boundaryVertices: cut.intersections.map((_, i) => n + i),
      headTriangles: cut.labels.filter((l) => l === 0).length,
      bodyTriangles: cut.labels.filter((l) => l === 1).length,
    },
    channels: [
      ...face.channels.map((c) => ({
        id: c.id, origin: "face" as const, kind: c.kind, minimum: c.minimum, maximum: c.maximum,
        positive: c.positive, negative: c.negative, group: null, mirror: null, description: c.description ?? null,
      })),
      ...body.channels.map((c) => ({
        id: c.id, origin: "body" as const, kind: c.kind, minimum: c.minimum, maximum: c.maximum,
        positive: c.positive, negative: c.negative, group: c.group ?? null, mirror: c.mirror ?? null, description: null,
      })),
    ],
    correctives: [
      ...(face.correctives ?? []).map((c) => ({ id: c.id, origin: "face" as const, inputs: c.inputs, weight: c.weight, target: c.target })),
      ...(body.correctives ?? []).map((c) => ({ id: c.id, origin: "body" as const, inputs: c.inputs, weight: c.weight, target: c.target })),
    ],
    targets,
    unavailable: input.bodyRows.unavailable,
    landmarks: [
      ...(face.landmarks === undefined ? [] : [{ origin: "face" as const, ...face.landmarks }]),
      { origin: "body" as const, ...body.landmarks },
    ],
    joints: body.joints,
    couplings: body.couplings ?? [],
    pelvifemoral: body.pelvifemoral ?? null,
    weights: { joints: [...joints], boneIndices, weights, origin: weightOrigin },
    parts: face.surfaces
      .filter((s) => s.id !== "Human")
      .map((s) => ({
        id: s.id,
        basis: face.id,
        basisSha256: input.faceSha256,
        vertices: s.positions.length / 3,
        endpoints: Object.keys(s.targets).length,
        provenance: "carried from the published face",
        surface: s,
        binding: null,
        bodyTargets: {},
      })),
    stamps,
    band: null,
    bandTargets: [],
    attachments: [],
    anchor: null,
    aliases: [],
    gaps: [],
    drivers: [],
  };
}
