import { AutoMovieSeamStation } from "./AutoMovieSeamStation";
import { AutoMovieStationHermite } from "./AutoMovieStationHermite";
import { AutoMovieViewConic } from "./AutoMovieViewConic";

/**
 * Candidate function-valued station interpolation of native polar sections.
 *
 * A natural spline is linear in its ordinate data. Applying its cardinal
 * weights to Q_i(t) = rho_i(t) [cos(t), sin(t)] therefore retains each native
 * principal section without projecting it into a finite Cartesian cubic.
 * The same weights apply to both analytic phase derivatives. Finite periodic
 * C2 source functions and regular frames give a C2 regular chart; neither
 * convexity between layers, continuous original-view reproduction, nor a
 * singular pole's geometric regularity follows from this construction.
 * This candidate is deliberately disconnected from the production chain.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the candidate boundary, coordinate units, principal-only preservation and regularity limitations.
 * @evidence contracts/development/design.md#principled-representation Represents Candidate function-valued station interpolation of native polar sections: companion namespace of 6 members (`ISource`, `IStation`, `prepare`, `station`, `point`, `jet`); units and frames named in its text: radians, radian, second, local, world. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieLoftPhaseSource` in packages/engine/src/geometry/construction/AutoMovieLoftPhaseSource.ts; its surface is the 6 members listed and the text shows 2 other files naming it, mostly test (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, a use of `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.
 */
export namespace AutoMovieLoftPhaseSource {
  /**
   * Explicit native functions and their natural-coordinate cardinal jets.
   *
   * @evidence contracts/development/design.md#principled-representation Native curve records own geometry while cardinal derivative tables depend only on increasing interpolation coordinates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Coordinates, native curves and two derivative tables completely describe the candidate without identity registration.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Equal-value structured/JSON copies preserve geometry; inputs and prepared records must remain immutable after preparation.
   * @evidence contracts/development/common.md#meaningful-documentation Each field states its coordinate, physical length or derivative meaning.
   */
  export interface ISource {
    /** Increasing coordinates q: station mm, signed sqrt(mm), or radians as chosen by the caller. */
    coordinates: readonly number[];

    /** Native sections in the same order, with millimetre radii and polar-radian phase. */
    curves: readonly AutoMovieViewConic.ICurve[];

    /** Cardinal first derivatives in q at every source coordinate. */
    slopes: readonly (readonly number[])[];

    /** Cardinal second derivatives in q at the same coordinates. */
    curvatures: readonly (readonly number[])[];
  }

  /**
   * One station's explicit linear combinations of native source functions.
   *
   * @evidence contracts/development/design.md#principled-representation Three weight rows evaluate value and first/second chosen-coordinate derivatives of the same interpolant.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One source reference and three numeric rows separate reusable station preparation from phase evaluation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A supplied finite change of coordinate reexpresses both derivative orders; no finite singular-pole derivative is fabricated.
   * @evidence contracts/development/common.md#meaningful-documentation Rows specify derivative order and source/physical-coordinate units.
   */
  export interface IStation {
    /** Explicit immutable native source. */
    source: ISource;

    /** Value, first and second derivative weights, in q unless station supplied a physical change of coordinate. */
    weights: readonly (readonly number[])[];
  }

  /**
   * Prepare a natural-coordinate operator without fitting any phase samples.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Solves the existing natural spline for identity ordinate columns, producing its exact linear cardinal operator up to binary64 arithmetic.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One explicit failure string precedes preparation; successful output keeps native data separate from numeric interpolation tables.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Rejects malformed coordinate/source data and nonfinite tables rather than selecting a spline fallback or a substitute curve.
   * @evidence contracts/development/common.md#meaningful-documentation Coordinates need at least two finite increasing values; curve radii use one millimetre unit and returned native records are borrowed immutably.
   * @evidence contracts/development/implementation.md#efficient-algorithms L identity columns require O(L squared) time and retained derivative storage through the existing O(LW) natural solver; temporary identity storage has the same order.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One curvature table feeds the slope solve and every subsequent station preparation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns copied coordinates, a copied curve-reference list and two owned derivative tables; temporary identity rows die with the call.
   */
  export function prepare(
    coordinates: readonly number[],
    curves: readonly AutoMovieViewConic.ICurve[],
  ): ISource | string {
    const n: number = coordinates.length;
    if (
      n < 2 ||
      curves.length !== n ||
      !coordinates.every(
        (value: number, i: number): boolean =>
          Number.isFinite(value) &&
          (i === 0 ||
            (value > coordinates[i - 1]! &&
              Number.isFinite(value - coordinates[i - 1]!))),
      )
    )
      return "native phase source needs matching curves and at least two finite increasing coordinates";
    for (const curve of curves) {
      if (curve.failure !== null || curve.quarters.length !== 4)
        return `native phase source is not admitted: ${curve.failure ?? "four quarters required"}`;
      if (
        !curve.quarters.every(
          (quarter: AutoMovieViewConic.IQuarter): boolean =>
            quarter.extents.every(
              (value: number): boolean => Number.isFinite(value) && value > 0,
            ) &&
            Number.isFinite(quarter.shoulder) &&
            quarter.shoulder > 0 &&
            quarter.shoulder < 1 &&
            quarter.guides.every(Number.isFinite),
        )
      )
        return "native phase source has malformed quarter data";
    }
    const identity: number[][] = coordinates.map(
      (_: number, i: number): number[] =>
        Array.from({ length: n }, (_unused: unknown, j: number): number =>
          i === j ? 1 : 0,
        ),
    );
    const curvatures: number[][] = AutoMovieSeamStation.curvatures(
      coordinates,
      identity,
    );
    const slopes: number[][] = AutoMovieSeamStation.slopes(
      coordinates,
      identity,
      curvatures,
    );
    if (
      ![...curvatures, ...slopes].every((row: number[]): boolean =>
        row.every(Number.isFinite),
      )
    )
      return "native phase source cardinal jets are not finitely representable";
    return {
      coordinates: [...coordinates],
      curves: [...curves],
      slopes,
      curvatures,
    };
  }

