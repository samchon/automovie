import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { samplePhysicalTarget } from "./samplePhysicalTarget";

/** Compile one interval's motion coefficients. Scalar checks retain direct callers' mutable-transform semantics; returned vectors are independently owned. */
export function preparePhysicalTargetSampler(
  before: P.ITransform,
  after: P.ITransform,
  rate: number,
): (fraction: number) => ReturnType<typeof samplePhysicalTarget> {
  let first: P.ITransform | undefined;
  let last: P.ITransform | undefined;
  let displacement: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  let velocity: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  let angularVelocity: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  return (fraction: number): ReturnType<typeof samplePhysicalTarget> => {
    if (!same(before, first) || !same(after, last)) {
      first = {
        position: { ...before.position },
        rotation: { ...before.rotation },
      };
      last = {
        position: { ...after.position },
        rotation: { ...after.rotation },
      };
      displacement = Vector3.subtract(last.position, first.position);
      velocity = Vector3.scale(displacement, rate);
      const delta: P.ITransform["rotation"] = Quaternion.multiply(
        last.rotation,
        Quaternion.inverse(first.rotation),
      );
      const sign: number = delta.w < 0 ? -1 : 1;
      const norm: number = Math.hypot(delta.x, delta.y, delta.z);
      const scale: number =
        norm < 1e-12
          ? 2 * sign * rate
          : (2 * Math.atan2(norm, Math.abs(delta.w)) * sign * rate) / norm;
      angularVelocity = {
        x: delta.x * scale,
        y: delta.y * scale,
        z: delta.z * scale,
      };
    }
    return {
      pose: {
        position: Vector3.add(
          first!.position,
          Vector3.scale(displacement, fraction),
        ),
        rotation: Quaternion.slerp(first!.rotation, last!.rotation, fraction),
      },
      velocity: { ...velocity },
      angularVelocity: { ...angularVelocity },
    };
  };
}

/** Compare numeric values so in-place receiver or target edits invalidate coefficients too. */
function same(
  actual: P.ITransform,
  previous: P.ITransform | undefined,
): boolean {
  return (
    previous !== undefined &&
    Object.is(actual.position.x, previous.position.x) &&
    Object.is(actual.position.y, previous.position.y) &&
    Object.is(actual.position.z, previous.position.z) &&
    Object.is(actual.rotation.x, previous.rotation.x) &&
    Object.is(actual.rotation.y, previous.rotation.y) &&
    Object.is(actual.rotation.z, previous.rotation.z) &&
    Object.is(actual.rotation.w, previous.rotation.w)
  );
}
