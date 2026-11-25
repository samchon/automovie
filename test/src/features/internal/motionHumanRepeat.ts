import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanAuditMotion } from "@automovie/motions/internal";

import { motionHumanFrame } from "./motionHumanFrame";

/**
 * Compare independently built performances at the same instants, including bone
 * orientations that leave their joint centres unchanged.
 *
 * @param first The first real performance's film.
 * @param second An independently resolved film with the same input values.
 * @param subject The person compared.
 * @param rate Samples per second; the caller's existing determinism rate.
 * @returns Every differing bone channel and duration, with its film second.
 * @evidence contracts/development/common.md#meaningful-documentation States the independent-state precondition and channels compared.
 * @evidence contracts/development/implementation.md#principled-implementation A pure deterministic performance has the same displayed positions and unit orientations; q and -q represent the same orientation. Both the metre and quaternion-chord bounds are 1e-9, the existing determinism bound.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Checks duration, then both directions of bone membership and the two displayed channels on the caller's grid.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads both actual films and rejects nonfinite frames before arithmetic; no expected pose is copied from implementation bookkeeping.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in grid frames times bones, stopping neither film at its first finding.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses each owning film's frame cache without sharing resolution between the two films.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only complaint text for the comparison; the films own their frames.
 */
export function motionHumanRepeat(
  first: IAutoMovieMotionHumanAuditMotion,
  second: IAutoMovieMotionHumanAuditMotion,
  subject: string,
  rate: number,
): string[] {
  const complaints: string[] = [];
  if (Math.abs(first.duration - second.duration) > 1e-9)
    complaints.push(
      `duration differs: ${first.duration} and ${second.duration}`,
    );
  for (const seconds of AutoMovieMotionHumanAuditMotion.grid(
    0,
    Math.min(first.duration, second.duration),
    rate,
  ).reverse()) {
    const a: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      first.bones(subject, seconds);
    const b: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      second.bones(subject, seconds);
    motionHumanFrame(a, `${subject} first at ${seconds} s`);
    motionHumanFrame(b, `${subject} repeat at ${seconds} s`);
    if (a.size !== b.size)
      complaints.push(
        `${subject} at ${seconds} s: bone counts ${a.size} and ${b.size}`,
      );
    for (const [bone, left] of a) {
      const right: IAutoMovieResolvedBone | undefined = b.get(bone);
      if (right === undefined) {
        complaints.push(`${subject} at ${seconds} s: missing ${bone}`);
        continue;
      }
      const p: IAutoMovieVector3 = left.worldPosition;
      const q: IAutoMovieVector3 = right.worldPosition;
      const position: number = Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
      const x: IAutoMovieQuaternion = left.worldRotation;
      const y: IAutoMovieQuaternion = right.worldRotation;
      const rotation: number = Math.min(
        Math.hypot(x.x - y.x, x.y - y.y, x.z - y.z, x.w - y.w),
        Math.hypot(x.x + y.x, x.y + y.y, x.z + y.z, x.w + y.w),
      );
      if (position > 1e-9 || rotation > 1e-9)
        complaints.push(
          `${subject} ${bone} at ${seconds} s: position ${position} m, rotation chord ${rotation}`,
        );
    }
  }
  return complaints;
}
