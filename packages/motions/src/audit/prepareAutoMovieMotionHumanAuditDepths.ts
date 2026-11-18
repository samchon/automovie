import {
  Quaternion,
  Vector3,
  physicalHullFaces,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanColliders,
  IAutoMoviePhysicalHullFaces,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";

/**
 * Prepare one placed collider segment as the segment other segments' probes
 * are read in (`AutoMovieMotionHumanAuditTangleModel.depths`).
 *
 * A reading may be handed an array to receive each probe's room: the most, over `b`'s shapes, of the
 * shape's bounding-sphere radius less the probe's distance from its centre.
 * A shape lies inside its bounding sphere, so a point's depth in it is no
 * more than its depth in the sphere, and the room bounds the probe's depth
 * from above where it is positive; it is a distance difference, so it moves
 * no faster than the probe and the segment move apart, which is what a
 * conservative-advancement certificate needs.
 *
 * @param b The placed segment the probes are read in. Its pose and its shapes' transforms stay unchanged while the reader is used: the reader belongs to one reading of one pose.
 * @returns A reader of how deep each probe of another placed segment lies in `b`: the probes in that segment's frame, the segment and the optional room array, giving metres per probe, zero outside.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the placed segment, the premise that it stays as placed, the reader's inputs, its unit and its outside value.
 * @evidence contracts/development/implementation.md#principled-implementation Interior depth of a point in a convex hull is its least distance to the face planes; other shapes are read by the engine's shape distance. The inverse of the segment's rotation, each shape's bounding sphere in the segment's frame and each hull's own inverse rotation depend on `b` alone, so they are the values every reading against `b` computed, computed once.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure What depends on `b` alone precedes one reader that keeps the original probe, shape and face loops.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The engine still owns every hull face and shape distance; no query, bound, face order, deepest comparison or tolerance changes, and the room is read off the screen's own distances.
 * @evidence contracts/development/implementation.md#efficient-algorithms For a pose read as P ordered pairs against one segment of H shapes, the segment's inverse rotation and its H bounding spheres are computed once instead of P times, and a hull's inverse rotation and its faces (the engine's hull of its points, looked up per probe before) once at its first use. Each reading keeps its sphere screening, its selected point transforms and the face loop's early cut. A room request takes the original distance for every shape. Without one, ordinary squared distances at or above a certified squared radius need no square root.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared across the readings of one pose against this placed segment: the three values above, functions of `b`'s pose and shape transforms only. The caller that placed the segments holds the reader and drops it with them, so no reader meets another pose.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader holds `b`, its inverse rotation, one sphere per shape and at most one inverse rotation per hull until its caller drops it; each reading returns a fresh depth array and keeps no probe, segment or depth.
 */
export function prepareAutoMovieMotionHumanAuditDepths(
  b: IAutoMovieMotionHumanColliders.IPlaced,
): (
  probes: readonly IAutoMovieVector3[],
  a: IAutoMovieMotionHumanColliders.IPlaced,
  room?: Float64Array,
) => Float64Array {
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(b.pose.rotation);

  // Each shape's bounding sphere in the segment's frame: a probe outside it
  // is outside the shape, which then adds no depth.
  const balls: IProbeBall[] = b.shapes.map(
    (
      shape: IAutoMoviePhysicalShape,
    ): IProbeBall => {
      const ball: IAutoMovieMotionHumanColliders.IBall =
        HumanColliders.bound(shape);
      const squared: number = ball.radius * ball.radius;
      return {
        centre: Vector3.add(
          shape.transform.position,
          Quaternion.rotateVector(shape.transform.rotation, ball.centre),
        ),
        radius: ball.radius,
        outsideSquared: squared >= 2 ** -1000 && squared <= 2 ** 1000 &&
          Math.sqrt(squared) >= ball.radius ? squared : Infinity,
      };
    },
  );
  let inverses: IAutoMovieQuaternion[] | undefined;

  // Each hull's faces, read off the engine's hull of its points at the
  // hull's first probe: the same record every probe read before.
  let hulls: IAutoMoviePhysicalHullFaces.IFace[][] | undefined;
  return (
    probes: readonly IAutoMovieVector3[],
    a: IAutoMovieMotionHumanColliders.IPlaced,
    room?: Float64Array,
  ): Float64Array => {
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      inverse,
      a.pose.rotation,
    );
    const position: IAutoMovieVector3 = Quaternion.rotateVector(
      inverse,
      Vector3.subtract(a.pose.position, b.pose.position),
    );
    const out: Float64Array = new Float64Array(probes.length);
    const rx: number = rotation.x;
    const ry: number = rotation.y;
    const rz: number = rotation.z;
    const rw: number = rotation.w;
    for (let k: number = 0; k < probes.length; k++) {
      // The probe in the segment's frame: `position + rotation * probe`, in
      // the engine's own expressions (`readRotatedVector`, `Vector3.add`) on
      // components, so each value is the one the record forms gave.
      const probe: IAutoMovieVector3 = probes[k]!;
      const tx: number = 2 * (ry * probe.z - rz * probe.y);
      const ty: number = 2 * (rz * probe.x - rx * probe.z);
      const tz: number = 2 * (rx * probe.y - ry * probe.x);
      const lx: number = position.x + (probe.x + rw * tx + (ry * tz - rz * ty));
      const ly: number = position.y + (probe.y + rw * ty + (rz * tx - rx * tz));
      const lz: number = position.z + (probe.z + rw * tz + (rx * ty - ry * tx));
      let local: IAutoMovieVector3 | undefined;
      let deepest: number = 0;
      let roomy: number = -Infinity;
      for (let s: number = 0; s < b.shapes.length; s++) {
        const shape: IAutoMoviePhysicalShape = b.shapes[s]!;
        const ball: IProbeBall = balls[s]!;
        const bx: number = lx - ball.centre.x;
        const by: number = ly - ball.centre.y;
        const bz: number = lz - ball.centre.z;
        const squared: number = bx * bx + by * by + bz * bz;
        // `Vector3.distance`: the square root wherever the square neither
        // underflows nor overflows, its own scaled form elsewhere.
        const ordinary: boolean = squared >= 2 ** -1000 && squared <= 2 ** 1000;
        // Monotonicity of sqrt proves the original outside comparison.
        if (room === undefined && ordinary && squared >= ball.outsideSquared) continue;
        const apart: number =
          ordinary
            ? Math.sqrt(squared)
            : Vector3.distance({ x: lx, y: ly, z: lz }, ball.centre);
        if (room !== undefined) roomy = Math.max(roomy, ball.radius - apart);
        if (apart >= ball.radius) continue;
        if (shape.kind !== "hull") {
          local ??= { x: lx, y: ly, z: lz };
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
        // The probe in the hull's frame: `unturn * (local - position)`.
        const vx: number = lx - shape.transform.position.x;
        const vy: number = ly - shape.transform.position.y;
        const vz: number = lz - shape.transform.position.z;
        const ux: number = 2 * (unturn.y * vz - unturn.z * vy);
        const uy: number = 2 * (unturn.z * vx - unturn.x * vz);
        const uz: number = 2 * (unturn.x * vy - unturn.y * vx);
        const px: number = vx + unturn.w * ux + (unturn.y * uz - unturn.z * uy);
        const py: number = vy + unturn.w * uy + (unturn.z * ux - unturn.x * uz);
        const pz: number = vz + unturn.w * uz + (unturn.x * uy - unturn.y * ux);
        let inside: number = Infinity;
        let faces: IAutoMoviePhysicalHullFaces.IFace[] | undefined = hulls?.[s];
        if (faces === undefined) {
          faces = physicalHullFaces(shape.points).faces;
          if (hulls === undefined) hulls = [];
          hulls[s] = faces;
        }
        for (const face of faces) {
          inside = Math.min(
            inside,
            face.offset -
              (face.normal.x * px + face.normal.y * py + face.normal.z * pz),
          );
          if (inside <= deepest) break;
        }
        if (inside !== Infinity) deepest = Math.max(deepest, inside);
      }
      out[k] = deepest;
      if (room !== undefined) room[k] = roomy;
    }
    return out;
  };
}

/** A placed sphere with its certified lower squared distance for outside probes. */
interface IProbeBall extends IAutoMovieMotionHumanColliders.IBall {
  /** Infinity where the ordinary square root does not certify the radius. */
  outsideSquared: number;
}

/** The identity frame a shape's distance is read in. */
const IDENTITY: IAutoMovieRigidTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};
