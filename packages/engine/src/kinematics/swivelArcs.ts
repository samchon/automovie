import type { IAutoMovieSwivelArcs } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";

/**
 * Sinusoids of a swivel and the arcs of swivels where they lie above a
 * margin. Whatever is turned about a fixed axis by a swivel `ψ` reads, in any
 * fixed linear measure, `a + b cos ψ + c sin ψ` (Rodrigues' formula): an
 * entry of the rotation, a coordinate of a point it carries. Such a sinusoid
 * is fitted exactly from its values at 0, 90 and 180 degrees, it exceeds a
 * margin on the one arc between its two arccos roots, and a union of such
 * arcs over one turn says which swivels some condition refuses.
 * `boxExcludedSwivels` reads a joint box's bounds this way, and a caller
 * bounding a point carried by the swivel (an elbow on its circle) reads its
 * half-planes the same way.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States why each reading is a sinusoid, how one is fitted, where it exceeds a margin and what a union of arcs answers.
 * @evidence contracts/development/design.md#principled-representation A sinusoid is its three coefficients and an arc its two ends, degrees; a union is disjoint arcs over a turn and the one after it, or every swivel.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two records and the fit, the two combinations, the arc of one sinusoid, the union and its two readings: what `boxExcludedSwivels` and a point's bound share.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Exact roots, never sampling; the margin is the caller's.
 */
export namespace swivelArcs {
  /**
   * The sinusoid through its values at swivels 0, 90 and 180 degrees.
   *
   * @param zero Its value at 0.
   * @param quarter Its value at 90.
   * @param half Its value at 180.
   * @returns The sinusoid.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three samples and the result.
   * @evidence contracts/development/implementation.md#principled-implementation `a + b` at 0, `a + c` at 90 and `a - b` at 180 solve exactly for the three coefficients.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three expressions.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exact for any reading of a rotation turned about a fixed axis.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The one fit of a joint box's entries and of a point's bounds.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result.
   * @evidence contracts/development/implementation.md#principled-implementation Sinusoids of one swivel are a vector space.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by every bound.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result.
   * @evidence contracts/development/implementation.md#principled-implementation Sinusoids of one swivel are a vector space.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by every bound.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
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
   * @returns The arc between its roots, degrees; every swivel when its least exceeds the margin; none when its greatest does not.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three cases.
   * @evidence contracts/development/implementation.md#principled-implementation `a + R cos(ψ - ψ₀)` with `R = hypot(b, c)` and `ψ₀ = atan2(c, b)` exceeds the margin within `acos((margin - a) / R)` of `ψ₀`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two tests and one arc.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The roots are exact.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by every bound.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
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
   * Arcs merged into disjoint intervals covering one full turn from 0 and the
   * one after it, so an interval starting in [0, 360) lies in the union
   * exactly when one merged interval holds it.
   *
   * @param arcs The arcs, degrees, any turn.
   * @returns The merged intervals in order, or every swivel when they cover a turn.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the cover and the "every swivel" case.
   * @evidence contracts/development/implementation.md#principled-implementation Each arc taken into its turn and copied a turn either way, then sorted and merged, so an arc across 0 or 360 is whole.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Copy, sort, merge.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three pieces an arc, one sort.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Built once per fit and read by every test of it.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh list.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the test.
   * @evidence contracts/development/implementation.md#principled-implementation The interval taken into the turn `union` covers twice.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scan.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the few merged intervals.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by every test of one union.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
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
   * @returns The swivel itself when outside, else the nearer end of the merged interval holding it, degrees in that interval's turn; null when the union is every swivel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three results.
   * @evidence contracts/development/implementation.md#principled-implementation Merged intervals are disjoint, so a swivel inside one leaves the union first at one of its two ends.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and one comparison.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The end is the exact root.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the few merged intervals.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads `union`'s cover.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
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
}
