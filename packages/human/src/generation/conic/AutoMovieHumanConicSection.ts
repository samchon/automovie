import { AutoMovieViewChain } from "@automovie/engine";

/**
 * One section of a conic family as a short vector of named shape numbers,
 * read through a layout of anchors.
 *
 * A section is a closed chain of conic arcs through its anchors in
 * increasing phase. Every anchor is a point whose tangent the layout fixes
 * by rule, so no number is spent on a direction that anatomy already gives:
 *
 * - `u`: a point where the section runs parallel to the chart's `v` axis: a
 *   front or back extreme. Its numbers are its `u` and `v`; a `mid` anchor
 *   stands on the median line `v = 0` and has only `u`.
 * - `v`: a point where the section runs parallel to the `u` axis: a side
 *   extreme. Its numbers are its `u` and `v`.
 * - `m`: the median point of the conic triangle its two neighbours span:
 *   `S = M + f (A - M)` on the segment from the chord midpoint `M` to the
 *   meeting `A` of the neighbours' tangent lines, with the tangent parallel to
 *   the chord, as every conic has at its own median point. Its number is `f`.
 *   Its neighbours are the nearest anchors of a lower `level`, so medians
 *   nest: a level 2 median halves an arc a level 1 median already made.
 * - `i`: an inflection between two neighbours whose tangents are parallel.
 *   An S-shaped stretch crosses its own chord once, at the inflection, so
 *   the point is `P0 + t (P2 - P0)` and its tangent is the chord's direction
 *   turned by `d`. Its numbers are `t` and `d`.
 * - `f`: a point on one of the part's feature lines (a tip's ridge, a wing's
 *   top, a groove's floor or the inflection beside it), its tangent free. Each
 *   number is a field along the stations like every other, so the feature line
 *   is a smooth longitudinal control curve, the way an aircraft's lines are
 *   drawn, and a feature that fades away leaves its anchor on a smooth stretch.
 *   Every feature of a run stands on one chord, its frame's (`frame`: the
 *   extremes either side of the run), so the features keep their order round
 *   the section wherever they fade, as an `i` anchor keeps it. Its numbers are
 *   its share of what is left of that chord past the feature before it
 *   (`along`), its offset `o` square to the chord in millimetres outward, and
 *   its tangent's turn `h` from the chord's direction, radians (`place`). Read
 *   as free chart coordinates, f1's nose's six feature lines left that order
 *   at 146 of 157 stations where its alar crease and wing fade; each on the
 *   chord from the feature before it, a tenth of a millimetre at one feature
 *   turned the next one's chord past its arc's own turn and the fit stood
 *   against those walls in both directions.
 *
 * After the anchors come the shoulders, one per arc between consecutive
 * anchors: the conic shoulder `rho = |M S| / |M A|` of the engine's native
 * chain (`AutoMovieViewChain`). A `mirror` layout lists the anchors of the
 * half `v >= 0` from the front median anchor to the back median anchor and
 * reflects them, so a bilateral section spends its numbers once.
 *
 * Shares (`f`, `t`, shoulders) are confined to `[EDGE, 1 - EDGE]` inside the
 * model itself, and shoulders to at most `FAIR`, so an offline fit, the
 * authored numbers and the generated surface read one curve.
 */
export namespace AutoMovieHumanConicSection {
  /** A planar chart point, millimetres. */
  export type P = [number, number];

  /** One anchor of a layout. */
  export interface IAnchor {
    /** The tangent rule, as the namespace describes. */
    kind: "u" | "v" | "m" | "i" | "f";

    /** A `u` anchor on the median line `v = 0`. */
    mid?: boolean;

    /** One of the four anchors the engine takes as its `+u`, `+v`, `-u`, `-v` guides, in that order along the chain. */
    guide?: boolean;

    /** Nesting level of an `m` or `i` anchor, 1 when absent: its neighbours are the nearest anchors of a lower level. */
    level?: number;

    /** The feature line an `f` anchor stands on, for its seed and its record; generation does not read it. */
    feature?: "convex" | "concave" | "inflection";

    /** Phase window in radians where an observation of this `u`, `v` or `f` anchor is sought; generation does not read it. */
    window?: [number, number];

    /** Whether an observation takes the window's largest or smallest coordinate; generation does not read it. */
    pick?: "max" | "min";
  }

  /** The anchors of a section family. */
  export interface ILayout {
    /** Anchors in increasing phase; for a mirror layout the half from phase 0 to pi inclusive. */
    anchors: IAnchor[];

    /** Reflect the listed half in the median line `v = 0`. */
    mirror: boolean;

