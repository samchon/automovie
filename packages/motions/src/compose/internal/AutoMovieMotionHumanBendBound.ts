import { AutoMovieEngineSwivelJointReadings, type AutoMovieEngineKinematicsTypes, AutoMovieEngineKinematicsJointRotation } from "@automovie/engine";
import type {
  IAutoMovieAxisFrame,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
  IAutoMovieRestFrame,
} from "@automovie/interface";

import { AutoMovieMotionHumanBendEnclosure } from "./AutoMovieMotionHumanBendEnclosure";
import type { AutoMovieMotionHumanBendSearch } from "./AutoMovieMotionHumanBendSearch";
import { motionHumanBendStrain } from "./motionHumanBendStrain";
import { AutoMovieMotionHumanBendUnmadeBound } from "./AutoMovieMotionHumanBendUnmadeBound";

/*
 * A certified lower bound of the elbow search's strain over an interval of
 * swivels, for the engine's branch and bound (`hingedSwivelBounded`, Land and
 * Doig 1960): a step whose bracket's bound already exceeds a legal place's
 * exact strain is never scored, and the search keeps the full sweep's choice.
 *
 * The strain of a place is at least the shoulder's share `S = Σ ((θ_i − n_i) /
 * h_i)^2` over flexion, abduction and twist, the clinical angles `θ_i` the
 * decomposition reads against the hanging arm's `n_i` over each axis's half
 * range `h_i`; with a hand rotation it is `S` plus non-negative shares, or
 * `UNMADE` plus a positive excess, so at least `min(S, UNMADE)`
 * (`motionHumanBendStrain.least`). This bounds `S` over an arc from
 * its swivel readings.
 *
 * Derivation. The upper arm's bone-local rotation at a swivel `ψ` is a fixed
 * rotation turned about the fixed shoulder-to-wrist axis by `ψ`, so every entry
 * of its matrix on the clinical basis is `a + b cos ψ + c sin ψ` (Rodrigues'
 * formula; Tolani, Goswami and Badler 2000, the swivel parameterisation, with
 * the joint angles sinusoids of the swivel as in Shimizu et al. 2008), fitted
 * exactly from three swivels (`AutoMovieEngineSwivelJointReadings`). The decomposition reads
 * the middle angle as `atan2(s, cos)`, `asin(s)` on a rotation, of one such
 * entry `s`, and each outer angle as `atan2(y, x)` of two entries, times the
 * basis's handedness for the twist. Each is enclosed over an arc in closed form
 * (`AutoMovieMotionHumanBendEnclosure`: the sinusoid's exact range under
 * `asin`, and a Lipschitz spread of `atan2`).
 *
 * - The decomposition then reports one of two charts, the principal or the
 *   alternate (`alternateRigJointAngles`: each outer angle turned a half turn,
 *   the middle one reflected about its right angle), lifts it through the rest
 *   frame (`sign · rig + neutral`) and may take any full-turn alias nearest the
 *   range (`nearestAngleAlias`). Each axis's reading therefore lies in the
 *   union of two intervals and their full-turn shifts, and its distance from
 *   `n_i` is at least the least distance to that union, taken for each axis
 *   apart, so the bound holds whichever chart the range chooses.
 * - Gimbal lock: the decomposition pins an outer angle where the projected
 *   cosine, the length of either outer vector, falls to about 1.5e-8. An arc
 *   where either outer vector or the middle angle's cosine may fall under
 *   `AutoMovieMotionHumanBendEnclosure.FLOOR` is never certified, so the pinned
 *   branch never lies in a certified arc, and there the `asin` slope is at most
 *   `1 / FLOOR`.
 * - Rounding: the fit and the decomposition err by about 1e-15 in an entry, at
 *   most `1e-15 / FLOOR` radians in an angle; every interval is widened by
 *   `AutoMovieMotionHumanBendEnclosure.SLACK` degrees, many orders above that,
 *   and the squares and their sum are taken of non-negative distances, which
 *   rounding to nearest keeps monotone.
 *
 * With a hand rotation, where the turn's unmade excess (the forearm's twist and
 * the wrist's flexion and abduction past their reserved ranges) is certified
 * positive over the whole arc (`AutoMovieMotionHumanBendUnmadeBound`), every
 * place there leaves the turn unmade, so the bound is `UNMADE` plus that
 * excess's bound, which ranks the unmade places among themselves; elsewhere it
 * is `min(S, UNMADE)`'s bound.
 *
 * An arc the bound cannot certify (a vector near gimbal, or a joint whose
 * rotation is not the premised sinusoid, which the preparation checks at two
 * more swivels against the decomposition itself) is bounded by 0, the strain's
 * own floor, and the search scores it exactly.
 */