  /**
   * Prepare weights at q, optionally reexpressed by [dq/ds, d2q/ds2].
   *
   * @evidence contracts/development/implementation.md#principled-implementation Brackets the same source coordinates and applies the existing quintic Hermite rule to cardinal endpoint values/derivatives; these endpoint jets reproduce the natural cubic.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Binary bracketing and one optional two-order chain rule return three ordinary linear-combination rows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Outside/nonfinite q or coordinate changes throw without clamping or a legacy fallback; singular physical changes must be withheld by their owner.
   * @evidence contracts/development/common.md#meaningful-documentation q uses the prepared coordinate unit; omitted change returns q derivatives and supplied finite change returns physical station derivatives per mm.
   * @evidence contracts/development/implementation.md#efficient-algorithms Binary bracketing plus three L-component Hermite combinations cost O(log L plus L) time and O(L) output.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Returned weights are reusable across phases and both point/jet readers without another solve.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns three rows and borrows source; endpoint identity rows and raw parameter weights are call-local.
   */
  export function station(
    source: ISource,
    q: number,
    change?: readonly [number, number],
  ): IStation {
    const t: readonly number[] = source.coordinates;
    const n: number = t.length;
    if (
      n < 2 ||
      source.curves.length !== n ||
      !Number.isFinite(q) ||
      q < t[0]! ||
      q > t[n - 1]! ||
      (change !== undefined && !change.every(Number.isFinite))
    )
      throw new Error(
        "native phase station has no finite in-domain coordinate 2-jet",
      );
    let lo: number = 0;
    let hi: number = n - 1;
    while (hi - lo > 1) {
      const middle: number = (lo + hi) >> 1;
      if (t[middle]! <= q) lo = middle;
      else hi = middle;
    }
    const endpoint: (index: number) => AutoMovieStationHermite.IEnd = (
      index: number,
    ): AutoMovieStationHermite.IEnd => {
      const slope: readonly number[] = source.slopes[index]!;
      const curvature: readonly number[] = source.curvatures[index]!;
      if (
        slope.length !== n ||
        curvature.length !== n ||
        !slope.every(Number.isFinite) ||
        !curvature.every(Number.isFinite)
      )
        throw new Error("native phase endpoint has malformed cardinal jets");
      return {
        value: Array.from({ length: n }, (_: unknown, j: number): number =>
          index === j ? 1 : 0,
        ),
        slope,
        curvature,
      };
    };
    const a: AutoMovieStationHermite.IEnd = endpoint(lo);
    const b: AutoMovieStationHermite.IEnd = endpoint(hi);
    const span: number = t[hi]! - t[lo]!;
    const raw: number[][] = [0, 1, 2].map((order: number): number[] =>
      AutoMovieStationHermite.combine(
        a,
        b,
        AutoMovieStationHermite.weights(
          (q - t[lo]!) / span,
          span,
          order as 0 | 1 | 2,
          true,
        ),
      ),
    );
    const weights: number[][] =
      change === undefined
        ? raw
        : [
            raw[0]!,
            raw[1]!.map((value: number): number => value * change[0]),
            raw[2]!.map(
              (value: number, k: number): number =>
                value * change[0] * change[0] + raw[1]![k]! * change[1],
            ),
          ];
    if (!weights.every((row: number[]): boolean => row.every(Number.isFinite)))
      throw new Error(
        "native phase station weights are not finitely representable",
      );
    return { source, weights };
  }

