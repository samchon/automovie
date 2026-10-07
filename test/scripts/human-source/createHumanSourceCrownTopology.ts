import { readHumanFaceOralCrowns } from "@automovie/human/face/anatomy/oral/readHumanFaceOralCrowns";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourceCrownTopology } from "./structures/IHumanSourceCrownTopology.ts";

/**
 * Register the unchanged component, closure and unique edges once per source.
 * The problem owner retains this value only while ISO regions, dental indices
 * and collider closure remain unchanged. Neutral coordinates may vary within
 * that problem; signed queries and crossing BVHs still use each candidate's
 * actual coordinates. A newly registered source creates a new topology.
 */
export function createHumanSourceCrownTopology(face: IAutoMovieHumanFaceBasis): IHumanSourceCrownTopology[] {
  const dental = face.surfaces.find((surface) => surface.id === "Human.teeth_base");
  const collider = face.contact?.colliders.find((entry) => entry.surface === "Human.teeth_base");
  if (dental === undefined || collider === undefined) throw new Error("Crown topology needs the dental surface and its collider closure.");
  const all = [...dental.indices, ...collider.closure];
  return readHumanFaceOralCrowns(face).map((crown): IHumanSourceCrownTopology => {
    const members = new Set(crown.vertices), indices: number[] = [];
    const edges = new Map<string, [number, number]>();
    for (let at = 0; at < all.length; at += 3) {
      if (!members.has(all[at]) || !members.has(all[at + 1]) || !members.has(all[at + 2])) continue;
      indices.push(all[at], all[at + 1], all[at + 2]);
      for (const [a, b] of [[all[at], all[at + 1]], [all[at + 1], all[at + 2]], [all[at + 2], all[at]]]) {
        const low = Math.min(a, b), high = Math.max(a, b);
        edges.set(`${low}/${high}`, [low, high]);
      }
    }
    return { id: crown.id, mandibular: crown.mandibular, vertices: [...crown.vertices], indices,
      edges: [...edges.values()].sort((left, right) => left[0] - right[0] || left[1] - right[1]) };
  });
}
