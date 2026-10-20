import {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieJointConstraint,
} from "@automovie/interface";

const range = (min: number, max: number): IAutoMovieAngleRange => ({
  min,
  max,
});

const constraint = (
  flexion: IAutoMovieAngleRange | null,
  abduction: IAutoMovieAngleRange | null,
  twist: IAutoMovieAngleRange | null,
): IAutoMovieJointConstraint => ({ flexion, abduction, twist });

const ballConstraint = (
  flexion: IAutoMovieAngleRange | null,
  abduction: IAutoMovieAngleRange | null,
  twist: IAutoMovieAngleRange | null,
  swingDeg: number,
): IAutoMovieJointConstraint => ({ flexion, abduction, twist, swingDeg });

/**
 * Generic finger phalanx: flexes forward, slight hyperextension, no
 * abduction/twist.
 */
const FINGER = constraint(range(-20, 100), null, null);

/**
 * Default anatomical range-of-motion table for the normalized humanoid, keyed
 * by {@link AutoMovieHumanoidBone}.
 *
 * These are **approximate clinical norms** (goniometry), in degrees, under the
 * sign convention documented on {@link IAutoMovieJointConstraint}: flexion (+) /
 * extension (−) about the sagittal axis, abduction (+) / adduction (−) about
 * the frontal axis, external (+) / internal (−) about the limb's long axis.
 * Left and right limbs share these clinical ranges; `HUMANOID_REST_FRAME`
 * maps each onto its side of the T-pose rig, so a value means the same motion
 * on both sides.
 *
 * A bone absent from this table (or an axis set to `null`) is treated as
 * unconstrained / immobile on that axis. A skeleton may override any of these
 * per-bone via {@link IAutoMovieBone.constraint} (a contortionist, a stylized
 * non-human rig); this table is only the fallback.
 *
 * These numbers are a deliberate, documented baseline: good enough to reject
 * grossly impossible poses (a backward elbow, a hyper-extended knee). Sourcing
 * exact per-population norms is tracked as future work.
 *
 * Ball-joint `swingDeg` caps use AAOS normal pure-plane maxima that must stay
 * legal on their own: shoulder flexion/abduction 180 degrees, hip flexion 120
 * degrees. The cone is a conservative combined flexion+abduction cap, not a
 * population-specific reach envelope.
 *
 * The HIP cone is live (its 120° cap sits below the flexion+abduction corner,
 * so max-flexion + max-abduction trips it); the SHOULDER cone is deliberate
 * headroom (#1058, decision 310): the swing metric never exceeds 180°, and a
 * pure-plane 180° (arm straight overhead) must stay legal, so no cap below 180
 * is possible without rejecting canonical overhead poses. The value documents
 * the sourced anatomical bound rather than gating anything.
 */
export const DEFAULT_HUMANOID_ROM: Partial<
  Record<AutoMovieHumanoidBone, IAutoMovieJointConstraint>
> = {
  // ── spine / head ──
  spine: constraint(range(-30, 80), range(-35, 35), range(-45, 45)),
  chest: constraint(range(-20, 40), range(-25, 25), range(-35, 35)),
  upperChest: constraint(range(-15, 30), range(-20, 20), range(-30, 30)),
  neck: constraint(range(-50, 45), range(-40, 40), range(-70, 70)),
  head: constraint(range(-50, 45), range(-40, 40), range(-70, 70)),
  // The jaw and eyes have no `HUMANOID_JOINT_AXES` entry, so they read the
  // default basis: flexion about X (jaw opening, gaze down), twist about Y (a
  // sideways jaw shift, a horizontal gaze) and abduction about Z, a roll
  // neither performs.
  jaw: constraint(range(0, 35), null, range(-10, 10)),
  leftEye: constraint(range(-30, 30), null, range(-45, 45)),
  rightEye: constraint(range(-30, 30), null, range(-45, 45)),

  // ── arms ──
  leftShoulder: constraint(range(-15, 30), range(-30, 30), null),
  rightShoulder: constraint(range(-15, 30), range(-30, 30), null),
  leftUpperArm: ballConstraint(
    range(-60, 180),
    range(-30, 180),
    range(-90, 90),
    180,
  ),
  rightUpperArm: ballConstraint(
    range(-60, 180),
    range(-30, 180),
    range(-90, 90),
    180,
  ),
  leftLowerArm: constraint(range(0, 150), null, range(-90, 90)),
  rightLowerArm: constraint(range(0, 150), null, range(-90, 90)),
  leftHand: constraint(range(-80, 70), range(-30, 20), null),
  rightHand: constraint(range(-80, 70), range(-30, 20), null),

  // ── legs ──
  leftUpperLeg: ballConstraint(
    range(-30, 120),
    range(-30, 45),
    range(-45, 45),
    120,
  ),
  rightUpperLeg: ballConstraint(
    range(-30, 120),
    range(-30, 45),
    range(-45, 45),
    120,
  ),
  leftLowerLeg: constraint(range(0, 150), null, null),
  rightLowerLeg: constraint(range(0, 150), null, null),
  leftFoot: constraint(range(-50, 20), range(-25, 25), null),
  rightFoot: constraint(range(-50, 20), range(-25, 25), null),
  leftToes: constraint(range(-40, 80), null, null),
  rightToes: constraint(range(-40, 80), null, null),

  // ── fingers (generic) ──
  leftThumbMetacarpal: FINGER,
  leftThumbProximal: FINGER,
  leftThumbDistal: FINGER,
  leftIndexProximal: FINGER,
  leftIndexIntermediate: FINGER,
  leftIndexDistal: FINGER,
  leftMiddleProximal: FINGER,
  leftMiddleIntermediate: FINGER,
  leftMiddleDistal: FINGER,
  leftRingProximal: FINGER,
  leftRingIntermediate: FINGER,
  leftRingDistal: FINGER,
  leftLittleProximal: FINGER,
  leftLittleIntermediate: FINGER,
  leftLittleDistal: FINGER,
  rightThumbMetacarpal: FINGER,
  rightThumbProximal: FINGER,
  rightThumbDistal: FINGER,
  rightIndexProximal: FINGER,
  rightIndexIntermediate: FINGER,
  rightIndexDistal: FINGER,
  rightMiddleProximal: FINGER,
  rightMiddleIntermediate: FINGER,
  rightMiddleDistal: FINGER,
  rightRingProximal: FINGER,
  rightRingIntermediate: FINGER,
  rightRingDistal: FINGER,
  rightLittleProximal: FINGER,
  rightLittleIntermediate: FINGER,
  rightLittleDistal: FINGER,
};
