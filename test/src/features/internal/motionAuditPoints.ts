import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { IAutoMovieMotionHumanAuditMotion } from "@automovie/motions";

/**
 * A hand-made motion of bare joint centres for the audit's tests: each named
 * bone sits where `points` puts it at a film second, with an identity
 * rotation, and the motion declares the given actions (none by default).
 *
 * It lets a test write a path in closed form (a line, a sine, a step) and
 * read what the audit makes of it, with no body and no law in between.
 *
 * @param duration The motion's length, seconds.
 * @param points Every bone's joint centre at a film second, world metres.
 * @param spans The declared actions.
 * @returns The motion.
 */
export function motionAuditPoints(
  duration: number,
  points: (
    seconds: number,
  ) => Partial<Record<AutoMovieHumanoidBone, IAutoMovieVector3>>,
  spans: readonly IAutoMovieMotionHumanAuditMotion.ISpan[] = [],
): IAutoMovieMotionHumanAuditMotion {
  return {
    duration,
    segments: (): readonly IAutoMovieMotionHumanAuditMotion.ISpan[] => spans,
    bones: (
      _subject: string,
      seconds: number,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      const out: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
      for (const [bone, point] of Object.entries(points(seconds)) as [
        AutoMovieHumanoidBone,
        IAutoMovieVector3,
      ][])
        out.set(bone, {
          bone,
          localRotation: { x: 0, y: 0, z: 0, w: 1 },
          worldPosition: point,
          worldRotation: { x: 0, y: 0, z: 0, w: 1 },
        });
      return out;
    },
  };
}
