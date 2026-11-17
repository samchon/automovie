import {
  Quaternion,
  Vector3,
  physicalHullFaces,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanColliders,
  IAutoMoviePhysicalHullFaces,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

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

  /**
   * A source-local probe in target segment b's local frame, as the tangle audit carries it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States source/target-local frames; a and b are the actual placed segment transforms.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates the original inverse-relative rigid transform to prepareRelative and evaluates the actual probe once.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One preparation and one read share the same transform owner with repeated-probe collision reading.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Changes no quaternion, translation or addition grouping and does not reuse another probe's result.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work; repeated-probe callers prepare the unchanged pair outside their loop.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Raw and repeated-probe paths share the same formula, while this standalone call evaluates its current placements.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The short-lived reader releases on return or throw, and only a fresh vector escapes.
   */
  export function relative(
    probe: IAutoMovieVector3,
    a: IAutoMovieMotionHumanColliders.IPlaced,
    b: IAutoMovieMotionHumanColliders.IPlaced,
  ): IAutoMovieVector3 {
    return prepareRelative(a, b)(probe);
  }

  /**
   * Carry varying probes between one unchanged pair of placed segment frames.
   *
   * @param a The source segment's actual current placement.
   * @param b The target segment's actual current placement.
   * @returns A source-local to target-local probe reader for this synchronous pair reading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed actual placements, local frames, varying probes and synchronous lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same target inverse, inverse-rotated position difference and inverse-times-source rotation as relative, retaining the original two rotations and addition grouping.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pair preparation owns its relative translation and rotation; the returned reader only carries each actual probe.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No probe, frame, quaternion convention or depth changes; any changed placement requires another reader.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation removes repeated inversion, quaternion multiplication and fixed-vector rotation from each of P probes; every probe still performs its own rotation and addition.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work reading binds one immutable placed pair throughout its ordered probe loop, so only the pair's fixed frame arithmetic is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The pair-local closure holds one private translation and rotation until that synchronous loop finishes or throws; it retains no query history or external resource.
   */
  export function prepareRelative(
    a: IAutoMovieMotionHumanColliders.IPlaced,
    b: IAutoMovieMotionHumanColliders.IPlaced,
  ): (probe: IAutoMovieVector3) => IAutoMovieVector3 {
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(b.pose.rotation);
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(
      inverse,
      Vector3.subtract(a.pose.position, b.pose.position),
    );
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(inverse, a.pose.rotation);
    return (probe: IAutoMovieVector3): IAutoMovieVector3 => Vector3.add(
      offset,
      Quaternion.rotateVector(rotation, probe),
    );
  }

  /**
   * How deep a point lies in a shape, metres, zero outside, as the audit
   * reads it: a hull's least distance inside its face planes, with the face
   * that gives it, read no further once it is no deeper than `floor`; any
   * other shape by the engine's shape distance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States segment-local point, metre depth/floor, zero-outside convention and the optional binding hull face.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates the exact hull-plane or engine shape-distance method to prepareInside and reads this actual point/floor.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One preparation and read retain a single geometry owner for standalone and repeated-probe paths.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains the original sphere/face/floor decisions and returns the actual depth and binding face.
   * @evidence contracts/development/implementation.md#efficient-algorithms Keeps the original ordered face cost; repeated-probe callers prepare the shape frame once outside their loops.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the depth implementation while standalone calls evaluate their current shape and query without a result cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The one-query reader releases on return or throw and returns only depth/face data, with no retained point or history.
   */
  export function inside(
    shape: IAutoMovieMotionHumanColliders.IPlaced["shapes"][number],
    local: IAutoMovieVector3,
    floor: number,
  ): { depth: number; face: IAutoMoviePhysicalHullFaces.IFace | undefined } {
    return prepareInside(shape)(local, floor);
  }

  /**
   * Prepare one unchanged shape's local frame for its actual probe depths.
   *
   * @param shape The placed segment's fixed profile shape.
   * @returns The original depth and binding face for a segment-local point and early-exit floor, in metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines fixed shape geometry, segment-local varying points, floor units, original depth/face result and synchronous use.
   * @evidence contracts/development/implementation.md#principled-implementation Hull queries retain the inverse shape frame, enclosing-sphere rejection and ordered minimum face-plane depth; other shapes still delegate every actual point to physicalShapeSegmentDistance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Shape-kind selection and fixed hull frame preparation precede one actual-point reader shared by inside and clearance's probe loops.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The greater-or-equal sphere screen, strict first-face update, floor early exit and zero-outside clamp remain unchanged; no depth or candidate verdict is reused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Prepares a hull inverse and its canonical face data once per unchanged shape, then keeps the original ordered face traversal for every point; non-hull query cost remains delegated.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work reading holds the same actual placed shapes while reading all meeting pairs, so their fixed shape transform and hull may be shared across probes; changed geometry requires a new reader.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One operation-local reader per actually visited shape holds fixed shape/hull data and releases with reading; no point, depth, prior pose or global cache is retained.
   */
  export function prepareInside(
    shape: IAutoMovieMotionHumanColliders.IPlaced["shapes"][number],
  ): (local: IAutoMovieVector3, floor: number) => { depth: number; face: IAutoMoviePhysicalHullFaces.IFace | undefined } {
    if (shape.kind !== "hull")
      return (local: IAutoMovieVector3): { depth: number; face: undefined } => ({
        depth: Math.max(
          0,
          -physicalShapeSegmentDistance(walkLegCapsules.IDENTITY, shape, local, local),
        ),
        face: undefined,
      });
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(shape.transform.rotation);
    const hull: IAutoMoviePhysicalHullFaces.IHull = physicalHullFaces(shape.points);
    return (local: IAutoMovieVector3, floor: number): { depth: number; face: IAutoMoviePhysicalHullFaces.IFace | undefined } => {
      const point: IAutoMovieVector3 = Quaternion.rotateVector(
        inverse,
        Vector3.subtract(local, shape.transform.position),
      );

      // A point outside the sphere about the hull's vertices lies outside it.
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
    };
  }

  /**
   * How far a segment-local point lies inside one shape-local hull face, metres, negative outside.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States coordinate frames, signed metre result and the fixed supplied hull face.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates the original inverse shape frame and plane projection to preparePlanar for this actual point.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One preparation and read share the binding derivative's plane owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not clamp, select another face or substitute a full hull depth for the named plane.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work, while repeated derivative calls prepare the unchanged shape inverse once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the plane formula; this standalone call reads its actual shape, face and point without caching a verdict.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The short-lived reader releases on return or throw and only its scalar result escapes.
   */
  export function planar(
    shape: IAutoMovieMotionHumanColliders.IPlaced["shapes"][number],
    local: IAutoMovieVector3,
    face: IAutoMoviePhysicalHullFaces.IFace,
  ): number {
    return preparePlanar(shape, face)(local);
  }

  /**
   * Prepare the fixed shape frame and face of one binding derivative.
   *
   * @param shape The immutable profile shape selected by the actual reading.
   * @param face That reading's binding face in shape-local coordinates.
   * @returns The signed distance below that same plane for a segment-local point, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the actual selected shape/face, varying local point, signed units and binding lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation Preserves inverse shape rotation, local-position subtraction and face-offset-minus-dot arithmetic of planar.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One fixed inverse feeds the scalar plane reader used by planar and the binding's actual derivative.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The selected face is never replaced, searched again or rounded; every moved point is actually transformed and read against it.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation removes one unchanged quaternion inversion from each derivative query while retaining its point rotation and plane projection.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A reading's derivative changes posed segment frames but keeps the same immutable body's profile shape and selected local face; any new binding receives its own reader.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The binding closure owns one inverse/shape/face reader until released and keeps no moved point, depth, prior leg or external handle.
   */
  export function preparePlanar(
    shape: IAutoMovieMotionHumanColliders.IPlaced["shapes"][number],
    face: IAutoMoviePhysicalHullFaces.IFace,
  ): (local: IAutoMovieVector3) => number {
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(shape.transform.rotation);
    return (local: IAutoMovieVector3): number => {
      const point: IAutoMovieVector3 = Quaternion.rotateVector(
        inverse,
        Vector3.subtract(local, shape.transform.position),
      );
      return face.offset - Vector3.dot(face.normal, point);
    };
  }
}
