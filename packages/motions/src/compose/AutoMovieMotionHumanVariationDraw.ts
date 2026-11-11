import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanSkill } from "../skill/HumanSkill";
import type { IAutoMovieProficiency } from "../skill/IAutoMovieProficiency";
import type { AutoMovieMotionHumanVariation } from "./AutoMovieMotionHumanVariation";

/**
 * The draws and the bound rules every slot function of the seeded variation
 * shares.
 *
 * A draw is one repeat's values from a slot's stream: uniform values, normal
 * values truncated at `TRUNCATE` spreads, or a point of a disc of `TRUNCATE`
 * spreads. A bound rule turns a slot's room into the largest offset: the cell
 * rule keeps a value in its name's cell, and the scalar offset shrinks a
 * spread until `TRUNCATE` spreads fit a bound. `AutoMovieMotionHumanVariation`
 * states what a slot, a spread and a stream are.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a draw and a bound rule are and where the slot's terms are defined.
 * @evidence contracts/development/design.md#principled-representation One low-discrepancy sequence per slot read through a quantile function, so a repeat's index alone places it among the others and no value is rejected or clamped.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two truncation constants, the sequence's steps, three draws and the four rules the slot functions of three files call; the quantile function stays private.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No function here knows a slot type: each takes the spread and the bound its caller derived.
 */
export namespace AutoMovieMotionHumanVariationDraw {
  /**
   * How many spreads from its mean a component may lie (provisional; the two
   * spreads `AutoMovieMotionManner.BOUNDS` uses, checked by
   * `test_motion_compose_variation_bounded`).
   */
  export const TRUNCATE: number = 2;

  /**
   * The share of the way from a value to the nearer edge of its name's cell
   * an offset may reach (provisional, checked by
   * `test_motion_compose_variation_named`).
   */
  export const MARGIN: number = 0.8;

  /**
   * The steps of the additive recurrence by the number of components
   * (Roberts 2018, "The unreasonable effectiveness of quasirandom
   * sequences"): the inverse golden ratio for one component, the powers of
   * the inverse plastic constant for two and the powers of the inverse root
   * of `x^4 = x + 1` for three.
   */
  export const ALPHA: readonly (readonly number[])[] = [
    [],
    [0.6180339887498949],
    [1 / 1.324717957244746, 1 / 1.324717957244746 ** 2],
    [
      1 / 1.2207440846057596,
      1 / 1.2207440846057596 ** 2,
      1 / 1.2207440846057596 ** 3,
    ],
  ];