    /**
     * Least shoulder an arc of this family takes; absent, only the model's edge bound holds. An arc whose shoulder lies far under the
     * ellipse's `sqrt(2) - 1` hugs its chord and turns at its ends, and where two such arcs meet at an extreme the wall turns within a few
     * millimetres: f1's trunk held 0.22 to 0.36 either side of its side extreme over the hips, turned 1.06 degrees a half millimetre there
     * against 0.2 elsewhere, and drew an upright line down each hip. It is a family's own number, not the model's, because other walls
     * (the face's, the leg's) were fitted with lower shoulders where their skin wants them.
     *
     * A list holds one least per arc, in the order of the shoulders (`leastOf`). The bound belongs to the arcs that need it, not to the
     * whole section: f1's foot end was fitted under 0.3 for the two arcs at its top, whose corner drew a slot at the big toe's root, and
     * the same bound held the sole's arc at 0.3 from 896 to 960 mm, where the skin wants a flatter arc, so the wall stood 1.0 to 1.7 mm
     * under the sole and each section fitted alone without it came within 0.4 to 0.85 mm.
     */
    least?: number | readonly number[];
  }

  /** What a field measures: millimetres, a share in (0, 1), or an angle in radians. */
  export type Unit = "mm" | "share" | "angle";

  /** The closed chain of a field vector with the positions of the engine's four guides in it. */
  export interface IChain {
    /** The native chain input: points, tangents and shoulders in increasing phase. */
    input: AutoMovieViewChain.IInput;

    /** Indices of the `+u`, `+v`, `-u`, `-v` guides in the chain. */
    guides: number[];
  }

  /** Bound of every share inside the model: a share at 0 or 1 is a degenerate conic the engine refuses. */
  const EDGE: number = 0.03;

  /**
   * Largest shoulder an arc takes. A shoulder near 1 hugs its two tangent lines and turns at their meeting within a millimetre: f1's trunk
   * fitted the tape's straight run between the thighs with shoulders of 0.91 to 0.96, and those arcs drew a crease up the front of each thigh
   * that no net over the wall could take out. Held at this the wall stays fair, and what it leaves the net carries.
   */
  const FAIR: number = 0.85;

  /** Largest share of the way to a box corner that a guide's touch offset may take. */
  const CORNER: number = 0.92;

  /** The limb layout: four extremes, each quarter halved `depth` times by nested medians (4, 8 or 16 conics). */
  export function limb(depth: number): ILayout {
    let layout: ILayout = { mirror: false, anchors: (["max", "max", "min", "min"] as const).map((pick: "max" | "min", q: number): IAnchor => ({ kind: q % 2 === 0 ? "u" : "v", guide: true, pick })) };
    for (let level: number = 1; level <= depth; ++level) layout = { mirror: false, anchors: layout.anchors.flatMap((anchor: IAnchor): IAnchor[] => [anchor, { kind: "m", level }]) };
    return layout;
  }

  /**
   * The lens layout: a long thin section with its length along the chart's `v`, its two faces' extremes on the median line `v = 0` and
   * its two ends' extremes free, each quarter halved `depth` times by nested medians. A flat face has no one extreme: a free face extreme
   * of a lens 30 mm long and 5 thick wandered from one end of its face to the other between neighbouring stations (the ear's plate), and
   * the engine's chain between such stations was refused. On the median line each face's extreme stands where the course crosses the
   * lens, at one number each, and the lens's two ends, where it turns, carry the free extremes.
   */
  export function lens(depth: number): ILayout {
    let layout: ILayout = {
      mirror: false,
      anchors: [
        { kind: "u", mid: true, guide: true, window: [-Math.PI / 2, Math.PI / 2] },
        { kind: "v", guide: true, pick: "max" },
        { kind: "u", mid: true, guide: true, window: [Math.PI / 2, (3 * Math.PI) / 2] },
        { kind: "v", guide: true, pick: "min" },
      ],
    };
    for (let level: number = 1; level <= depth; ++level) layout = { mirror: false, anchors: layout.anchors.flatMap((anchor: IAnchor): IAnchor[] => [anchor, { kind: "m", level }]) };
    return layout;
  }