export namespace AutoMovieMotionHumanBendBound {
  /*
   * The fixed joint and strain terms a bound reads.
   */
  export interface IProps {
    /*
     * The upper arm's clinical basis, admitted and normalized.
     */
    basis: IAutoMovieJointAxes;

    /*
     * The upper arm's rest frame, lifting rest-relative degrees to clinical
     * ones.
     */
    frame: IAutoMovieRestFrame | undefined;

    /*
     * The upper arm's range, whose half widths the strain divides by.
     */
    range: IAutoMovieJointConstraint | null;

    /*
     * The hanging arm's clinical shoulder angles, degrees.
     */
    neutral: AutoMovieMotionHumanBendSearch.IAngles;

    /*
     * The hand's turn the strain adds, whose unmade excess bounds an unmade
     * place from below (`AutoMovieMotionHumanBendUnmadeBound`); absent where
     * the goal asks no rotation.
     */
    hand: AutoMovieMotionHumanBendUnmadeBound.IProps | undefined;
  }

  /*
   * Prepare the bound of one sweep's joint and strain.
   * Parameter props: The fixed joint and strain terms.
   * Returns: The engine's bound reader: given a branch's upper-arm rotation by
   * swivel (degrees) and its poser, the bound of every candidate's strain at
   * a swivel from `low` to `high` degrees.
   */
  export function prepare(
    props: IProps,
  ): NonNullable<AutoMovieEngineKinematicsTypes.IAutoMovieEngineKinematicsHingedArmArticulationProps["bound"]> {
    const halves: motionHumanBendStrain.IHalves =
      motionHumanBendStrain.halvesOf(props.range);
    const unmade: ReturnType<
      typeof AutoMovieMotionHumanBendUnmadeBound.prepare
    > =
      props.hand === undefined
        ? null
        : AutoMovieMotionHumanBendUnmadeBound.prepare(props.hand);
    return (
      upper: (swivel: number) => IAutoMovieQuaternion,
      posed: Parameters<NonNullable<AutoMovieEngineKinematicsTypes.IAutoMovieEngineKinematicsHingedArmArticulationProps["bound"]>>[1],
    ): ((low: number, high: number) => number) => {
      const shoulder: (low: number, high: number) => number = shoulderOf(
        props,
        halves,
        upper,
      );
      if (props.hand === undefined) return shoulder;
      const excess: ((low: number, high: number) => number) | null =
        unmade === null ? null : unmade(upper, posed(0).lower);
      // Where the turn is certified unmade on the whole arc, the strain is
      // `UNMADE` plus an excess at least the certified one; elsewhere it is
      // at least the shoulder's share or `UNMADE`, whichever is less.
      return (low: number, high: number): number => {
        const left: number = excess === null ? 0 : excess(low, high);
        return left > 0
          ? motionHumanBendStrain.UNMADE + left
          : Math.min(
              shoulder(low, high),
              motionHumanBendStrain.UNMADE,
            );
      };
    };
  }
}

/*
 * The shoulder's share bounded over a branch's arcs, or 0 where it is not
 * certified.
 */
function shoulderOf(
  props: AutoMovieMotionHumanBendBound.IProps,
  halves: motionHumanBendStrain.IHalves,
  upper: (swivel: number) => IAutoMovieQuaternion,
): (low: number, high: number) => number {
  const readings: Record<AutoMovieEngineSwivelJointReadings.Axis, AutoMovieEngineSwivelJointReadings.IRead> =
    AutoMovieEngineSwivelJointReadings.of(props.basis, upper);
  if (!premised(props.basis, upper, readings)) return NONE;
  return (low: number, high: number): number => {
    let sum: number = 0;
    for (let i: number = 0; i < 3; ++i) {
      const axis: AutoMovieEngineSwivelJointReadings.Axis = AutoMovieEngineSwivelJointReadings.AXES[i]!;
      const read: AutoMovieEngineSwivelJointReadings.IRead = readings[axis];
      const enclosed: AutoMovieMotionHumanBendEnclosure.IInterval | null =
        "sine" in read
          ? AutoMovieMotionHumanBendEnclosure.middle(read.sine, low, high)
          : AutoMovieMotionHumanBendEnclosure.outer(
              read.y,
              read.x,
              read.turn,
              low,
              high,
            );
      if (enclosed === null) return 0;
      const half: number | null = halves[i]!;
      if (half === null) continue;
      sum += motionHumanBendStrain.share(
        distance(
          props.neutral[axis],
          enclosed,
          "sine" in read,
          props.frame?.[axis],
        ),
        half,
      );
    }
    return sum;
  };
}

