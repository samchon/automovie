import {
  Quaternion,
  Vector3,
  physicalShapeHull,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanColliders,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walkLegCapsules } from "./walkLegCapsules";

/**
 * The relations a probe of two legs' clearance is read through
 * (`walkLegClearance.prepare`): a point's place relative to a posed bone and
 * its depth inside a shape.
 */
export namespace walkLegBinding {
  /**
   * Carry probes from one placed segment's frame into another's.
   *
   * @param a The source segment's current placement.
   * @param b The target segment's current placement.
   * @returns A source-local to target-local probe reader for this pair reading.
   */
  export function prepareRelative(
    a: Pick<IAutoMovieMotionHumanColliders.IPlaced, "pose">,
    b: Pick<IAutoMovieMotionHumanColliders.IPlaced, "pose">,
  ): (probe: IAutoMovieVector3) => IAutoMovieVector3 {
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(b.pose.rotation);
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(
      inverse,
      Vector3.subtract(a.pose.position, b.pose.position),
    );
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      inverse,
      a.pose.rotation,
    );
    return (probe: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(offset, Quaternion.rotateVector(rotation, probe));
  }

  /**
   * Prepare one shape for the depths of segment-local points inside it, as the
   * audit reads them: a hull's least distance inside its face planes, read no
   * further once it is no deeper than `floor`; any other shape by the engine's
   * shape distance; zero outside.
   *
   * @param shape The placed segment's profile shape.
   * @returns The depth in metres of a segment-local point, given the depth
   *   below which the caller has no use for it.
   */
  export function prepareInside(
    shape: IAutoMovieMotionHumanColliders.IPlaced["shapes"][number],
  ): (local: IAutoMovieVector3, floor: number) => number {
    if (shape.kind !== "hull")
      return (local: IAutoMovieVector3): number =>
        Math.max(
          0,
          -physicalShapeSegmentDistance(
            walkLegCapsules.IDENTITY,
            shape,
            local,
            local,
          ),
        );
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      shape.transform.rotation,
    );
    const hull: ReturnType<typeof physicalShapeHull> = physicalShapeHull(shape);
    return (local: IAutoMovieVector3, floor: number): number => {
      const point: IAutoMovieVector3 = Quaternion.rotateVector(
        inverse,
        Vector3.subtract(local, shape.transform.position),
      );

      // A point outside the sphere about the hull's vertices lies outside it.
      if (Vector3.length(Vector3.subtract(point, hull.centre)) >= hull.radius)
        return 0;
      let depth: number = Infinity;
      for (const f of hull.faces) {
        depth = Math.min(depth, f.offset - Vector3.dot(f.normal, point));
        if (depth <= floor) break;
      }
      return Math.max(0, depth);
    };
  }
}
