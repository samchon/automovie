import type { HumanArmClearance } from "./HumanArmClearance";

/**
 * The turn that clears an arm: of the two freedoms that move a forearm
 * without a goal, the upper arm's abduction and the elbow's flexion, the
 * least turn along the first of a fixed order of directions that brings the
 * arm's room within its allowance.
 *
 * A person whose forearm would cross the waist lets the elbow out, and one
 * whose hand would pass through somebody close folds the elbow. So the
 * directions are tried in that order: out at the shoulder, folded at the
 * elbow, both together, and only then the others. Along one direction the
 * least turn that clears moves continuously as the pose does, so a carried
 * arm keeps one course from instant to instant. An earlier search took the
 * nearest clear point of a lattice of turns in both freedoms, and its
 * nearest point changed direction between two instants 1/120 s apart, which
 * showed as a step of the wrist of 37 mm in a reach.
 *
 * The direction changes only when the one in use can no longer clear the
 * arm within `SPAN`, at its far end, which is the remaining place a carry
 * can step.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is turned, the order of directions with its reason, the continuity it gives, the measured defect of the search it replaces and where a step can remain.
 * @evidence contracts/development/design.md#principled-representation A direction is a unit pair of abduction and flexion; the order is data; the search is one function of the arm and two readings of it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The four bounds, the order and the search; read by `HumanArmClearance.cleared`, which owns the room and range readings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No obstacle is named: the room reading decides what is in the way, and a turn that leaves a joint's range ends its direction instead of being clamped.
 */
export namespace HumanArmClearing {
  /** The most a clearing turns either freedom from the given arm, degrees (provisional: beyond it the arm is no longer the carry's). */
  export const SPAN: number = 40;

  /** The step a direction is scanned in for its first clear turn, degrees (provisional: a few centimetres at the hand). */
  export const STEP: number = 5;

  /** The room over its allowance a clearing leaves, degrees (provisional: a twentieth of a degree, a quarter of a millimetre at the elbow). */
  export const TOLERANCE: number = 0.05;

  /** The bisections that find the least clear turn inside one step: eight halve it to 1/256 of the step, a fiftieth of a degree (provisional). */
  export const HALVINGS: number = 8;

  /**
   * The directions a clearing tries, in order, as shares of abduction and of
   * elbow flexion: out, folded, out and folded, then unfolded, out and
   * unfolded, in, in and folded, in and unfolded.
   */
  export const ORDER: readonly (readonly [number, number])[] = [
    [1, 0],
    [0, 1],
    [Math.SQRT1_2, Math.SQRT1_2],
    [0, -1],
    [Math.SQRT1_2, -Math.SQRT1_2],
    [-1, 0],
    [-Math.SQRT1_2, Math.SQRT1_2],
    [-Math.SQRT1_2, -Math.SQRT1_2],
  ];

  /**
   * An arm turned until its room is within its allowance.
   *
   * @param props The arm, the room it lacks over its allowance (degrees; cleared at or below `TOLERANCE`) and how far outside their ranges its joints are (degrees).
   * @returns The arm's joint angles, the hand's unchanged; the arm with the least lacking room met when no direction clears it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs with their units, the result and the fallback.
   * @evidence contracts/development/implementation.md#principled-implementation Each direction is scanned outward in `STEP` degrees for its first clear turn, and the least clear turn is bisected inside that step; the first direction of `ORDER` that clears is taken, so the choice does not depend on which of several clear turns happens to lie nearest.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the directions, one scan and one bisection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No margin is added; a turn that takes a joint farther out of its range than the given arm is ends its direction. A clearing that opens and closes inside one step is missed, the remaining gap.
   * @evidence contracts/development/implementation.md#efficient-algorithms One reading when the arm is clear; otherwise at most eight readings per direction scanned and `HALVINGS` more for the one taken.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its readings with nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(props: {
    arm: HumanArmClearance.IArm;
    over: (arm: HumanArmClearance.IArm) => number;
    range: (arm: HumanArmClearance.IArm) => number;
  }): HumanArmClearance.IArm {
    const arm: HumanArmClearance.IArm = props.arm;
    if (props.over(arm) <= TOLERANCE) return arm;
    const turned = (
      direction: readonly [number, number],
      degrees: number,
    ): HumanArmClearance.IArm => ({
      upper: [
        arm.upper[0],
        arm.upper[1] + direction[0] * degrees,
        arm.upper[2],
      ],
      lower: [
        arm.lower[0] + direction[1] * degrees,
        arm.lower[1],
        arm.lower[2],
      ],
      hand: arm.hand,
    });
    const limit: number = props.range(arm) + 1e-9;
    let best: HumanArmClearance.IArm = arm;
    let least: number = props.over(arm);
    for (const direction of ORDER)
      for (let far: number = STEP; far <= SPAN + 1e-9; far += STEP) {
        const candidate: HumanArmClearance.IArm = turned(direction, far);
        if (props.range(candidate) > limit) break;
        const value: number = props.over(candidate);
        if (value <= TOLERANCE) {
          // The least turn of this direction that still clears the arm.
          let lo: number = far - STEP;
          let hi: number = far;
          for (let i: number = 0; i < HALVINGS; i++) {
            const mid: number = (lo + hi) / 2;
            if (props.over(turned(direction, mid)) <= TOLERANCE) hi = mid;
            else lo = mid;
          }
          return turned(direction, hi);
        }
        if (value < least) {
          least = value;
          best = candidate;
        }
      }
    return best;
  }
}
