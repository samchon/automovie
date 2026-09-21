/**
 * Two-sided push-out of one connected skin where two of its segments cross.
 *
 * The face track's corrective generator moves one surface out of another:
 * teeth never move, so the lip yields. Skin against skin has no such order.
 * At a bent elbow the forearm presses the upper arm and the upper arm presses
 * back, and both flatten. So both segments move here, and the solver repeats
 * until no triangle of either crosses the other or the rounds run out.
 *
 * The rule is a plane. Two segments that meet at a joint fold into each
 * other through the crease, where the blend has collapsed and sometimes
 * inverted the triangles; there each side is kept on its own side of the
 * **fold plane**, the plane through the joint bisecting the two bones,
 * which is what flesh pressed against flesh does. Two segments that are not
 * adjacent meet as two surfaces, and the plane that separates their
 * crossing patches, through the patches' mean and normal to the line
 * between their centroids, is the **contact plane**. Either plane slides on
 * the first round to the middle of the two penetrations, and afterwards a
 * millimetre a round toward whichever side still has budget while the
 * other has spent it. Along the seam of the two segments a vertex belongs
 * to both; it goes with the bone that owns it and is pinned exactly one
 * clearance off the plane while every other vertex is held at least two,
 * so the triangle of the other segment that has it as a corner never
 * reaches the sheet that segment's own triangles form.
 *
 * Two earlier rules remain for the case the contact plane cannot be found
 * (both patches' centroids coincide): a **surface** rule that puts each
 * corner inside the other surface half way to a clearance outside it along
 * that surface's normal, and a **retreat** rule that moves every corner of
 * a crossing triangle into its own body along its rest normal carried into
 * the pose; the solver switches between them whenever a window of rounds
 * has not reduced the crossing count. Every round's rule is reported.
 *
 * The motion is then spread over a few rings of neighbours as a diffusion
 * of the *displacement*, not of the position: relaxing positions shrinks a
 * curved surface toward its neighbours' mean, while relaxing displacements
 * leaves an unmoved surface exactly where it was and turns a row of pushed
 * vertices into a dent with sloped sides. Under a plane rule every touched
 * vertex is held back on its side after the diffusion.
 *
 * Every vertex keeps within a budget from where the push started, measured
 * in the posed frame. A pair the budget cannot clear is reported unsolved,
 * not pushed harder: a corrective that has to move skin further than tissue
 * compresses is describing a pose the range should not reach.
 */
import { crossedVertices, surfaceOf } from "./pushApartGeometry";

/** How far past the surface it entered a pushed corner is put, in metres. */
export const CLEARANCE = 0.0005;
/** How far a corner retreats into its own body per round, in metres. */
export const RETREAT = 0.001;
/** Rounds of pushing and relaxing before a pair is called unsolved. */
export const ROUNDS = 48;
/** Rounds without a tenth less crossing corners before the rule switches. */
export const WINDOW = 6;
/** Share of a pushed vertex's motion its neighbours take on, per sweep. */
export const RELAX = 0.5;
/** Diffusion sweeps after each push. */
export const SMOOTHING = 6;
/** Rings of neighbours around a pushed vertex that take part in diffusion. */
export const RINGS = 3;

export type PushRule = "fold" | "surface" | "retreat";

/**
 * The fold plane of two adjacent segments: through the joint, with its unit
 * normal pointing to the side segment `a` belongs on.
 */
/** What a round of `pushApart` saw, for a probe that watches a pair fail. */
export interface IPushTrace {
  round: number;
  rule: PushRule;
  plane: IFoldPlane | null;
  /** Signed depths of the crossed vertices of `a` and of `b` against the plane, after any slide. */
  depthsA: number[];
  depthsB: number[];
  starved: number;
}

export interface IFoldPlane {
  point: number[];
  normal: number[];
}

