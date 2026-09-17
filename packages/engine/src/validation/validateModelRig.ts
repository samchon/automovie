/**
 * Skeleton and joint-range admission called by validateModel. Identity
 * uniqueness is checked by the orchestrator before these graph checks. Parent
 * resolution and one-root reachability reject disconnected components without
 * mutating the graph. Angular bounds use degrees; a swing cone must intersect
 * the flexion/abduction box, which is tested at the box point nearest neutral.
 * Null constraints retain their declared absence. Diagnostics append in input
 * order and do not normalize ranges or rewrite poses. These structural checks
 * precede playback and do not solve motion or perform anatomical inference.
 */
import type {
  IAutoMovieAngleRange,
  IAutoMovieJointConstraint,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { swingConeAngle } from "../rom/swingCone";
import { ViolationCollector } from "./violation";

/**
 * Reports unresolved parents, invalid root counts and unreachable skeleton members in original bone order.
 * @evidence requirements/actors/validation.md#actor-input-binding-validation Checks parent resolution, the single root and reachability without normalizing or repairing the skeleton.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure Checks parent resolution, the single root and reachability without normalizing or repairing the skeleton.
 */
export const validateSkeletonGraph = (
  skeleton: IAutoMovieSkeleton,
  path: string,
  collector: ViolationCollector,
): void => {
  const names = new Set(skeleton.bones.map((bone) => bone.bone));
  const roots: string[] = [];
  skeleton.bones.forEach((bone, i) => {
    if (bone.parent === null) roots.push(bone.bone);
    else if (!names.has(bone.parent))
      collector.push(
        "type",
        `${path}.bones[${i}].parent`,
        `parent "${bone.parent}" is not a bone of this skeleton`,
        bone.parent,
      );
  });
  if (roots.length !== 1) {
    collector.push(
      "type",
      `${path}.bones`,
      `a skeleton needs exactly one root bone (parent: null), but found ${roots.length}`,
      roots,
    );
    return;
  }

  const children = new Map<string, string[]>();
  for (const bone of skeleton.bones) {
    if (bone.parent === null) continue;
    const list = children.get(bone.parent) ?? [];
    list.push(bone.bone);
    children.set(bone.parent, list);
  }
  const reached = new Set<string>();
  const queue = [roots[0]!];
  while (queue.length > 0) {
    const name = queue.pop()!;
    if (reached.has(name)) continue;
    reached.add(name);
    queue.push(...(children.get(name) ?? []));
  }
  skeleton.bones.forEach((bone, i) => {
    if (!reached.has(bone.bone))
      collector.push(
        "type",
        `${path}.bones[${i}]`,
        `bone "${bone.bone}" is not reachable from the root "${roots[0]}" (a detached cycle cannot be posed)`,
        bone.bone,
      );
  });
};

const CONSTRAINT_AXES = ["flexion", "abduction", "twist"] as const;

/**
 * Checks finite ordered degree ranges and existence of a pose inside the declared angular box and swing cone.
 * @evidence requirements/actors/validation.md#actor-input-binding-validation Checks degree-range ordering and uses the nearest-neutral box point to decide whether its swing cone admits a pose.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure Checks degree-range ordering and uses the nearest-neutral box point to decide whether its swing cone admits a pose.
 */
export const validateJointConstraint = (
  constraint: IAutoMovieJointConstraint,
  path: string,
  collector: ViolationCollector,
): void => {
  for (const axis of CONSTRAINT_AXES) {
    const range = constraint[axis];
    if (range !== null) validateAngleRange(range, `${path}.${axis}`, collector);
  }

  if (constraint.swingDeg !== undefined && constraint.swingDeg !== null) {
    const swingDeg = constraint.swingDeg;
    if (!Number.isFinite(swingDeg) || swingDeg <= 0)
      collector.push(
        "range",
        `${path}.swingDeg`,
        `swingDeg must be a finite number > 0, but was ${swingDeg}`,
        swingDeg,
      );
    else {
      // A swing-coned constraint is unsatisfiable exactly when its box and its
      // cone do not intersect, NOT merely when the box excludes neutral (#1245).
      // The box point nearest neutral is each axis clamped toward 0, and the
      // cone grows monotonically away from neutral, so that point has the
      // smallest swing the box can reach: if even IT exceeds `swingDeg`, no pose
      // satisfies both. A box that excludes neutral but sits inside a wide cone
      // is perfectly sound (e.g. flexion [10, 90] with a 95° cone admits
      // (10, 0) at 10° of swing), and rejecting it refused rigs the per-bone
      // override exists to express (a limb that cannot fully extend).
      const nearest = (range: IAutoMovieAngleRange | null): number =>
        range === null ||
        !Number.isFinite(range.min) ||
        !Number.isFinite(range.max)
          ? 0
          : range.min > 0
            ? range.min
            : range.max < 0
              ? range.max
              : 0;
      const minimumSwing = swingConeAngle(
        nearest(constraint.flexion),
        nearest(constraint.abduction),
      );
      if (minimumSwing > swingDeg)
        collector.push(
          "range",
          `${path}.swingDeg`,
          `a swing-coned joint must admit at least one pose: the most-retracted articulation its flexion/abduction ranges allow already swings ${minimumSwing.toFixed(1)}°, past this ${swingDeg}° cone, so no pose satisfies both the ranges and the cone`,
          swingDeg,
        );
    }
  }
};

const validateAngleRange = (
  range: IAutoMovieAngleRange,
  path: string,
  collector: ViolationCollector,
): void => {
  const fields: ReadonlyArray<readonly [string, number]> = [
    ["min", range.min],
    ["max", range.max],
  ];
  for (const [field, value] of fields)
    if (!Number.isFinite(value))
      collector.push(
        "range",
        `${path}.${field}`,
        `${field} must be finite, but was ${value}`,
        value,
      );

  if (
    Number.isFinite(range.min) &&
    Number.isFinite(range.max) &&
    range.min > range.max
  )
    collector.push(
      "range",
      path,
      `range min must be <= max, but was [${range.min}, ${range.max}]`,
      range,
    );
};
