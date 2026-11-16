import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFrame } from "../posture/HumanFrame";

/**
 * Prepare the measured two-bone geometry and fixed heading of a stepping shank.
 *
 * @param body The unchanged body's thigh and shank lengths, metres.
 * @param heading The unchanged heading toward which its knee bends, degrees.
 * @returns The original forward shank lean, degrees, for each actual world-metre hip and ankle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed body/heading, world-metre varying joints, forward-positive degree result and unchanged-body lifetime.
 * @evidence contracts/development/implementation.md#principled-implementation Retains the cosine-law knee circle and the original least-absolute swing satisfying the foot's no-twist condition, followed by the same shank forward-angle projection.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Measured length products and heading axes precede the one actual-joint reader used by raw walkLeg.lean and repeated rocker/trail searches.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original multiply/add grouping, degeneracy thresholds, cosine clamp, first equal-swing choice and knee construction; no probe, range or sampled result changes.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation shares two length squares and the heading/lateral axes; each trial retains the full bounded two-bone geometry without repeating fixed trigonometry.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller binds one unchanged measured body and heading for its rocker or stance; changing either requires another reader, while every actual hip/ankle is evaluated.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One caller-owned closure retains fixed lengths and private axes until its stance/search releases it, with no hip, ankle, angle or time history.
 */
export function prepareWalkLegLean(
  body: IHumanBody,
  heading: number,
): (hip: IAutoMovieVector3, ankle: IAutoMovieVector3) => number {
  const a: number = body.measure.thigh;
  const b: number = body.measure.shank;
  const aa: number = a * a;
  const bb: number = b * b;
  const forward: IAutoMovieVector3 = HumanFrame.point(
    { origin: { x: 0, y: 0, z: 0 }, yaw: heading },
    { x: 0, y: 0, z: 1 },
  );
  const lateral: IAutoMovieVector3 = { x: forward.z, y: 0, z: -forward.x };
  return (hip: IAutoMovieVector3, ankle: IAutoMovieVector3): number => {
    const v: IAutoMovieVector3 = Vector3.subtract(ankle, hip);
    const d: number = Vector3.length(v);
    if (d < 1e-6) return 0;
    const axis: IAutoMovieVector3 = Vector3.scale(v, 1 / d);
    const along: number = (aa - bb + d * d) / (2 * d);
    const across: number = Math.sqrt(Math.max(0, aa - along * along));
    let perpendicular: IAutoMovieVector3 = Vector3.subtract(
      forward,
      Vector3.scale(axis, Vector3.dot(forward, axis)),
    );
    if (Vector3.length(perpendicular) < 1e-9) return 0;
    perpendicular = Vector3.normalize(perpendicular);

    // The shank's forward axis must be perpendicular to the foot's lateral
    // axis; choose the same nearer of the two knee-circle intersections.
    const side: IAutoMovieVector3 = Vector3.cross(axis, perpendicular);
    const p: number = Vector3.dot(perpendicular, lateral);
    const q: number = Vector3.dot(side, lateral);
    const size: number = Math.hypot(p, q);
    let swing: number = 0;
    if (size > 1e-9 && d - along > 1e-9) {
      const middle: number = Math.atan2(q, p);
      const half: number = Math.acos(
        Math.min(1, Math.max(-1, (across * Vector3.dot(axis, lateral)) / ((along - d) * size))),
      );
      const wrap: (angle: number) => number = (angle: number): number => Math.atan2(Math.sin(angle), Math.cos(angle));
      const one: number = wrap(middle + half);
      const other: number = wrap(middle - half);
      swing = Math.abs(one) <= Math.abs(other) ? one : other;
    }
    const knee: IAutoMovieVector3 = Vector3.add(
      hip,
      Vector3.add(
        Vector3.scale(axis, along),
        Vector3.scale(
          Vector3.add(
            Vector3.scale(perpendicular, Math.cos(swing)),
            Vector3.scale(side, Math.sin(swing)),
          ),
          across,
        ),
      ),
    );
    const shank: IAutoMovieVector3 = Vector3.subtract(knee, ankle);
    return (Math.atan2(Vector3.dot(shank, forward), shank.y) * 180) / Math.PI;
  };
}
