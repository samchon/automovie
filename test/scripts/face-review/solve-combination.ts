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
 * first attempt carried the fold with the shared boundary and grew the
 * crossing from 16 vertices to 63. Those pairs go to `unfold` instead, which
 * takes back the pose's own pull around the fold rather than pushing either part.
 *
 * Consumers: `generate-combination-correctives.ts`. Nothing here reads or
 * writes the published study.
 */
import { measureAutoMovieModelCrossings } from "@automovie/engine";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human";
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

import { neighboursOf, pushOut, takeBack } from "./push-out";
import { unfold } from "./unfold";

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

/**
 * What the oral lining may give where the mandible swings out from under it,
 * in metres. The skin part is one surface from the brow to the floor of the
 * mouth, and where it meets the teeth it is that floor, attached to the bone
 * and dropping with it; the census measured the authored floor lagging the
 * gum block by up to eight millimetres, five past what soft tissue over an
 * arch is allowed. The second budget is tried only where the first fails.
 */
export const LINING_LIMIT = 0.008;
const LINING: [string, string] = [
  "Human.teeth_base/Human.teeth_base",
  "Human/skin",
];

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
  /** `same surface` is no longer produced; it names folds an older receipt left alone. */
  yielded?: string;
  budgetMillimetres?: number;
  /** The factor of its own motion the soft part gave back, when it had to. */
  tookBack?: number;
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

/** The part pairs a built model crosses on, each named once, sorted. */
export const crossingPairs = (model: IAutoMovieModel): Set<string> => {
  const found = new Set<string>();
  for (const crossing of measureAutoMovieModelCrossings(model))
    found.add(
      [crossing.part, crossing.other]
        .sort((a, b) => a.localeCompare(b))
        .join(" x "),
    );
  return found;
};

/**
 * The part pairs a pose makes cross that neither of its channels makes cross
 * alone at the same weight: the enumeration's criterion, asked of one pose.
 * `alone` is a cache of single-channel crossings keyed `channel@weight`, so a
 * grid of poses over the same channels builds each single once.
 */
export const appearedAt = (
  build: (expression: Record<string, number>) => IAutoMovieModel,
  expression: Record<string, number>,
  alone: Map<string, Set<string>>,
): string[] => {
  const singles = new Set<string>();
  for (const [channel, weight] of Object.entries(expression)) {
    const key = `${channel}@${weight}`;
    let found = alone.get(key);
    if (found === undefined) {
      found = crossingPairs(build({ [channel]: weight }));
      alone.set(key, found);
    }
    for (const pair of found) singles.add(pair);
  }
  return [...crossingPairs(build(expression))]
    .filter((pair) => !singles.has(pair))
    .sort((a, b) => a.localeCompare(b));
};

/**
 * Which parts each channel moves at full weight, read off the worn head: a
 * part whose shared positions differ from rest. Cached per channel, so a
 * grid of poses over the same channels costs one single build each.
 */
export const moverOf = (
  worn: (expression: Record<string, number>) => Worn,
  atRest: Worn,
  parts: Parts,
): ((channel: string) => Set<string>) => {
  const moves = new Map<string, Set<string>>();
  return (channel) => {
    let found = moves.get(channel);
    if (found === undefined) {
      found = new Set();
      const posed = worn({ [channel]: 1 });
      for (const [part, { surface, indices }] of parts) {
        const now = posed.get(surface)!.positions;
        const rest = atRest.get(surface)!.positions;
        if (
          indices.some(
            (v) =>
              now[v * 3] !== rest[v * 3] ||
              now[v * 3 + 1] !== rest[v * 3 + 1] ||
              now[v * 3 + 2] !== rest[v * 3 + 2],
          )
        )
          found.add(part);
      }
      moves.set(channel, found);
    }
    return found;
  };
};

/**
 * The head worn by only those channels of `expression` that move `part`, or
 * at rest when none does: what a take-back on the other part returns to.
 */
