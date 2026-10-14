import {
  IAutoMovieActorContext,
  makeActorSynthesizer,
  validatePoseResult,
} from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  IAutoMovieActionCall,
  IAutoMovieAngleRange,
  IAutoMovieBone,
  IAutoMovieGait,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton, joint, makePose } from "../internal/fixtures";
import { namedFacts, nclose, violationCount } from "../internal/predicates";

/** The context needs gaits; no locomotion is exercised here. */
const WALK: IAutoMovieGait = {
  name: "walk",
  period: 1,
  limbs: [{ bone: "leftUpperLeg", phase: 0, duty: 0.5, amplitude: 25 }],
};

const range: (min: number, max: number) => IAutoMovieAngleRange = (
  min: number,
  max: number,
): IAutoMovieAngleRange => ({
  min,
  max,
});

/** A cervical constraint: `lookAt` drives flexion and twist, never abduction. */
const cervical: (
  flexion: IAutoMovieAngleRange | null,
  twist: IAutoMovieAngleRange | null,
) => IAutoMovieJointConstraint = (
  flexion: IAutoMovieAngleRange | null,
  twist: IAutoMovieAngleRange | null,
): IAutoMovieJointConstraint => ({ flexion, abduction: null, twist });

/** The gaze chain the S-06 run declared, the one the reproduction ran on. */
const S06: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointConstraint>> = {
  neck: cervical(range(-50, 60), range(-70, 70)),
  head: cervical(range(-30, 30), range(-30, 30)),
};

const rigWith: (
  constraints: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieJointConstraint>
  >,
  drop?: AutoMovieHumanoidBone | null,
) => IAutoMovieSkeleton = (
  constraints: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieJointConstraint>
  >,
  drop: AutoMovieHumanoidBone | null = null,
): IAutoMovieSkeleton => {
  const base: IAutoMovieSkeleton = createSkeleton();
  return {
    ...base,
    bones: base.bones
      .filter((bone: IAutoMovieBone): boolean => bone.bone !== drop)
      .map(
        (bone: IAutoMovieBone): IAutoMovieBone => ({
          ...bone,
          constraint: constraints[bone.bone] ?? bone.constraint,
        }),
      ),
  };
};

/** Eyes at 1.6 m, the height every geometry below is measured from. */
const EYE_HEIGHT: number = 1.6;

const contextOf: (rig: IAutoMovieSkeleton | null) => IAutoMovieActorContext = (
  rig: IAutoMovieSkeleton | null,
): IAutoMovieActorContext => ({
  skeleton: "skeleton-1",
  gaits: [WALK],
  position: { x: 0, y: 0, z: 0 },
  speed: 1,
  facingDeg: 0,
  eyeHeight: EYE_HEIGHT,
  restPose: makePose([joint("spine", { flexion: 0 })]),
  ...(rig === null ? {} : { rig }),
});

const NODES: Map<string, IAutoMovieVector3> = new Map<
  string,
  IAutoMovieVector3
>([["hero", { x: 0, y: 0, z: 0 }]]);

/** The pose one `lookAt` at an explicit point synthesises for this rig. */
const aim: (
  rig: IAutoMovieSkeleton | null,
  point: IAutoMovieVector3,
) => IAutoMoviePose = (
  rig: IAutoMovieSkeleton | null,
  point: IAutoMovieVector3,
): IAutoMoviePose => {
  const action: IAutoMovieActionCall = {
    verb: "lookAt",
    to: { kind: "point", point },
    actor: "hero",
    start: 0,
    duration: 1,
  };
  const contexts: Map<string, IAutoMovieActorContext> = new Map<
    string,
    IAutoMovieActorContext
  >([["hero", contextOf(rig)]]);
  return makeActorSynthesizer(contexts, NODES)(action, "hero")!.keyframes[0]!
    .pose;
};

const boneOf: (
  pose: IAutoMoviePose,
  bone: AutoMovieHumanoidBone,
) => IAutoMovieJointPose | undefined = (
  pose: IAutoMoviePose,
  bone: AutoMovieHumanoidBone,
): IAutoMovieJointPose | undefined =>
  pose.joints.find(
    (entry: IAutoMovieJointPose): boolean => entry.bone === bone,
  );

