import type {
  AutoMovieHumanSkeleton,
  AutoMovieHumanSupportFrame,
  IAutoMovieHumanPose,
} from "@automovie/human";
import * as THREE from "three";

import { MotionAction } from "../motion/core/MotionAction";

/**
 * Measure an authored plantar frame from immutable actual geometry and public FK.
 * @evidence contracts/common.md#implementation-and-ownership Every original same-side source-foot vertex participates in relative floor height. The same measured initial bone and authored FK bone define a world-axis quaternion; requested X/Z remains fixed rather than following torso motion. No actor, pose, root, geometry or floor is mutated, and no rendered object is retained.
 * @evidence contracts/common.md#authoring-interface Initial FK, actual source points and frame must describe the same body/stance. The hard/free frame retains point identity, requested X/Z and initialWorld; the separate hard/planted minimum original vertex lies on the floor. A technique chooses which contact to retain. Contexts remain usable after drawing retirement; actual fitted frame, contact and whole-foot floor require independent inspection.
 */
export function measureLabSupportFrame(
  evaluate: AutoMovieHumanSkeleton.PoseEvaluator,
  initial: AutoMovieHumanSkeleton.IOutput,
  points: readonly AutoMovieHumanSupportFrame.IPoint[],
  frame: { origin: MotionAction.Vec3; yawRadians: number },
  pose: IAutoMovieHumanPose,
  rootOffset: MotionAction.Vec3,
  patch: MotionAction.SupportPatch,
): MotionAction.SupportMeasurement {
  MotionAction.validateSupportFrame(patch);
  const output: AutoMovieHumanSkeleton.IOutput = evaluate(pose);
  const placements: Map<string, AutoMovieHumanSkeleton.IPlacement> = new Map(
    output.posed.map(
      (
        point: AutoMovieHumanSkeleton.IPlacement,
      ): [string, AutoMovieHumanSkeleton.IPlacement] => [point.bone, point],
    ),
  );
  const start: AutoMovieHumanSkeleton.IPlacement | undefined =
    initial.posed.find(
      (point: AutoMovieHumanSkeleton.IPlacement): boolean =>
        point.bone === patch.bone,
    );
  const current: AutoMovieHumanSkeleton.IPlacement | undefined = placements.get(
    patch.bone,
  );
  if (
    !start ||
    !current ||
    !points.length ||
    !points.some(
      (point: AutoMovieHumanSupportFrame.IPoint): boolean =>
        point.bone === patch.bone &&
        point.localPoint.every(
          (value: number, axis: number): boolean =>
            value === patch.localPoint[axis],
        ),
    ) ||
    !patch.bone.startsWith(patch.side) ||
    points.some(
      (point: AutoMovieHumanSupportFrame.IPoint): boolean =>
        !point.bone.startsWith(patch.side),
    )
  )
    throw new Error(
      "Support frame requires the same actual side, emitted source vertex and full-foot population",
    );
  const heading: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    frame.yawRadians,
  );
  const root: THREE.Vector3 = new THREE.Vector3(...rootOffset)
    .applyQuaternion(heading)
    .add(new THREE.Vector3(...frame.origin));
  const worldPoint: (
    point: AutoMovieHumanSupportFrame.IPoint,
  ) => THREE.Vector3 = (
    point: AutoMovieHumanSupportFrame.IPoint,
  ): THREE.Vector3 => {
    const bone: AutoMovieHumanSkeleton.IPlacement | undefined = placements.get(
      point.bone,
    );
    if (!bone)
      throw new Error(`Missing actual plantar frame bone ${point.bone}`);
    return new THREE.Vector3(...point.localPoint)
      .applyQuaternion(new THREE.Quaternion(...bone.rotation))
      .add(new THREE.Vector3(...bone.position))
      .applyQuaternion(heading)
      .add(root);
  };
  const pivot: THREE.Vector3 = worldPoint({
    bone: patch.bone,
    localPoint: patch.localPoint,
  });
  const minimum: {
    point: AutoMovieHumanSupportFrame.IPoint;
    world: THREE.Vector3;
  } = points
    .map(
      (
        point: AutoMovieHumanSupportFrame.IPoint,
      ): {
        point: AutoMovieHumanSupportFrame.IPoint;
        world: THREE.Vector3;
      } => ({ point, world: worldPoint(point) }),
    )
    .reduce(
      (
        best: {
          point: AutoMovieHumanSupportFrame.IPoint;
          world: THREE.Vector3;
        },
        point: {
          point: AutoMovieHumanSupportFrame.IPoint;
          world: THREE.Vector3;
        },
      ): { point: AutoMovieHumanSupportFrame.IPoint; world: THREE.Vector3 } =>
        point.world.y < best.world.y ? point : best,
    );
  const height: number = pivot.y - minimum.world.y;
  const rotation: THREE.Quaternion = heading
    .clone()
    .multiply(new THREE.Quaternion(...current.rotation))
    .multiply(new THREE.Quaternion(...start.rotation).invert())
    .multiply(heading.clone().invert());
  const measured: MotionAction.SupportPatch = {
    ...structuredClone(patch),
    mode: "free",
    constraint: "hard",
    world: [patch.world[0], height, patch.world[2]],
    frameRotation: rotation.toArray(),
  };
  delete measured.yawDegrees;
  MotionAction.validateSupportFrame(measured);
  const contact: MotionAction.SupportPatch = {
    side: patch.side,
    bone: minimum.point.bone,
    localPoint: [...minimum.point.localPoint],
    mode: "planted",
    constraint: "hard",
    world: minimum.world
      .clone()
      .sub(pivot)
      .add(new THREE.Vector3(...measured.world))
      .toArray(),
  };
  contact.world[1] = 0;
  return { frame: measured, contact };
}
