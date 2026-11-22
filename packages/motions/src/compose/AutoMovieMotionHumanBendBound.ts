import {
  decomposeJointRotationOnBasis,
  swivelJointReadings,
} from "@automovie/engine";
import type {
  IAutoMovieAxisFrame,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
  IAutoMovieRestFrame,
  IAutoMovieSwivelArcs,
} from "@automovie/interface";

import type { AutoMovieMotionHumanBendSearch } from "./AutoMovieMotionHumanBendSearch";
import { AutoMovieMotionHumanBendStrain } from "./AutoMovieMotionHumanBendStrain";

/**
 * A certified lower bound of the elbow search's strain over an interval of
 * swivels, for the engine's branch and bound (`hingedSwivelBounded`, Land
 * and Doig 1960): a step whose bracket's bound already exceeds a legal
 * place's exact strain is never scored, and the search keeps the full
 * sweep's choice.
 *
 * The strain of a place is at least the shoulder's share
 * `S = Σ ((θ_i − n_i) / h_i)^2` over flexion, abduction and twist, the
 * clinical angles `θ_i` the decomposition reads against the hanging arm's
 * `n_i` over each axis's half range `h_i`; with a hand rotation it is
 * `S` plus non-negative shares, or `UNMADE` plus a positive excess, so at
 * least `min(S, UNMADE)` (`AutoMovieMotionHumanBendStrain.least`). This
 * bounds `S` over an arc from its swivel readings.
 *
 * Derivation. The upper arm's bone-local rotation at a swivel `ψ` is a fixed
 * rotation turned about the fixed shoulder-to-wrist axis by `ψ`, so every
 * entry of its matrix on the clinical basis is `a + b cos ψ + c sin ψ`
 * (Rodrigues' formula; Tolani, Goswami and Badler 2000, the swivel
 * parameterisation, with the joint angles sinusoids of the swivel as in
 * Shimizu et al. 2008), fitted exactly from three swivels
 * (`swivelJointReadings`). The decomposition reads the middle angle as
 * `atan2(s, cos)`, `asin(s)` on a rotation, of one such entry `s`, and each
 * outer angle as `atan2(y, x)` of two entries, times the basis's handedness
 * for the twist.
 *
 * - A sinusoid's range on `[l, h]` is closed form: `a + R cos(ψ − φ)` with
 *   `R = hypot(b, c)` and `φ = atan2(c, b)` takes its maximum `a + R` where
 *   `φ` lies in the arc and its minimum `a − R` where `φ + 180` does, and its
 *   values at the ends otherwise. `asin` is increasing, so the middle angle
 *   lies between the `asin` of those two.
 * - An outer angle's vector `v(ψ) = (x, y)` has `|v'| ≤ M`, with
 *   `M = sqrt(b_x² + c_x² + b_y² + c_y²)`, and its angle turns at
 *   `|x y' − y x'| / |v|² ≤ |v'| / |v|`. On an arc of half width `w` radians
 *   about its middle `m`, `|v| ≥ r = |v(m)| − w M`, so where `r > 0` the
 *   angle stays within `w M / r` of the angle at the middle.
 * - The decomposition then reports one of two charts, the principal or the
 *   alternate (`alternateRigJointAngles`: each outer angle turned a half
 *   turn, the middle one reflected about its right angle), lifts it through
 *   the rest frame (`sign · rig + neutral`) and may take any full-turn alias
 *   nearest the range (`nearestAngleAlias`). Each axis's reading therefore
 *   lies in the union of two intervals and their full-turn shifts, and its
 *   distance from `n_i` is at least the least distance to that union, taken
 *   for each axis apart, so the bound holds whichever chart the range
 *   chooses.
 * - Gimbal lock: the decomposition pins an outer angle where the projected
 *   cosine, the length of either outer vector, falls to about 1.5e-8. An arc
 *   whose lower bound `r` of either outer vector's length is under `FLOOR`
 *   is never certified, so the pinned branch never lies in a certified arc,
 *   and there the `asin` slope is at most `1 / FLOOR`.
 * - Rounding: the fit and the decomposition err by about 1e-15 in an entry,
 *   at most `1e-15 / FLOOR` radians in an angle; every interval is widened by
 *   `SLACK` degrees, many orders above that, and the squares and their sum
 *   are taken of non-negative distances, which rounding to nearest keeps
 *   monotone.
 *
 * An arc the bound cannot certify (a vector near gimbal, or a joint whose
 * rotation is not the premised sinusoid, which the preparation checks at two
 * more swivels against the decomposition itself) is bounded by 0, the
 * strain's own floor, and the search scores it exactly.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the bound, the derivation for both charts, the gimbal and rounding cases and the fallback.
 * @evidence contracts/development/design.md#principled-representation One preparation per fixed joint and neutral, returning the engine's bound reader over a branch's rotation by swivel.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two constants, one record and one preparation, read by `AutoMovieMotionHumanBendSweep`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sampled bound: every value is a closed-form enclosure or 0.
 */
export namespace AutoMovieMotionHumanBendBound {
  /** The least length of an outer angle's vector, the projected cosine, over which an arc is certified; nearer gimbal lock it is bounded by 0. */
  export const FLOOR: number = 1e-3;

