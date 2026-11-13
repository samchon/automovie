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
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two exports: the search (`of`), read by `HumanArmClearance.cleared`, which owns the room and range readings, and the course (`course`) over `KEYS` shares of a carry, read by the arm's carry; the bounds, the order and the keys are module constants.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No obstacle is named: the room reading decides what is in the way, and a turn that leaves a joint's range ends its direction instead of being clamped.
 */
export namespace HumanArmClearing {
  /** The most a clearing turns either freedom from the given arm, degrees (provisional: beyond it the arm is no longer the carry's). */
  const SPAN: number = 40;

  /** The step a direction is scanned in for its first clear turn, degrees (provisional: a few centimetres at the hand). */
  const STEP: number = 5;

  /** The room over its allowance a clearing leaves, degrees (provisional: a twentieth of a degree, a quarter of a millimetre at the elbow). */
  const TOLERANCE: number = 0.05;

  /** The bisections that find the least clear turn inside one step: eight halve it to 1/256 of the step, a fiftieth of a degree (provisional). */
  const HALVINGS: number = 8;

  /**
   * The directions a clearing tries, in order, as shares of abduction and of
   * elbow flexion: out, folded, out and folded, then unfolded, out and
   * unfolded, in, in and folded, in and unfolded; and after those eight the
   * eight that lie midway between two of them, in the same order of their
   * angles from out through folded.
   */
  const ORDER: readonly (readonly [number, number])[] = [
    [1, 0],
    [0, 1],
    [Math.SQRT1_2, Math.SQRT1_2],
    [0, -1],
    [Math.SQRT1_2, -Math.SQRT1_2],
    [-1, 0],
    [-Math.SQRT1_2, Math.SQRT1_2],
    [-Math.SQRT1_2, -Math.SQRT1_2],
    ...[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map(
      (degrees: number): readonly [number, number] => [
        Math.cos((degrees * Math.PI) / 180),
        Math.sin((degrees * Math.PI) / 180),
      ],
    ),
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
   * @evidence contracts/development/implementation.md#efficient-algorithms One reading when the arm is clear; otherwise at most twelve readings per direction scanned (a diagonal's length reaches `SPAN` times the square root of 2) and `HALVINGS` more for the one taken.
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
    for (const direction of ORDER) {
      // `SPAN` bounds each freedom, so a ray between the two runs until its
      // larger share reaches it: a diagonal ray stopped at a length of
      // `SPAN` turned each freedom only 28 degrees, and an arm a turn of 40
      // out and 40 unfolded clears was left 3 degrees short of its room.
      const reach: number =
        SPAN / Math.max(Math.abs(direction[0]), Math.abs(direction[1]));
      let near: number = 0;
      while (near < reach - 1e-9) {
        const far: number = Math.min(near + STEP, reach);
        const candidate: HumanArmClearance.IArm = turned(direction, far);
        if (props.range(candidate) > limit) break;
        const value: number = props.over(candidate);
        if (value <= TOLERANCE) {
          // The least turn of this direction that still clears the arm.
          let lo: number = near;
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
        near = far;
      }
    }
    return best;
  }

  /** The equal parts of a carry at whose ends its clearing is solved before any refinement (provisional: tenths, each a few centimetres of a hand's way). */
  const KEYS: number = 10;

  /** How many times a part of the way is halved where its proportion leaves the arm uncleared (provisional: four halvings reach a hundred-and-sixtieth of the way). */
  const DEPTH: number = 4;

  /**
   * An arm on its way between two poses, kept clear along the way by one
   * course: the clearing turn is solved at the `KEYS` equal shares of the
   * way and carried between two neighbouring ones in proportion, and both
   * ends, which hold the room they hold, take none. Where the proportion of
   * two neighbouring keys leaves the arm uncleared at their midpoint, the
   * midpoint becomes a key of its own and each half is read the same way,
   * up to `DEPTH` halvings.
   *
   * The room an arm lacks does not fall steadily as it is let out: a
   * forearm that leaves the flank meets the ridge between two shapes of the
   * trunk a few degrees farther out, so the least turn that clears it,
   * solved afresh at each instant, drops from beyond the ridge to before it
   * between two instants. A reach read 9 degrees of clearing at one share and
   * 12 degrees a two-hundredth earlier, a step of 32 mm at the wrist. Solved
   * at fixed shares and carried between them, the turn is a continuous
   * function of the share while the rest of the body holds still.
   *
   * Between two clear keys the arm need not be clear: a blown kiss's hand
   * leaves a thigh its fingertips rest against, and its wrist's first flexion
   * pressed them 11.3 mm into the thigh inside the first tenth of the way,
   * whose two ends were clear. A key is added only where the proportion
   * fails, so the tenths keep the course they had wherever it already holds.
   *
   * @param props The arm at a share of the way before any clearing (`plain`); the arm the keys' turns are solved on (`planned`: the carry toward a fixed arrival, so the course is a constant of the carry; `plain` when absent); the share asked for; and the clearing of an arm at a share (`clear`, which returns it turned in its upper arm's abduction and its elbow's flexion only, and as given when it is already clear).
   * @returns The arm's joint angles at the share.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the course, its refinement and why, the measured defects of a clearing solved per instant and of the tenths alone, and what is continuous under which condition.
   * @evidence contracts/development/implementation.md#principled-implementation A course fixed at shares of the way does not depend on the instant it is read at, so two neighbouring instants read two neighbouring points of one piecewise-linear turn; the halving depends only on the planned arm, so every share reads the same tree of keys and the turn stays continuous at an added key.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The two tenths around the share, then one loop that halves the part holding the share while its midpoint's proportion is uncleared, and one proportion.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is remembered between calls, so the course is the same in whatever order its instants are read; a body that moves under the arm changes the keys' turns from instant to instant, the remaining place a carried arm can step; past `DEPTH` halvings the proportion is taken as it is.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two clearings a call, none at an end, and per halving one reading of the midpoint's proportion and one clearing when it fails.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Stateless by design: a memory of the keys would have to be keyed by the whole pose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function course(props: {
    plain: (share: number) => HumanArmClearance.IArm;
    planned?: (share: number) => HumanArmClearance.IArm;
    share: number;
    clear: (
      arm: HumanArmClearance.IArm,
      share: number,
    ) => HumanArmClearance.IArm;
  }): HumanArmClearance.IArm {
    const planned = (share: number): HumanArmClearance.IArm =>
      (props.planned ?? props.plain)(share);
    const turned = (
      arm: HumanArmClearance.IArm,
      turn: readonly [number, number],
    ): HumanArmClearance.IArm => ({
      upper: [arm.upper[0], arm.upper[1] + turn[0], arm.upper[2]],
      lower: [arm.lower[0] + turn[1], arm.lower[1], arm.lower[2]],
      hand: arm.hand,
    });
    const turn = (share: number): readonly [number, number] => {
      if (share <= 0 || share >= 1) return [0, 0];
      const arm: HumanArmClearance.IArm = planned(share);
      const clear: HumanArmClearance.IArm = props.clear(arm, share);
      return [clear.upper[1] - arm.upper[1], clear.lower[0] - arm.lower[0]];
    };
    const share: number = Math.min(1, Math.max(0, props.share));
    const before: number = Math.min(KEYS - 1, Math.floor(share * KEYS));
    let from: number = before / KEYS;
    let to: number = (before + 1) / KEYS;
    let a: readonly [number, number] = turn(from);
    let b: readonly [number, number] = share === from ? a : turn(to);
    // The part of the way holding the share is halved while the proportion
    // of its two keys leaves the planned arm uncleared at its midpoint.
    for (let depth: number = 0; depth < DEPTH && share !== from; depth++) {
      const middle: number = (from + to) / 2;
      const blended: HumanArmClearance.IArm = turned(planned(middle), [
        (a[0] + b[0]) / 2,
        (a[1] + b[1]) / 2,
      ]);
      const cleared: HumanArmClearance.IArm = props.clear(blended, middle);
      if (
        cleared.upper[1] === blended.upper[1] &&
        cleared.lower[0] === blended.lower[0]
      )
        break;
      const own: readonly [number, number] = turn(middle);
      if (share < middle) {
        to = middle;
        b = own;
      } else {
        from = middle;
        a = own;
      }
    }
    const weight: number = (share - from) / (to - from);
    return turned(props.plain(props.share), [
      a[0] + (b[0] - a[0]) * weight,
      a[1] + (b[1] - a[1]) * weight,
    ]);
  }
}