/**
 * Move segments `a` and `b` apart in place and report the crossing corners
 * and the rule of each round, and whether they parted.
 *
 * `base` is the untouched posed skin that `displacement` is measured from
 * (it accumulates across the pairs of one state and its passes); `start` is
 * where the push begins and the `budget` is measured from, which differs
 * from `base` when a volume corrective already moved the skin; `normals`
 * are the unit outward rest normals carried into the pose, per vertex;
 * `fold` is the fold plane of an adjacent pair, or null for two surfaces,
 * and `owner` says which side (+1 for `a`, -1 for `b`) a vertex both
 * segments touch belongs to, by the bone that owns it.
 */
export function pushApart(
  positions: number[],
  base: number[],
  start: number[],
  displacement: Map<number, number[]>,
  near: Set<number>[],
  a: number[],
  b: number[],
  budget: number,
  normals: number[],
  fold: IFoldPlane | null,
  owner: Map<number, 1 | -1> = new Map(),
  trace: ((event: IPushTrace) => void) | null = null,
): { rounds: number[]; rules: PushRule[]; solved: boolean } {
  const rounds: number[] = [];
  const rules: PushRule[] = [];
  // Two segments that are not adjacent still meet along a surface, and the
  // plane that separates their crossing patches (through the patches' mean,
  // normal from one patch's centroid to the other's) is the contact plane;
  // it is derived on the first round, when the patches are known, and the
  // surface rule is kept only when the two centroids coincide.
  let plane: IFoldPlane | null = fold;
  let rule: PushRule = fold === null ? "surface" : "fold";
  // Which side of the fold plane a vertex belongs on: +1 for segment a, -1
  // for b. A seam vertex, one that both segments' triangles touch, goes with
  // the bone that owns it (`owner`), not onto the plane: the seam of a
  // majority partition is a band several triangles wide, and pinning it to
  // the plane laid whole triangles of both segments in one plane, which the
  // crossing test rightly reports as coplanar overlap forever.
  const sideOf = new Map<number, 1 | -1>();
  // A seam vertex is pinned exactly at its clearance rather than at least
  // there: it is a corner of the other segment's triangles too, and a corner
  // deeper than the sheet lets that triangle dip through the sheet.
  const seam = new Set<number>();
  {
    const inA = new Set(a);
    for (const vertex of b) sideOf.set(vertex, -1);
    for (const vertex of a) sideOf.set(vertex, 1);
    for (const vertex of b)
      if (inA.has(vertex)) {
        sideOf.set(vertex, owner.get(vertex) ?? 1);
        seam.add(vertex);
      }
  }
  // A seam vertex that is, this round, a corner of a crossing triangle of
  // the segment that does not own it is the crease gutter itself: it is put
  // on the plane, so that triangle spans one side only and cannot cross the
  // other segment's sheet. The rest of the seam keeps its clearance, which
  // is what stops the band from collapsing into one coplanar sheet.
  const gutter = new Set<number>();
  /** Put a vertex at its fold depth target when it is short of it. */
  const hold = (vertex: number, minimum: number): void => {
    const side = sideOf.get(vertex);
    if (side === undefined) return;
    if (gutter.has(vertex)) {
      const depth = [0, 1, 2].reduce(
        (total, k) =>
          total +
          (positions[vertex * 3 + k] - plane!.point[k]) * plane!.normal[k],
        0,
      );
      if (depth !== 0)
        for (let k = 0; k < 3; k++)
          positions[vertex * 3 + k] -= depth * plane!.normal[k];
      return;
    }
    const depth = [0, 1, 2].reduce(
      (total, k) =>
        total +
        (positions[vertex * 3 + k] - plane!.point[k]) * plane!.normal[k],
      0,
    );
    // the seam sits exactly one clearance off the plane and everything else
    // at least two, so a seam corner of the other segment's triangle never
    // reaches the sheet those triangles form
    const target = side * (seam.has(vertex) ? minimum : 2 * minimum);
    if (seam.has(vertex) ? depth !== target : side * depth < 2 * minimum)
      for (let k = 0; k < 3; k++)
        positions[vertex * 3 + k] += (target - depth) * plane!.normal[k];
  };
  /** Vertices the budget stopped short of their fold side, this round. */
  const starved = new Set<number>();
  const clamp = (vertex: number): void => {
    const delta = [0, 1, 2].map(
      (k) => positions[vertex * 3 + k] - start[vertex * 3 + k],
    );
    const far = Math.hypot(delta[0], delta[1], delta[2]);
    if (far > budget) {
      for (let k = 0; k < 3; k++)
        positions[vertex * 3 + k] =
          start[vertex * 3 + k] + (delta[k] / far) * budget;
      starved.add(vertex);
    }
    const kept = [0, 1, 2].map(
      (k) => positions[vertex * 3 + k] - base[vertex * 3 + k],
    );
    if (Math.hypot(kept[0], kept[1], kept[2]) > 1e-9)
      displacement.set(vertex, kept);
    else displacement.delete(vertex);
  };
  for (let round = 0; round < ROUNDS; round++) {
    const hitA = crossedVertices(positions, a, b);
    const hitB = crossedVertices(positions, b, a);
    rounds.push(hitA.size + hitB.size);
    if (hitA.size + hitB.size === 0) return { rounds, rules, solved: true };
    // a count that has not fallen in a window under a plane rule is stuck on
    // the budget, and forty more rounds of it are forty more crossing tests
    if (
      rule === "fold" &&
      round >= 2 * WINDOW &&
      rounds[round] >= Math.min(...rounds.slice(round - 2 * WINDOW, round))
    )
      return { rounds, rules, solved: false };
    // The plane through the joint splits the fold, not the tissue: the biceps
    // may stand further past it than the forearm does. On the first round the
    // plane slides along its normal to the middle of the two penetrations, so
    // both sides give up the same depth and neither alone spends the budget.
    // the separating plane of two crossing patches: through their mean,
    // normal along the line between their centroids; null when they coincide
    const separating = (): IFoldPlane | null => {
      const centroid = (hit: Set<number>): number[] => {
        const sum = [0, 0, 0];
        for (const vertex of hit)
          for (let k = 0; k < 3; k++) sum[k] += positions[vertex * 3 + k];
        return sum.map((one) => one / hit.size);
      };
      if (hitA.size === 0 || hitB.size === 0) return null;
      const cA = centroid(hitA);
      const cB = centroid(hitB);
      const apart = [0, 1, 2].map((k) => cA[k] - cB[k]);
      const size = Math.hypot(apart[0], apart[1], apart[2]);
      if (size <= 0.0005) return null;
      return {
        point: [0, 1, 2].map((k) => (cA[k] + cB[k]) / 2),
        normal: apart.map((one) => one / size),
      };
    };
    if (round === 0 && plane === null) {
      plane = separating();
      if (plane !== null) rule = "fold";
    }
    if (rule === "fold" && round === 0) {
      const depthOf = (vertex: number): number =>
        [0, 1, 2].reduce(
          (total, k) =>
            total +
            (positions[vertex * 3 + k] - plane!.point[k]) * plane!.normal[k],
          0,
        );
      // measured from the vertices themselves, not from zero: a joint deep
      // inside the pelvis puts its plane eight centimetres behind the groin
      // fold, where both patches lie on the same side of it
      let deepestA = Infinity;
      let deepestB = -Infinity;
      for (const vertex of hitA) deepestA = Math.min(deepestA, depthOf(vertex));
      for (const vertex of hitB) deepestB = Math.max(deepestB, depthOf(vertex));
      const shift =
        hitA.size > 0 && hitB.size > 0 ? (deepestA + deepestB) / 2 : 0;
      for (let k = 0; k < 3; k++) plane!.point[k] += shift * plane!.normal[k];
    }
    // When the budget starves one side and the other still has slack, the
    // plane slides a millimetre toward the side with slack, so the tissue
    // that can still give does, before a pair is called unsolved.
    if (rule === "fold" && round > 0 && starved.size > 0) {
      let starvedA = 0;
      let starvedB = 0;
      for (const vertex of starved)
        if (sideOf.get(vertex) === 1) starvedA++;
        else starvedB++;
      const toward =
        starvedA > 0 && starvedB === 0
          ? -1
          : starvedB > 0 && starvedA === 0
            ? 1
            : 0;
      for (let k = 0; k < 3; k++)
        plane!.point[k] += toward * RETREAT * plane!.normal[k];
    }
    if (trace !== null) {
      const depthOf = (vertex: number): number =>
        plane === null
          ? Number.NaN
          : [0, 1, 2].reduce(
              (total, k) =>
                total +
                (positions[vertex * 3 + k] - plane!.point[k]) *
                  plane!.normal[k],
              0,
            );
      trace({
        round,
        rule,
        plane:
          plane === null
            ? null
            : { point: [...plane.point], normal: [...plane.normal] },
        depthsA: [...hitA].map(depthOf),
        depthsB: [...hitB].map(depthOf),
        starved: starved.size,
      });
    }
    starved.clear();
    if (
      rule !== "fold" &&
      round >= WINDOW &&
      round % WINDOW === 0 &&
      rounds[round] > 0.9 * rounds[round - WINDOW]
    )
      rule = rule === "surface" ? "retreat" : "surface";
    rules.push(rule);
    gutter.clear();
    if (rule === "fold") {
      for (const vertex of hitA)
        if (sideOf.get(vertex) === -1) gutter.add(vertex);
      for (const vertex of hitB)
        if (sideOf.get(vertex) === 1) gutter.add(vertex);
    }
    const touched = new Set<number>();
    for (const [hit, into] of [
      [hitA, b],
      [hitB, a],
    ] as const) {
      const nearestOn = rule === "surface" ? surfaceOf(positions, into) : null;
      for (const vertex of hit) {
        if (rule === "fold") {
          // keep this corner a clearance on its own side of the plane
          hold(
            vertex,
            CLEARANCE * (process.env.FOLD_GROW === "1" ? round + 1 : 1),
          );
        } else if (nearestOn !== null) {
          const point = [0, 1, 2].map((k) => positions[vertex * 3 + k]);
          const { at, normal, away } = nearestOn(point);
          // Only a corner inside the other surface is moved, half way to a
          // clearance outside it. Carrying an outside corner further out each
          // round, as the one-sided face solver does, makes two continuous
          // sheets chase each other outward here; a triangle whose corners
          // are all outside yet still crosses is left to the retreat rule.
          if (away >= 0) continue;
          for (let k = 0; k < 3; k++)
            positions[vertex * 3 + k] +=
              0.5 * (at[k] + normal[k] * CLEARANCE - positions[vertex * 3 + k]);
        } else
          for (let k = 0; k < 3; k++)
            positions[vertex * 3 + k] -= RETREAT * normals[vertex * 3 + k];
        clamp(vertex);
        touched.add(vertex);
      }
    }
    const pinned = new Set(touched);
    let ring = new Set(touched);
    for (let depth = 0; depth < RINGS; depth++) {
      const next = new Set<number>();
      for (const vertex of ring)
        for (const neighbour of near[vertex])
          if (!touched.has(neighbour)) {
            touched.add(neighbour);
            next.add(neighbour);
          }
      ring = next;
    }
    for (let sweep = 0; sweep < SMOOTHING; sweep++) {
      const before = new Map<number, number[]>();
      for (const vertex of touched)
        before.set(vertex, displacement.get(vertex) ?? [0, 0, 0]);
      for (const vertex of touched) {
        if (pinned.has(vertex)) continue;
        const mean = [0, 0, 0];
        for (const neighbour of near[vertex]) {
          const delta = before.get(neighbour) ??
            displacement.get(neighbour) ?? [0, 0, 0];
          for (let k = 0; k < 3; k++) mean[k] += delta[k];
        }
        const own = before.get(vertex)!;
        for (let k = 0; k < 3; k++)
          positions[vertex * 3 + k] =
            base[vertex * 3 + k] +
            own[k] * (1 - RELAX) +
            (mean[k] / near[vertex].size) * RELAX;
        clamp(vertex);
      }
    }
    // Diffusion can carry a relaxed neighbour back across the fold plane and
    // hand the next round the crossing it just cleared; under the fold rule
    // every touched vertex is held on its own side after each round.
    if (rule === "fold")
      for (const vertex of touched) {
        hold(vertex, CLEARANCE);
        clamp(vertex);
      }
  }
  return { rounds, rules, solved: false };
}