  /** Degrees every angle enclosure is widened by: far above the fit's and the decomposition's rounding (about 1e-12 degrees at `FLOOR`), far below any strain a sweep compares. */
  export const SLACK: number = 1e-6;

  /**
   * The fixed joint and strain terms a bound reads.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation The upper arm's admitted basis, rest frame and range, the hanging arm's clinical angles, and whether the strain is capped.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members, all read by the preparation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The basis is the one the decomposition reads, admitted once by the sweep.
   */
  export interface IProps {
    /** The upper arm's clinical basis, admitted and normalized. */
    basis: IAutoMovieJointAxes;

    /** The upper arm's rest frame, lifting rest-relative degrees to clinical ones. */
    frame: IAutoMovieRestFrame | undefined;

    /** The upper arm's range, whose half widths the strain divides by. */
    range: IAutoMovieJointConstraint | null;

    /** The hanging arm's clinical shoulder angles, degrees. */
    neutral: AutoMovieMotionHumanBendSearch.IAngles;

    /** Whether the strain adds the hand's turn, so its bound is capped at `UNMADE`. */
    capped: boolean;
  }

  /**
   * Prepare the bound of one sweep's joint and strain.
   *
   * @param props The fixed joint and strain terms.
   * @returns The engine's bound reader: given a branch's upper-arm rotation by swivel (degrees), the bound of every candidate's strain at a swivel from `low` to `high` degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the reader returned.
   * @evidence contracts/development/implementation.md#principled-implementation The namespace's derivation: closed-form sinusoid ranges, a Lipschitz enclosure of each outer angle, both charts and every alias, the gimbal floor and the slack; 0 where none holds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Readings and premise check once per branch, then three axis enclosures, their distances and one sum per interval.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An uncertified arc or branch returns 0, never an estimate; no candidate is skipped here, only bounded.
   * @evidence contracts/development/implementation.md#efficient-algorithms Per branch three rotations for the fit and two decompositions for the check; per interval at most a dozen sinusoid evaluations, against a scored place's posing, decompositions, range scan and obstruction queries it can spare.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The readings are the engine's `swivelJointReadings`, the fit `boxExcludedSwivels` refuses arcs by; the halves and squares are `AutoMovieMotionHumanBendStrain`'s.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each branch's reader retains its three readings and the fixed terms until the sweep releases it.
   */
  export function prepare(
    props: IProps,
  ): (
    upper: (swivel: number) => IAutoMovieQuaternion,
  ) => (low: number, high: number) => number {
    const halves: AutoMovieMotionHumanBendStrain.IHalves =
      AutoMovieMotionHumanBendStrain.halvesOf(props.range);
    const middleOf: Record<swivelJointReadings.Axis, boolean> = {
      flexion: false,
      abduction: false,
      twist: false,
    };
    return (
      upper: (swivel: number) => IAutoMovieQuaternion,
    ): ((low: number, high: number) => number) => {
      const readings: Record<swivelJointReadings.Axis, swivelJointReadings.IRead> =
        swivelJointReadings.of(props.basis, upper);
      if (!premised(props.basis, upper, readings)) return NONE;
      for (const axis of swivelJointReadings.AXES)
        middleOf[axis] = "sine" in readings[axis];
      return (low: number, high: number): number => {
        let sum: number = 0;
        for (let i: number = 0; i < 3; ++i) {
          const axis: swivelJointReadings.Axis = swivelJointReadings.AXES[i]!;
          const enclosed: [number, number] | null = enclose(
            readings[axis],
            low,
            high,
          );
          if (enclosed === null) return 0;
          const half: number | null = halves[i]!;
          if (half === null) continue;
          sum += AutoMovieMotionHumanBendStrain.share(
            distance(
              props.neutral[axis],
              enclosed,
              middleOf[axis],
              props.frame?.[axis],
            ),
            half,
          );
        }
        return props.capped
          ? Math.min(sum, AutoMovieMotionHumanBendStrain.UNMADE)
          : sum;
      };
    };
  }
}

/** The reader of a branch no bound is certified on: the strain's own floor. */
const NONE: (low: number, high: number) => number = (): number => 0;

/** Degrees per radian. */
const DEGREES: number = 180 / Math.PI;

/** A sinusoid's value at a swivel, degrees. */
function at(f: IAutoMovieSwivelArcs.ISinusoid, swivel: number): number {
  const turn: number = swivel / DEGREES;
  return f.a + f.b * Math.cos(turn) + f.c * Math.sin(turn);
}

/** Whether some full-turn shift of an angle, degrees, lies in `[low, high]`. */
function within(angle: number, low: number, high: number): boolean {
  return angle + 360 * Math.ceil((low - angle) / 360) <= high;
}

