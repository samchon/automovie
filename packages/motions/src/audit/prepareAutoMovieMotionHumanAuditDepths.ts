import {
  Quaternion,
  Vector3,
  physicalHullFaces,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";

/**
 * Prepare one placed collider segment as the segment other segments' probes
 * are read in (`AutoMovieMotionHumanAuditTangleModel.depths`).
 *
 * @param b The placed segment the probes are read in. Its pose and its shapes' transforms stay unchanged while the reader is used: the reader belongs to one reading of one pose.
 * @returns A reader of how deep each probe of another placed segment lies in `b`: the probes in that segment's frame and the segment, giving metres per probe, zero outside.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the placed segment, the premise that it stays as placed, the reader's inputs, its unit and its outside value.
 * @evidence contracts/development/implementation.md#principled-implementation Interior depth of a point in a convex hull is its least distance to the face planes; other shapes are read by the engine's shape distance. The inverse of the segment's rotation, each shape's bounding sphere in the segment's frame and each hull's own inverse rotation depend on `b` alone, so they are the values every reading against `b` computed, computed once.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure What depends on `b` alone precedes one reader that keeps the original probe, shape and face loops.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The engine still owns every hull face and shape distance; no query, bound, face order, deepest comparison or tolerance changes.
 * @evidence contracts/development/implementation.md#efficient-algorithms For a pose read as P ordered pairs against one segment of H shapes, the segment's inverse rotation and its H bounding spheres are computed once instead of P times, and a hull's inverse rotation once at its first use. Each reading keeps its sphere screening, its selected point transforms and the face loop's early cut. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared across the readings of one pose against this placed segment: the three values above, functions of `b`'s pose and shape transforms only. The caller that placed the segments holds the reader and drops it with them, so no reader meets another pose.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader holds `b`, its inverse rotation, one sphere per shape and at most one inverse rotation per hull until its caller drops it; each reading returns a fresh depth array and keeps no probe, segment or depth.
 */
export function prepareAutoMovieMotionHumanAuditDepths(
  b: HumanColliders.IPlaced,
): (probes: readonly IAutoMovieVector3[], a: HumanColliders.IPlaced) => Float64Array {
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(b.pose.rotation);

  // Each shape's bounding sphere in the segment's frame: a probe outside it
  // is outside the shape, which then adds no depth.
  const balls: { centre: IAutoMovieVector3; radius: number }[] = b.shapes.map(
    (shape: IAutoMoviePhysicalProfile.IShape): { centre: IAutoMovieVector3; radius: number } => {
      const ball: HumanColliders.IBall = HumanColliders.bound(shape);
      return {
        centre: Vector3.add(
          shape.transform.position,
          Quaternion.rotateVector(shape.transform.rotation, ball.centre),
        ),
        radius: ball.radius,
      };
    },
  );
  let inverses: IAutoMovieQuaternion[] | undefined;
  return (probes: readonly IAutoMovieVector3[], a: HumanColliders.IPlaced): Float64Array => {
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      inverse,
      a.pose.rotation,
    );
    const position: IAutoMovieVector3 = Quaternion.rotateVector(
      inverse,
      Vector3.subtract(a.pose.position, b.pose.position),
    );
    const out: Float64Array = new Float64Array(probes.length);
    for (let k: number = 0; k < probes.length; k++) {
      // The probe in the segment's frame.
      const local: IAutoMovieVector3 = Vector3.add(
        position,
        Quaternion.rotateVector(rotation, probes[k]!),
      );
      let deepest: number = 0;
      for (let s: number = 0; s < b.shapes.length; s++) {
        const shape: IAutoMoviePhysicalProfile.IShape = b.shapes[s]!;
        if (
          Vector3.distance(local, balls[s]!.centre) >=
          balls[s]!.radius
        )
          continue;
        if (shape.kind !== "hull") {
          deepest = Math.max(
            deepest,
            -physicalShapeSegmentDistance(IDENTITY, shape, local, local),
          );
          continue;
        }
        let unturn: IAutoMovieQuaternion | undefined = inverses?.[s];
        if (unturn === undefined) {
          unturn = Quaternion.inverse(shape.transform.rotation);
          if (inverses === undefined) inverses = [];
          inverses[s] = unturn;
        }
        const point: IAutoMovieVector3 = Quaternion.rotateVector(
          unturn,
          Vector3.subtract(local, shape.transform.position),
        );
        let inside: number = Infinity;
        for (const face of physicalHullFaces(shape.points).faces) {
          inside = Math.min(
            inside,
            face.offset - Vector3.dot(face.normal, point),
          );
          if (inside <= deepest) break;
        }
        if (inside !== Infinity) deepest = Math.max(deepest, inside);
      }
      out[k] = deepest;
    }
    return out;
  };
}

/** The identity frame a shape's distance is read in. */
const IDENTITY: IAutoMoviePhysicalProfile.ITransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};
