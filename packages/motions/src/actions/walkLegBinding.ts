import type { IAutoMovieMotionHumanColliders, IAutoMoviePhysicalHullFaces, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import {
  physicalHullFaces,
  physicalShapeSegmentDistance,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import { walkLegCapsules } from "./walkLegCapsules";

/**
 * The relations a binding probe of two legs' clearance is read through
 * (`walkLegClearance.reading`): the probe and the face that bind, a point's
 * place relative to a posed bone, whether it lies inside a hull, and its
 * depth below a face.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read and who reads it.
 * @evidence contracts/development/design.md#principled-representation The binding's record and the three relations the reading and its gradient share.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record and three functions, read by `walkLegClearance`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The relations are the tangle audit's own geometry.
 */
export namespace walkLegBinding {
  /** The probe, hull and face that bind a reading (`reading`). */
  export interface IBinding {
    /** Which leg carries the probe, 0 or 1. */
    from: number;

    /** The probe's segment among the audit model's parts. */
    i: number;

    /** Which leg carries the hull. */
    to: number;

    /** The hull's segment among the audit model's parts. */
    j: number;

    /** The probe, in its segment's frame. */
    probe: IAutoMovieVector3;

    /** The hull among its segment's shapes. */
    shape: number;

    /** The face plane the probe lies least inside, in the hull's frame; none for a shape that is not a hull. */
    face: IAutoMoviePhysicalHullFaces.IFace | undefined;

    /** The probe's reference depth there, metres. */
    reference: number;
  }

  /** A probe of segment `a` in segment `b`'s frame, as the audit carries it (`AutoMovieMotionHumanAuditTangleModel.depths`). */
  export function relative(
    probe: IAutoMovieVector3,
    a: IAutoMovieMotionHumanColliders.IPlaced,
    b: IAutoMovieMotionHumanColliders.IPlaced,
  ): IAutoMovieVector3 {
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(b.pose.rotation);
    return Vector3.add(
      Quaternion.rotateVector(
        inverse,
        Vector3.subtract(a.pose.position, b.pose.position),
      ),
      Quaternion.rotateVector(
        Quaternion.multiply(inverse, a.pose.rotation),
        probe,
      ),
    );
  }

  /**
   * How deep a point lies in a shape, metres, zero outside, as the audit
   * reads it: a hull's least distance inside its face planes, with the face
   * that gives it, read no further once it is no deeper than `floor`; any
   * other shape by the engine's shape distance.
   */
  export function inside(
    shape: IAutoMovieMotionHumanColliders.IPlaced["shapes"][number],
    local: IAutoMovieVector3,
    floor: number,
  ): { depth: number; face: IAutoMoviePhysicalHullFaces.IFace | undefined } {
    if (shape.kind !== "hull")
      return {
        depth: Math.max(
          0,
          -physicalShapeSegmentDistance(walkLegCapsules.IDENTITY, shape, local, local),
        ),
        face: undefined,
      };
    const point: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(shape.transform.rotation),
      Vector3.subtract(local, shape.transform.position),
    );
    // A point outside the sphere about the hull's vertices lies outside it.
    const hull: IAutoMoviePhysicalHullFaces.IHull = physicalHullFaces(shape.points);
    if (Vector3.length(Vector3.subtract(point, hull.centre)) >= hull.radius)
      return { depth: 0, face: undefined };
    let depth: number = Infinity;
    let face: IAutoMoviePhysicalHullFaces.IFace | undefined;
    for (const f of hull.faces) {
      const d: number = f.offset - Vector3.dot(f.normal, point);
      if (d < depth) {
        depth = d;
        face = f;
      }
      if (depth <= floor) break;
    }
    return { depth: Math.max(0, depth), face };
  }

  /** How far a point lies inside one face plane of a hull, metres, negative outside. */
  export function planar(
    shape: IAutoMovieMotionHumanColliders.IPlaced["shapes"][number],
    local: IAutoMovieVector3,
    face: IAutoMoviePhysicalHullFaces.IFace,
  ): number {
    const point: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(shape.transform.rotation),
      Vector3.subtract(local, shape.transform.position),
    );
    return face.offset - Vector3.dot(face.normal, point);
  }
}
