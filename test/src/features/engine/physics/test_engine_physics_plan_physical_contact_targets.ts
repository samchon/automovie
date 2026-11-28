import { AutoMovieEnginePhysicalGeometry as Geometry, AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMoviePreparePhysicalGeometry,
  IAutoMovieRigidTransform,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalModelFixtures } from "../../internal/PhysicalModelFixtures";

/** How far an anchor, a range or an untouched bone may move, rounding. */
const KEPT: number = 1e-9;

/** Poses by bone. */
type Poses = Record<string, IAutoMovieRigidTransform>;

/**
 * `planPhysicalContactTargets`'s self-avoidance fit resolves a body's own
 * overlap through its free joint coordinates, holding the root, every anchor,
 * every joint range and the unrelated legs, and claims nothing it cannot
 * reach.
 *
 * Scenarios, the quadrupod's first leg folded -85 degrees about Z into the
 * third:
 *
 * 1. With the colliding branches recast as boxes, capsules or spheres, a native
 *    penetration over 2 cm is at least halved, the root, anchors, ranges and
 *    legs 1 and 3 kept.
 * 2. With the folded joint locked at its angle the free coordinates still halve
 *    the overlap, the lock kept.
 * 3. With every coordinate of legs 0 and 2 locked the targets and the penetration
 *    stay as they were.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes native self-contact fitting with fixed root, anchor and joint-lock constraints.
 * @evidence contracts/development/testing.md#behavioral-verification Folds one branch of a quadrupod into another, repeats with boxes, capsules and spheres, and progressively locks the relevant joints.
 * @evidence contracts/development/testing.md#independent-expectations Original native overlap exceeds 2 cm. Available coordinates must at least halve it; a fully locked pair keeps the original targets and penetration.
 */
