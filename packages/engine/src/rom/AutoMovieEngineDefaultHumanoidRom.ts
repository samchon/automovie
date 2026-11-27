import type { AutoMovieHumanoidBone, IAutoMovieJointConstraint } from "@automovie/interface";

import { AutoMovieEngineAnkleDorsiflexion } from "./AutoMovieEngineAnkleDorsiflexion";
import { DefaultHumanoidRomData } from "./internal/DefaultHumanoidRomData";


/**
 * Default anatomical range-of-motion table for the normalized humanoid, keyed
 * by {@link AutoMovieHumanoidBone}.
 *
 * These are **approximate clinical norms** (goniometry), in degrees, under the
 * sign convention documented on {@link IAutoMovieJointConstraint}: flexion (+) /
 * extension (−) about the sagittal axis, abduction (+) / adduction (−) about
 * the frontal axis, external (+) / internal (−) about the limb's long axis.
 * Left and right limbs share these clinical ranges; `AutoMovieEngineHumanoidRestFrame` maps
 * each onto its side of the T-pose rig, so a value means the same motion on
 * both sides.
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
 *
 * The shoulders are gated by swing and twist
 * (`IAutoMovieJointConstraint.swingTwist`): the limb may point wherever its
 * flexion and abduction intervals (and the cone) reach, and may turn about its
 * own axis within an interval measured from the rig's rest pose. Their clinical
 * `twist` interval is then a reading only. Read as three angles, the shoulder's
 * twist range is fixed in a frame that turns once about the arm pointing
 * straight ahead, so two arms a fraction of a degree apart there could lie one
 * inside and one far outside it, and an arm on a table with its forearm up
 * (flexion 135, abduction 71) read only 22 degrees of external rotation left.
 * The shoulder's rest is the T-pose, 90 degrees of abduction, where its
 * rotation is measured clinically (external 90, internal 70, as relayed for the
 * AAOS norms and not checked against a primary source here). Measured from that
 * rest, the turn a raised or a lowered arm needs is larger: a hand behind the
 * head reads 128 degrees and a hand clasped behind the back -104 (the reaches
 * of `test_motion_fit_chain_reach`, which the three-angle box admitted). So the
 * interval is [-110, 135], provisional: one interval for every swing, where the
 * anatomical limit depends on the swing (Codman's paradox: the turn a swing
 * adds makes one interval of clinical rotation, internal 70 and external 90 at
 * 90 degrees of abduction, refuse a hand behind the head by 38 degrees and one
 * behind the back by 34). Their swing is capped at `REACH` from the T-pose, so
 * the rest direction's antipode, the arm pointing through the chest, where the
 * twist has no value, lies 50 degrees outside the range. The hips keep the
 * three-angle gate: their twist is proximal, about the rest axis, and measured
 * from rest by swing and twist the turns their box admits run from -106 to 91
 * degrees (deep flexion with abduction), which no one interval of the clinical
 * 45 each way holds: a deadlift's planted feet slid 33.6 mm under it.
 */
export const AutoMovieEngineDefaultHumanoidRom: Partial<
  Record<AutoMovieHumanoidBone, IAutoMovieJointConstraint>