/** A sinusoid's least and greatest values on `[low, high]` degrees, in closed form. */
function range(
  f: IAutoMovieSwivelArcs.ISinusoid,
  low: number,
  high: number,
): [number, number] {
  const ends: [number, number] = [at(f, low), at(f, high)];
  let least: number = Math.min(ends[0], ends[1]);
  let most: number = Math.max(ends[0], ends[1]);
  const amplitude: number = Math.hypot(f.b, f.c);
  if (amplitude > 0) {
    const peak: number = Math.atan2(f.c, f.b) * DEGREES;
    if (within(peak, low, high)) most = f.a + amplitude;
    if (within(peak + 180, low, high)) least = f.a - amplitude;
  }
  return [least, most];
}

/**
 * The principal chart's rest-relative reading of an axis over `[low, high]`
 * degrees, widened by the slack; null where the arc is not certified.
 */
function enclose(
  read: swivelJointReadings.IRead,
  low: number,
  high: number,
): [number, number] | null {
  if ("sine" in read) {
    const [least, most] = range(read.sine, low, high);
    return [
      Math.asin(Math.max(-1, Math.min(1, least))) * DEGREES -
        AutoMovieMotionHumanBendBound.SLACK,
      Math.asin(Math.max(-1, Math.min(1, most))) * DEGREES +
        AutoMovieMotionHumanBendBound.SLACK,
    ];
  }
  const middle: number = (low + high) / 2;
  const width: number = (high - low) / 2 / DEGREES;
  const x: number = at(read.x, middle);
  const y: number = at(read.y, middle);
  const slope: number = Math.sqrt(
    read.x.b * read.x.b +
      read.x.c * read.x.c +
      read.y.b * read.y.b +
      read.y.c * read.y.c,
  );
  const reach: number = Math.hypot(x, y) - width * slope;
  if (!(reach >= AutoMovieMotionHumanBendBound.FLOOR)) return null;
  const angle: number = Math.atan2(y, x) * DEGREES;
  const spread: number =
    Math.min(Math.PI, (width * slope) / reach) * DEGREES +
    AutoMovieMotionHumanBendBound.SLACK;
  const ends: [number, number] = [
    read.turn * (angle - spread),
    read.turn * (angle + spread),
  ];
  return [Math.min(ends[0], ends[1]), Math.max(ends[0], ends[1])];
}

/**
 * The least distance, degrees, from a clinical angle to an axis's readings:
 * the principal interval and the alternate chart's (a half turn for an outer
 * angle, the reflection about the right angle for the middle one), lifted
 * through the rest frame, with every full-turn alias.
 */
function distance(
  neutral: number,
  rig: [number, number],
  middle: boolean,
  frame: IAutoMovieAxisFrame | undefined,
): number {
  const alternate: [number, number] = middle
    ? [180 - rig[1], 180 - rig[0]]
    : [rig[0] + 180, rig[1] + 180];
  return Math.min(
    circular(neutral, lifted(rig, frame)),
    circular(neutral, lifted(alternate, frame)),
  );
}

/** A rest-relative interval as clinical degrees, `sign · rig + neutral`, ordered. */
function lifted(
  rig: [number, number],
  frame: IAutoMovieAxisFrame | undefined,
): [number, number] {
  if (frame === undefined) return rig;
  const ends: [number, number] = [
    frame.sign * rig[0] + frame.neutral,
    frame.sign * rig[1] + frame.neutral,
  ];
  return [Math.min(ends[0], ends[1]), Math.max(ends[0], ends[1])];
}

/** The least distance, degrees, from an angle to an interval and its full-turn shifts. */
function circular(angle: number, interval: [number, number]): number {
  const width: number = interval[1] - interval[0];
  if (!(width < 360)) return 0;
  const offset: number = (((angle - interval[0]) % 360) + 360) % 360;
  return offset <= width ? 0 : Math.min(offset - width, 360 - offset);
}

/**
 * Whether the branch's rotation is the premised sinusoid: the fitted
 * readings give the decomposition's own principal angles at two more
 * swivels, within a hundredth of the slack, wherever both are away from
 * gimbal lock.
 */
function premised(
  basis: IAutoMovieJointAxes,
  upper: (swivel: number) => IAutoMovieQuaternion,
  readings: Record<swivelJointReadings.Axis, swivelJointReadings.IRead>,
): boolean {
  for (const swivel of [45, 225]) {
    const actual: IAutoMovieResolvedJointAngles = decomposeJointRotationOnBasis(
      upper(swivel),
      basis,
    );
    for (const axis of swivelJointReadings.AXES) {
      const read: swivelJointReadings.IRead = readings[axis];
      let fitted: number;
      if ("sine" in read) {
        const s: number = at(read.sine, swivel);
        if (!(Math.abs(s) <= 1 - AutoMovieMotionHumanBendBound.FLOOR))
          return false;
        fitted = Math.asin(s) * DEGREES;
      } else {
        const x: number = at(read.x, swivel);
        const y: number = at(read.y, swivel);
        if (!(Math.hypot(x, y) >= AutoMovieMotionHumanBendBound.FLOOR))
          return false;
        fitted = read.turn * Math.atan2(y, x) * DEGREES;
      }
      const gap: number = Math.abs(
        ((((fitted - actual[axis]) % 360) + 540) % 360) - 180,
      );
      if (!(gap <= AutoMovieMotionHumanBendBound.SLACK / 100)) return false;
    }
  }
  return true;
}