  /**
   * The bilateral layout: the front and back extremes on the median line and one side extreme between them, each arc halved `depth` times
   * by nested medians, the half reflected in the median line (4, 8 or 16 conics). A section symmetric about the median plane has its
   * front and back extremes on that plane with their tangents square to it, so those extremes cost one number each and the half the rest;
   * fitted as a limb, such a section spends twice the numbers and its front and back anchors wander off the median line wherever the
   * front is flat, each drawing the crease where two conics meet along the skin.
   */
  export function bilateral(depth: number): ILayout {
    let anchors: IAnchor[] = [
      { kind: "u", mid: true, guide: true, window: [-Math.PI / 2, Math.PI / 2] },
      { kind: "v", guide: true, pick: "max" },
      { kind: "u", mid: true, guide: true, window: [Math.PI / 2, (3 * Math.PI) / 2] },
    ];
    for (let level: number = 1; level <= depth; ++level) anchors = anchors.flatMap((anchor: IAnchor, k: number): IAnchor[] => (k < anchors.length - 1 ? [anchor, { kind: "m", level }] : [anchor]));
    return { mirror: true, anchors };
  }

  /**
   * The limb layout of the given median depth with a groove after each listed anchor: two inflections and the groove's own median between
   * them, `[i, m, i]`, the inflections a level deeper than every median and the groove's median a level deeper again, so each inflection
   * stands on the chord of the anchors round it and the groove's floor on the triangle of its two inflections. Across a family the
   * inflections' shares and turns are fields like every other, so each groove's two inflection lines run along the stations as smooth
   * curves, the way conic lofting draws a concavity with one more control line. On `limb(1)` a groove seeds an admissible chain only after
   * a `u` extreme (anchors 0 and 4).
   *
   * @param depth The limb's median depth.
   * @param after Indices into `limb(depth).anchors` after which a groove stands, each at most once.
   */
  export function inflected(depth: number, after: readonly number[]): ILayout {
    return {
      mirror: false,
      anchors: limb(depth).anchors.flatMap((anchor: IAnchor, k: number): IAnchor[] =>
        after.includes(k) ? [anchor, { kind: "i", level: depth + 1 }, { kind: "m", level: depth + 2 }, { kind: "i", level: depth + 1 }] : [anchor],
      ),
    };
  }

  /** One run of feature anchors inserted after an anchor of a base layout (`featured`). */
  export interface IFeatureRun {
    /** Index in the base layout's anchors after which the run stands. */
    after: number;

    /** The feature anchors (`f`), in increasing phase. */
    anchors: IAnchor[];
  }

  /**
   * A base layout with feature runs inserted after given anchors, and the listed median anchors (`m`) of the base turned into feature
   * anchors (`f`) at the same place in the order. Only the model's own anchor kinds are used.
   *
   * A median stands on the triangle of the nearest anchors already resolved when it is (`neighbours`), which are the feature anchors
   * once any stand in its run, since features resolve before every median (`resolve`); its tangent is then parallel to a different
   * chord (`resolve`: a median's tangent is its neighbours' chord). So a feature inserted beside a median moves that median, and no field
   * vector of the featured layout reproduces the stored section there. Turned into a feature anchor, the old median keeps its own point
   * and tangent, and a stored wall of the base layout converts exactly (`convert`): each inserted feature splits a stored conic arc at
   * an interior point into two conic arcs, which de Casteljau's construction on the rational quadratic's homogeneous controls gives
   * exactly (Farin, Curves and Surfaces for CAGD, rational quadratic Bezier curves).
   *
   * @param base The layout the features go into.
   * @param runs After which anchor of `base` each run of feature anchors stands.
   * @param freed Indices in `base` of median anchors (`m`) turned into feature anchors.
   */
  export function featured(base: ILayout, runs: readonly IFeatureRun[], freed: readonly number[] = []): ILayout {
    // A least per arc names the base's arcs, which the inserted features split; it has no reading on the featured layout.
    if (typeof base.least === "object") throw new Error("featured: a least per arc does not carry over to inserted features");
    for (const k of freed) if (base.anchors[k]?.kind !== "m") throw new Error(`featured: anchor ${k} of the base is not a median`);
    return {
      mirror: base.mirror,
      ...(base.least === undefined ? {} : { least: base.least }),
      anchors: base.anchors.flatMap((anchor: IAnchor, k: number): IAnchor[] => [
        freed.includes(k) ? { kind: "f", feature: "convex" } : anchor,
        ...runs.filter((r: IFeatureRun): boolean => r.after === k).flatMap((r: IFeatureRun): IAnchor[] => r.anchors),
      ]),
    };
  }

