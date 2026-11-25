import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  HumanPostureRaw,
  createHumanPostureCurve,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/** World coordinates stay below 3 m across one subtraction and one addition. */
const TRANSLATION_ROUNDING: number = 6 * Number.EPSILON;

/** A free leg goal. */
function leg(x: number): IAutoMovieHumanLimbGoal {
  return { point: { x, y: 0.1, z: 0 }, bend: { x, y: 0.5, z: 0.4 } };
}

/** A posture with free legs and a turn. */
const POSTURE: IAutoMovieMotionHumanPosture = {
  root: { x: 0, y: 0.9, z: 0 },
  yaw: 0,
  pitch: 0,
  roll: 0,
  joints: { spine: [5, 0, 0] },
  limbs: { leftLeg: leg(0.1), rightLeg: leg(-0.1) },
  rotation: { about: { x: 0, y: 1, z: 0 }, turn: { x: 0, y: 0, z: 0, w: 1 } },
};

/**
 * `HumanPostureRaw` is the raw domain a posture may be moved in without a
 * solve: `eligible` holds for a posture with no digit goals and only free leg
 * goals, a goal being free when it sets none of the contexts that ask for an
 * ordinary solve (plant, contact, reference, attachment and the rest);
 * `translated` moves the root to a place and every goal in the world, and the
 * whole-body turn's centre, by the same displacement, a goal riding a bone left
 * as it is, the source untouched. `createHumanPostureCurve` is a constant curve
 * whose every read is a fresh copy.
 *
 * Scenarios:
 *
 * 1. Free legs are eligible; a planted leg, an arm goal or a digit goal is not;
 *    each of the twelve solving contexts makes a goal not free.
 * 2. Moved to (1, 0.9, 2), the legs' points and bends and the turn's centre move
 *    by (1, 0, 2), the joints stay, and the source is unchanged.
 * 3. A leg goal or a digit goal riding a bone is not moved; a world digit goal
 *    is.
 * 4. Two limb keys sharing one goal retain that one goal and translate it once.
 * 5. A constant curve returns equal, distinct copies, unaffected by the input's or
 *    a read's later change.
 */
export function test_motions_posture_posture_raw(): void {
  // 1. Eligibility.
  TestValidator.predicate(
    "free legs only",
    HumanPostureRaw.eligible(POSTURE) &&
      !HumanPostureRaw.eligible({
        ...POSTURE,
        limbs: { leftLeg: { ...leg(0.1), planted: true } },
      }) &&
      !HumanPostureRaw.eligible({ ...POSTURE, limbs: { leftArm: leg(0.3) } }) &&
      !HumanPostureRaw.eligible({ ...POSTURE, digits: {} }),
  );
  const contexts: Partial<IAutoMovieHumanLimbGoal>[] = [
    { elbow: "placed" },
    { planted: false },
    { contact: { x: 0, y: 0, z: 0 } },
    { limits: [] },
    { on: "hips" },
    { reference: { upper: [0, 0, 0], lower: [0, 0, 0] } },
    { seed: { branch: 0, swivel: 0 } },
    { clear: [] },
    { clearExternal: [] },
    { rests: [] },
    { restsOwn: [] },
    { clearanceOn: { clear: [], rests: [] } },
  ];
  TestValidator.predicate(
    "every solving context makes a goal not free",
    HumanPostureRaw.free(leg(0)) &&
      contexts.every(
        (context: Partial<IAutoMovieHumanLimbGoal>): boolean =>
          !HumanPostureRaw.free({ ...leg(0), ...context }),
      ),
  );

  // 2. Translated.
  const moved: IAutoMovieMotionHumanPosture = HumanPostureRaw.translated(
    POSTURE,
    {
      x: 1,
      y: 0.9,
      z: 2,
    },
  );
  TestValidator.predicate(
    "every world goal and the turn moved with the root",
    vclose(moved.root, { x: 1, y: 0.9, z: 2 }, 0) &&
      vclose(moved.limbs.leftLeg!.point, { x: 1.1, y: 0.1, z: 2 }, TRANSLATION_ROUNDING) &&
      vclose(moved.limbs.rightLeg!.bend, { x: 0.9, y: 0.5, z: 2.4 }, TRANSLATION_ROUNDING) &&
      vclose(moved.rotation!.about, { x: 1, y: 1, z: 2 }, TRANSLATION_ROUNDING) &&
      moved.joints.spine![0] === 5 &&
      POSTURE.limbs.leftLeg!.point.x === 0.1 &&
      POSTURE.root.x === 0,
  );

  // 3. A goal on a bone.
  const riding: IAutoMovieMotionHumanPosture = HumanPostureRaw.translated(
    {
      ...POSTURE,
      limbs: { leftLeg: { ...leg(0.1), on: "hips" } },
      digits: {
        leftIndex: { point: { x: 0.3, y: 1, z: 0.2 }, surface: "tip" },
        leftThumb: { point: { x: 0.3, y: 1, z: 0.2 }, surface: "pad", on: "hips" },
      },
    },
    { x: 1, y: 0.9, z: 2 },
  );
  TestValidator.predicate(
    "a goal on a bone stays, a world digit goal moves",
    vclose(riding.limbs.leftLeg!.point, { x: 0.1, y: 0.1, z: 0 }, 0) &&
      vclose(riding.digits!.leftIndex!.point, { x: 1.3, y: 1, z: 2.2 }, TRANSLATION_ROUNDING) &&
      vclose(riding.digits!.leftThumb!.point, { x: 0.3, y: 1, z: 0.2 }, 0),
  );

  // 4. An aliased goal.
  const shared: IAutoMovieHumanLimbGoal = leg(0.25);
  const aliased: IAutoMovieMotionHumanPosture = HumanPostureRaw.translated(
    { ...POSTURE, limbs: { leftLeg: shared, rightLeg: shared } },
    { x: 1, y: 0.9, z: 2 },
  );
  TestValidator.predicate(
    "a shared world goal moves exactly once",
    aliased.limbs.leftLeg === aliased.limbs.rightLeg &&
      vclose(aliased.limbs.leftLeg!.point, { x: 1.25, y: 0.1, z: 2 }, TRANSLATION_ROUNDING),
  );

  // 5. A constant curve.
  const source: IAutoMovieMotionHumanPosture = structuredClone(POSTURE);
  const curve: (seconds: number) => IAutoMovieMotionHumanPosture =
    createHumanPostureCurve(source);
  const a: IAutoMovieMotionHumanPosture = curve(0);
  a.root.x = 9;
  source.root.y = 9;
  const b: IAutoMovieMotionHumanPosture = curve(1);
  TestValidator.predicate(
    "fresh copies of the saved posture",
    a !== b && b.root.x === 0 && b.root.y === 0.9,
  );
}
