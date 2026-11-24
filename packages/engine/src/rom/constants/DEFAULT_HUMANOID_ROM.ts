import type {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieFlexedAbduction,
  IAutoMovieJointConstraint,
} from "@automovie/interface";

import { ANKLE_DORSIFLEXION } from "./ANKLE_DORSIFLEXION";

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
  turn?: IAutoMovieAngleRange,
  reach?: number,
): IAutoMovieJointConstraint => ({
  flexion,
  abduction,
  twist,
  swingDeg,
  ...(turn === undefined
    ? {}
    : {
        swingTwist: { twist: turn, ...(reach === undefined ? {} : { reach }) },
      }),
});

/**
 * A finger's metacarpophalangeal joint (the knuckle): flexion 90 and
 * hyperextension 45, abduction 30 to either side, no axial turn. The upper
 * values of the active norms in McGraw-Hill's goniometry table (Prentice,
 * "Rehabilitation Techniques for Sports Medicine and Athletic Training", ch. 8:
 * MCP flexion 85-90, extension 30-45, abduction 20-30); the adduction toward
 * the middle finger mirrors the abduction, provisional (no located source
 * tabulates it apart). A two-freedom joint with no third freedom to read twice,
 * so its box of flexion and abduction is its own coordinate range and needs no
 * swing-twist gate.
 */
const KNUCKLE = constraint(range(-45, 90), range(-30, 30), null);

/**
 * A hip's abduction ceiling flexed: 45 degrees with the hip straight (the
 * `abduction` interval's own) rising to 60 with the hip flexed 90, the upper
 * AAOS 1965 norm for abduction with the hip and knee flexed 90 (45-60), as
 * Cejudo, Sainz de Baranda, Santonja and Ayala tabulate it (2016, SporTK
 * 5(1):35-46, Table 1); flexion slackens the ligaments that stop a straight
 * hip's abduction (Kapandji, as they cite).
 */
const HIP_FLEXED_ABDUCTION: IAutoMovieFlexedAbduction = {
  flexion: 90,
  max: 60,
};

/**
 * A finger's proximal interphalangeal joint: a hinge, flexion 0 to 115 (the
 * same table's 100-115).
 */
const MIDDLE_JOINT = constraint(range(0, 115), null, null);

/**
 * A finger's distal interphalangeal joint: a hinge, flexion 90 and
 * hyperextension 20 (the same table's 80-90 and 20; AAOS 90 as relayed).
 */
const END_JOINT = constraint(range(-20, 90), null, null);

/**
 * The thumb's carpometacarpal joint, a saddle, gated by swing and twist.
 * Cooney, Lucca, Chao and Linscheid 1981 (J Bone Joint Surg Am 63:1371-1381)
 * measured total arcs of 53 degrees of flexion-extension, 42 of
 * abduction-adduction and 17 of axial rotation on biplane radiographs of 19
 * subjects. The rig reads the thumb on the hand's basis (`HUMANOID_JOINT_AXES`,
 * "as an approximation"), so its flexion, about the axis across the hand, moves
 * the thumb out of the palm's plane toward the palm: anatomical palmar
 * abduction, the 42-degree arc, from the rest (0) to 42. The rig's rest thumb
 * does not lie in the palm's plane: its neutral stops where its skin clears the
 * hand's (`AutoMovieHumanNeutralThumbCmc`), which leaves its tip about 20
 * degrees palmar of the knuckles' plane, so a palm laid flat on a floor would
 * sink the thumb. The joint's retroposition, the thumb carried back behind the
 * palm's plane (25 to 38 degrees, 31 ± 4, in 100 asymptomatic adults: Barakat,
 * Field and Taylor 2013, Hand 8(2):179-182), is admitted to -25, the low end of
 * that normal range, which brings the thumb into the palm's plane and some way
 * past it. Its abduction, about the palm's normal, swings the thumb within the
 * palm's plane: anatomical flexion-extension, the 53-degree arc, split evenly
 * about the rest (provisional: the rest's place in Cooney's arc is not stated).
 * The axial rotation's 17 degrees are split evenly likewise (provisional).
 */
const THUMB_BASE: IAutoMovieJointConstraint = {
  flexion: range(-25, 42),
  abduction: range(-26.5, 26.5),
  twist: range(-8.5, 8.5),
  swingTwist: { twist: range(-8.5, 8.5) },
};

/**
 * The thumb's metacarpophalangeal joint: flexion 0 to 55 (the same goniometry
 * table's 50-55); its small abduction has no located norm, so it stays
 * immobile.
 */
const THUMB_MIDDLE = constraint(range(0, 55), null, null);

/**
 * The thumb's interphalangeal joint: flexion 90 and hyperextension 5 (the same
 * table's 85-90 and 0-5).
 */
const THUMB_END = constraint(range(-5, 90), null, null);