  /**
   * The field vector of `featured(base, runs, freed)` that draws the same closed chain as `values` on `base`: every base anchor where it
   * was (a freed median as a feature at its own point and tangent), each run's features on the base arc that follows the anchor they
   * stand after, at equal steps of their projection on their frame's chord between the arc's two ends (so a feature's share along the
   * chord, the number a featured layout stores, is a smooth function of the base's fields), and every shoulder that of its piece of the
   * base arc.
   * A piece `[a, b]` of the rational quadratic with homogeneous controls `(P0, 1), (w P1, w), (P2, 1)` has the blossom controls
   * `B(a, a)`, `B(a, b)`, `B(b, b)`, so its middle weight normalised by its end weights is `W1 / sqrt(W0 W2)` and its shoulder
   * `w / (1 + w)` (the shoulder `rho = |M S| / |M A|` of a conic of middle weight `w`).
   *
   * @param values A section's field vector on `base`.
   * @param base Its layout.
   * @param runs The inserted feature runs (`featured`); a run after anchor `k` lies on the base arc from anchor `k` to `k + 1`.
   * @param freed The base medians turned into features.
   * @returns The field vector on `featured(base, runs, freed)`.
   */
  export function convert(values: readonly number[], base: ILayout, runs: readonly IFeatureRun[], freed: readonly number[] = []): number[] {
    const target: ILayout = featured(base, runs, freed);
    const chain: AutoMovieViewChain.IInput = resolve(values, base).input;
    const K: number = base.anchors.length;
    const arcs: number = base.mirror ? K - 1 : K;
    // The base arc `k` as homogeneous controls: its ends, and the meeting of their tangents weighted by the arc's middle weight.
    const controls = (k: number): { p: [P, P, P]; w: number } => {
      const p0: P = chain.points[k] as P;
      const p2: P = chain.points[(k + 1) % chain.points.length] as P;
      const rho: number = chain.shoulders[k]!;
      return { p: [p0, meet(p0, chain.tangents[k] as P, p2, chain.tangents[(k + 1) % chain.points.length] as P), p2], w: rho / (1 - rho) };
    };
    // The blossom of the arc's homogeneous quadratic at (s, t): a weighted point.
    const blossom = (k: number, s: number, t: number): { x: P; weight: number } => {
      const { p, w } = controls(k);
      const b0: number = (1 - s) * (1 - t), b1: number = ((1 - s) * t + s * (1 - t)) * w, b2: number = s * t;
      const weight: number = b0 + b1 + b2;
      return { x: [(b0 * p[0][0] + b1 * p[1][0] + b2 * p[2][0]) / weight, (b0 * p[0][1] + b1 * p[1][1] + b2 * p[2][1]) / weight], weight };
    };
    // The point and the heading of travel on arc `k` at `t`.
    const at = (k: number, t: number): { point: P; heading: number } => {
      const { p, w } = controls(k);
      const point: P = blossom(k, t, t).x;
      // The derivative of the rational curve: (N' D - N D') / D^2, whose direction is that of N' D - N D'.
      const D: number = (1 - t) ** 2 + 2 * t * (1 - t) * w + t * t;
      const dD: number = -2 * (1 - t) + 2 * (1 - 2 * t) * w + 2 * t;
      const N: P = [(1 - t) ** 2 * p[0][0] + 2 * t * (1 - t) * w * p[1][0] + t * t * p[2][0], (1 - t) ** 2 * p[0][1] + 2 * t * (1 - t) * w * p[1][1] + t * t * p[2][1]];
      const dN: P = [-2 * (1 - t) * p[0][0] + 2 * (1 - 2 * t) * w * p[1][0] + 2 * t * p[2][0], -2 * (1 - t) * p[0][1] + 2 * (1 - 2 * t) * w * p[1][1] + 2 * t * p[2][1]];
      const d: P = [dN[0] * D - N[0] * dD, dN[1] * D - N[1] * dD];
      return { point, heading: Math.atan2(d[1], d[0]) };
    };
    // Each target anchor as a base arc and a rational parameter on it (an end of an arc for a base anchor).
    const placed: { arc: number; t: number }[] = [];
    // The frame chord of a run inserted on base arc `k`: the extremes either side of it in the base (`frame` on the base layout).
    const chordOf = (k: number): [P, P] => {
      const extreme = (j: number): boolean => ["u", "v"].includes(base.anchors[(j + K) % K]!.kind);
      let before: number = k;
      while (!extreme(before)) before = (before + K - 1) % K;
      let after: number = (k + 1) % K;
      while (!extreme(after)) after = (after + 1) % K;
      return [chain.points[before] as P, chain.points[after] as P];
    };
    base.anchors.forEach((_: IAnchor, k: number): void => {
      placed.push({ arc: Math.min(k, arcs - 1), t: k < arcs ? 0 : 1 });
      const n: number = runs.filter((r: IFeatureRun): boolean => r.after === k).reduce((sum: number, r: IFeatureRun): number => sum + r.anchors.length, 0);
      if (n === 0) return;
      const [c0, c1]: [P, P] = chordOf(k);
      const d: P = [c1[0] - c0[0], c1[1] - c0[1]];
      const project = (t: number): number => {
        const q: P = blossom(k, t, t).x;
        return ((q[0] - c0[0]) * d[0] + (q[1] - c0[1]) * d[1]) / (d[0] * d[0] + d[1] * d[1] || 1);
      };
      const [s0, s1]: [number, number] = [project(0), project(1)];
      for (let j: number = 1; j <= n; ++j) {
        const target: number = s0 + ((s1 - s0) * j) / (n + 1);
        let lo: number = 0, hi: number = 1;
        for (let i: number = 0; i < 60; ++i) {
          const mid: number = (lo + hi) / 2;
          if ((project(mid) - target) * Math.sign(s1 - s0) < 0) lo = mid;
          else hi = mid;
        }
        placed.push({ arc: k, t: (lo + hi) / 2 });
      }
    });
    const { at: offset, shoulders }: { at: number[]; shoulders: number } = offsets(target);
    const out: number[] = new Array<number>(units(target).length).fill(0);
    // Points of the target anchors, and each anchor's values.
    const points: P[] = placed.map((q: { arc: number; t: number }): P => at(q.arc, q.t).point);
    let previous: number = 0;
    target.anchors.forEach((anchor: IAnchor, k: number): void => {
      const o: number = offset[k]!;
      if (anchor.kind === "u" || anchor.kind === "v") {
        out[o] = points[k]![0];
        if (anchor.mid !== true) out[o + 1] = points[k]![1];
        return;
      }
      if (anchor.kind === "m") {
        // A median the conversion keeps: its share on its neighbours' triangle, read as `resolve` places it.
        const [before, after]: [number, number] = [k - 1, k + 1];
        const p0: P = points[before]!, p2: P = points[after]!;
        const corner: P = meet(p0, [Math.cos(at(placed[before]!.arc, placed[before]!.t).heading), Math.sin(at(placed[before]!.arc, placed[before]!.t).heading)], p2, [Math.cos(at(placed[after]!.arc, placed[after]!.t).heading), Math.sin(at(placed[after]!.arc, placed[after]!.t).heading)]);
        const middle: P = [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2];
        const span: number = Math.hypot(corner[0] - middle[0], corner[1] - middle[1]) || 1;
        out[o] = ((points[k]![0] - middle[0]) * (corner[0] - middle[0]) + (points[k]![1] - middle[1]) * (corner[1] - middle[1])) / span ** 2;
        return;
      }
      if (anchor.kind !== "f") throw new Error(`convert: anchor kind ${anchor.kind} is not converted`);
      if (k === 0 || target.anchors[k - 1]!.kind !== "f") previous = 0;
      const [before, after]: [number, number] = frame(k, target);
      const read: { values: [number, number, number]; t: number } = unplace(points[before]!, points[after]!, points[k]!, at(placed[k]!.arc, placed[k]!.t).heading, previous);
      out[o] = read.values[0];
      out[o + 1] = read.values[1];
      out[o + 2] = read.values[2];
      previous = read.t;
    });
    // Each target arc is the piece of its base arc between its two ends' parameters.
    const pieces: number = target.mirror ? target.anchors.length - 1 : target.anchors.length;
    for (let j: number = 0; j < pieces; ++j) {
      const a: { arc: number; t: number } = placed[j]!;
      const b: { arc: number; t: number } = placed[(j + 1) % placed.length]!;
      const k: number = a.arc;
      const tb: number = b.arc === k ? b.t : 1;
      const W0: number = blossom(k, a.t, a.t).weight, W1: number = blossom(k, a.t, tb).weight, W2: number = blossom(k, tb, tb).weight;
      const w: number = W1 / Math.sqrt(W0 * W2);
      out[shoulders + j] = w / (1 + w);
    }
    return out;
  }

