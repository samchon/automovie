import type { IAutoMovieSwivelArcs } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";

/**
 * Sinusoids of a swivel and the arcs of swivels where they lie above a margin.
 * Whatever is turned about a fixed axis by a swivel `ψ` reads, in any fixed
 * linear measure, `a + b cos ψ + c sin ψ` (Rodrigues' formula): an entry of the
 * rotation, a coordinate of a point it carries. Such a sinusoid is fitted
 * exactly from its values at 0, 90 and 180 degrees, it exceeds a margin on the
 * one arc between its two arccos roots, and a union of such arcs over one turn
 * says which swivels some condition refuses. `boxExcludedSwivels` reads a joint
 * box's bounds this way, and a caller bounding a point carried by the swivel
 * (an elbow on its circle) reads its half-planes the same way.
 */
export namespace swivelArcs {
  /**
   * The sinusoid through its values at swivels 0, 90 and 180 degrees.
   *
   * @param zero Its value at 0.
   * @param quarter Its value at 90.
   * @param half Its value at 180.
   * @returns The sinusoid.
   */
  export function fitted(
    zero: number,
    quarter: number,
    half: number,
  ): IAutoMovieSwivelArcs.ISinusoid {
    const a: number = (zero + half) / 2;
    return { a, b: (zero - half) / 2, c: quarter - a };
  }

  /**
   * A sinusoid times a number.
   *
   * @param f The sinusoid.
   * @param by The factor.
   * @returns `by · f`.
   */
  export function scaled(
    f: IAutoMovieSwivelArcs.ISinusoid,
    by: number,
  ): IAutoMovieSwivelArcs.ISinusoid {
    return { a: f.a * by, b: f.b * by, c: f.c * by };
  }

  /**
   * Two sinusoids combined.
   *
   * @param f The first.
   * @param u Its factor.
   * @param g The second.
   * @param v Its factor.
   * @returns `u·f + v·g`.
   */
  export function combined(
    f: IAutoMovieSwivelArcs.ISinusoid,
    u: number,
    g: IAutoMovieSwivelArcs.ISinusoid,
    v: number,
  ): IAutoMovieSwivelArcs.ISinusoid {
    return { a: u * f.a + v * g.a, b: u * f.b + v * g.b, c: u * f.c + v * g.c };
  }

  /**
   * The swivels where a sinusoid exceeds a margin.
   *
   * @param f The sinusoid.
   * @param margin The margin.
   * @returns The arc between its roots, degrees; every swivel when its least
   *   exceeds the margin; none when its greatest does not.
   */
  export function above(
    f: IAutoMovieSwivelArcs.ISinusoid,
    margin: number,
  ): IAutoMovieSwivelArcs.IArc | "all" | null {
    const radius: number = Math.hypot(f.b, f.c);
    if (f.a - radius > margin) return "all";
    if (f.a + radius <= margin) return null;
    const centre: number = Math.atan2(f.c, f.b) / Quaternion.DEG2RAD;
    const half: number =
      Math.acos((margin - f.a) / radius) / Quaternion.DEG2RAD;
    return { from: centre - half, to: centre + half };
  }

  /**
   * The swivel at which a sinusoid is least: `a + R cos(ψ - φ)`, with `R =
   * hypot(b, c)` and `φ = atan2(c, b)`, is least at `φ + 180`.
   *
   * @param f The sinusoid.
   * @returns Degrees in (-180, 180]; null for a constant.
   */
  export function least(f: IAutoMovieSwivelArcs.ISinusoid): number | null {
    return f.b === 0 && f.c === 0
      ? null
      : Math.atan2(-f.c, -f.b) / Quaternion.DEG2RAD;
  }

  /**
   * A sinusoid's least value over the swivels from `low` to `high` degrees: the
   * lesser of its two ends, or its trough `a - R` where the interval holds the
   * swivel of it (`least`).
   *
   * @param f The sinusoid.
   * @param low The interval's start, degrees.
   * @param high Its end, degrees, at least `low`.
   * @returns The least value.
   */
  export function lowest(
    f: IAutoMovieSwivelArcs.ISinusoid,
    low: number,
    high: number,
  ): number {
    const trough: number | null = least(f);
    if (
      trough === null ||
      high - low >= 360 ||
      trough + 360 * Math.ceil((low - trough) / 360) <= high
    )
      return trough === null ? f.a : f.a - Math.hypot(f.b, f.c);
    const at = (degrees: number): number =>
      f.a +
      f.b * Math.cos(degrees * Quaternion.DEG2RAD) +
      f.c * Math.sin(degrees * Quaternion.DEG2RAD);
    return Math.min(at(low), at(high));
  }

  /**
   * The swivels where a sinusoid vanishes.
   *
   * @param f The sinusoid.
   * @returns Its roots, degrees in [0, 360): two, one where they meet, or none
   *   when it keeps one sign or is constant.
   */
  export function roots(f: IAutoMovieSwivelArcs.ISinusoid): number[] {
    const radius: number = Math.hypot(f.b, f.c);
    if (!(radius > 0) || Math.abs(f.a) > radius) return [];
    const centre: number = Math.atan2(f.c, f.b) / Quaternion.DEG2RAD;
    const half: number = Math.acos(-f.a / radius) / Quaternion.DEG2RAD;
    const turn = (angle: number): number =>
      angle - 360 * Math.floor(angle / 360);
    return half === 0 || half === 180
      ? [turn(centre + half)]
      : [turn(centre - half), turn(centre + half)];
  }

