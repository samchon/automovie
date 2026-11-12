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
    kind: "u" | "v" | "m" | "i";

    /** A `u` anchor on the median line `v = 0`. */
    mid?: boolean;

    /** One of the four anchors the engine takes as its `+u`, `+v`, `-u`, `-v` guides, in that order along the chain. */
    guide?: boolean;

    /** Nesting level of an `m` or `i` anchor, 1 when absent: its neighbours are the nearest anchors of a lower level. */
    level?: number;

    /** Phase window in radians where an observation of this `u` or `v` anchor is sought; generation does not read it. */
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

  /** Unit of every field of a layout, in field order: each anchor's numbers, then one shoulder per arc. */
  export function units(layout: ILayout): Unit[] {
    const out: Unit[] = [];
    for (const anchor of layout.anchors) {
      if (anchor.kind === "m") out.push("share");
      else if (anchor.kind === "i") out.push("share", "angle");
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
      cursor += anchor.kind === "m" || anchor.mid === true ? 1 : 2;
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

  /** The nearest resolved anchors before and after anchor `k`. */
  export function neighbours(k: number, done: readonly (P | null)[]): [number, number] {
    const K: number = done.length;
    let before: number = (k + K - 1) % K;
    while (done[before] === null) before = (before + K - 1) % K;
    let after: number = (k + 1) % K;
    while (done[after] === null) after = (after + 1) % K;
    return [before, after];
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

    // Extremes first: their tangents follow the counter-clockwise travel of the chain.
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
    const rho = (arc: number): number => Math.min(FAIR, clamp(values[shoulders + arc]!));
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

  /** Build the engine's native conic chain from a field vector. */
  export function chain(values: readonly number[], layout: ILayout): AutoMovieViewChain.ISection {
    return AutoMovieViewChain.of(resolve(values, layout).input);
  }
}
