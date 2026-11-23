import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { AutoMoviePhysicalJointChart } from "./AutoMoviePhysicalJointChart";

/**
 * Admit a relative joint rotation to the joint's chart. A joint declaring a
 * sequential chart (`order`) is admitted in it (`AutoMoviePhysicalJointChart`):
 * each Tait-Bryan angle clamped into its free axis's range, a locked one
 * held at zero. Otherwise the solver's independent twist coordinates, 2 atan(q.axis / w) per free axis:
 * with positive quaternion w, each free coordinate is 2 atan(q.axis / w);
 * locked coordinates require a zero numerator. This projects that coordinate
 * box, rather than claiming a nearest rotation in geodesic distance. At a
 * half turn the finite Rodrigues representation stops within 1e-12 radians.
 */
export function projectPhysicalJointRotation(
  joint: IAutoMoviePhysicalJoint,
  rotation: IAutoMovieRigidTransform["rotation"],
): IAutoMovieRigidTransform["rotation"] {
  const norm: number = Math.hypot(
    rotation.x,
    rotation.y,
    rotation.z,
    rotation.w,
  );
  if (!(norm > 0) || !Number.isFinite(norm))
    throw new Error("Invalid physical joint rotation");
  // A joint with a sequential chart is admitted in it: each angle of the
  // rotation's decomposition clamped into its free axis's range, a locked
  // axis's held at zero, and the angles composed back.
  if (joint.order !== undefined) {
    const order: IAutoMoviePhysicalJointAxis["axis"][] = joint.order;
    return AutoMoviePhysicalJointChart.compose(
      order,
      AutoMoviePhysicalJointChart.angles(order, {
        x: rotation.x / norm,
        y: rotation.y / norm,
        z: rotation.z / norm,
        w: rotation.w / norm,
      }).map((angle: number, at: number): number => {
        const range: IAutoMoviePhysicalJointAxis | undefined = joint.axes.find(
          (candidate: IAutoMoviePhysicalJointAxis): boolean =>
            candidate.axis === order[at],
        );
        return range === undefined
          ? 0
          : Math.max(range.minimum, Math.min(range.maximum, angle));
      }),
    );
  }
  const sign: number = rotation.w < 0 ? -1 : 1;
  const denominator: number = Math.max(Math.abs(rotation.w) / norm, 1e-12);
  const coordinates: { x: number; y: number; z: number; w: number } = {
    x: 0,
    y: 0,
    z: 0,
    w: 1,
  };
  for (const axis of ["x", "y", "z"] as const) {
    const range: IAutoMoviePhysicalJointAxis | undefined = joint.axes.find(
      (candidate: IAutoMoviePhysicalJointAxis): boolean =>
        candidate.axis === axis,
    );
    if (!range) continue;
    const angle: number =
      2 * Math.atan2((rotation[axis] * sign) / norm, denominator);
    const admitted: number = Math.max(
      -Math.PI + 1e-12,
      Math.min(
        Math.PI - 1e-12,
        Math.max(range.minimum, Math.min(range.maximum, angle)),
      ),
    );
    coordinates[axis] = Math.tan(admitted / 2);
  }
  const length: number = Math.hypot(
    coordinates.x,
    coordinates.y,
    coordinates.z,
    1,
  );
  return {
    x: coordinates.x / length,
    y: coordinates.y / length,
    z: coordinates.z / length,
    w: 1 / length,
  };
}
