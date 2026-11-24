import type {
  IAutoMovieMeasurePhysicalMotionConstraint,
  IAutoMoviePhysicalSegmentState,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * Measure authored endpoint, separation and bend promises from displayed bone
 * frames. No clinical catalogue, species, actor or screenplay window is
 * selected here. A missing frame, coincident ray or zero-length angle refuses
 * the audit instead of turning an undefined measurement into a passing zero.
 */
export function measurePhysicalMotionConstraint(
  constraint: IAutoMovieMeasurePhysicalMotionConstraint.IConstraint,
  states: Readonly<Record<string, IAutoMoviePhysicalSegmentState>>,
  seconds: number,
): number {
  const point: (
    anchor: IAutoMovieMeasurePhysicalMotionConstraint.IAnchor,
  ) => IAutoMovieVector3 = (
    anchor: IAutoMovieMeasurePhysicalMotionConstraint.IAnchor,
  ): IAutoMovieVector3 => {
    const frame: IAutoMoviePhysicalSegmentState | undefined =
      states[anchor.bone];
    if (!frame) throw new Error(`Motion audit point missing: ${anchor.bone}`);
    if (anchor.blend) {
      const other: IAutoMoviePhysicalSegmentState | undefined =
        states[anchor.blend.other];
      if (
        !other ||
        anchor.blend.weight < 0 ||
        anchor.blend.weight > 1
      )
        throw new Error("Invalid motion audit blended point");
      return Vector3.add(
        frame.position,
        Vector3.scale(
          Vector3.subtract(other.position, frame.position),
          anchor.blend.weight,
        ),
      );
    }
    if (anchor.ray) {
      const from: IAutoMoviePhysicalSegmentState | undefined =
        states[anchor.ray.from];
      if (
        !from ||
        anchor.ray.distance < 0
      )
        throw new Error("Invalid motion audit ray");
      const delta: IAutoMovieVector3 = Vector3.subtract(
        frame.position,
        from.position,
      );
      const length: number = Vector3.length(delta);
      if (!(length > 0)) throw new Error("Degenerate motion audit ray");
      return Vector3.add(
        frame.position,
        Vector3.scale(delta, anchor.ray.distance / length),
      );
    }
    return anchor.localPoint
      ? Vector3.add(
          frame.position,
          Quaternion.rotateVector(frame.rotation, anchor.localPoint),
        )
      : frame.position;
  };
  if (constraint.kind === "goal")
    return Vector3.length(
      Vector3.subtract(point(constraint.point), constraint.target(seconds)),
    );
  if (constraint.kind === "distance") {
    const displacement: IAutoMovieVector3 = Vector3.subtract(
      point(constraint.from),
      point(constraint.to),
    );
    return constraint.horizontal
      ? Math.hypot(displacement.x, displacement.z)
      : Vector3.length(displacement);
  }
  const pivot: IAutoMovieVector3 = point(constraint.pivot);
  const a: IAutoMovieVector3 = Vector3.subtract(point(constraint.from), pivot);
  const b: IAutoMovieVector3 = Vector3.subtract(point(constraint.to), pivot);
  if (!(Vector3.length(a) > 0) || !(Vector3.length(b) > 0))
    throw new Error("Degenerate motion audit angle");
  return (
    Math.PI -
    Math.acos(
      Math.max(
        -1,
        Math.min(
          1,
          Vector3.dot(a, b) / (Vector3.length(a) * Vector3.length(b)),
        ),
      ),
    )
  );
}
