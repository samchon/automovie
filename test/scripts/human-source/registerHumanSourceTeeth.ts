import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourceToothRegistration } from "./structures/IHumanSourceToothRegistration.ts";

/** Dentition surface id. */
const SURFACE = "Human.teeth_base";
/** Vertices of one single-tooth component of the CC0 dentition mesh. */
const TOOTH_VERTICES = 63;
/** Angular separation below which two teeth of one quadrant are not ordered, radians. */
const ORDER_TOLERANCE = 1e-3;

/**
 * Number the teeth of the dentition by ISO 3950 from their positions.
 *
 * The CC0 dentition mesh is two gum-and-palate components and 32 separate
 * tooth components of 63 vertices each. Each tooth pairs with its occluding
 * antagonist (the mutual nearest tooth in the horizontal plane) and the higher
 * of the two is the upper; teeth are then split into the face's right (-X)
 * and left (+X) by the sign of x, and ordered within a quadrant from the
 * midline backward by the angle of their centroid about the arch centre
 * (mean centroid), measured from the front (+Z). Quadrants follow ISO 3950:
 * 1 upper right, 2 upper left, 3 lower left, 4 lower right, teeth 1 to 8 from
 * the midline. A quadrant without eight teeth, or two teeth within the angle
 * tolerance, leaves those teeth out with the reason recorded; gingiva and
 * palate are not separated in the mesh and are not written.
 */
export function registerHumanSourceTeeth(face: IAutoMovieHumanFaceBasis): IHumanSourceToothRegistration {
  const index = face.surfaces.findIndex((s) => s.id === SURFACE);
  if (index < 0) throw new Error(`Tooth registration: the face has no ${SURFACE} surface.`);
  const surface = face.surfaces[index];
  const p = surface.positions;
  const n = p.length / 3;
  const parent = Int32Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  for (let t = 0; t < surface.indices.length; t += 3)
    for (let k = 1; k < 3; k++) {
      const a = find(surface.indices[t]);
      const b = find(surface.indices[t + k]);
      if (a !== b) parent[a] = b;
    }
  const groups = new Map<number, number[]>();
  for (let v = 0; v < n; v++) {
    const r = find(v);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r)!.push(v);
  }
  const teeth = [...groups.values()].filter((g) => g.length === TOOTH_VERTICES);
  const centroid = (g: number[]): number[] => [0, 1, 2].map((c) => g.reduce((s, v) => s + p[3 * v + c], 0) / g.length);
  const items = teeth.map((vertices) => ({ vertices: [...vertices].sort((a, b) => a - b), c: centroid(vertices) }));
  // Antagonists: each tooth pairs with the tooth nearest it in the horizontal
  // (x, z) plane, and the pair must be mutual. In a pair the tooth with the
  // higher centroid is the upper. A tooth without a mutual antagonist is left
  // unassigned and refused.
  const horizontal = (a: number[], b: number[]): number => Math.hypot(a[0] - b[0], a[2] - b[2]);
  const nearestOf = items.map((t, i) => {
    let best = -1;
    let distance = Infinity;
    items.forEach((o, j) => {
      if (j === i) return;
      const d = horizontal(t.c, o.c);
      if (d < distance) {
        distance = d;
        best = j;
      }
    });
    return best;
  });
  const isUpper = new Map<(typeof items)[number], boolean>();
  items.forEach((t, i) => {
    const j = nearestOf[i];
    if (nearestOf[j] === i) isUpper.set(t, t.c[1] > items[j].c[1]);
  });
  const centre = [0, 1, 2].map((c) => items.reduce((s, t) => s + t.c[c], 0) / items.length);
  const regions: IHumanSourceToothRegistration["regions"] = {};
  const refused: string[] = [];
  for (const [quadrant, upper, left] of [
    [1, true, false],
    [2, true, true],
    [3, false, true],
    [4, false, false],
  ] as const) {
    const members = items
      .filter((t) => isUpper.get(t) === upper && t.c[0] > 0 === left)
      .map((t) => ({ ...t, angle: Math.atan2(Math.abs(t.c[0] - centre[0]), t.c[2] - centre[2]) }))
      .sort((a, b) => a.angle - b.angle);
    if (members.length !== 8) {
      refused.push(`quadrant ${quadrant}: ${members.length} teeth, not 8`);
      continue;
    }
    members.forEach((tooth, i) => {
      const close = (i > 0 && tooth.angle - members[i - 1].angle < ORDER_TOLERANCE) || (i < 7 && members[i + 1].angle - tooth.angle < ORDER_TOLERANCE);
      if (close) refused.push(`tooth ${quadrant}${i + 1}: angle within ${ORDER_TOLERANCE} rad of its neighbour`);
      else regions[`tooth-${quadrant}${i + 1}`] = { surface: index, vertices: tooth.vertices };
    });
  }
  return {
    regions,
    record: {
      surface: SURFACE,
      convention: "Region rows are vertex IDs of the face's `Human.teeth_base` surface; centroids are neutral head-frame metres (right-handed Y-up, Z-forward, +X the anatomical left); tooth codes follow ISO 3950 with the anatomical sides.",
      rule: "32 components of 63 vertices; upper/lower within each mutual nearest antagonist pair in the horizontal plane, the higher centroid being upper; right/left by the sign of x; within a quadrant ordered from the midline by the centroid angle about the mean centroid, measured from +Z; ISO 3950 quadrants 1 upper right, 2 upper left, 3 lower left, 4 lower right",
      toothComponents: teeth.length,
      otherComponents: [...groups.values()].filter((g) => g.length !== TOOTH_VERTICES).map((g) => g.length),
      registered: Object.keys(regions).length,
      refused,
      gingivaAndPalate: "not separated in the CC0 mesh; not written (absent registration)",
    },
  };
}
