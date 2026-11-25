import { measurePhysicalJointLimits } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCollapse,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import type { HumanPerformance } from "@automovie/motions";

/**
 * Print one opt-in diagnostic record from the existing test performance. Read
 * the displayed joint frames and native arm limits through the whole take and
 * on both sides of its event times.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the source of displayed frames, joint limits and timing evidence.
 */
export function observeCollapseTrajectory(
  film: HumanPerformance,
  body: IAutoMovieMotionHumanBody,
  scope: {
    cast: string;
    direction: IAutoMovieMotionHumanCollapse.Direction;
    tone: IAutoMovieMotionHumanCollapse.Tone;
  },
): void {
  const end: number = film.duration;
  const joints: readonly AutoMovieHumanoidBone[] = [
    "hips",
    "chest",
    "leftUpperArm",
    "leftLowerArm",
    "leftHand",
    "rightUpperArm",
    "rightLowerArm",
    "rightHand",
  ];
  const jointsToMeasure = body.profile.joints.filter(({ child }): boolean =>
    /^(left|right)(UpperArm|LowerArm)$/.test(child),
  );
  const sample = (time: number) => {
    const bones = film.bones("a", time);
    const transform = (name: string): IAutoMovieRigidTransform => {
      const joint: IAutoMovieResolvedBone = bones.get(
        name as AutoMovieHumanoidBone,
      )!;
      return { position: joint.worldPosition, rotation: joint.worldRotation };
    };
    return {
      time,
      lowest: Math.min(
        ...[...bones.values()].map(({ worldPosition }) => worldPosition.y),
      ),
      joints: Object.fromEntries(
        joints.map((joint) => [joint, transform(joint)]),
      ),
      armRomRad: Math.max(
        0,
        ...jointsToMeasure.flatMap((joint) =>
          measurePhysicalJointLimits(
            joint,
            transform(joint.parent),
            transform(joint.child),
          ).map(({ violation }): number => violation),
        ),
      ),
    };
  };
  const action = film.segments("a").at(-1)!;
  const instants = [
    { name: "entry", time: action.entryTime },
    ...action.plan.events.map(({ name, share }) => ({
      name,
      time: action.start + share * action.plan.duration,
    })),
  ];
  // A millisecond and its half-step distinguish a jump from ordinary motion.
  const phases = instants.map(({ name, time }) => ({
    name,
    time,
    samples: [-0.001, -0.0005, 0, 0.0005, 0.001].map((offset: number) =>
      sample(Math.min(end, Math.max(0, time + offset))),
    ),
  }));
  console.log(
    JSON.stringify({
      event: "collapse-trajectory",
      ...scope,
      contacts: action.plan.contacts,
      physicalWindow: action.plan.physicalWindow,
      phases,
      samples: Array.from({ length: 121 }, (_, index: number) =>
        sample((end * index) / 120),
      ),
    }),
  );
}