  /** Unit of every field of a layout, in field order: each anchor's numbers, then one shoulder per arc. */
  export function units(layout: ILayout): Unit[] {
    const out: Unit[] = [];
    for (const anchor of layout.anchors) {
      if (anchor.kind === "m") out.push("share");
      else if (anchor.kind === "i") out.push("share", "angle");
      else if (anchor.kind === "f") out.push("share", "mm", "angle");
      else if (anchor.mid === true) out.push("mm");
      else out.push("mm", "mm");
    }
    const arcs: number = layout.mirror ? layout.anchors.length - 1 : layout.anchors.length;
    for (let k: number = 0; k < arcs; ++k) out.push("share");
    return out;
  }

  /** Offsets of every anchor's first field, and the offset of the first shoulder. */
  export function offsets(layout: ILayout): { at: number[]; shoulders: number } {
    const at: number[] = [];
    let cursor: number = 0;
    for (const anchor of layout.anchors) {
      at.push(cursor);
      cursor += anchor.kind === "m" || anchor.mid === true ? 1 : anchor.kind === "f" ? 3 : 2;
    }
    return { at, shoulders: cursor };
  }

  /** Dependent anchors (`m`, `i`) by increasing level, the order they are resolved in. */
  export function dependents(layout: ILayout): number[] {
    return layout.anchors
      .map((_: IAnchor, k: number): number => k)
      .filter((k: number): boolean => layout.anchors[k]!.kind === "m" || layout.anchors[k]!.kind === "i")
      .sort((a: number, b: number): number => (layout.anchors[a]!.level ?? 1) - (layout.anchors[b]!.level ?? 1));
  }

