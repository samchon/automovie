import type { IAutoMovieHumanPose } from "@automovie/human";

/**
 * One supported riding action, from ordinary seat to a visible racing tuck.
 * Tuck folds knees and the trunk together; wrist contacts remain scene-owned.
 * These are authored clinical controls, not equilibrium or strength claims.
 *
 * @evidence contracts/common.md#implementation-and-ownership Shares the seated and racing silhouette across chase and rescue instead of duplicating unrelated joint tables. Human still supplies anatomical FK, ROM and actual contact fitting; the scene owns phase weights and support.
 * @evidence contracts/common.md#authoring-interface Lean is lumbar degrees; tuck is a finite0–1action weight. Returns fresh pose records. Body angle, clearance and visible motion require the actual whole consumer, not this control table alone.
 */
export function ridingPose(lean: number, tuck: number = 0): IAutoMovieHumanPose {
  if (!Number.isFinite(lean) || !Number.isFinite(tuck) || tuck < 0 || tuck > 1) throw new Error("Invalid supported riding action");
  return {
    legs: {
      left: { hip: { flexion: 78 + 12 * tuck, abduction: 25 }, knee: { flexion: 95 + 30 * tuck } },
      right: { hip: { flexion: 78 + 12 * tuck, abduction: 25 }, knee: { flexion: 95 + 30 * tuck } },
    },
    spine: { lumbar: { flexion: lean + 20 * tuck }, thoracic: { flexion: 8 + 17 * tuck } },
    arms: { left: { shoulder: { flexion: 55 }, elbow: { flexion: 45 } }, right: { shoulder: { flexion: 55 }, elbow: { flexion: 45 } } },
  };
}
