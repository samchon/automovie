/** Solve one channel combination's crossings into one corrective endpoint.
 *
 * This is the middle of the corrective generator, pulled out so the same
 * procedure answers a pose at full weight and a pose at half weight alike.
 * Given a head that can be worn at any expression, a combination, the part
 * pairs the enumeration says it makes cross, and the head at rest, it pushes
 * each yielding part clear of the firm one on a single working head, firmest
 * pair first, and reports the whole head's displacement as sparse rows per
 * surface in the basis's shared vertex identities.
 *
 * Which part yields is a standing order, not a judgement. Bone and the globe
 * of the eye do not deform, so teeth and eyes never move and whatever they are
 * inside of does. Between two soft parts the enclosed one yields, because a
 * tongue is in a mouth and lips are not in a tongue; hair-like parts yield to
 * skin for the same reason a brow sits on a face. One order is decided by the
 * pose rather than the anatomy: when the tongue is being put out, the tongue
 * is the agent and the lips part around it, because pushing the tongue back
 * inside is undoing the channel rather than correcting the combination, and
 * the solver measured exactly that, a tongue-out pair whose crossing grew
 * from 12 vertices to 24 while the tongue was being pushed back a clearance
 * at a time. The caller names such agents per combination. Lips and skin are one
 * connected surface, so a lip triangle through a skin triangle is that surface
 * folding into itself, and a push between two bodies does not answer it: the
 * published attempt carried the fold with the shared boundary and grew the
 * crossing from 16 vertices to 63. Those pairs are named and left alone.
 *
 * Consumers: `generate-combination-correctives.ts`. Nothing here reads or
 * writes the published study.
 */
import type { IAutoMovieHumanFaceBasis } from "@automovie/human";
import type { IAutoMovieMesh } from "@automovie/interface";

import { neighboursOf, pushOut } from "./push-out";

/** Which part gives way, lowest first: rigid never, then skin, then the rest. */
export const YIELDS = [
  "Human.teeth_base/Human.teeth_base",
  "Human.low-poly/Human.low-poly",
  "Human/skin",
  "Human/lips",
  "Human.eyebrow001/Human.eyebrow001",
  "Human.eyelashes01/Human.eyelashes01",
  "Human.tongue01/Human.tongue01",
];
/** Parts that never yield; a crossing between two of them is not solvable here. */
export const RIGID = 2;

/** A head worn at one expression: surface id to a mesh over shared vertices. */
export type Worn = Map<string, IAutoMovieMesh>;

/** What a part is, in basis terms: its surface and its triangles over it. */
export type Parts = Map<string, { surface: string; indices: number[] }>;

/** One part pair's outcome inside a solved combination. */
export interface ICrossingOutcome {
  surfaces: string;
  outcome:
    | "repaired"
    | "absent"
    | "beyond the budget"
    | "both rigid"
    | "same surface";
  yielded?: string;
  crossedVerticesPerRound?: number[];
  movedVertices?: number;
  mostMillimetres?: number;
}

/** A solved combination: its rows per surface and how each pair went. */
export interface ISolvedCombination {
  outcomes: ICrossingOutcome[];
  rows: Map<string, number[]>;
  movedVertices: number;
  creaseMetres: number;
  /** Every answerable crossing was answered, and at least one was there to answer. */
  publishable: boolean;
}

/** A part's place in the yield order; an agent of the pose ranks just after bone. */
const rankOf = (id: string, agents: ReadonlySet<string>): number => {
  const rank = YIELDS.indexOf(id);
  if (rank < 0) throw new Error(`no standing order says whether ${id} yields`);
  return agents.has(id) ? RIGID - 0.5 : rank;
};

/** Back to sparse quadruples, strictly increasing by vertex as the schema says. */
const gather = (moved: Map<number, number[]>): number[] => {
  const out: number[] = [];
  for (const vertex of [...moved.keys()].sort((a, b) => a - b)) {
    const [x, y, z] = moved.get(vertex)!;
    if (x === 0 && y === 0 && z === 0) continue;
    out.push(vertex, x, y, z);
  }
  return out;
};

/**
 * The steepest step between two neighbouring vertices' displacements, in
 * metres. A repair that reads as tissue moving has a small one; a dent has a
 * step the size of the push itself. Unmoved neighbours count as zero, so the
 * edge of the moved region is measured too.
 */
const creaseOf = (
  mesh: IAutoMovieMesh,
  moved: Map<number, number[]>,
): number => {
  const near = neighboursOf(mesh);
  let worst = 0;
  for (const [vertex, delta] of moved)
    for (const neighbour of near[vertex]) {
      const other = moved.get(neighbour) ?? [0, 0, 0];
      worst = Math.max(
        worst,
        Math.hypot(
          delta[0] - other[0],
          delta[1] - other[1],
          delta[2] - other[2],
        ),
      );
    }
  return worst;
};

/** Read a worn head's parts out of the builder's model, over shared vertices. */
export const wornFrom = (
  basis: IAutoMovieHumanFaceBasis,
  parts: Map<string, IAutoMovieMesh>,
): Worn => {
  const surfaces: Worn = new Map();
  for (const surface of basis.surfaces) {
    // The neck clip left skin vertices that no triangle uses; they keep their
    // neutral coordinates, take part in no crossing and are never moved. The
    // builder splits seams, so a shared vertex is read back through each
    // region's own corner list: corner `c` of region `r` is source vertex
    // `r.indices[c]` and region vertex `mesh.indices[c]`, exactly.
    const positions = [...surface.positions];
    const drawn = new Set<number>();
    for (const region of surface.regions) {
      const mesh = parts.get(region.id)!;
      region.indices.forEach((source, corner) => {
        const local = mesh.indices![corner];
        drawn.add(source);
        for (let k = 0; k < 3; k++)
          positions[source * 3 + k] = mesh.positions[local * 3 + k];
      });
    }
    if (drawn.size !== new Set(surface.indices).size)
      throw new Error(
        `${surface.id}: the regions do not draw every surface triangle`,
      );
    surfaces.set(surface.id, {
      positions,
      normals: null,
      uvs: null,
      indices: surface.indices,
      skin: null,
    });
  }
  return surfaces;
};

