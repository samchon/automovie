import type { IAutoMovieMotionHumanArmClearance } from "@automovie/interface";
import * as HumanArmClearingData from "./HumanArmClearingData";

/*
 * An arm turned until its room is within its allowance.
 * Parameter props: The arm, the room it lacks over its allowance (degrees; cleared
 * at or below `TOLERANCE`) and how far outside their ranges its joints are
 * (degrees).
 * Returns: The arm's joint angles, the hand's unchanged; the arm with the least
 * lacking room met when no direction clears it.
 */
export function HumanArmClearing(
  props: IOfProps,
): IAutoMovieMotionHumanArmClearance.IArm {
  const arm: IAutoMovieMotionHumanArmClearance.IArm = props.arm;
  if (props.over(arm) <= HumanArmClearingData.TOLERANCE) return arm;
  const turned = (
    direction: readonly [number, number],
    degrees: number,
  ): IAutoMovieMotionHumanArmClearance.IArm => ({
    upper: [arm.upper[0], arm.upper[1] + direction[0] * degrees, arm.upper[2]],
    lower: [arm.lower[0] + direction[1] * degrees, arm.lower[1], arm.lower[2]],
    hand: arm.hand,
  });
  const limit: number = props.range(arm) + 1e-9;
  let best: IAutoMovieMotionHumanArmClearance.IArm = arm;
  let least: number = props.over(arm);
  for (const direction of HumanArmClearingData.ORDER) {
    // `SPAN` bounds each freedom, so a ray between the two runs until its
    // larger share reaches it: a diagonal ray stopped at a length of
    // `SPAN` turned each freedom only 28 degrees, and an arm a turn of 40
    // out and 40 unfolded clears was left 3 degrees short of its room.
    const reach: number =
      HumanArmClearingData.SPAN / Math.max(Math.abs(direction[0]), Math.abs(direction[1]));
    let near: number = 0;
    while (near < reach - 1e-9) {
      const far: number = Math.min(near + HumanArmClearingData.STEP, reach);
      const candidate: IAutoMovieMotionHumanArmClearance.IArm = turned(
        direction,
        far,
      );
      if (props.range(candidate) > limit) break;
      const value: number = props.over(candidate);
      if (value <= HumanArmClearingData.TOLERANCE) {
        // The least turn of this direction that still clears the arm.
        let lo: number = near;
        let hi: number = far;
        for (let i: number = 0; i < HumanArmClearingData.HALVINGS; i++) {
          const mid: number = (lo + hi) / 2;
          if (props.over(turned(direction, mid)) <= HumanArmClearingData.TOLERANCE) hi = mid;
          else lo = mid;
        }
        return turned(direction, hi);
      }
      if (value < least) {
        least = value;
        best = candidate;
      }
      near = far;
    }
  }
  return best;
}

/*
 * The turn that clears an arm: of the two freedoms that move a forearm without
 * a goal, the upper arm's abduction and the elbow's flexion, the least turn
 * along the first of a fixed order of directions that brings the arm's room
 * within its allowance.
 *
 * A person whose forearm would cross the waist lets the elbow out, and one
 * whose hand would pass through somebody close folds the elbow. So the
 * directions are tried in that order: out at the shoulder, folded at the elbow,
 * both together, and only then the others. Along one direction the least turn
 * that clears moves continuously as the pose does, so a carried arm keeps one
 * course from instant to instant. An earlier search took the nearest clear
 * point of a lattice of turns in both freedoms, and its nearest point changed
 * direction between two instants 1/120 s apart, which showed as a step of the
 * wrist of 37 mm in a reach.
 *
 * The direction changes only when the one in use can no longer clear the arm
 * within `SPAN`, at its far end, which is the remaining place a carry can
 * step.
 */
export namespace HumanArmClearing {
  /*
   * The share of the way past which a key lies beside the arrival: its
   * allowance is no less than the arrival's own room.
   */
  export const BESIDE: number = 0.9;

  /*
   * Deprecated with `AutoMovieMotionHumanArmCarry.carry`, its only reader: a
   * carry's clearance belongs to its planned trajectory
   * (`AutoMovieMotionHumanArmCarry.carried` over a span), and this course is
   * retired once the last share-only carry has moved.
   *
   * An arm on its way between two poses, kept clear along the way by one
   * course: the clearing turn is solved at the fixed shares of the way
   * (`SHARES`) and carried between two neighbouring ones in proportion, and
   * both ends, which hold the room they hold, take none.
   *
   * The room an arm lacks does not fall steadily as it is let out: a forearm
   * that leaves the flank meets the ridge between two shapes of the trunk a few
   * degrees farther out, so the least turn that clears it, solved afresh at
   * each instant, drops from beyond the ridge to before it between two
   * instants. A reach read 9 degrees of clearing at one share and 12 degrees a
   * two-hundredth earlier, a step of 32 mm at the wrist. Solved at fixed shares
   * and carried between them, the turn is a continuous function of the share
   * while the rest of the body holds still; between two keys the arm is as
   * clear as the proportion of two clear arms is.
   * Parameter props: The arm at a share of the way before any clearing (`plain`);
   * the arm the keys' turns are solved on (`planned`: the carry toward a
   * fixed arrival, so the course is a constant of the carry; `plain` when
   * absent); the share asked for; and the clearing of an arm at a share
   * (`clear`, which returns it turned in its upper arm's abduction and its
   * elbow's flexion only).
   * Returns: The arm's joint angles at the share.
   */
  export function course(
    props: ICourseProps,
  ): IAutoMovieMotionHumanArmClearance.IArm {
    return sample(
      (): IAutoMovieMotionHumanArmClearance.IArm => props.plain(props.share),
      (key: number): Turn =>
        turn(key, props.planned ?? props.plain, (arm, share) =>
          props.clear(arm, share),
        ),
      props.share,
    );
  }