> = {
  // ── spine / head ──
  spine: DefaultHumanoidRomData.constraint(DefaultHumanoidRomData.range(-30, 80), DefaultHumanoidRomData.range(-35, 35), DefaultHumanoidRomData.range(-45, 45)),
  chest: DefaultHumanoidRomData.constraint(DefaultHumanoidRomData.range(-20, 40), DefaultHumanoidRomData.range(-25, 25), DefaultHumanoidRomData.range(-35, 35)),
  upperChest: DefaultHumanoidRomData.constraint(DefaultHumanoidRomData.range(-15, 30), DefaultHumanoidRomData.range(-20, 20), DefaultHumanoidRomData.range(-30, 30)),
  neck: DefaultHumanoidRomData.constraint(DefaultHumanoidRomData.range(-50, 45), DefaultHumanoidRomData.range(-40, 40), DefaultHumanoidRomData.range(-70, 70)),
  head: DefaultHumanoidRomData.constraint(DefaultHumanoidRomData.range(-50, 45), DefaultHumanoidRomData.range(-40, 40), DefaultHumanoidRomData.range(-70, 70)),
  // The jaw and eyes have no `AutoMovieEngineHumanoidJointAxes` entry, so they read the
  // default basis: flexion about X (jaw opening, gaze down), twist about Y (a
  // sideways jaw shift, a horizontal gaze) and abduction about Z, a roll
  // neither performs.
  jaw: DefaultHumanoidRomData.constraint(DefaultHumanoidRomData.range(0, 35), null, DefaultHumanoidRomData.range(-10, 10)),
  leftEye: DefaultHumanoidRomData.constraint(DefaultHumanoidRomData.range(-30, 30), null, DefaultHumanoidRomData.range(-45, 45)),
  rightEye: DefaultHumanoidRomData.constraint(DefaultHumanoidRomData.range(-30, 30), null, DefaultHumanoidRomData.range(-45, 45)),

  // ── arms ──
  leftShoulder: DefaultHumanoidRomData.constraint(DefaultHumanoidRomData.range(-15, 30), DefaultHumanoidRomData.range(-30, 30), null),
  rightShoulder: DefaultHumanoidRomData.constraint(DefaultHumanoidRomData.range(-15, 30), DefaultHumanoidRomData.range(-30, 30), null),
  leftUpperArm: DefaultHumanoidRomData.ballConstraint(
    DefaultHumanoidRomData.range(-60, 180),
    DefaultHumanoidRomData.range(-30, 180),
    DefaultHumanoidRomData.range(-90, 90),
    180,
    DefaultHumanoidRomData.range(-110, 135),
    DefaultHumanoidRomData.REACH,
  ),
  rightUpperArm: DefaultHumanoidRomData.ballConstraint(
    DefaultHumanoidRomData.range(-60, 180),
    DefaultHumanoidRomData.range(-30, 180),
    DefaultHumanoidRomData.range(-90, 90),
    180,
    DefaultHumanoidRomData.range(-110, 135),
    DefaultHumanoidRomData.REACH,
  ),
  leftLowerArm: DefaultHumanoidRomData.constraint(DefaultHumanoidRomData.range(0, 150), null, DefaultHumanoidRomData.range(-90, 90)),
  rightLowerArm: DefaultHumanoidRomData.constraint(DefaultHumanoidRomData.range(0, 150), null, DefaultHumanoidRomData.range(-90, 90)),
  leftHand: DefaultHumanoidRomData.constraint(DefaultHumanoidRomData.range(-80, 70), DefaultHumanoidRomData.range(-30, 20), null),
  rightHand: DefaultHumanoidRomData.constraint(DefaultHumanoidRomData.range(-80, 70), DefaultHumanoidRomData.range(-30, 20), null),

  // ── legs ──
  leftUpperLeg: {
    ...DefaultHumanoidRomData.ballConstraint(DefaultHumanoidRomData.range(-30, 120), DefaultHumanoidRomData.range(-30, 45), DefaultHumanoidRomData.range(-45, 45), 120),
    abductionFlexed: DefaultHumanoidRomData.HIP_FLEXED_ABDUCTION,
  },
  rightUpperLeg: {
    ...DefaultHumanoidRomData.ballConstraint(DefaultHumanoidRomData.range(-30, 120), DefaultHumanoidRomData.range(-30, 45), DefaultHumanoidRomData.range(-45, 45), 120),
    abductionFlexed: DefaultHumanoidRomData.HIP_FLEXED_ABDUCTION,
  },
  leftLowerLeg: DefaultHumanoidRomData.constraint(DefaultHumanoidRomData.range(0, 150), null, null),
  rightLowerLeg: DefaultHumanoidRomData.constraint(DefaultHumanoidRomData.range(0, 150), null, null),
  // A foot's dorsiflexion reaches its loaded limit: a bearing foot is taken
  // that far by the body's weight (`AutoMovieEngineAnkleDorsiflexion`).
  leftFoot: DefaultHumanoidRomData.constraint(
    DefaultHumanoidRomData.range(-50, AutoMovieEngineAnkleDorsiflexion.loaded),
    DefaultHumanoidRomData.range(-25, 25),
    null,
  ),
  rightFoot: DefaultHumanoidRomData.constraint(
    DefaultHumanoidRomData.range(-50, AutoMovieEngineAnkleDorsiflexion.loaded),
    DefaultHumanoidRomData.range(-25, 25),
    null,
  ),
  leftToes: DefaultHumanoidRomData.constraint(DefaultHumanoidRomData.range(-40, 80), null, null),
  rightToes: DefaultHumanoidRomData.constraint(DefaultHumanoidRomData.range(-40, 80), null, null),

  // ── fingers ──
  leftThumbMetacarpal: DefaultHumanoidRomData.THUMB_BASE,
  leftThumbProximal: DefaultHumanoidRomData.THUMB_MIDDLE,
  leftThumbDistal: DefaultHumanoidRomData.THUMB_END,
  leftIndexProximal: DefaultHumanoidRomData.KNUCKLE,
  leftIndexIntermediate: DefaultHumanoidRomData.MIDDLE_JOINT,
  leftIndexDistal: DefaultHumanoidRomData.END_JOINT,
  leftMiddleProximal: DefaultHumanoidRomData.KNUCKLE,
  leftMiddleIntermediate: DefaultHumanoidRomData.MIDDLE_JOINT,
  leftMiddleDistal: DefaultHumanoidRomData.END_JOINT,
  leftRingProximal: DefaultHumanoidRomData.KNUCKLE,
  leftRingIntermediate: DefaultHumanoidRomData.MIDDLE_JOINT,
  leftRingDistal: DefaultHumanoidRomData.END_JOINT,
  leftLittleProximal: DefaultHumanoidRomData.KNUCKLE,
  leftLittleIntermediate: DefaultHumanoidRomData.MIDDLE_JOINT,
  leftLittleDistal: DefaultHumanoidRomData.END_JOINT,
  rightThumbMetacarpal: DefaultHumanoidRomData.THUMB_BASE,
  rightThumbProximal: DefaultHumanoidRomData.THUMB_MIDDLE,
  rightThumbDistal: DefaultHumanoidRomData.THUMB_END,
  rightIndexProximal: DefaultHumanoidRomData.KNUCKLE,
  rightIndexIntermediate: DefaultHumanoidRomData.MIDDLE_JOINT,
  rightIndexDistal: DefaultHumanoidRomData.END_JOINT,
  rightMiddleProximal: DefaultHumanoidRomData.KNUCKLE,
  rightMiddleIntermediate: DefaultHumanoidRomData.MIDDLE_JOINT,
  rightMiddleDistal: DefaultHumanoidRomData.END_JOINT,
  rightRingProximal: DefaultHumanoidRomData.KNUCKLE,
  rightRingIntermediate: DefaultHumanoidRomData.MIDDLE_JOINT,
  rightRingDistal: DefaultHumanoidRomData.END_JOINT,
  rightLittleProximal: DefaultHumanoidRomData.KNUCKLE,
  rightLittleIntermediate: DefaultHumanoidRomData.MIDDLE_JOINT,
  rightLittleDistal: DefaultHumanoidRomData.END_JOINT,
};