  /**
   * Planar point [x,z], millimetres, at the original polar phase in radians.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Combines native polar points with the station's value row, preserving source sections at their cardinal coordinates.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One value-only reader avoids materializing unused derivative rows in point consumers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Negative interpolation weights remain observable and any nonfinite source read throws; there is no shape-dependent fallback.
   * @evidence contracts/development/common.md#meaningful-documentation Gives millimetre output, polar-radian input and the native radius owner's still-computed jet cost.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most L nonzero weights read native radius jets in O(L) time; the radius owner currently computes its three orders even though this reader uses only value.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses one prepared value row without a new station solve; zero cardinal weights avoid irrelevant source reads.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh pair and retains no source/query state globally.
   */
  export function point(at: IStation, phi: number): [number, number] {
    validate(at);
    if (!Number.isFinite(phi)) throw new Error("native phase must be finite");
    let radius: number = 0;
    for (let i: number = 0; i < at.source.curves.length; i++) {
      const weight: number = at.weights[0]![i]!;
      if (weight !== 0) radius += weight * read(at.source.curves[i]!, phi)[0];
    }
    if (!Number.isFinite(radius))
      throw new Error("native phase combination has a nonfinite point");
    return [radius * Math.cos(phi), radius * Math.sin(phi)];
  }

  /**
   * Three planar rows [x,z,x_t,z_t,x_tt,z_tt], for station orders 0,1,2.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Analytic polar product rules give both phase derivatives, and the same station cardinal rows commute with these derivatives on finite C2 native sources.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The six-component rows fit the existing world-frame product rule without constructing a second phase representation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses no finite difference, overshoot clamp or point-derived normal; this candidate supplies neither a pole jet nor a world frame.
   * @evidence contracts/development/common.md#meaningful-documentation Documents row/column order, millimetre values, per-radian phase derivatives and the prepared station coordinate's derivative units.
   * @evidence contracts/development/implementation.md#efficient-algorithms One native three-order radius read per contributing source and fixed three-by-six accumulation cost O(L) time with constant-size output.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Source radius and trigonometric values serve all station/phase derivative orders in one query.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns three fresh six-entry rows; no phase or geometry registry is retained.
   */
  export function jet(at: IStation, phi: number): number[][] {
    validate(at);
    if (!Number.isFinite(phi)) throw new Error("native phase must be finite");
    const cosine: number = Math.cos(phi);
    const sine: number = Math.sin(phi);
    const rows: number[][] = Array.from({ length: 3 }, (): number[] =>
      new Array<number>(6).fill(0),
    );
    for (let i: number = 0; i < at.source.curves.length; i++) {
      const radius: readonly number[] = read(at.source.curves[i]!, phi);
      const r: number = radius[0]!;
      const first: number = radius[1]!;
      const second: number = radius[2]!;
      const native: number[] = [
        r * cosine,
        r * sine,
        first * cosine - r * sine,
        first * sine + r * cosine,
        (second - r) * cosine - 2 * first * sine,
        (second - r) * sine + 2 * first * cosine,
      ];
      for (let order: number = 0; order < 3; order++)
        for (let k: number = 0; k < 6; k++)
          rows[order]![k] =
            rows[order]![k]! + at.weights[order]![i]! * native[k]!;
    }
    if (!rows.every((row: number[]): boolean => row.every(Number.isFinite)))
      throw new Error("native phase combination has a nonfinite jet");
    return rows;
  }
}

/** Validate explicit prepared rows without selecting geometry by registration identity. */
function validate(at: AutoMovieLoftPhaseSource.IStation): void {
  const count: number = at.source.curves.length;
  if (
    count < 2 ||
    at.weights.length !== 3 ||
    !at.weights.every(
      (row: readonly number[]): boolean =>
        row.length === count && row.every(Number.isFinite),
    ) ||
    at.source.curves.some(
      (curve: AutoMovieViewConic.ICurve): boolean =>
        curve.failure !== null || curve.quarters.length !== 4,
    )
  )
    throw new Error("native phase station has malformed explicit source data");
}

/** A broken present source is an error, never a request for legacy coefficient geometry. */
function read(
  curve: AutoMovieViewConic.ICurve,
  phi: number,
): readonly [number, number, number] {
  const radius: readonly [number, number, number] = AutoMovieViewConic.radius(
    curve,
    phi,
  );
  if (!radius.every(Number.isFinite))
    throw new Error(
      `native phase source returned no finite radius jet: ${curve.failure ?? "invalid source data"}`,
    );
  return radius;
}