  /*
   * Prepare the clearance coefficients for fixed endpoint blends and fixed
   * clearance geometry. The returned reader evaluates the original arm blend
   * and the original piecewise-linear correction at the requested share.
   */
  export function prepareCourse(
    props: Omit<Parameters<typeof course>[0], "share">,
  ): (share: number) => IAutoMovieMotionHumanArmClearance.IArm {
    const turns: Turn[] = SHARES.map(
      (_: number, key: number): Turn =>
        turn(key, props.planned ?? props.plain, props.clear),
    );
    const plain: typeof props.plain = props.plain;
    return (share: number): IAutoMovieMotionHumanArmClearance.IArm =>
      sample(plain, (key: number): Turn => turns[key]!, share);
  }

  /*
   * The shares of the way at which a carry's clearing is solved: the tenths,
   * and the twentieths beside both ends (provisional: each a few centimetres of
   * a hand's way).
   *
   * Under the minimum-jerk profile every carry's weight follows
   * (`AutoMovieMotionClock.envelope`), the first tenth of the way takes a fifth
   * of the carry's time, about three frames of a 0.7 s carry, where the middle
   * tenth takes one. A hand at rest lies against the thigh and leaves it over
   * that first tenth, so the tenth is halved: a blown kiss's fingertips, the
   * rest and the first tenth both clear, pressed 11.3 mm into the thigh between
   * them. The last tenth is halved too: beside the arrival the hand meets its
   * place, and a hand cleared at the ninth tenth and arriving clear can still
   * sweep through the body between them (a parade rest's fingers 17 mm in the
   * hips at 0.93 of the way). A key there once read the goal's own contact as
   * room to clear (22 to 31 degrees at a bite's mouth, an elbow swung 104.5 mm
   * in a frame); beside the arrival a key's allowance is therefore no less than
   * the arrival's own room (`AutoMovieMotionHumanArmCarryCourse`), so the
   * place's contact is never cleared away. The keys are fixed, so the course
   * never chooses between two layouts from one instant to the next: a layout
   * chosen by whether the proportion cleared the arm flipped as a picking
   * hand's fingers closed, and stepped its fingertip 9.4 mm.
   */
  const SHARES: readonly number[] = [
    0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1,
  ];

  /*
   * Read one original key's clearance correction. The fixed ends retain their
   * angles.
   */
  function turn(
    key: number,
    planned: Parameters<typeof course>[0]["plain"],
    clear: Parameters<typeof course>[0]["clear"],
  ): Turn {
    if (key <= 0 || key >= SHARES.length - 1) return [0, 0];
    const share: number = SHARES[key]!;
    const arm: IAutoMovieMotionHumanArmClearance.IArm = planned(share);
    const cleared: IAutoMovieMotionHumanArmClearance.IArm = clear(arm, share);
    return [cleared.upper[1] - arm.upper[1], cleared.lower[0] - arm.lower[0]];
  }

  /*
   * Sample a blended arm plus the course's original correction on the
   * containing interval.
   */
  function sample(
    plain: Parameters<typeof course>[0]["plain"],
    turnAt: (key: number) => Turn,
    at: number,
  ): IAutoMovieMotionHumanArmClearance.IArm {
    const share: number = Math.min(1, Math.max(0, at));
    let before: number = 0;
    while (before < SHARES.length - 2 && SHARES[before + 1]! <= share) before++;
    const weight: number =
      (share - SHARES[before]!) / (SHARES[before + 1]! - SHARES[before]!);
    const a: Turn = turnAt(before);
    const b: Turn = weight === 0 ? a : turnAt(before + 1);
    const arm: IAutoMovieMotionHumanArmClearance.IArm = plain(at);
    return {
      upper: [
        arm.upper[0],
        arm.upper[1] + a[0] + (b[0] - a[0]) * weight,
        arm.upper[2],
      ],
      lower: [
        arm.lower[0] + a[1] + (b[1] - a[1]) * weight,
        arm.lower[1],
        arm.lower[2],
      ],
      hand: arm.hand,
    };
  }

  /*
   * Shoulder abduction and elbow flexion corrections, in clinical degrees.
   */
  type Turn = readonly [number, number];
}

/*
 * The record of `ICourseProps`'s site.
 */
type ICourseProps = {
  plain: (share: number) => IAutoMovieMotionHumanArmClearance.IArm;
  planned?: (share: number) => IAutoMovieMotionHumanArmClearance.IArm;
  share: number;
  clear: (
    arm: IAutoMovieMotionHumanArmClearance.IArm,
    share: number,
  ) => IAutoMovieMotionHumanArmClearance.IArm;
};

/*
 * The record of `IOfProps`'s site.
 */
type IOfProps = {
  arm: IAutoMovieMotionHumanArmClearance.IArm;
  over: (arm: IAutoMovieMotionHumanArmClearance.IArm) => number;
  range: (arm: IAutoMovieMotionHumanArmClearance.IArm) => number;
};
