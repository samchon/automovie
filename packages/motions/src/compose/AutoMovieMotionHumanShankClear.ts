import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanVerdicts } from "../audit/HumanVerdicts";

/**
 * A swinging ankle kept clear of the standing leg's shank: the stance shank
 * is the capsule about the segment from its ankle a shank's length toward
 * its hip (the knee lies near that line), of radius two shank radii plus the
 * skin's give (`HumanVerdicts.SKIN`), so the two shanks' surfaces do not
 * meet. A point inside is moved out to the capsule's surface along the line
 * from the nearest point of the segment, the least move that clears it; a
 * point outside is returned as it is. The swinging foot passes beside the
 * standing leg, as a stepping foot passes the stance ankle at the step's
 * width, never through it.
 *
 * @param body The body, whose shank length and radius size the capsule.
 * @param point The swinging ankle, world metres.
 * @param ankle The standing ankle, world metres.
 * @param hip The standing leg's hip joint, world metres.
 * @returns The ankle clear of the standing shank, world metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the capsule, its radius, the projection and what it models.
 * @evidence contracts/development/implementation.md#principled-implementation The nearest point of a segment and the radial projection onto a capsule are the closed forms of a point-capsule separation; the radius is the two shanks' own plus the verdicts' skin.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One nearest point, one distance, one projection.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every length is the body's or the verdicts'; a point inside moves only to the surface, never by a tuned offset.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function AutoMovieMotionHumanShankClear(
  body: IAutoMovieMotionHumanBody,
  point: IAutoMovieVector3,
  ankle: IAutoMovieVector3,
  hip: IAutoMovieVector3,
): IAutoMovieVector3 {
  const radius: number = 2 * body.measure.shankRadius + HumanVerdicts.SKIN;
  const up: IAutoMovieVector3 = Vector3.subtract(hip, ankle);
  const length: number = Vector3.length(up);
  if (!(length > 0)) return point;
  const axis: IAutoMovieVector3 = Vector3.scale(up, 1 / length);
  const along: number = Math.min(
    body.measure.shank,
    Math.max(0, Vector3.dot(Vector3.subtract(point, ankle), axis)),
  );
  const nearest: IAutoMovieVector3 = Vector3.add(
    ankle,
    Vector3.scale(axis, along),
  );
  const off: IAutoMovieVector3 = Vector3.subtract(point, nearest);
  const distance: number = Vector3.length(off);
  if (distance >= radius) return point;
  // A point on the axis itself, which a course passing beside the leg does
  // not reach, has no nearest side; it leaves along the world's x.
  const out: IAutoMovieVector3 =
    distance > 1e-9 ? Vector3.scale(off, 1 / distance) : { x: 1, y: 0, z: 0 };
  return Vector3.add(nearest, Vector3.scale(out, radius));
}
