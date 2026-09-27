import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";

import { faceLipOwners } from "./prepareVermilionHeightBasis";

/**
 * The smile retraction revision of the connected face basis: each side's
 * smile (`mouthSmileLeft`, `mouthSmileRight`) carries the lips back onto
 * the dental arch as a posed smile does.
 *
 * In a posed smile the zygomaticus major pulls the corners up and back and
 * the lips, stretched between them, draw back against the teeth: the upper
 * lip's most prominent point falls 2.63 mm further behind the nasal tip and
 * the lower lip's 1.96 mm, for a smile that widens the mouth by 10.39 mm
 * (41 adults, rest against posed smile, 3D surface imaging; PMC12549365).
 * The source's smile widens the mouth and lifts its corners, but its lips
 * stay where they stood (the upper lip 0.18 mm ahead of its rest depth, the
 * lower 0.55 mm), so every rendered smile shows full lips standing off the
 * teeth. The revision adds that missing retraction to the smile's rows. On
 * the lips' surface (`lips`, both lips with their linings, so the lip keeps
 * its thickness) each vertex moves straight back by its lip's `retraction`
 * (metres with both sides at full weight: `upper` and `lower`, each lip the
 * part nearer its own meeting point, `faceLipOwners`) times cos^2 of a
 * quarter turn over its distance from the midline in the commissures'
 * half-width, all at the midline and none at the corners, which the smile
 * already carries back. Tissue does not pass through the teeth: where a lip
 * vertex lies in front of the dental crowns (`teeth`: the surface, and the
 * `gap` kept to it), its clearance from the crowns' front at the smile's
 * full weight, less the gap, holds the retraction of its whole lip column
 * (every vertex of that lip within 1.5 mm across), so the lining stops on
 * the incisors and the lip keeps its thickness: thinned there, the outer
 * surface passed behind the lower lip's own lining. Each side's channel carries its share: a
 * smoothstep over `midline` either side of the midplane, a half at it. The
 * outer skin (all but what faces back, into the mouth) reached from the lips without crossing them, between `reach`
 * (subnasale's height above, the labiomental fold's below) and within
 * `margin` beyond the corners (the modiolus), follows as a membrane (each
 * vertex's displacement the mean of its neighbours'), the skin beyond held.
 * The mouth's vestibule behind the linings, facing back toward the teeth
 * (a normal more than 60 degrees past the frontal plane), stays. The
 * rows are added to each channel's existing endpoint rows; every other
 * row, the documents and the control map are copied, restamped to
 * `revision`. Pure.
 */