  /**
   * The uniform values of one repeat of a slot.
   *
   * @param draws The slot's stream and the repeat's index.
   * @param count The slot's number of components, 1 to 3.
   * @returns One value in [0, 1) per component.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the count's range and the result's range.
   * @evidence contracts/development/implementation.md#principled-implementation The additive recurrence of Roberts 2018 with a seeded rotation (Cranley and Patterson 1976): component `c` of repeat `n` is the fraction of `stream.float(c) + n ALPHA[count][c]`, so repeats fill the range evenly and two slots never move together.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression per component.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The stream is read at the fixed indices 0 to `count - 1` whatever the repeat, so a slot's draws never depend on another slot or on the order of calls.
   * @evidence contracts/development/implementation.md#efficient-algorithms One stream read per component.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs; the laws resolve each slot once at plan time.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function uniforms(
    draws: IHumanActionContext.ISeries,
    count: 1 | 2 | 3,
  ): number[] {
    return ALPHA[count]!.map((alpha: number, c: number): number => {
      const value: number = draws.random.float(c) + draws.index * alpha;
      return value - Math.floor(value);
    });
  }

  /**
   * The truncated standard normal values of one repeat of a slot.
   *
   * @param draws The slot's stream and the repeat's index.
   * @param count The slot's number of components, 1 to 3.
   * @returns One value in [-`TRUNCATE`, `TRUNCATE`] per component.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result's range.
   * @evidence contracts/development/implementation.md#principled-implementation Each uniform is mapped into the central mass of the normal between the two truncation points and read through the normal's quantile function, so one uniform gives one component and the sequence's spacing survives, which a Box-Muller pair does not keep.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One map over `uniforms`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is clamped: a truncated quantile has no pile-up at its ends.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `uniforms` and one quantile function.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per component.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function normals(
    draws: IHumanActionContext.ISeries,
    count: 1 | 2 | 3,
  ): number[] {
    return uniforms(draws, count).map((u: number): number =>
      quantile(TAIL + u * (1 - 2 * TAIL)),
    );
  }

  /**
   * A point of the disc of `TRUNCATE` spreads under a standard normal on each
   * axis.
   *
   * @param draws The slot's stream and the repeat's index.
   * @returns Two coordinates in spreads, at most `TRUNCATE` from the origin.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the unit and the bound of the result.
   * @evidence contracts/development/implementation.md#principled-implementation The radius is the quantile of the radial distribution cut at `TRUNCATE` and the angle is uniform, so the bound is a distance from the origin and not a square.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One radius, one angle and their two coordinates.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is rejected or clamped: the cut is taken in the quantile, so every draw gives one point.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `uniforms`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function disc(draws: IHumanActionContext.ISeries): [number, number] {
    const [u, v] = uniforms(draws, 2) as [number, number];
    const cut: number = 1 - Math.exp(-(TRUNCATE ** 2) / 2);
    const radius: number = Math.sqrt(-2 * Math.log(1 - u * cut));
    return [
      radius * Math.cos(2 * Math.PI * v),
      radius * Math.sin(2 * Math.PI * v),
    ];
  }

  /**
   * The cell rule: `MARGIN` of the distance from a value to the nearer edge
   * of the cell of the name nearest it.
   *
   * A cell's edge is the midpoint with the neighbouring name. The first and
   * the last name, which have one neighbour, take the same distance on their
   * open side.
   *
   * @param names The values of an axis's names, in the axis's unit.
   * @param value The value.
   * @returns The bound, in the axis's unit; 0 when the value lies on or past an edge.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what a cell and its edge are, the open side's rule, the unit and the result with no room.
   * @evidence contracts/development/implementation.md#principled-implementation A varied value keeps its name while it is nearer to that name than to any other, which is the cell between the two midpoints.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The nearest name, its two edges and one distance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A value past its cell's edge gets 0 and never a negative bound; an axis with one name has no edge and gets 0.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A sort of one axis's few names, once per slot at plan time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs; no owner holds an axis's midpoints.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function cell(names: readonly number[], value: number): number {
    const sorted: number[] = [...names].sort((a: number, b: number) => a - b);
    let nearest: number = 0;
    for (let i: number = 1; i < sorted.length; ++i)
      if (Math.abs(sorted[i]! - value) < Math.abs(sorted[nearest]! - value))
        nearest = i;
    const name: number = sorted[nearest]!;
    const below: number | undefined =
      nearest > 0 ? (name - sorted[nearest - 1]!) / 2 : undefined;
    const above: number | undefined =
      nearest < sorted.length - 1
        ? (sorted[nearest + 1]! - name) / 2
        : undefined;
    const low: number = name - (below ?? above ?? 0);
    const high: number = name + (above ?? below ?? 0);
    return Math.max(0, MARGIN * Math.min(value - low, high - value));
  }

  /**
   * A right-handed orthonormal basis whose first vector lies along a
   * direction.
   *
   * @param direction The direction, any length; a zero direction takes +Z.
   * @returns Three unit vectors: along the direction, across it and across both.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the zero case and the three vectors.
   * @evidence contracts/development/implementation.md#principled-implementation An offset is stated along and across a movement, so its frame is built on the movement's direction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reference axis and two cross products.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The second vector is across the world axis the direction is farthest from, so the basis never degenerates.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's `Vector3`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function basis(direction: IAutoMovieVector3): IAutoMovieVector3[] {
    const along: IAutoMovieVector3 =
      Vector3.length(direction) > 1e-9
        ? Vector3.normalize(direction)
        : { x: 0, y: 0, z: 1 };
    const reference: IAutoMovieVector3 =
      Math.abs(along.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
    const first: IAutoMovieVector3 = Vector3.normalize(
      Vector3.cross(reference, along),
    );
    return [along, first, Vector3.cross(along, first)];
  }

  /**
   * A row of the spread table at the source's skill on one axis.
   *
   * @param source The action's variation.
   * @param axis The skill axis the spread is read on.
   * @param spread The spread's novice and elite values.
   * @returns The spread at `variation` 1, in the row's unit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and the result's unit.
   * @evidence contracts/development/implementation.md#principled-implementation A spread narrows with skill as every skill quantity does, so it is read between its two ends by the owner of that reading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanSkill.quantity`.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts One call with no case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function quantity(
    source: AutoMovieMotionHumanVariation.ISource,
    axis: IAutoMovieProficiency.Axis,
    spread: readonly [number, number],
  ): number {
    return HumanSkill.quantity(source.skill, axis, spread[0], spread[1]);
  }

  /**
   * A one-component offset: a truncated normal draw times the spread, the
   * spread shrunk until `TRUNCATE` spreads fit the bound.
   *
   * @param source The action's variation.
   * @param key The slot key.
   * @param axis The skill axis the spread is read on.
   * @param spread The spread's novice and elite values.
   * @param scale A factor on the spread: 1 for an absolute offset, the value for a relative one.
   * @param bound The largest size of the offset.
   * @returns The offset, in the spread's unit; 0 with no spread or no room.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, the unit and the result with no room.
   * @evidence contracts/development/implementation.md#principled-implementation The spread shrinks by one factor of at most 1, the largest for which the offset at `TRUNCATE` stays inside the bound, so the offset keeps a normal's shape inside any bound.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One spread, one guard and one product.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is clamped, and no room reads no draw, so a slot without room moves no stream.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `quantity` and `normals`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function scalar(
    source: AutoMovieMotionHumanVariation.ISource,
    key: string,
    axis: IAutoMovieProficiency.Axis,
    spread: readonly [number, number],
    scale: number,
    bound: number,
  ): number {
    const sigma: number =
      source.variation * scale * quantity(source, axis, spread);
    if (!(sigma > 0 && bound > 0)) return 0;
    return (
      Math.min(1, bound / (TRUNCATE * sigma)) *
      sigma *
      normals(source.series(key), 1)[0]!
    );
  }
}

/** The mass of the standard normal below `-TRUNCATE`: `Phi(-2)`. */
const TAIL: number = 0.022750131948179195;

/**
 * The standard normal's quantile function, by Acklam's rational
 * approximation (relative error below 1.15e-9).
 *
 * @param p A probability in (0, 1).
 * @returns The value the standard normal lies below with probability `p`.
 */
function quantile(p: number): number {
  const tail = (q: number): number =>
    (((((C[0] * q + C[1]) * q + C[2]) * q + C[3]) * q + C[4]) * q + C[5]) /
    ((((D[0] * q + D[1]) * q + D[2]) * q + D[3]) * q + 1);
  if (p < LOW) return tail(Math.sqrt(-2 * Math.log(p)));
  if (p > 1 - LOW) return -tail(Math.sqrt(-2 * Math.log(1 - p)));
  const q: number = p - 0.5;
  const r: number = q * q;
  return (
    ((((((A[0] * r + A[1]) * r + A[2]) * r + A[3]) * r + A[4]) * r + A[5]) *
      q) /
    (((((B[0] * r + B[1]) * r + B[2]) * r + B[3]) * r + B[4]) * r + 1)
  );
}

/** Below this probability, and above its complement, the quantile uses its tail form. */
const LOW: number = 0.02425;

/** The numerator of the quantile's central form. */
const A: readonly [number, number, number, number, number, number] = [
  -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
  1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
];

/** The denominator of the quantile's central form. */
const B: readonly [number, number, number, number, number] = [
  -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
  6.680131188771972e1, -1.328068155288572e1,
];

/** The numerator of the quantile's tail form. */
const C: readonly [number, number, number, number, number, number] = [
  -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
  -2.549732539343734, 4.374664141464968, 2.938163982698783,
];

/** The denominator of the quantile's tail form. */
const D: readonly [number, number, number, number] = [
  7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
  3.754408661907416,
];
