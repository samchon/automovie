import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { IAutoMovieMotionHumanAuditMotion } from "@automovie/motions";

/**
 * A hand-made motion for the audit's tests: one fixed set of displayed bones
 * whose every bone is carried by a translation the test writes in closed
 * form, with its rotation untouched.
 *
 * Translating the whole body rigidly, or one limb against the rest, injects
 * a defect of a known size (a foot that slides 30 mm, a forearm set inside
 * the chest, a body sunk 20 mm into the floor), so the audit's reading has
 * an expected value that does not come from the audit.
 *
 * @param bones The displayed bones of the still body.
 * @param duration The motion's length, seconds.
 * @param move The translation of a bone at a film second, world metres.
 * @param spans The declared actions.
 * @returns The motion.
 */
export function motionAuditMoved(
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  duration: number,
  move: (bone: AutoMovieHumanoidBone, seconds: number) => IAutoMovieVector3,
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
      for (const [bone, resolved] of bones) {
        const by: IAutoMovieVector3 = move(bone, seconds);
        out.set(bone, {
          ...resolved,
          worldPosition: {
            x: resolved.worldPosition.x + by.x,
            y: resolved.worldPosition.y + by.y,
            z: resolved.worldPosition.z + by.z,
          },
        });
      }
      return out;
    },
  };
}