/*
 * The reader of a branch no bound is certified on: the strain's own floor.
 */
const NONE: (low: number, high: number) => number = (): number => 0;

/*
 * Degrees per radian.
 */
const DEGREES: number = 180 / Math.PI;

/*
 * The least distance, degrees, from a clinical angle to an axis's readings: the
 * principal interval and the alternate chart's (a half turn for an outer angle,
 * the reflection about the right angle for the middle one), lifted through the
 * rest frame, with every full-turn alias.
 */
function distance(
  neutral: number,
  rig: AutoMovieMotionHumanBendEnclosure.IInterval,
  middle: boolean,
  frame: IAutoMovieAxisFrame | undefined,
): number {
  const alternate: AutoMovieMotionHumanBendEnclosure.IInterval = middle
    ? [180 - rig[1], 180 - rig[0]]
    : [rig[0] + 180, rig[1] + 180];
  return Math.min(
    AutoMovieMotionHumanBendEnclosure.circular(neutral, lifted(rig, frame)),
    AutoMovieMotionHumanBendEnclosure.circular(
      neutral,
      lifted(alternate, frame),
    ),
  );
}

/*
 * A rest-relative interval as clinical degrees, `sign · rig + neutral`,
 * ordered.
 */
function lifted(
  rig: AutoMovieMotionHumanBendEnclosure.IInterval,
  frame: IAutoMovieAxisFrame | undefined,
): AutoMovieMotionHumanBendEnclosure.IInterval {
  if (frame === undefined) return rig;
  const ends: AutoMovieMotionHumanBendEnclosure.IInterval = [
    frame.sign * rig[0] + frame.neutral,
    frame.sign * rig[1] + frame.neutral,
  ];
  return [Math.min(ends[0], ends[1]), Math.max(ends[0], ends[1])];
}

/*
 * Whether the branch's rotation is the premised sinusoid: the fitted readings
 * give the decomposition's own principal angles at two more swivels, within a
 * hundredth of the slack, wherever both are away from gimbal lock.
 */
function premised(
  basis: IAutoMovieJointAxes,
  upper: (swivel: number) => IAutoMovieQuaternion,
  readings: Record<AutoMovieEngineSwivelJointReadings.Axis, AutoMovieEngineSwivelJointReadings.IRead>,
): boolean {
  for (const swivel of [45, 225]) {
    const actual: IAutoMovieResolvedJointAngles = AutoMovieEngineKinematicsJointRotation.decomposeJointRotationOnBasis(
      upper(swivel),
      basis,
    );
    for (const axis of AutoMovieEngineSwivelJointReadings.AXES) {
      const read: AutoMovieEngineSwivelJointReadings.IRead = readings[axis];
      let fitted: number;
      if ("sine" in read) {
        const s: number = AutoMovieMotionHumanBendEnclosure.at(
          read.sine,
          swivel,
        );
        if (!(Math.abs(s) <= 1 - AutoMovieMotionHumanBendEnclosure.FLOOR))
          return false;
        fitted = Math.asin(s) * DEGREES;
      } else {
        const x: number = AutoMovieMotionHumanBendEnclosure.at(read.x, swivel);
        const y: number = AutoMovieMotionHumanBendEnclosure.at(read.y, swivel);
        if (!(Math.hypot(x, y) >= AutoMovieMotionHumanBendEnclosure.FLOOR))
          return false;
        fitted = read.turn * Math.atan2(y, x) * DEGREES;
      }
      const gap: number = Math.abs(
        ((((fitted - actual[axis]) % 360) + 540) % 360) - 180,
      );
      if (!(gap <= AutoMovieMotionHumanBendEnclosure.SLACK / 100)) return false;
    }
  }
  return true;
}
