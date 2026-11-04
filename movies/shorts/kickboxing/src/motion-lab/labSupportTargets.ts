import type {
  AutoMovieHumanClinicalIk,
  AutoMovieHumanSkeleton,
  AutoMovieHumanSupportFrame,
} from "@automovie/human";
import * as THREE from "three";

import type { MotionAction } from "../motion/core/MotionAction";

/**
 * Expand an original declared support frame into its unchanged world point tasks.
 * @evidence contracts/common.md#implementation-and-ownership Uses the original carrier's actual vertices, initial FK rotation and fixed heading. The farthest and noncollinear witnesses are the same three-point construction consumed by the host; no mathematical replacement frame or achieved actor state participates.
 * @evidence contracts/common.md#authoring-interface Inputs belong to one immutable authoring snapshot. The declared world anchor is copied unchanged, plain contact retains one point, and an explicit frame retains three. Every returned tuple is independent of inputs and other calls.
 */
export function labSupportTargets(
  initial: AutoMovieHumanSkeleton.IOutput,
  yaw: number,
  vertices: readonly AutoMovieHumanSupportFrame.IPoint[],
  patch: MotionAction.Immutable<MotionAction.SupportPoint>,
): AutoMovieHumanClinicalIk.ITarget[] {
  if (
    !vertices.some(
      (point: AutoMovieHumanSupportFrame.IPoint): boolean =>
        point.bone === patch.bone &&
        point.localPoint.every(
          (value: number, axis: number): boolean =>
            value === patch.localPoint[axis],
        ),
    )
  )
    throw new Error(
      "Support targets require an actual emitted vertex on the declared carrier",
    );
  const result: AutoMovieHumanClinicalIk.ITarget[] = [
    {
      bone: patch.bone,
      localPoint: [...patch.localPoint],
      position: [...patch.world],
    },
  ];
  if (patch.mode !== "pivot" && !patch.frameRotation) return result;
  const placement: AutoMovieHumanSkeleton.IPlacement | undefined =
    initial.posed.find(
      (point: AutoMovieHumanSkeleton.IPlacement): boolean =>
        point.bone === patch.bone,
    );
  if (!placement)
    throw new Error(`Missing original support frame ${patch.bone}`);
  const points: THREE.Vector3[] = vertices
    .filter(
      (point: AutoMovieHumanSupportFrame.IPoint): boolean =>
        point.bone === patch.bone,
    )
    .map(
      (point: AutoMovieHumanSupportFrame.IPoint): THREE.Vector3 =>
        new THREE.Vector3(...point.localPoint),
    );
  if (!points.length)
    throw new Error(`Missing original support vertices ${patch.bone}`);
  const centre: THREE.Vector3 = new THREE.Vector3(...patch.localPoint);
  const first: THREE.Vector3 = points.reduce(
    (best: THREE.Vector3, point: THREE.Vector3): THREE.Vector3 =>
      point.distanceToSquared(centre) > best.distanceToSquared(centre)
        ? point
        : best,
    points[0]!,
  );
  const axis: THREE.Vector3 = first.clone().sub(centre);
  const second: THREE.Vector3 = points.reduce(
    (best: THREE.Vector3, point: THREE.Vector3): THREE.Vector3 =>
      axis.clone().cross(point.clone().sub(centre)).lengthSq() >
      axis.clone().cross(best.clone().sub(centre)).lengthSq()
        ? point
        : best,
    points[0]!,
  );
  if (axis.clone().cross(second.clone().sub(centre)).lengthSq() < 1e-12)
    throw new Error(`Degenerate original support frame ${patch.bone}`);
  const initialRotation: THREE.Quaternion = new THREE.Quaternion()
    .setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw)
    .multiply(new THREE.Quaternion(...placement.rotation));
  const delta: THREE.Quaternion = patch.frameRotation
    ? new THREE.Quaternion(...patch.frameRotation)
    : new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        (-(patch.yawDegrees ?? 0) * Math.PI) / 180,
      );
  for (const point of [first, second])
    result.push({
      bone: patch.bone,
      localPoint: point.toArray(),
      position: point
        .clone()
        .sub(centre)
        .applyQuaternion(initialRotation)
        .applyQuaternion(delta)
        .add(new THREE.Vector3(...patch.world))
        .toArray(),
    });
  return result;
}