  /**
   * The two extremes a feature anchor `k` stands between: the nearest `u` or `v` anchor before it and the nearest after it, in the
   * layout's order (round the end of the list for a closed layout). Every feature of a run shares this frame and its chord.
   */
  export function frame(k: number, layout: ILayout): [number, number] {
    const K: number = layout.anchors.length;
    const extreme = (j: number): boolean => ["u", "v"].includes(layout.anchors[j]!.kind);
    let before: number = (k + K - 1) % K;
    while (!extreme(before)) before = (before + K - 1) % K;
    let after: number = (k + 1) % K;
    while (!extreme(after)) after = (after + 1) % K;
    return [before, after];
  }

  /**
   * Where along its frame's chord a feature anchor stands: the feature before it in the run at `previous` (0 at the run's first), its
   * own share `share` of what is left of the chord after that. Each feature then stands past the one before it by construction.
   */
  export function along(previous: number, share: number): number {
    return previous + (1 - previous) * clamp(share);
  }

  /**
   * A feature point on the chord from `p0` to `p2`: at `t` of the way along it, the offset `o` square to it, millimetres outward (to the
   * right of travel, which is outward on a counter-clockwise section), and its tangent the chord's direction turned by `h` radians.
   */
  export function place(p0: P, p2: P, t: number, o: number, h: number): { point: P; tangent: P } {
    const d: P = [p2[0] - p0[0], p2[1] - p0[1]];
    const length: number = Math.hypot(d[0], d[1]) || 1;
    const angle: number = Math.atan2(d[1], d[0]) + h;
    return { point: [p0[0] + t * d[0] + (o * d[1]) / length, p0[1] + t * d[1] - (o * d[0]) / length], tangent: [Math.cos(angle), Math.sin(angle)] };
  }

  /**
   * The numbers `[share, o, h]` of a feature point `p` with the tangent heading `heading` on the chord from `p0` to `p2`, the feature
   * before it in the run at `previous` of the way along (`along`, `place`), and how far along the chord `p` itself stands.
   */
  export function unplace(p0: P, p2: P, p: P, heading: number, previous: number): { values: [number, number, number]; t: number } {
    const d: P = [p2[0] - p0[0], p2[1] - p0[1]];
    const square: number = d[0] * d[0] + d[1] * d[1] || 1;
    const q: P = [p[0] - p0[0], p[1] - p0[1]];
    const h: number = heading - Math.atan2(d[1], d[0]);
    const t: number = (q[0] * d[0] + q[1] * d[1]) / square;
    return { values: [(t - previous) / Math.max(1e-9, 1 - previous), (q[0] * d[1] - q[1] * d[0]) / Math.sqrt(square), Math.atan2(Math.sin(h), Math.cos(h))], t };
  }
  /** The nearest resolved anchors before and after anchor `k`. */
  export function neighbours(k: number, done: readonly (P | null)[]): [number, number] {
    const K: number = done.length;
    let before: number = (k + K - 1) % K;
    while (done[before] === null) before = (before + K - 1) % K;
    let after: number = (k + 1) % K;
    while (done[after] === null) after = (after + 1) % K;
    return [before, after];
  }

  /**
   * A stored shoulder as the model reads it: inside `[EDGE, FAIR]`, and at least the layout's `least`. A fit may store a shoulder past those
   * bounds where it changes nothing at the fitted sections; between the knots the field's natural cubic then crosses a bound and the arc
   * holds still there while its neighbours move, which draws a level line across the wall.
   *
   * @param value The stored shoulder.
   * @param layout The layout it belongs to.
   * @param arc The arc's index among the shoulders, which selects its least when the layout lists one per arc.
   */
  export function shoulder(value: number, layout: ILayout, arc: number = 0): number {
    return Math.min(FAIR, Math.max(leastOf(layout, arc) ?? 0, clamp(value)));
  }

