import { physicalSpanPose } from "@automovie/engine";
import type {
  IAutoMoviePhysicalJoint,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A body is handed from physics to its push response only when its joints hold
 * together (`physicalSpanPose.admissible`): every joint's two anchors, its
 * parent frame on the parent's pose and its child frame on the child's, within
 * the handoff's linear error of each other, the envelope an ownership return
 * starts inside (`assertPhysicalReturnPath`).
 *
 * Scenarios, a thigh and shank joined at a knee 0.45 m below the thigh's
 * origin:
 *
 * 1. Anchors that meet are admissible under a 1 mm limit.
 * 2. A shank 2 mm off the knee is not admissible under 1 mm, and is under 3 mm:
 *    the boundary is the limit itself.
 * 3. A joint whose child has no pose is skipped.
 * 4. A rotation of the thigh about its own origin carries the knee: the shank left
 *    behind is not admissible, the one moved with it is.
 */
export function test_unit_engine_physics_physical_disturbance_handoff(): void {
  const knee: IAutoMoviePhysicalJoint = {
    id: "knee",
    parent: "thigh",
    child: "shank",
    parentFrame: {
      position: { x: 0, y: -0.45, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    childFrame: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    axes: [],
  };
  const pose = (
    x: number,
    y: number,
    z: number,
    rotation: IAutoMovieRigidTransform["rotation"] = { x: 0, y: 0, z: 0, w: 1 },
  ): IAutoMovieRigidTransform => ({ position: { x, y, z }, rotation });
  const admissible = (
    poses: Record<string, IAutoMovieRigidTransform>,
    limit: number,
  ): boolean => physicalSpanPose.admissible({ joints: [knee], poses, limit });

  // 1. Meeting anchors.
  TestValidator.predicate(
    "meeting anchors",
    admissible({ thigh: pose(0, 1, 0), shank: pose(0, 0.55, 0) }, 0.001),
  );
  // 2. The limit is the boundary.
  const apart = { thigh: pose(0, 1, 0), shank: pose(0.002, 0.55, 0) };
  TestValidator.predicate("2 mm under 1 mm", !admissible(apart, 0.001));
  TestValidator.predicate("2 mm under 3 mm", admissible(apart, 0.003));
  // 3. A missing pose is skipped.
  TestValidator.predicate(
    "missing pose",
    admissible({ thigh: pose(0, 1, 0) }, 0.001),
  );
  // 4. A rotated thigh carries the knee: 90 degrees about z moves it from
  // (0, 0.55, 0) to (0.45, 1, 0).
  const turned = { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 };
  TestValidator.predicate(
    "shank left behind",
    !admissible(
      { thigh: pose(0, 1, 0, turned), shank: pose(0, 0.55, 0) },
      0.001,
    ),
  );
  TestValidator.predicate(
    "shank carried",
    admissible(
      { thigh: pose(0, 1, 0, turned), shank: pose(0.45, 1, 0) },
      0.001,
    ),
  );
}