export const anchoredBy = (
  worn: (expression: Record<string, number>) => Worn,
  atRest: Worn,
  mover: (channel: string) => Set<string>,
  expression: Record<string, number>,
): ((part: string) => Worn) => {
  const cache = new Map<string, Worn>();
  return (part) => {
    let found = cache.get(part);
    if (found === undefined) {
      const keep = Object.fromEntries(
        Object.entries(expression).filter(([channel]) =>
          mover(channel).has(part),
        ),
      );
      found = Object.keys(keep).length === 0 ? atRest : worn(keep);
      cache.set(part, found);
    }
    return found;
  };
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
 * names the parts this pose makes firm, `anchored` gives the head worn by
 * only the channels of this pose that move a named part, `withoutAgents` the
 * head worn without the channels that make an agent, and `log` receives one
 * line per part pair for the console.
 *
 * What a take-back returns to is not rest but the pose less the channel that
 * did the crossing. A lip rolled over the incisors with the jaw thrust
 * forward is unrolled and the jaw stays thrust, because the lip's carry on
 * the jaw is not what put it through the teeth and taking it back too would
 * leave the lip at rest in front of teeth that have moved, which was measured
 * to cross by more than the pose did; so the soft part returns to `anchored`
 * by the firm one. A tongue that cannot come out returns to the pose without
 * `tongueOut`, which is `withoutAgents`, and keeps whatever the jaw did.
 */
export const solveCombination = (
  worn: Worn,
  appeared: string[],
  parts: Parts,
  atRest: Worn,
  limit: number,
  agents: ReadonlySet<string>,
  anchored: (part: string) => Worn,
  withoutAgents: Worn,
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
    const sameSurface = parts.get(firm)!.surface === parts.get(soft)!.surface;
    const mesh = sameSurface
      ? working.get(parts.get(soft)!.surface)!
      : partMesh(soft);
    // Three shapes of crossing, three ways out. A firm body that sits beside
    // a soft sheet at rest, teeth behind a lip, leaves by the side the sheet
    // was on, which the rest pose knows and the pose does not. A firm body
    // that passes through the sheet, a tongue through the lip aperture, is
    // not beside it at rest anywhere useful: its rest offset points along the
    // tongue, and a lip pushed that way is chasing the tip. There the sheet
    // opens around the body, off its nearest face. And two parts of one
    // surface through each other are a fold, which has no outside to push
    // toward and whose pull is taken back instead.
    const push = (budget: number) =>
      pushOut(
        mesh,
        partMesh(firm),
        budget,
        agents.has(firm)
          ? undefined
          : { mesh: partMesh(soft, atRest), into: partMesh(firm, atRest) },
      );
    let budget = limit;
    let first = sameSurface
      ? unfold(
          mesh,
          atRest.get(parts.get(soft)!.surface)!,
          parts.get(firm)!.indices,
          parts.get(soft)!.indices,
          limit,
        )
      : push(limit);
    if (
      !first.solved &&
      firm === LINING[0] &&
      soft === LINING[1] &&
      LINING_LIMIT > limit
    ) {
      budget = LINING_LIMIT;
      first = push(budget);
    }
    const { moved, crossings, solved } = first;
    for (const [vertex, delta] of moved)
      for (let k = 0; k < 3; k++) mesh.positions[vertex * 3 + k] += delta[k];
    let most = 0;
    for (const delta of moved.values())
      most = Math.max(most, Math.hypot(delta[0], delta[1], delta[2]));
    // What the yielding part cannot clear inside its budget, the other part
    // clears for it, when it is soft: a tongue through puckered lips is met by
    // lips that open and a tongue that gives, each inside the same budget,
    // rather than by lips alone asked for twice as much. Bone and the globe
    // still never move, and a fold has no other part to give.
    let shared = 0;
    let sharedMost = 0;
    let finallySolved = solved;
    let tookBack = 0;
    if (!solved && !sameSurface && YIELDS.indexOf(firm) < RIGID) {
      // Bone cannot give and the soft part could not clear it inside what
      // tissue gives; what remains is that the soft part came this far at all.
      // Its own motion from rest is scaled back until it is clear of the
      // bone: a lip rolled over the incisors with the jaw thrust forward
      // unrolls, which is what a lip against teeth does.
      for (const [vertex, delta] of moved)
        for (let k = 0; k < 3; k++) mesh.positions[vertex * 3 + k] -= delta[k];
      moved.clear();
      most = 0;
      const back = takeBack(
        mesh,
        partMesh(soft, anchored(firm)),
        partMesh(firm),
      );
      for (const [vertex, delta] of back.moved)
        for (let k = 0; k < 3; k++) mesh.positions[vertex * 3 + k] += delta[k];
      for (const [vertex, delta] of back.moved) {
        moved.set(vertex, delta);
        most = Math.max(most, Math.hypot(delta[0], delta[1], delta[2]));
      }
      crossings.push(...back.crossings);
      finallySolved = back.solved;
      tookBack = back.factor;
    }
    if (!solved && !sameSurface && YIELDS.indexOf(firm) >= RIGID) {
      const other = partMesh(firm);
      // An agent gives by coming out less, not by being pushed: its own motion
      // is scaled back until it is clear, and the push the lips took toward
      // it is undone first, because a lip dented three millimetres around a
      // tongue that then comes out less is a dent and nothing else; the
      // render showed the chin bulging under a tongue that was no longer
      // there. Any other soft part is pushed.
      if (agents.has(firm)) {
        for (const [vertex, delta] of moved)
          for (let k = 0; k < 3; k++)
            mesh.positions[vertex * 3 + k] -= delta[k];
        moved.clear();
        most = 0;
      }
      const second = agents.has(firm)
        ? takeBack(other, partMesh(firm, withoutAgents), partMesh(soft))
        : pushOut(other, partMesh(soft), limit, {
            mesh: partMesh(firm, atRest),
            into: partMesh(soft, atRest),
          });
      for (const [vertex, delta] of second.moved)
        for (let k = 0; k < 3; k++) other.positions[vertex * 3 + k] += delta[k];
      for (const delta of second.moved.values())
        sharedMost = Math.max(
          sharedMost,
          Math.hypot(delta[0], delta[1], delta[2]),
        );
      shared = second.moved.size;
      crossings.push(...second.crossings);
      finallySolved = second.solved;
    }
    // Three outcomes, not two: a pair with nothing crossing at this pose is
    // absent, not repaired, and an earlier pair's push may have cleared it.
    const outcome =
      crossings[0] === 0
        ? "absent"
        : finallySolved
          ? "repaired"
          : "beyond the budget";
    outcomes.push({
      surfaces: `${firm} x ${soft}`,
      budgetMillimetres: budget * 1000,
      ...(tookBack > 0 ? { tookBack } : {}),
      yielded: sameSurface
        ? `${soft} and ${firm}`
        : shared > 0
          ? `${soft}, then ${firm}`
          : soft,
      crossedVerticesPerRound: crossings,
      movedVertices: moved.size + shared,
      mostMillimetres: Math.max(most, sharedMost) * 1000,
      outcome,
    });
    log(
      `${short(soft).padEnd(12)} ${short(firm).padEnd(12)}` +
        ` ${String(crossings[0]).padStart(7)}` +
        ` ${String(crossings[crossings.length - 1]).padStart(4)}` +
        ` ${String(moved.size + shared).padStart(5)} ${(Math.max(most, sharedMost) * 1000).toFixed(2).padStart(5)}` +
        (shared > 0 ? `   +${short(firm)} gave ${shared}` : "") +
        (tookBack > 0 ? `   took back ${(tookBack * 100).toFixed(0)}%` : "") +
        (budget !== limit ? `   @${(budget * 1000).toFixed(0)}mm` : "") +
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