  /**
   * The least shoulder of one arc of a layout (`ILayout.least`): the layout's one number, or that arc's entry of its list; undefined
   * where the layout sets none.
   *
   * @param layout The layout.
   * @param arc The arc's index among the shoulders.
   */
  export function leastOf(layout: ILayout, arc: number): number | undefined {
    if (layout.least === undefined || typeof layout.least === "number") return layout.least;
    const own: number | undefined = layout.least[arc];
    if (own === undefined) throw new Error(`leastOf: the layout lists ${layout.least.length} least shoulders and has no arc ${arc}`);
    return own;
  }

  /** Confine a share to the model's bounds. */
  export function clamp(share: number): number {
    return Math.min(1 - EDGE, Math.max(EDGE, share));
  }

  /** Meeting point of two tangent lines; the chord midpoint when they are parallel. */
  export function meet(p0: P, t0: P, p2: P, t2: P): P {
    const den: number = t0[0] * t2[1] - t0[1] * t2[0];
    if (den === 0) return [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2];
    const a: number = ((p2[0] - p0[0]) * t2[1] - (p2[1] - p0[1]) * t2[0]) / den;
    return [p0[0] + a * t0[0], p0[1] + a * t0[1]];
  }

  /** Resolve a field vector into its closed chain. */
  export function resolve(values: readonly number[], layout: ILayout): IChain {
    const K: number = layout.anchors.length;
    const points: (P | null)[] = new Array<P | null>(K).fill(null);
    const tangents: (P | null)[] = new Array<P | null>(K).fill(null);
    const { at, shoulders }: { at: number[]; shoulders: number } = offsets(layout);

    // Extremes first: an extreme's tangent follows the counter-clockwise travel of the chain.
    layout.anchors.forEach((anchor: IAnchor, k: number): void => {
      if (anchor.kind !== "u" && anchor.kind !== "v") return;
      const p: P = anchor.mid === true ? [values[at[k]!]!, 0] : [values[at[k]!]!, values[at[k]! + 1]!];
      points[k] = p;
      tangents[k] = anchor.kind === "u" ? [0, p[0] > 0 ? 1 : -1] : [p[1] > 0 ? -1 : 1, 0];
    });

    // A guide that reaches its box's corner leaves its arc no first leg. Where one point of a section is both its forward
    // and its side extreme (a section standing like a diamond in its chart) the touch offset would do exactly that, so each
    // guide is held inside the share CORNER of the way to the corners its two neighbouring guides set.
    const boxed: number[] = layout.anchors.map((_: IAnchor, k: number): number => k).filter((k: number): boolean => layout.anchors[k]!.guide === true);
    if (!layout.mirror && boxed.length === 4)
      boxed.forEach((k: number, q: number): void => {
        const across: 0 | 1 = q % 2 === 0 ? 1 : 0;
        const a: number = points[boxed[(q + 1) % 4]!]![across];
        const b: number = points[boxed[(q + 3) % 4]!]![across];
        const p: P = points[k]!;
        p[across] = Math.min(CORNER * Math.max(a, b), Math.max(CORNER * Math.min(a, b), p[across]));
      });

    // Then the feature points in order, each on the chord of its frame (`frame`: the extremes either side of its run), past the feature
    // before it in the run (`along`).
    let previous: number = 0;
    layout.anchors.forEach((anchor: IAnchor, k: number): void => {
      if (anchor.kind !== "f") return;
      if (k === 0 || layout.anchors[k - 1]!.kind !== "f") previous = 0;
      const [before, after]: [number, number] = frame(k, layout);
      previous = along(previous, values[at[k]!]!);
      const placed: { point: P; tangent: P } = place(points[before]!, points[after]!, previous, values[at[k]! + 1]!, values[at[k]! + 2]!);
      points[k] = placed.point;
      tangents[k] = placed.tangent;
    });

    // Then the anchors that stand on their neighbours' triangle or chord, lower levels first.
    for (const k of dependents(layout)) {
      const [before, after]: [number, number] = neighbours(k, points);
      const p0: P = points[before]!;
      const p2: P = points[after]!;
      const share: number = clamp(values[at[k]!]!);
      if (layout.anchors[k]!.kind === "i") {
        const angle: number = Math.atan2(p2[1] - p0[1], p2[0] - p0[0]) + values[at[k]! + 1]!;
        points[k] = [p0[0] + share * (p2[0] - p0[0]), p0[1] + share * (p2[1] - p0[1])];
        tangents[k] = [Math.cos(angle), Math.sin(angle)];
        continue;
      }
      const corner: P = meet(p0, tangents[before]!, p2, tangents[after]!);
      const middle: P = [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2];
      points[k] = [middle[0] + share * (corner[0] - middle[0]), middle[1] + share * (corner[1] - middle[1])];
      tangents[k] = [p2[0] - p0[0], p2[1] - p0[1]];
    }
    const input: AutoMovieViewChain.IInput = { points: [], tangents: [], shoulders: [] };
    const guides: number[] = [];
    const rho = (arc: number): number => shoulder(values[shoulders + arc]!, layout, arc);
    for (let k: number = 0; k < K; ++k) {
      if (layout.anchors[k]!.guide === true) guides.push(input.points.length);
      input.points.push(points[k]!);
      input.tangents.push(tangents[k]!);
      input.shoulders.push(rho(layout.mirror && k === K - 1 ? K - 2 : k));
    }
    if (layout.mirror)
      for (let k: number = K - 2; k >= 1; --k) {
        if (layout.anchors[k]!.kind === "v" && layout.anchors[k]!.guide === true) guides.push(input.points.length);
        input.points.push([points[k]![0], -points[k]![1]]);
        input.tangents.push([-tangents[k]![0], tangents[k]![1]]);
        input.shoulders.push(rho(k - 1));
      }
    return { input, guides };
  }