/**
 * Push every yielding part of `worn` clear of its firm partner, in place on a
 * copy, and return the displacement that took as one corrective's rows.
 *
 * `appeared` names the part pairs in the enumeration's "a x b" spelling.
 * `atRest` decides which side of a firm part each vertex belongs on, `agents`
 * names the parts this pose makes firm, and `log` receives one line per part
 * pair for the console.
 */
export const solveCombination = (
  worn: Worn,
  appeared: string[],
  parts: Parts,
  atRest: Worn,
  limit: number,
  agents: ReadonlySet<string>,
  log: (line: string) => void,
): ISolvedCombination => {
  const working: Worn = new Map(
    [...worn].map(([id, mesh]) => [
      id,
      { ...mesh, positions: [...mesh.positions] },
    ]),
  );
  const partMesh = (part: string, over = working): IAutoMovieMesh => {
    const { surface, indices } = parts.get(part)!;
    return { ...over.get(surface)!, indices };
  };
  // Part pairs, firmest first, so a tongue clears the lips where the lips now are.
  const rank = (id: string) => rankOf(id, agents);
  const ordered = appeared
    .map((one) => {
      const [a, b] = one.split(" x ");
      return rank(a) < rank(b) ? [a, b] : [b, a];
    })
    .sort((x, y) => rank(x[0]) - rank(y[0]) || rank(x[1]) - rank(y[1]));
  const outcomes: ICrossingOutcome[] = [];
  const short = (part: string) =>
    (part.split("/").pop() ?? part).replace("Human.", "");
  for (const [firm, soft] of ordered) {
    if (rank(soft) < RIGID) {
      outcomes.push({ surfaces: `${firm} x ${soft}`, outcome: "both rigid" });
      continue;
    }
    if (parts.get(firm)!.surface === parts.get(soft)!.surface) {
      outcomes.push({ surfaces: `${firm} x ${soft}`, outcome: "same surface" });
      continue;
    }
    const mesh = partMesh(soft);
    // Two ways out, for two shapes of crossing. A firm body that sits beside
    // a soft sheet at rest, teeth behind a lip, leaves by the side the sheet
    // was on, which the rest pose knows and the pose does not. A firm body
    // that passes through the sheet, a tongue through the lip aperture, is
    // not beside it at rest anywhere useful: its rest offset points along the
    // tongue, and a lip pushed that way is chasing the tip. There the sheet
    // opens around the body, off its nearest face.
    const { moved, crossings, solved } = pushOut(
      mesh,
      partMesh(firm),
      limit,
      agents.has(firm)
        ? undefined
        : { mesh: partMesh(soft, atRest), into: partMesh(firm, atRest) },
    );
    for (const [vertex, delta] of moved)
      for (let k = 0; k < 3; k++) mesh.positions[vertex * 3 + k] += delta[k];
    let most = 0;
    for (const delta of moved.values())
      most = Math.max(most, Math.hypot(delta[0], delta[1], delta[2]));
    // Three outcomes, not two: a pair with nothing crossing at this pose is
    // absent, not repaired, and an earlier pair's push may have cleared it.
    const outcome =
      crossings[0] === 0 ? "absent" : solved ? "repaired" : "beyond the budget";
    outcomes.push({
      surfaces: `${firm} x ${soft}`,
      yielded: soft,
      crossedVerticesPerRound: crossings,
      movedVertices: moved.size,
      mostMillimetres: most * 1000,
      outcome,
    });
    log(
      `${short(soft).padEnd(12)} ${short(firm).padEnd(12)}` +
        ` ${String(crossings[0]).padStart(7)}` +
        ` ${String(crossings[crossings.length - 1]).padStart(4)}` +
        ` ${String(moved.size).padStart(5)} ${(most * 1000).toFixed(2).padStart(5)}` +
        (outcome === "repaired" ? "" : `   ${outcome.toUpperCase()}`),
    );
  }
  // The corrective is the whole head's displacement, every surface at once.
  const rows = new Map<string, number[]>();
  let crease = 0;
  let movedVertices = 0;
  for (const [id, mesh] of working) {
    const delta = new Map<number, number[]>();
    const before = worn.get(id)!;
    for (let vertex = 0; vertex < mesh.positions.length / 3; vertex++) {
      const d = [0, 1, 2].map(
        (k) =>
          mesh.positions[vertex * 3 + k] - before.positions[vertex * 3 + k],
      );
      if (Math.hypot(d[0], d[1], d[2]) > 1e-9) delta.set(vertex, d);
    }
    if (delta.size === 0) continue;
    crease = Math.max(crease, creaseOf(mesh, delta));
    movedVertices += delta.size;
    rows.set(id, gather(delta));
  }
  return {
    outcomes,
    rows,
    movedVertices,
    creaseMetres: crease,
    publishable:
      outcomes.some((o) => o.outcome === "repaired") &&
      outcomes.every((o) =>
        ["repaired", "absent", "same surface"].includes(o.outcome),
      ),
  };
};
