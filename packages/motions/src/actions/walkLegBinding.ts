import {
  Quaternion,
  Vector3,
  physicalHullFaces,
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read and who reads it.
 * @evidence contracts/development/design.md#principled-representation The two relations the clearance reading composes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two prepared readers, read by `walkLegClearance`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The relations are the tangle audit's own geometry.
 */
export namespace walkLegBinding {
  /**
   * Carry probes from one placed segment's frame into another's.
   *
   * @param a The source segment's current placement.
   * @param b The target segment's current placement.
   * @returns A source-local to target-local probe reader for this pair reading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed placements, local frames, varying probes and the pair-reading lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation The rigid transform b⁻¹·a: the target's inverse rotation applied to the position difference, and the inverse times the source rotation applied to each probe.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pair preparation owns the relative translation and rotation; the reader only carries each probe.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No probe, frame or quaternion convention changes; a changed placement needs another reader.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation takes the inversion, the quaternion product and the offset rotation out of each of the pair's probes; each probe costs one rotation and one addition.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A reading holds one placed pair through its probe loop, so only the pair's frame arithmetic is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure holds one translation and one rotation until its loop finishes; it retains no probe or result.
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
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      inverse,
      a.pose.rotation,
    );
    return (probe: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(offset, Quaternion.rotateVector(rotation, probe));
  }

  /**
   * Prepare one shape for the depths of segment-local points inside it, as
   * the audit reads them: a hull's least distance inside its face planes,
   * read no further once it is no deeper than `floor`; any other shape by
   * the engine's shape distance; zero outside.
   *
   * @param shape The placed segment's profile shape.
   * @returns The depth in metres of a segment-local point, given the depth below which the caller has no use for it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the fixed shape, segment-local points, the floor and the zero-outside depth.
   * @evidence contracts/development/implementation.md#principled-implementation A hull query rejects points outside the sphere about its vertices, then takes the least face-plane depth in the hull's frame; other shapes take physicalShapeSegmentDistance at the point.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Shape-kind selection and the hull frame's preparation precede one point reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The floor only stops the face scan once the depth can no longer exceed it, so a depth the caller keeps is always the hull's least face depth.
   * @evidence contracts/development/implementation.md#efficient-algorithms Prepares a hull's inverse rotation and faces once per shape, then scans faces in order per point; non-hull cost is the engine's.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A reading holds the same placed shapes across all its probes, so each shape's frame and faces are shared; changed geometry needs another reader.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One reader per visited shape holds its frame and faces and releases with the reading.
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
    const hull: ReturnType<typeof physicalHullFaces> = physicalHullFaces(
      shape.points,
    );
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