  /**
   * The field vector with the shoulders of the two arcs that meet at anchor `k` set so the section's curvature is continuous there, each
   * arc keeping its triangle (its two end points and the meeting of their tangents).
   *
   * Two conics that meet at an anchor share its tangent but not its curvature, and where one arc ends nearly flat and the next starts sharply
   * bent the wall turns within a few millimetres along the anchor's whole station line: f1's trunk over the hips met at its first median with
   * curvatures of 1.2 and 308 per metre and drew an upright line down each hip. For a rational quadratic with end weights 1 and middle
   * weight `w = rho / (1 - rho)` the curvature at an end is `|(P1 - P0) x (P2 - P1)| / (w^2 |leg|^3)`, the leg the side of the triangle at
   * that end (Farin, rational quadratic Bezier curves; Pottmann, curvature continuous conic splines). Both curvatures are brought to their
   * geometric mean, so each arc's weight moves by the same factor; the shoulders stay within the model's bounds, where the joint is as near
   * G2 as they allow. Merged into one conic instead (both halves of one arc split at its shoulder), the hip's shape moved further.
   *
   * @param values The section's field vector.
   * @param layout Its layout, not a mirror's last anchor: `k` must have an arc on either side in the listed anchors.
   * @param k The anchor.
   */
  export function continuous(values: readonly number[], layout: ILayout, k: number): number[] {
    const chain: AutoMovieViewChain.IInput = resolve(values, layout).input;
    const triangle = (a: number): [P, P, P] => {
      const p0: P = chain.points[a] as P;
      const p2: P = chain.points[a + 1] as P;
      return [p0, meet(p0, chain.tangents[a] as P, p2, chain.tangents[a + 1] as P), p2];
    };
    const turn = ([p0, p1, p2]: [P, P, P], leg: number): number => Math.abs((p1[0] - p0[0]) * (p2[1] - p1[1]) - (p1[1] - p0[1]) * (p2[0] - p1[0])) / leg ** 3;
    const [b0, b1, b2]: [P, P, P] = triangle(k - 1);
    const [a0, a1, a2]: [P, P, P] = triangle(k);
    const before: number = turn([b0, b1, b2], Math.hypot(b2[0] - b1[0], b2[1] - b1[1]));
    const after: number = turn([a0, a1, a2], Math.hypot(a1[0] - a0[0], a1[1] - a0[1]));
    const weight = (rho: number): number => rho / (1 - rho);
    const target: number = Math.sqrt((before / weight(chain.shoulders[k - 1]!) ** 2) * (after / weight(chain.shoulders[k]!) ** 2));
    const shoulder = (factor: number, arc: number): number => {
      const w: number = Math.sqrt(factor / target);
      return Math.min(FAIR, Math.max(leastOf(layout, arc) ?? EDGE, w / (1 + w)));
    };
    const out: number[] = [...values];
    const { shoulders }: { shoulders: number } = offsets(layout);
    out[shoulders + k - 1] = shoulder(before, k - 1);
    out[shoulders + k] = shoulder(after, k);
    return out;
  }

  /** Build the engine's native conic chain from a field vector. */
  export function chain(values: readonly number[], layout: ILayout): AutoMovieViewChain.ISection {
    return AutoMovieViewChain.of(resolve(values, layout).input);
  }
}