/** Degrees of flexion the aim formula demands: `+` is a downward tilt. */
const flexionFor: (dy: number, horizontal: number) => number = (
  dy: number,
  horizontal: number,
): number => (-Math.atan2(dy, horizontal) * 180) / Math.PI;

/** Degrees of twist the aim formula demands for a target off to the side. */
const twistFor: (dx: number, dz: number) => number = (
  dx: number,
  dz: number,
): number => (Math.atan2(dx, dz) * 180) / Math.PI;

/** One metre ahead and 1.1 m below eye level: 47.726…° of downward aim. */
const DESK: IAutoMovieVector3 = { x: 0, y: EYE_HEIGHT - 1.1, z: 1 };

/**
 * Observe the actual actor synthesizer's head-first gaze split and pose-ROM result with declared cervical ranges. The cases isolate flexion or twist; their angle sums do not establish a world-space gaze guarantee for simultaneous noncommuting axes or rotated rest frames.
 *
 * Scenarios:
 *
 * 1. The 47.726310993906274-degree downward reproduction yields head 30 plus neck remainder, no pose violations and null neck twist.
 * 2. A shallow head-only aim preserves a single head joint, null abduction and zero twist.
 * 3. An upward aim uses the head minimum -30 plus the neck remainder and passes the pose gate.
 * 4. A 90-degree twist splits head 30 plus neck 60, with head flexion zero and neck flexion null.
 * 5. A null head-twist range leaves head twist exactly zero and sends 60 to the neck, with no pose violations.
 * 6. A narrowed neck takes 10, leaves the positive residual on the head and produces one pose violation; the unit does not assert that violation's diagnostic text or path.
 * 7. A rig-less context emits a single head with the full required angle, null abduction and zero twist.
 * 8. A neckless rig emits a single head with the full required angle and zero twist.
 * 9. A head attached to chest rather than neck emits a single head with the full angle.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs makeActorSynthesizer on concrete rigs and targets, then checks joint population/axes and validatePoseResult counts. Head-only steep aiming, wrong signed capacity, unwanted neck axes or silent clamping contradict the literal outputs.
 * @evidence contracts/testing.md#independent-expectations Target atan2 geometry and authored range endpoints supply expected angles and split residuals, including the independent 47.726310993906274 reference at original 1e-9 tolerance. Other nclose tolerances are unchanged; the formerly exact immobile-axis zero uses eps0. The production pose gate supplies legality counts, not an independent physical eye-direction oracle.
 * @evidence contracts/testing.md#distinguishing-cases Preserves positive/negative flexion, head-only boundary, twist, immobile axis, insufficient chain capacity, absent rig/neck and detached parent, with all original geometry and ranges. Missing head, both-axis FK and animated rest-frame cases are outside this unit.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns each synthesis and pose validation through local rig/aim callbacks. Fixture initialization performs no synthesis or registration; no browser, renderer or native artifact is required.
 */