  /**
   * Arcs merged into disjoint intervals covering one full turn from 0 and the
   * one after it, so an interval starting in [0, 360) lies in the union exactly
   * when one merged interval holds it.
   *
   * @param arcs The arcs, degrees, any turn.
   * @returns The merged intervals in order, or every swivel when they cover a
   *   turn.
   */
  export function union(
    arcs: readonly IAutoMovieSwivelArcs.IArc[],
  ): IAutoMovieSwivelArcs.IArc[] | "all" {
    const pieces: IAutoMovieSwivelArcs.IArc[] = [];
    for (const arc of arcs) {
      const from: number = arc.from - 360 * Math.floor(arc.from / 360);
      for (const turn of [-360, 0, 360])
        pieces.push({
          from: from + turn,
          to: from + (arc.to - arc.from) + turn,
        });
    }
    pieces.sort(
      (x: IAutoMovieSwivelArcs.IArc, y: IAutoMovieSwivelArcs.IArc): number =>
        x.from - y.from,
    );
    const out: IAutoMovieSwivelArcs.IArc[] = [];
    for (const piece of pieces) {
      const last: IAutoMovieSwivelArcs.IArc | undefined = out[out.length - 1];
      if (last !== undefined && piece.from <= last.to)
        last.to = Math.max(last.to, piece.to);
      else out.push({ ...piece });
    }
    if (
      out.some(
        (arc: IAutoMovieSwivelArcs.IArc): boolean =>
          arc.from <= 0 && arc.to >= 360,
      )
    )
      return "all";
    return out;
  }

  /**
   * Whether every swivel from `low` to `high` degrees lies in a union.
   *
   * @param merged The union (`union`).
   * @param low The interval's start, degrees.
   * @param high Its end, degrees, at most a turn after `low`.
   * @returns Whether one merged interval holds it.
   */
  export function covers(
    merged: readonly IAutoMovieSwivelArcs.IArc[] | "all",
    low: number,
    high: number,
  ): boolean {
    if (merged === "all") return true;
    const turns: number = 360 * Math.floor(low / 360);
    return merged.some(
      (arc: IAutoMovieSwivelArcs.IArc): boolean =>
        arc.from <= low - turns && arc.to >= high - turns,
    );
  }

  /**
   * The swivel nearest a given one that lies outside a union.
   *
   * @param merged The union (`union`).
   * @param swivel The swivel, degrees.
   * @returns The swivel itself when outside, else the nearer end of the merged
   *   interval holding it, degrees in that interval's turn; null when the union
   *   is every swivel.
   */
  export function nearest(
    merged: readonly IAutoMovieSwivelArcs.IArc[] | "all",
    swivel: number,
  ): number | null {
    if (merged === "all") return null;
    const at: number = swivel - 360 * Math.floor(swivel / 360);
    const holding: IAutoMovieSwivelArcs.IArc | undefined = merged.find(
      (arc: IAutoMovieSwivelArcs.IArc): boolean =>
        arc.from <= at && at <= arc.to,
    );
    if (holding === undefined) return swivel;
    return at - holding.from <= holding.to - at ? holding.from : holding.to;
  }

  /**
   * The swivels outside a union: the gaps between its merged arcs over one turn
   * from 0, a gap across 360 kept whole.
   *
   * @param merged The union (`union`), or every swivel.
   * @returns The disjoint arcs outside it, degrees, each starting in [0, 360);
   *   every swivel as one turn from 0 when the union is empty; none when it is
   *   every swivel.
   */
  export function complement(
    merged: readonly IAutoMovieSwivelArcs.IArc[] | "all",
  ): IAutoMovieSwivelArcs.IArc[] {
    if (merged === "all") return [];
    // The union's arcs that meet the turn [0, 360], clipped to it, in order.
    const inside: IAutoMovieSwivelArcs.IArc[] = merged
      .filter(
        (arc: IAutoMovieSwivelArcs.IArc): boolean =>
          arc.to > 0 && arc.from < 360,
      )
      .map(
        (arc: IAutoMovieSwivelArcs.IArc): IAutoMovieSwivelArcs.IArc => ({
          from: Math.max(0, arc.from),
          to: Math.min(360, arc.to),
        }),
      );
    if (inside.length === 0) return [{ from: 0, to: 360 }];
    const gaps: IAutoMovieSwivelArcs.IArc[] = [];
    for (let i: number = 0; i + 1 < inside.length; ++i)
      if (inside[i]!.to < inside[i + 1]!.from)
        gaps.push({ from: inside[i]!.to, to: inside[i + 1]!.from });
    // The gap across 360: from the last arc's end to the first's start a
    // turn later.
    const first: IAutoMovieSwivelArcs.IArc = inside[0]!;
    const last: IAutoMovieSwivelArcs.IArc = inside[inside.length - 1]!;
    if (last.to < first.from + 360)
      gaps.push({ from: last.to, to: first.from + 360 });
    return gaps.map(
      (gap: IAutoMovieSwivelArcs.IArc): IAutoMovieSwivelArcs.IArc =>
        gap.from >= 360 ? { from: gap.from - 360, to: gap.to - 360 } : gap,
    );
  }

  /**
   * The arc of a list that holds a swivel, taken in the swivel's own turn.
   *
   * @param arcs Disjoint arcs, degrees, any turn.
   * @param swivel The swivel, degrees.
   * @returns The arc holding it, shifted by whole turns to the swivel's; none
   *   when no arc holds it.
   */
  export function holding(
    arcs: readonly IAutoMovieSwivelArcs.IArc[],
    swivel: number,
  ): IAutoMovieSwivelArcs.IArc | null {
    for (const arc of arcs) {
      const shift: number = 360 * Math.floor((swivel - arc.from) / 360);
      if (swivel - shift <= arc.to)
        return { from: arc.from + shift, to: arc.to + shift };
    }
    return null;
  }
}