/**
 * The farthest a shoulder's arm points from the T-pose, degrees, which keeps
 * the rest direction's antipode (the arm pointing through the chest, where the
 * twist has no value) outside the range. Provisional, with a known defect: one
 * radius on every great circle is a generalisation the anatomy does not have.
 * The shoulder's directional limit is a measured cone that varies with the
 * plane of elevation (Engin and Chen 1986, J Biomech Eng 108:215), not reached;
 * the figure is horizontal adduction from 90 degrees of abduction, 130 in
 * Physiotutors' active range of motion norms (IDEA gives 140; Norkin and White
 * tabulate none), and applied elsewhere it clamps a hand wiping the mouth,
 * which reaches 131, and an elbow brought to the midline ahead of the chest
 * (half the shoulder breadth across: 135 degrees for an upper arm of 0.226 m on
 * a half breadth of 0.153 m). That figure is the clinical angle only on the
 * horizontal great circle: the test starts at the T-pose and turns the arm in
 * the horizontal plane, so its angle is this swing there and no other circle
 * has a stated norm. The arm planner's variables are the swing-twist chart this
 * radius scales, so the figure is not changed for one place: a wider one
 * changes every arm trajectory's chart.
 */
const REACH: number = 130;

/**
 * Default anatomical range-of-motion table for the normalized humanoid, keyed
 * by {@link AutoMovieHumanoidBone}.
 *
 * These are **approximate clinical norms** (goniometry), in degrees, under the
 * sign convention documented on {@link IAutoMovieJointConstraint}: flexion (+) /
 * extension (−) about the sagittal axis, abduction (+) / adduction (−) about
 * the frontal axis, external (+) / internal (−) about the limb's long axis.
 * Left and right limbs share these clinical ranges; `HUMANOID_REST_FRAME` maps
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
    range(-110, 135),
    REACH,
  ),
  rightUpperArm: ballConstraint(
    range(-60, 180),
    range(-30, 180),
    range(-90, 90),
    180,
    range(-110, 135),
    REACH,
  ),
  leftLowerArm: constraint(range(0, 150), null, range(-90, 90)),
  rightLowerArm: constraint(range(0, 150), null, range(-90, 90)),
  leftHand: constraint(range(-80, 70), range(-30, 20), null),
  rightHand: constraint(range(-80, 70), range(-30, 20), null),

  // ── legs ──
  leftUpperLeg: {
    ...ballConstraint(range(-30, 120), range(-30, 45), range(-45, 45), 120),
    abductionFlexed: HIP_FLEXED_ABDUCTION,
  },
  rightUpperLeg: {
    ...ballConstraint(range(-30, 120), range(-30, 45), range(-45, 45), 120),
    abductionFlexed: HIP_FLEXED_ABDUCTION,
  },
  leftLowerLeg: constraint(range(0, 150), null, null),
  rightLowerLeg: constraint(range(0, 150), null, null),
  // A foot's dorsiflexion reaches its loaded limit: a bearing foot is taken
  // that far by the body's weight (`ANKLE_DORSIFLEXION`).
  leftFoot: constraint(
    range(-50, ANKLE_DORSIFLEXION.loaded),
    range(-25, 25),
    null,
  ),
  rightFoot: constraint(
    range(-50, ANKLE_DORSIFLEXION.loaded),
    range(-25, 25),
    null,
  ),
  leftToes: constraint(range(-40, 80), null, null),
  rightToes: constraint(range(-40, 80), null, null),

  // ── fingers ──
  leftThumbMetacarpal: THUMB_BASE,
  leftThumbProximal: THUMB_MIDDLE,
  leftThumbDistal: THUMB_END,
  leftIndexProximal: KNUCKLE,
  leftIndexIntermediate: MIDDLE_JOINT,
  leftIndexDistal: END_JOINT,
  leftMiddleProximal: KNUCKLE,
  leftMiddleIntermediate: MIDDLE_JOINT,
  leftMiddleDistal: END_JOINT,
  leftRingProximal: KNUCKLE,
  leftRingIntermediate: MIDDLE_JOINT,
  leftRingDistal: END_JOINT,
  leftLittleProximal: KNUCKLE,
  leftLittleIntermediate: MIDDLE_JOINT,
  leftLittleDistal: END_JOINT,
  rightThumbMetacarpal: THUMB_BASE,
  rightThumbProximal: THUMB_MIDDLE,
  rightThumbDistal: THUMB_END,
  rightIndexProximal: KNUCKLE,
  rightIndexIntermediate: MIDDLE_JOINT,
  rightIndexDistal: END_JOINT,
  rightMiddleProximal: KNUCKLE,
  rightMiddleIntermediate: MIDDLE_JOINT,
  rightMiddleDistal: END_JOINT,
  rightRingProximal: KNUCKLE,
  rightRingIntermediate: MIDDLE_JOINT,
  rightRingDistal: END_JOINT,
  rightLittleProximal: KNUCKLE,
  rightLittleIntermediate: MIDDLE_JOINT,
  rightLittleDistal: END_JOINT,
};

