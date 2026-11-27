import { AutoMovieEngineValidation, AutoMovieEngineFilm } from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  IAutoMovieActionCall,
  type IAutoMovieActorContext,
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
import { nclose, violationCount } from "../internal/predicates";

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
  return AutoMovieEngineFilm.makeActorSynthesizer(contexts, NODES)(action, "hero")!.keyframes[0]!
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

/**
 * Allocates the requested eye angle to the head, then its actual parent neck.
 * Scenarios:
 * - Positive and negative flexion, head-only flexion, lateral gaze and a locked head axis.
 * - An exhausted neck leaves an observable violation; absent and disconnected necks cannot carry the residual.
 * @evidence contracts/development/testing.md#behavioral-verification Reads each joint and the independent public pose validator.
 * @evidence contracts/development/testing.md#independent-expectations Arc tangent yields the requested angle; subtracting the available head range gives the neck share.
 * @evidence contracts/development/testing.md#distinguishing-cases Samples both range signs, excess demand and absent cervical hierarchy.
 * @evidence contracts/development/testing.md#execution-ownership Uses one skeleton topology with surgical variations to its range or parent.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies angular and anatomy boundaries.
 */
export function test_motion_gaze_chain_limits(): void {
  const rig = rigWith(S06),
    desk = { x: 0, y: EYE_HEIGHT - 1.1, z: 1 };
  for (const dy of [-1.1, -0.3, 1.4]) {
    const demanded = (-Math.atan2(dy, 1) * 180) / Math.PI;
    const head = Math.max(-30, Math.min(30, demanded));
    const pose = aim(rig, { x: 0, y: EYE_HEIGHT + dy, z: 1 });
    const h = boneOf(pose, "head")!,
      n = boneOf(pose, "neck");
    TestValidator.predicate(
      "head consumes available flexion",
      nclose(h.flexion!, head) && h.abduction === null && nclose(h.twist!, 0),
    );
    if (head === demanded)
      TestValidator.equals(
        "no cervical residual",
        pose.joints.map((j) => j.bone),
        ["head"],
      );
    else
      TestValidator.predicate(
        "neck holds exact excess on one axis",
        nclose(n!.flexion!, demanded - head) && n!.twist === null,
      );
    TestValidator.equals(
      "admitted distribution",
      violationCount(AutoMovieEngineValidation.validatePoseResult(pose, rig)),
      0,
    );
  }
  const locked = rigWith({ ...S06, head: cervical(range(-30, 30), null) });
  for (const [skeleton, x, z, head, neck] of [
    [rig, 1, 0, 30, 60],
    [locked, Math.sqrt(3), 1, 0, 60],
  ] as const) {
    const pose = aim(skeleton, { x, y: EYE_HEIGHT, z });
    const h = boneOf(pose, "head")!,
      n = boneOf(pose, "neck")!;
    TestValidator.predicate(
      "twist follows available head rotation",
      nclose(h.twist!, head) &&
        nclose(n.twist!, neck) &&
        nclose(h.flexion!, 0) &&
        n.flexion === null,
    );
    TestValidator.equals(
      "twist inside each joint limit",
      violationCount(AutoMovieEngineValidation.validatePoseResult(pose, skeleton)),
      0,
    );
  }
  const restricted = rigWith({
    ...S06,
    neck: cervical(range(-10, 10), range(-70, 70)),
  });
  const pose = aim(restricted, desk),
    angle = (Math.atan2(1.1, 1) * 180) / Math.PI;
  TestValidator.predicate(
    "requested direction survives exhaustion",
    nclose(boneOf(pose, "neck")!.flexion!, 10) &&
      nclose(boneOf(pose, "head")!.flexion!, angle - 10),
  );
  TestValidator.equals(
    "unattainable direction reports one violation",
    violationCount(AutoMovieEngineValidation.validatePoseResult(pose, restricted)),
    1,
  );
  const detached: IAutoMovieSkeleton = {
    ...rig,
    bones: rig.bones.map((b) =>
      b.bone === "head" ? { ...b, parent: "chest" } : b,
    ),
  };
  for (const skeleton of [
    null,
    rigWith({ head: S06.head! }, "neck"),
    detached,
  ]) {
    const solo = aim(skeleton, desk);
    TestValidator.equals(
      "gaze has a single anatomical owner",
      solo.joints.map((j) => j.bone),
      ["head"],
    );
    const h = solo.joints[0]!;
    TestValidator.predicate(
      "head carries complete raw direction",
      nclose(h.flexion!, angle) && nclose(h.twist!, 0) && h.abduction === null,
    );
  }
}