export function prepareSmileRetractionBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  skin: string;
  lips: string;
  channels: { left: string; right: string };
  retraction: { upper: number; lower: number };
  reach: { upper: number; lower: number };
  margin: number;
  midline: number;
  teeth: { surface: string; gap: number };
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    lips: number;
    skin: number;
    sweeps: number;
    corner: number;
    held: number;
  };
} {
  if (input.revision.trim() === "" || input.revision === input.basis.id)
    throw new Error("A smile retraction revision needs a distinct revision.");
  if (!(input.retraction.upper >= 0 && input.retraction.lower >= 0))
    throw new Error("A retraction is zero or more.");
  if (!(input.reach.lower < input.reach.upper))
    throw new Error("The lower reach lies below the upper.");
  if (!(input.margin >= 0 && input.midline > 0))
    throw new Error("The margin is zero or more and the midline positive.");
  const basis = structuredClone(input.basis);
  const skin = basis.surfaces.find((one) => one.id === input.skin);
  if (skin === undefined) throw new Error(`No surface ${input.skin}.`);
  const region = skin.regions.find((one) => one.id === input.lips);
  if (region === undefined) throw new Error(`No region ${input.lips}.`);
  const contact = basis.contact?.lips;
  if (contact === undefined) throw new Error("The basis has no lip contact.");
  const channels = [input.channels.left, input.channels.right].map((id) => {
    const channel = basis.channels.find((one) => one.id === id);
    if (channel === undefined || channel.positive === null)
      throw new Error(`No smile channel ${id} with a positive endpoint.`);
    return channel;
  });
  const P = skin.positions;
  const I = skin.indices;
  const lipVertices = new Set(region.indices);
  const neighbours = new Map<number, Set<number>>();
  // Each vertex's facing: its triangles' area-weighted normal's forward
  // share (z over length).
  const normal = new Array<number>(P.length).fill(0);
  for (let t = 0; t < I.length; t += 3) {
    const [a, b, c] = [I[t]!, I[t + 1]!, I[t + 2]!];
    const u = [0, 1, 2].map((k) => P[3 * b + k]! - P[3 * a + k]!);
    const w = [0, 1, 2].map((k) => P[3 * c + k]! - P[3 * a + k]!);
    const n = [
      u[1]! * w[2]! - u[2]! * w[1]!,
      u[2]! * w[0]! - u[0]! * w[2]!,
      u[0]! * w[1]! - u[1]! * w[0]!,
    ];
    for (const v of [a, b, c])
      for (let k = 0; k < 3; ++k) normal[3 * v + k]! += n[k]!;
  }
  const facing = (v: number) =>
    normal[3 * v + 2]! /
    (Math.hypot(normal[3 * v]!, normal[3 * v + 1]!, normal[3 * v + 2]!) || 1);
  for (let t = 0; t < I.length; t += 3)
    for (let e = 0; e < 3; ++e) {
      const [from, to] = [I[t + e]!, I[t + ((e + 1) % 3)]!];
      if (!neighbours.has(from)) neighbours.set(from, new Set());
      if (!neighbours.has(to)) neighbours.set(to, new Set());
      neighbours.get(from)!.add(to);
      neighbours.get(to)!.add(from);
    }
  const owner = faceLipOwners(P, neighbours, lipVertices, contact);
  // The crowns' front: the most anterior crown point in each 1.5 mm cell of
  // the frontal plane.
  const teeth = basis.surfaces.find((one) => one.id === input.teeth.surface);
  if (teeth === undefined)
    throw new Error(`No surface ${input.teeth.surface}.`);
  const cell = 0.0015;
  const front = new Map<string, number>();
  for (let v = 0; v < teeth.positions.length / 3; ++v) {
    const key = `${Math.floor(teeth.positions[3 * v]! / cell)},${Math.floor(teeth.positions[3 * v + 1]! / cell)}`;
    front.set(
      key,
      Math.max(front.get(key) ?? -Infinity, teeth.positions[3 * v + 2]!),
    );
  }
  // Each lip vertex at both smiles' full weight.
  const smiled = [...P];
  for (const channel of channels) {
    const flat = skin.targets[channel.positive!] ?? [];
    for (let i = 0; i < flat.length; i += 4)
      for (let k = 0; k < 3; ++k) smiled[3 * flat[i]! + k]! += flat[i + 1 + k]!;
  }
  const clearance = (v: number): number => {
    const [x, y, z] = [smiled[3 * v]!, smiled[3 * v + 1]!, smiled[3 * v + 2]!];
    let crown = -Infinity;
    for (let i = -1; i <= 1; ++i)
      for (let j = -1; j <= 1; ++j)
        crown = Math.max(
          crown,
          front.get(
            `${Math.floor(x / cell) + i},${Math.floor(y / cell) + j}`,
          ) ?? -Infinity,
        );
    return crown === -Infinity || crown > z
      ? Infinity
      : z - crown - input.teeth.gap;
  };
  const corner = Math.max(...[...lipVertices].map((v) => Math.abs(P[3 * v]!)));
  // A lip moves back as one body in each column (1.5 mm across): the room
  // its nearest vertex to the crowns leaves holds the whole column, so its
  // outer surface never passes behind its own lining.
  const room = new Map(
    [...lipVertices].map((v) => [v, Math.max(0, clearance(v))]),
  );
  const column = (v: number): number => {
    let least = Infinity;
    for (const n of lipVertices)
      if (
        owner.get(n) === owner.get(v) &&
        Math.abs(P[3 * n]! - P[3 * v]!) < cell
      )
        least = Math.min(least, room.get(n)!);
    return least;
  };
  let held = 0;
  // The lips' own retraction, both sides at full weight.
  const field = new Map<number, number>();
  for (const v of lipVertices) {
    const t = Math.min(1, Math.abs(P[3 * v]!) / corner);
    const wanted =
      (owner.get(v) === "upper"
        ? input.retraction.upper
        : input.retraction.lower) *
      Math.cos((Math.PI / 2) * t) ** 2;
    const allowed = column(v);
    if (allowed < wanted) ++held;
    field.set(v, Math.min(wanted, allowed));
  }
  // The outer skin that follows, reached from the lips without crossing
  // them, within the reach and the margin.
  const follow = new Set<number>();
  const stack = [...lipVertices];
  while (stack.length !== 0) {
    const v = stack.pop()!;
    for (const n of neighbours.get(v) ?? []) {
      if (lipVertices.has(n) || follow.has(n)) continue;
      const [x, y] = [P[3 * n]!, P[3 * n + 1]!];
      if (
        facing(n) > -0.9 &&
        Math.abs(x) < corner + input.margin &&
        y > input.reach.lower &&
        y < input.reach.upper
      ) {
        follow.add(n);
        field.set(n, 0);
        stack.push(n);
      }
    }
  }
  let sweeps = 0;
  for (; sweeps < 20000; ++sweeps) {
    let change = 0;
    for (const v of follow) {
      const around = [...neighbours.get(v)!];
      const mean =
        around.reduce((sum, n) => sum + (field.get(n) ?? 0), 0) / around.length;
      change = Math.max(change, Math.abs(mean - field.get(v)!));
      field.set(v, mean);
    }
    if (change < 1e-10) break;
  }
  // Each side's share: a smoothstep across the midline.
  const share = (x: number, sign: 1 | -1): number => {
    const t = Math.min(
      1,
      Math.max(0, (sign * x + input.midline) / (2 * input.midline)),
    );
    return t * t * (3 - 2 * t);
  };
  channels.forEach((channel, k) => {
    const sign = k === 0 ? 1 : -1;
    const rows = new Map<number, [number, number, number]>();
    const flat = skin.targets[channel.positive!] ?? [];
    for (let i = 0; i < flat.length; i += 4)
      rows.set(flat[i]!, [flat[i + 1]!, flat[i + 2]!, flat[i + 3]!]);
    for (const [v, back] of field) {
      const dz = back * share(P[3 * v]!, sign);
      if (!(dz > 1e-9)) continue;
      const row = rows.get(v) ?? [0, 0, 0];
      rows.set(v, [row[0], row[1], row[2] - dz]);
    }
    skin.targets[channel.positive!] = [...rows]
      .sort(([a], [b]) => a - b)
      .flatMap(([v, [dx, dy, dz]]) => [v, dx, dy, dz]);
  });
  const source = basis.id;
  basis.id = input.revision;
  return {
    basis,
    documents: input.documents.map((one) => ({
      ...structuredClone(one),
      basis: input.revision,
    })),
    controls: { ...structuredClone(input.controls), basis: input.revision },
    receipt: {
      source,
      revision: input.revision,
      lips: lipVertices.size,
      skin: follow.size,
      sweeps,
      corner,
      held,
    },
  };
}
