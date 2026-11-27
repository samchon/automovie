import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Closed-form capsule-to-box signed distance while the capsule's axis stays
 * outside the box: the distance from the axis segment to the oriented box,
 * minimized over the segment parameter, less the radius. Point-to-box distance
 * is convex along a line, so ternary search finds the minimum. Shapes are
 * placed by their bone pose composed with their bone-local transform.
 */
export function capsuleBoxSeparation(
  capsule: IAutoMoviePhysicalShape,
  capsulePose: IAutoMovieRigidTransform,
  box: IAutoMoviePhysicalShape,
  boxPose: IAutoMovieRigidTransform,
): number {
  if (capsule.kind !== "capsule" || box.kind !== "box")
    throw new Error("capsuleBoxSeparation needs a capsule and a box");
  const axis: IAutoMovieRigidTransform = place(capsulePose, capsule);
  const solid: IAutoMovieRigidTransform = place(boxPose, box);
  const distance: (parameter: number) => number = (
    parameter: number,
  ): number => {
    const local: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      AutoMovieEngineQuaternion.inverse(solid.rotation),
      AutoMovieEngineVector3.subtract(
        AutoMovieEngineVector3.add(
          axis.position,
          AutoMovieEngineQuaternion.rotateVector(axis.rotation, {
            x: 0,
            y: parameter * capsule.halfLength,
            z: 0,
          }),
        ),
        solid.position,
      ),
    );
    return Math.hypot(
      Math.max(Math.abs(local.x) - box.halfExtents.x, 0),
      Math.max(Math.abs(local.y) - box.halfExtents.y, 0),
      Math.max(Math.abs(local.z) - box.halfExtents.z, 0),
    );
  };
  let low: number = -1;
  let high: number = 1;
  for (let iteration: number = 0; iteration < 200; ++iteration) {
    const left: number = low + (high - low) / 3;
    const right: number = high - (high - low) / 3;
    if (distance(left) < distance(right)) high = right;
    else low = left;
  }
  const gap: number = distance((low + high) / 2);
  if (!(gap > 0)) throw new Error("capsuleBoxSeparation axis entered the box");
  return gap - capsule.radius;
}

/** World placement of a shape on its bone pose. */
function place(
  pose: IAutoMovieRigidTransform,
  shape: IAutoMoviePhysicalShape,
): IAutoMovieRigidTransform {
  return {
    position: AutoMovieEngineVector3.add(
      pose.position,
      AutoMovieEngineQuaternion.rotateVector(pose.rotation, shape.transform.position),
    ),
    rotation: AutoMovieEngineQuaternion.multiply(pose.rotation, shape.transform.rotation),
  };
}
