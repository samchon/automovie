import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditMotion } from "../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditMotion";
import { motionHumanFrame } from "./motionHumanFrame";

/**
 * Compare independently built performances on the shared portion of their
 * display clocks. Compare bone positions in metres and orientations as unit
 * quaternion chords, with a 1e-9 tolerance for each.
 *
 * @param first First film.
 * @param second Independently built second film.
 * @param subject Person to compare in both films.
 * @param rate Finite positive samples per second.
 * @returns Duration, bone count, missing bone and channel differences.
 * @throws If timing is nonfinite or a sampled frame is empty or invalid.
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the shared sampled clock, both compared channels and tolerances, and the finite timing and admitted-frame prerequisites.
 * @evidence contracts/development/implementation.md#principled-implementation Checks finite timing before building the shared grid. At each time it validates both frames, checks count and first-film bone membership, and admits only distances and chords within tolerance. The smaller chord treats q and −q as the same orientation.
 * @evidence contracts/development/implementation.md#efficient-algorithms Reads a frame from each film once per grid time and walks the first map with direct second-map lookup. Its stored work is the sampling grid and complaint text. Each film owns its own frames.
 */
export function motionHumanRepeat(
  first: IAutoMovieMotionHumanAuditMotion,
  second: IAutoMovieMotionHumanAuditMotion,
  subject: string,
  rate: number,
): string[] {
  if (!Number.isFinite(first.duration) || !Number.isFinite(second.duration))
    throw new Error("A repeated motion comparison needs finite durations");
  if (!Number.isFinite(rate) || rate <= 0)
    throw new Error(
      "A repeated motion comparison needs a finite positive sample rate",
    );

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
      if (!(position <= 1e-9 && rotation <= 1e-9))
        complaints.push(
          `${subject} ${bone} at ${seconds} s: position ${position} m, rotation chord ${rotation}`,
        );
    }
  }
  return complaints;
}
