import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { findHumanSourceDriverMaximum } from "./findHumanSourceDriverMaximum.ts";
import type { IHumanSourcePersonViews } from "./structures/IHumanSourcePersonViews.ts";
import type { IHumanSourcePersonViewsInput } from "./structures/IHumanSourcePersonViewsInput.ts";

/**
 * Split the finished one-skin generation into the person generation's two
 * files, the head view and the body view.
 *
 * This is a pure re-addressing: every row is a generation row moved from its
 * one-skin id to its partition's vertex ids, and no rule is computed. A face
 * row lands on the face vertex of its skin id, or, on a body-band vertex, in
 * the band's face rows; a body row lands on its body vertex, or, on a head-only
 * vertex, in the face view, which is only legal for a body endpoint listed in
 * `drivers`. Each driver becomes a face channel `driver:<endpoint>` whose
 * weight the evaluator sets from the body's own state of that endpoint, and a
 * face corrective driven by a body channel reads that driver instead. Bound
 * part rows and face landmark body rows are likewise driver-keyed. Anything a
 * driver would need but does not list is refused, never dropped.
 */
export function splitHumanSourcePersonViews(input: IHumanSourcePersonViewsInput): IHumanSourcePersonViews {
  const { generation, p1 } = input;
  const human = p1.face.surfaces.find((s) => s.id === "Human");
  if (human?.sourcePartition === undefined) throw new Error("The P1 face skin has no source partition.");
  const bodySurface = p1.body.surfaces[0];
  if (bodySurface.sourcePartition === undefined) throw new Error("The P1 body skin has no source partition.");
  const facesOf = new Map<number, number[]>();
  const bodiesOf = new Map<number, number[]>();
  const add = (map: Map<number, number[]>, key: number, value: number): void => {
    const list = map.get(key);
    if (list === undefined) map.set(key, [value]);
    else list.push(value);
  };
  human.sourcePartition.samples.forEach((s, v) => add(facesOf, s, v));
  bodySurface.sourcePartition.samples.forEach((s, v) => add(bodiesOf, s, v));
  const origin = new Map<string, "face" | "body">();
  for (const channel of generation.channels) {
    origin.set(channel.positive, channel.origin);
    if (channel.negative !== null) origin.set(channel.negative, channel.origin);
  }
  for (const corrective of generation.correctives) origin.set(corrective.target, corrective.origin);
  const driven = new Set(generation.drivers);
  const requireDriver = (endpoint: string, what: string): void => {
    if (!driven.has(endpoint)) throw new Error(`${what} ${endpoint} drives the head but is not a listed driver.`);
  };
  const ascending = (rows: number[], stride: number): number[] => {
    const groups: number[][] = [];
    for (let i = 0; i < rows.length; i += stride) groups.push(rows.slice(i, i + stride));
    groups.sort((x, y) => x[0] - y[0]);
    return groups.flat();
  };
  const push = (map: Record<string, number[]>, name: string, vertex: number, delta: number[]): void => {
    (map[name] ??= []).push(vertex, ...delta);
  };

  const faceTargets: Record<string, number[]> = {};
  const bodyTargets: Record<string, number[]> = {};
  const bodyFaceTargets: Record<string, number[]> = {};
  for (const [name, rows] of Object.entries(generation.targets)) {
    const owner = origin.get(name);
    if (owner === undefined) throw new Error(`Endpoint ${name} has no channel or corrective.`);
    for (let i = 0; i < rows.length; i += 4) {
      const s = rows[i];
      const delta = rows.slice(i + 1, i + 4);
      const faces = facesOf.get(s);
      const bodies = bodiesOf.get(s);
      if (owner === "face") {
        if (faces !== undefined) for (const v of faces) push(faceTargets, name, v, delta);
        else if (bodies !== undefined) for (const v of bodies) push(bodyFaceTargets, name, v, delta);
      } else if (bodies !== undefined) for (const v of bodies) push(bodyTargets, name, v, delta);
      else if (faces !== undefined) {
        requireDriver(name, "Body endpoint");
        for (const v of faces) push(faceTargets, name, v, delta);
      }
    }
  }
  for (const map of [faceTargets, bodyTargets, bodyFaceTargets]) for (const name of Object.keys(map)) map[name] = ascending(map[name], 4);

  const faceAttachments = generation.attachments.map((attachment) => {
    const face: number[] = [];
    const band: number[] = [];
    for (let i = 0; i < attachment.rows.length; i += 2) {
      const s = attachment.rows[i];
      const weight = attachment.rows[i + 1];
      const faces = facesOf.get(s);
      if (faces !== undefined) for (const v of faces) face.push(v, weight);
      else for (const v of bodiesOf.get(s) ?? []) band.push(v, weight);
    }
    return { owner: attachment.owner, face: ascending(face, 2), band: ascending(band, 2) };
  });

  const parts = generation.parts.map((part) => {
    const published = p1.face.surfaces.find((s) => s.id === part.id);
    if (published === undefined) throw new Error(`Part ${part.id} is not in the P1 face.`);
    const targets: Record<string, number[]> = { ...part.surface.targets };
    for (const [endpoint, rows] of Object.entries(part.bodyTargets)) {
      requireDriver(endpoint, "Part row");
      targets[endpoint] = ascending(rows, 4);
    }
    return { ...published, ...part.surface, targets };
  });
  const faceLandmarks = generation.landmarks.find((set) => set.origin === "face");
  if (faceLandmarks === undefined || p1.face.landmarks === undefined) throw new Error("The generation has no face landmark set.");
  for (const name of Object.keys(faceLandmarks.targets)) if (origin.get(name) === "body") requireDriver(name, "Landmark row");

  const bodyChannels = new Map(generation.channels.filter((c) => c.origin === "body").map((c) => [c.id, c]));
  const bodyCorrectives = generation.correctives.filter((c) => c.origin === "body");
  const driverChannel = (endpoint: string): string => `driver:${endpoint}`;
  const faceCorrectives = generation.correctives
    .filter((c) => c.origin === "face")
    .map((c) => ({
      id: c.id,
      weight: c.weight,
      target: c.target,
      inputs: c.inputs.map((driver) => {
        if (!("channel" in driver)) throw new Error(`Face corrective ${c.id} has a non-channel driver.`);
        const channel = bodyChannels.get(driver.channel);
        if (channel === undefined) return driver;
        const endpoint = driver.side === "negative" ? channel.negative : channel.positive;
        if (endpoint === null) throw new Error(`Face corrective ${c.id} reads a missing body side.`);
        requireDriver(endpoint, "Corrective input");
        return { ...driver, channel: driverChannel(endpoint), side: "positive" as const };
      }),
    }));
  const drivers = generation.drivers.map((endpoint) => ({ channel: driverChannel(endpoint), endpoint }));
  const faceChannels = [
    ...generation.channels
      .filter((c) => c.origin === "face")
      .map((c) => {
        const published = p1.face.channels.find((x) => x.id === c.id);
        if (published === undefined) throw new Error(`Face channel ${c.id} is not in the P1 face.`);
        return published;
      }),
    ...drivers.map((d) => ({
      id: d.channel,
      kind: "shape" as const,
      minimum: 0,
      maximum: findHumanSourceDriverMaximum(d.endpoint, [...bodyChannels.values()], bodyCorrectives),
      positive: d.endpoint,
      negative: null,
      description: "Driver-only: the body's own gain of this body endpoint, bounded by its channel side envelope plus every targeting corrective's unit activation; beyond one the endpoint row is extrapolated linearly (convention).",
    })),
  ];
  const boneIndices: number[] = [];
  const weights: number[] = [];
  for (const s of human.sourcePartition.samples)
    for (let k = 0; k < 4; k++) {
      boneIndices.push(generation.weights.boneIndices[4 * s + k]);
      weights.push(generation.weights.weights[4 * s + k]);
    }
  return {
    head: {
      id: generation.id,
      face: {
        ...p1.face,
        landmarks: { ...p1.face.landmarks, ids: faceLandmarks.ids, positions: faceLandmarks.positions, targets: faceLandmarks.targets },
        channels: faceChannels,
        correctives: faceCorrectives,
        surfaces: [
          { ...human, targets: faceTargets, attachments: faceAttachments.map((a) => ({ owner: a.owner, rows: a.face })) },
          ...parts,
        ],
      },
      headSkin: { joints: generation.weights.joints as AutoMovieHumanoidBone[], boneIndices, weights },
      aliases: generation.aliases.filter((a) => a.kind === "channel").map((a) => ({ face: a.from, body: a.to })),
      drivers,
    },
    body: {
      id: generation.id,
      body: { ...p1.body, surfaces: [{ ...bodySurface, targets: bodyTargets }, ...p1.body.surfaces.slice(1)] },
      band: { bodyFaceTargets, bodyAttachments: faceAttachments.map((a) => ({ owner: a.owner, rows: a.band })) },
    },
  };
}