export async function test_engine_physics_plan_physical_contact_targets(): Promise<void> {
  const geometry: IAutoMoviePreparePhysicalGeometry.IQueries = await Geometry.prepare();

  /** The fold: upper-0 and its descendants turn -85 degrees about Z. */
  const fold = (model: P): Poses => {
    const targets: Poses = {};
    for (const segment of model.segments)
      targets[segment.bone] = structuredClone(segment.neutral);
    AutoMovieEnginePhysics.setPhysicalTargetJointRotation(
      targets,
      model.joints.find((joint) => joint.child === "upper-0")!,
      ["upper-0", "lower-0", "support-0"],
      AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, -85),
    );
    return targets;
  };
  /** The self-avoidance fit with the root held at its actual pose. */
  const plan = (model: P, targets: Poses): Poses =>
    AutoMovieEnginePhysics.planPhysicalContactTargets({
      body: "mechanism",
      profiles: { mechanism: model },
      targets: structuredClone(targets),
      actual: { mechanism: structuredClone(targets) },
      bindings: [],
      selfAvoidance: { iterations: 24, tolerance: 0.0001 },
      geometry,
      floor: -10,
    }).targets;
  /** Every declared coordinate of the named joints locked at its angle. */
  const lock = (model: P, targets: Poses, children: readonly string[]): P => ({
    ...model,
    joints: model.joints.map((joint: IAutoMoviePhysicalJoint) => {
      if (!children.includes(joint.child)) return joint;
      const angles = AutoMovieEnginePhysics.measurePhysicalJointLimits(
        joint,
        targets[joint.parent]!,
        targets[joint.child]!,
      );
      return {
        ...joint,
        axes: joint.axes.map((axis) => {
          const angle: number = angles.find((e) => e.axis === axis.axis)!.angle;
          return { ...axis, minimum: angle, maximum: angle };
        }),
      };
    }),
  });
  /** The largest position or quaternion component change over shared bones. */
  const moved = (from: Poses, to: Poses): number => {
    let result: number = 0;
    for (const [bone, pose] of Object.entries(from)) {
      const next: IAutoMovieRigidTransform = to[bone]!;
      const sign: number =
        pose.rotation.x * next.rotation.x +
          pose.rotation.y * next.rotation.y +
          pose.rotation.z * next.rotation.z +
          pose.rotation.w * next.rotation.w <
        0
          ? -1
          : 1;
      result = Math.max(
        result,
        AutoMovieEngineVector3.distance(pose.position, next.position),
        ...(["x", "y", "z", "w"] as const).map((axis) =>
          Math.abs(pose.rotation[axis] - sign * next.rotation[axis]),
        ),
      );
    }
    return result;
  };
  /** The root, the anchors, the ranges and the untouched legs as declared. */
  const admitted = (
    model: P,
    initial: Poses,
    poses: Poses,
    still: readonly string[],
  ): boolean =>
    moved({ body: initial.body! }, { body: poses.body! }) <= KEPT &&
    model.joints.every((joint: IAutoMoviePhysicalJoint): boolean => {
      const parent = poses[joint.parent]!;
      const child = poses[joint.child]!;
      const gap: number = AutoMovieEngineVector3.distance(
        AutoMovieEngineVector3.add(
          parent.position,
          AutoMovieEngineQuaternion.rotateVector(parent.rotation, joint.parentFrame.position),
        ),
        AutoMovieEngineVector3.add(
          child.position,
          AutoMovieEngineQuaternion.rotateVector(child.rotation, joint.childFrame.position),
        ),
      );
      return (
        gap < KEPT &&
        AutoMovieEnginePhysics.measurePhysicalJointLimits(joint, parent, child).every(
          (entry): boolean => entry.violation < KEPT,
        )
      );
    }) &&
    still.every((leg: string): boolean =>
      ["upper", "lower", "support"].every(
        (part: string): boolean =>
          moved(
            { [`${part}-${leg}`]: initial[`${part}-${leg}`]! },
            { [`${part}-${leg}`]: poses[`${part}-${leg}`]! },
          ) <= KEPT,
      ),
    );
  /** The worst enabled native penetration. */
  const penetration = (model: P, poses: Poses): number => {
    let result: number = 0;
    for (const [index, segment] of model.segments.entries())
      for (const other of model.segments.slice(index + 1)) {
        if (AutoMovieEnginePhysics.isPhysicalProfilePairExcluded(model, segment.bone, other.bone))
          continue;
        for (const a of segment.shapes)
          for (const b of other.shapes)
            result = Math.max(
              result,
              -(
                geometry.contact(
                  {
                    body: "mechanism",
                    bone: segment.bone,
                    shape: a,
                    pose: poses[segment.bone]!,
                  },
                  {
                    body: "mechanism",
                    bone: other.bone,
                    shape: b,
                    pose: poses[other.bone]!,
                  },
                  0,
                )?.separation ?? 0
              ),
            );
      }
    return result;
  };

  // 1. Recast branches.
  const recasts: [
    string,
    (shape: IAutoMoviePhysicalShape) => IAutoMoviePhysicalShape,
  ][] = [
    ["box", (shape) => shape],
    [
      "capsule",
      (shape) => ({
        id: shape.id,
        material: shape.material,
        transform: shape.transform,
        kind: "capsule",
        radius: 0.05,
        halfLength: 0.175,
      }),
    ],
    [
      "sphere",
      (shape) => ({
        id: shape.id,
        material: shape.material,
        transform: shape.transform,
        kind: "sphere",
        radius: 0.12,
      }),
    ],
  ];
  for (const [kind, recast] of recasts) {
    const original: P = PhysicalModelFixtures.quadrupod();
    const profile: P = {
      ...original,
      segments: original.segments.map(
        (segment: IAutoMoviePhysicalSegment): IAutoMoviePhysicalSegment =>
          segment.bone === "lower-0" || segment.bone === "upper-2"
            ? { ...segment, shapes: segment.shapes.map(recast) }
            : segment,
      ),
    };
    const folded: Poses = fold(profile);
    const before: number = penetration(profile, folded);
    const fitted: Poses = plan(profile, folded);
    TestValidator.predicate(
      `${kind} branches resolved`,
      before > 0.02 &&
        penetration(profile, fitted) < before / 2 &&
        admitted(profile, folded, fitted, ["1", "3"]),
    );
  }

  // 2-3. Locks.
  const profile: P = PhysicalModelFixtures.quadrupod();
  const folded: Poses = fold(profile);
  const before: number = penetration(profile, folded);
  const partial: P = lock(profile, folded, ["upper-0"]);
  const steered: Poses = plan(partial, folded);
  TestValidator.predicate(
    "around a locked joint",
    penetration(partial, steered) < before / 2 &&
      admitted(partial, folded, steered, ["1", "3"]),
  );
  const sealed: P = lock(
    profile,
    folded,
    ["0", "2"].flatMap((leg) =>
      ["upper", "lower", "support"].map((part) => `${part}-${leg}`),
    ),
  );
  const stuck: Poses = plan(sealed, folded);
  TestValidator.predicate(
    "an unreachable overlap is not claimed",
    Math.abs(penetration(sealed, stuck) - before) < KEPT &&
      moved(folded, stuck) < KEPT,
  );
}