export function test_perform_look_at_gaze_chain(): void {
  // 1. the reproduction: the chain absorbs what the head alone could not.
  const rig: IAutoMovieSkeleton = rigWith(S06);
  const steep: IAutoMoviePose = aim(rig, DESK);
  const required: number = flexionFor(-1.1, 1);
  TestValidator.predicate(
    "the reproduction's aim is the issue's 47.726 degrees",
    nclose(required, 47.726310993906274, 1e-9),
  );
  const head: IAutoMovieJointPose = boneOf(steep, "head")!;
  const neck: IAutoMovieJointPose = boneOf(steep, "neck")!;
  TestValidator.equals(
    "the head takes its declared maximum and the neck takes the rest",
    namedFacts([
      ["ncloseHeadFlexion", (): boolean => nclose(head.flexion!, 30)],
      [
        "ncloseNeckFlexion",
        (): boolean => nclose(neck.flexion!, required - 30),
      ],
    ]),
    { ncloseHeadFlexion: true, ncloseNeckFlexion: true },
  );
  TestValidator.predicate(
    "the chain aims exactly where the single bone was aiming",
    nclose(head.flexion! + neck.flexion!, required),
  );
  TestValidator.equals(
    "the steep gaze breaks no declared range",
    violationCount(validatePoseResult(steep, rig)),
    0,
  );
  TestValidator.equals(
    "an axis the head holds alone leaves the neck silent",
    neck.twist,
    null,
  );

  // 2. the negative twin: an aim inside the head's own range is untouched.
  const shallow: IAutoMoviePose = aim(rig, { x: 0, y: EYE_HEIGHT - 0.3, z: 1 });
  TestValidator.equals(
    "a gaze the head can hold stays a single-joint pose",
    shallow.joints.map(
      (entry: IAutoMovieJointPose): AutoMovieHumanoidBone => entry.bone,
    ),
    ["head"],
  );
  TestValidator.equals(
    "that single joint carries the whole shallow aim",
    namedFacts([
      [
        "ncloseShallowJoints",
        (): boolean => nclose(shallow.joints[0]!.flexion!, flexionFor(-0.3, 1)),
      ],
      [
        "shallowJointsAbduction",
        (): boolean => shallow.joints[0]!.abduction === null,
      ],
      [
        "ncloseShallowJoints2",
        (): boolean => nclose(shallow.joints[0]!.twist!, 0),
      ],
    ]),
    {
      ncloseShallowJoints: true,
      shallowJointsAbduction: true,
      ncloseShallowJoints2: true,
    },
  );

  // 3. the opposite hemisphere: an upward aim splits through the min side.
  const up: IAutoMoviePose = aim(rig, { x: 0, y: EYE_HEIGHT + 1.4, z: 1 });
  const upward: number = flexionFor(1.4, 1);
  TestValidator.equals(
    "an upward gaze splits at the head's minimum, not its maximum",
    namedFacts([
      [
        "ncloseBoneOfUp",
        (): boolean => nclose(boneOf(up, "head")!.flexion!, -30),
      ],
      [
        "ncloseBoneOfUp2",
        (): boolean => nclose(boneOf(up, "neck")!.flexion!, upward + 30),
      ],
      ["upward", (): boolean => upward < -30],
    ]),
    { ncloseBoneOfUp: true, ncloseBoneOfUp2: true, upward: true },
  );
  TestValidator.equals(
    "the upward gaze breaks no declared range",
    violationCount(validatePoseResult(up, rig)),
    0,
  );

  // 4. the twist axis splits on the same rule, and flexion stays out of it.
  const turned: IAutoMoviePose = aim(rig, { x: 1, y: EYE_HEIGHT, z: 0 });
  TestValidator.equals(
    "a 90 degree turn splits twist 30 + 60 across the chain",
    namedFacts([
      ["ncloseTwistFor", (): boolean => nclose(twistFor(1, 0), 90)],
      [
        "ncloseBoneOfTurned",
        (): boolean => nclose(boneOf(turned, "head")!.twist!, 30),
      ],
      [
        "ncloseBoneOfTurned2",
        (): boolean => nclose(boneOf(turned, "neck")!.twist!, 60),
      ],
    ]),
    {
      ncloseTwistFor: true,
      ncloseBoneOfTurned: true,
      ncloseBoneOfTurned2: true,
    },
  );
  TestValidator.equals(
    "the axis that needed no help contributes nothing",
    namedFacts([
      [
        "ncloseBoneOfTurned",
        (): boolean => nclose(boneOf(turned, "head")!.flexion!, 0),
      ],
      [
        "boneOfTurnedNeck",
        (): boolean => boneOf(turned, "neck")!.flexion === null,
      ],
      [
        "violationCountValidatePoseResultTurned",
        (): boolean => violationCount(validatePoseResult(turned, rig)) === 0,
      ],
    ]),
    {
      ncloseBoneOfTurned: true,
      boneOfTurnedNeck: true,
      violationCountValidatePoseResultTurned: true,
    },
  );

  // 5. an immobile head axis sends the whole turn to the neck.
  const immobile: IAutoMovieSkeleton = rigWith({
    neck: cervical(range(-50, 60), range(-70, 70)),
    head: cervical(range(-30, 30), null),
  });
  const rolled: IAutoMoviePose = aim(immobile, {
    x: Math.sqrt(3),
    y: EYE_HEIGHT,
    z: 1,
  });
  TestValidator.equals(
    "an immobile head twist leaves the head at 0 and the neck at 60",
    namedFacts([
      [
        "ncloseTwistForMath",
        (): boolean => nclose(twistFor(Math.sqrt(3), 1), 60),
      ],
      [
        "boneOfRolledHead",
        (): boolean =>
          boneOf(rolled, "head")!.twist !== null &&
          nclose(boneOf(rolled, "head")!.twist!, 0, 0),
      ],
      [
        "ncloseBoneOfRolled",
        (): boolean => nclose(boneOf(rolled, "neck")!.twist!, 60),
      ],
      [
        "violationCountValidatePoseResultRolled",
        (): boolean =>
          violationCount(validatePoseResult(rolled, immobile)) === 0,
      ],
    ]),
    {
      ncloseTwistForMath: true,
      boneOfRolledHead: true,
      ncloseBoneOfRolled: true,
      violationCountValidatePoseResultRolled: true,
    },
  );

  // 6. a chain that cannot span the aim fails unclamped, like a reach.
  const narrow: IAutoMovieSkeleton = rigWith({
    neck: cervical(range(-10, 10), range(-70, 70)),
    head: cervical(range(-30, 30), range(-30, 30)),
  });
  const impossible: IAutoMoviePose = aim(narrow, DESK);
  const deficit: number = required - 40;
  TestValidator.equals(
    "what neither joint can take rides the head, unclamped",
    namedFacts([
      [
        "ncloseBoneOfImpossible",
        (): boolean => nclose(boneOf(impossible, "neck")!.flexion!, 10),
      ],
      [
        "ncloseBoneOfImpossible2",
        (): boolean =>
          nclose(boneOf(impossible, "head")!.flexion!, 30 + deficit),
      ],
      ["deficit", (): boolean => deficit > 0],
    ]),
    {
      ncloseBoneOfImpossible: true,
      ncloseBoneOfImpossible2: true,
      deficit: true,
    },
  );
  TestValidator.equals(
    "the saturated chain still reports, once",
    violationCount(validatePoseResult(impossible, narrow)),
    1,
  );

  // 7. no rig, no distribution: the pose is what it always was.
  const rigless: IAutoMoviePose = aim(null, DESK);
  TestValidator.equals(
    "a rig-less context poses one bone",
    rigless.joints.map(
      (entry: IAutoMovieJointPose): AutoMovieHumanoidBone => entry.bone,
    ),
    ["head"],
  );
  TestValidator.equals(
    "a rig-less context keeps the whole angle on the head",
    namedFacts([
      [
        "ncloseRiglessJoints",
        (): boolean => nclose(rigless.joints[0]!.flexion!, required),
      ],
      [
        "riglessJointsAbduction",
        (): boolean => rigless.joints[0]!.abduction === null,
      ],
      [
        "ncloseRiglessJoints2",
        (): boolean => nclose(rigless.joints[0]!.twist!, 0),
      ],
    ]),
    {
      ncloseRiglessJoints: true,
      riglessJointsAbduction: true,
      ncloseRiglessJoints2: true,
    },
  );

  // 8. a rig with no neck bone never names one.
  const neckless: IAutoMovieSkeleton = rigWith({ head: S06.head! }, "neck");
  const posed: IAutoMoviePose = aim(neckless, DESK);
  TestValidator.equals(
    "a rig declaring no neck poses one bone",
    posed.joints.map(
      (entry: IAutoMovieJointPose): AutoMovieHumanoidBone => entry.bone,
    ),
    ["head"],
  );
  TestValidator.equals(
    "a rig declaring no neck keeps the single-bone aim",
    namedFacts([
      [
        "nclosePosedJoints",
        (): boolean => nclose(posed.joints[0]!.flexion!, required),
      ],
      ["nclosePosedJoints2", (): boolean => nclose(posed.joints[0]!.twist!, 0)],
    ]),
    { nclosePosedJoints: true, nclosePosedJoints2: true },
  );

  // 9. a neck the head does not hang from carries nothing.
  const detached: IAutoMovieSkeleton = {
    ...rig,
    bones: rig.bones.map(
      (bone: IAutoMovieBone): IAutoMovieBone =>
        bone.bone === "head" ? { ...bone, parent: "chest" } : bone,
    ),
  };
  const sideways: IAutoMoviePose = aim(detached, DESK);
  TestValidator.equals(
    "a head beside the neck poses one bone",
    sideways.joints.map(
      (entry: IAutoMovieJointPose): AutoMovieHumanoidBone => entry.bone,
    ),
    ["head"],
  );
  TestValidator.predicate(
    "and keeps the whole aim on that bone",
    nclose(sideways.joints[0]!.flexion!, required),
  );
}
