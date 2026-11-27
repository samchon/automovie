import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalModelFixtures } from "../../internal/PhysicalModelFixtures";

/** How far a support endpoint may miss its goal, metres: the solve's tolerance. */
const ENDPOINT: number = 0.005;

/** How far a joint's two anchors may part, metres: rounding. */
const ANCHOR: number = 1e-10;

/** The planner's lowest root drop, metres. */
const MAXIMUM_DROP: number = 0.15;

/** Each segment at its neutral pose. */
function neutral(profile: IProfile): Record<string, IAutoMovieRigidTransform> {
  const out: Record<string, IAutoMovieRigidTransform> = {};
  for (const segment of profile.segments) out[segment.bone] = segment.neutral;
  return out;
}

/** The profile the planner reads. */
type IProfile = IAutoMoviePhysicalProfile;

/** Whether every joint's parent and child anchors coincide. */
function articulated(
  profile: IProfile,
  targets: Record<string, IAutoMovieRigidTransform>,
): boolean {
  return profile.joints.every(
    (joint: IProfile["joints"][number]): boolean =>
      AutoMovieEngineVector3.distance(
        AutoMovieEnginePhysics.physicalSupportPoint(
          targets[joint.parent]!,
          joint.parentFrame.position,
        ),
        AutoMovieEnginePhysics.physicalSupportPoint(targets[joint.child]!, joint.childFrame.position),
      ) <= ANCHOR,
  );
}

/**
 * `planPhysicalSupportTargets` reaches each support's distal point to its goal
 * over its own chain, lowering the root only by what a straight leg still
 * lacks, keeps the other supports on theirs, and leaves every joint
 * articulated.
 *
 * Scenarios:
 *
 * 1. The stickman's left shin tip, the capsule's far end, moved 0.18 m forward:
 *    the root drops by more than 0 and less than 0.15 m, both shin tips end on
 *    their goals within 5 mm, and the joints stay articulated.
 * 2. The quadrupod's first support reached 0.2 or 0.45 m along +X: the root drops
 *    by `max(0, (hip - ankle) - sqrt(0.9^2 - reach^2))` from the fixture's own
 *    bent-knee anchors, none at 0.2 m and some at 0.45 m; every support ends on
 *    its goal and the joints stay articulated.
 */
export function test_engine_physics_plan_physical_support_targets(): void {
  // 1. The stickman's shin tips.
  const stickman: IProfile = PhysicalModelFixtures.stickman().profile;
  const standing: Record<string, IAutoMovieRigidTransform> = neutral(stickman);
  const shin = (side: "left" | "right"): IAutoMoviePhysicalSegment =>
    stickman.segments.find(
      (segment: IAutoMoviePhysicalSegment): boolean =>
        segment.bone === `${side}LowerLeg`,
    )!;
  const tip = (side: "left" | "right"): IAutoMovieVector3 => {
    const shape = shin(side).shapes[0]!;
    const reach: number =
      shape.kind === "capsule" ? shape.halfLength + shape.radius : 0;
    return AutoMovieEngineVector3.add(
      shape.transform.position,
      AutoMovieEngineQuaternion.rotateVector(shape.transform.rotation, {
        x: 0,
        y: -reach,
        z: 0,
      }),
    );
  };
  const biped: IAutoMovieFootfallPattern = {
    id: "stickman-shin-tips",
    minimumSupports: 1,
    limbs: (["left", "right"] as const).map((side, index: number) => ({
      bone: shin(side).bone,
      localPoint: tip(side),
      chain: [`${side}UpperLeg`, shin(side).bone],
      phase: index / 2,
      duty: 0.6,
      offset: { forward: 0, left: shin(side).neutral.position.x },
      stride: [{ speed: 0, length: 0.4 }],
    })),
  };
  const moving = biped.limbs[0]!;
  const start: IAutoMovieVector3 = AutoMovieEnginePhysics.physicalSupportPoint(
    standing[moving.bone]!,
    moving.localPoint!,
  );
  const goal: IAutoMovieVector3 = { ...start, z: start.z + 0.18 };
  const stepped = AutoMovieEnginePhysics.planPhysicalSupportTargets({
    profile: stickman,
    pattern: biped,
    targets: standing,
    goals: { [moving.bone]: goal },
    maximumRootDrop: MAXIMUM_DROP,
    iterations: 64,
    tolerance: 0.0001,
  });
  TestValidator.predicate(
    "the stickman's shin tips",
    stepped.rootDrop > 0 &&
      stepped.rootDrop < MAXIMUM_DROP &&
      biped.limbs.every(
        (limb): boolean =>
          AutoMovieEngineVector3.distance(
            AutoMovieEnginePhysics.physicalSupportPoint(stepped.targets[limb.bone]!, limb.localPoint!),
            limb === moving
              ? goal
              : AutoMovieEnginePhysics.physicalSupportPoint(standing[limb.bone]!, limb.localPoint!),
          ) <= ENDPOINT,
      ) &&
      articulated(stickman, stepped.targets),
  );

  // 2. The quadrupod's reach and root drop.
  const quadrupod: IProfile = PhysicalModelFixtures.quadrupod();
  const rest: Record<string, IAutoMovieRigidTransform> = neutral(quadrupod);
  const quadruped: IAutoMovieFootfallPattern = {
    id: "four-independent-chains",
    minimumSupports: 3,
    limbs: [0, 1, 2, 3].map((index: number) => ({
      bone: `support-${index}`,
      chain: [`upper-${index}`, `lower-${index}`, `support-${index}`],
      reach: {
        root: `upper-${index}`,
        middle: `lower-${index}`,
        tip: `support-${index}`,
      },
      phase: index / 4,
      duty: 0.75,
      offset: { forward: 0, left: 0 },
      stride: [{ speed: 0, length: 0.6 }],
    })),
  };
  const anchor = (child: string): IAutoMovieVector3 => {
    const joint = quadrupod.joints.find((j) => j.child === child)!;
    return AutoMovieEnginePhysics.physicalSupportPoint(
      rest[joint.parent]!,
      joint.parentFrame.position,
    );
  };
  let reached: boolean = true;
  for (const reach of [0.2, 0.45]) {
    const target: IAutoMovieVector3 = {
      ...rest["support-0"]!.position,
      x: rest["support-0"]!.position.x + reach,
    };
    const planned = AutoMovieEnginePhysics.planPhysicalSupportTargets({
      profile: quadrupod,
      pattern: quadruped,
      targets: rest,
      goals: { "support-0": target },
      maximumRootDrop: MAXIMUM_DROP,
      iterations: 48,
      tolerance: 0.0001,
    });
    const drop: number = Math.max(
      0,
      anchor("upper-0").y -
        anchor("support-0").y -
        Math.sqrt(0.81 - reach ** 2),
    );
    reached &&=
      reach > 0.2 === drop > 0 &&
      Math.abs(planned.rootDrop - drop) <= ANCHOR &&
      quadruped.limbs.every(
        (limb): boolean =>
          AutoMovieEngineVector3.distance(
            planned.targets[limb.bone]!.position,
            limb.bone === "support-0" ? target : rest[limb.bone]!.position,
          ) <= ENDPOINT,
      ) &&
      articulated(quadrupod, planned.targets);
  }
  TestValidator.predicate("the quadrupod's reach", reached);
}
