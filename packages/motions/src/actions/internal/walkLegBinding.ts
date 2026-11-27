import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
  AutoMovieEnginePhysics,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanColliders,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walkLegCapsules } from "./walkLegCapsules";

/*
 * The relations a probe of two legs' clearance is read through
 * (`walkLegClearance.prepare`): a point's place relative to a posed bone and
 * its depth inside a shape.
 */
export namespace walkLegBinding {
  /*
   * Carry probes from one placed segment's frame into another's.
   * Parameter a: The source segment's current placement.
   * Parameter b: The target segment's current placement.
   * Returns: A source-local to target-local probe reader for this pair reading.
   */
  export function prepareRelative(
    a: Pick<IAutoMovieMotionHumanColliders.IPlaced, "pose">,
    b: Pick<IAutoMovieMotionHumanColliders.IPlaced, "pose">,
  ): (probe: IAutoMovieVector3) => IAutoMovieVector3 {
    const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(b.pose.rotation);
    const offset: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      inverse,
      AutoMovieEngineVector3.subtract(a.pose.position, b.pose.position),
    );
    const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      inverse,
      a.pose.rotation,
    );
    return (probe: IAutoMovieVector3): IAutoMovieVector3 =>
      AutoMovieEngineVector3.add(offset, AutoMovieEngineQuaternion.rotateVector(rotation, probe));
  }

  /*
   * Prepare one shape for the depths of segment-local points inside it, as the
   * audit reads them: a hull's least distance inside its face planes, read no
   * further once it is no deeper than `floor`; any other shape by the engine's
   * shape distance; zero outside.
   * Parameter shape: The placed segment's profile shape.
   * Returns: The depth in metres of a segment-local point, given the depth
   * below which the caller has no use for it.
   */
  export function prepareInside(
    shape: IAutoMovieMotionHumanColliders.IPlaced["shapes"][number],
  ): (local: IAutoMovieVector3, floor: number) => number {
    if (shape.kind !== "hull")
      return (local: IAutoMovieVector3): number =>
        Math.max(
          0,
          -AutoMovieEnginePhysics.physicalShapeSegmentDistance(
            walkLegCapsules.IDENTITY,
            shape,
            local,
            local,
          ),
        );
    const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
      shape.transform.rotation,
    );
    const hull: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeHull> = AutoMovieEnginePhysics.physicalShapeHull(shape);
    return (local: IAutoMovieVector3, floor: number): number => {
      const point: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
        inverse,
        AutoMovieEngineVector3.subtract(local, shape.transform.position),
      );

      // A point outside the sphere about the hull's vertices lies outside it.
      if (AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(point, hull.centre)) >= hull.radius)
        return 0;
      let depth: number = Infinity;
      for (const f of hull.faces) {
        depth = Math.min(depth, f.offset - AutoMovieEngineVector3.dot(f.normal, point));
        if (depth <= floor) break;
      }
      return Math.max(0, depth);
    };
  }
}
