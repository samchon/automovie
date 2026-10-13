import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Read the midpoint of the body's named eye-joint landmarks as the face frame's anchor in common source metres.
 *
 * Refuses a table without `joint-l-eye` or `joint-r-eye`. Finite representable source coordinates are a caller premise; this midpoint adds no clinical eye-centre measurement or extreme-input overflow guard.
 *
 * @evidence contracts/common.md#principled-implementation Exact left/right eye-joint identities yield the componentwise common-frame midpoint used by head carry.
 * @evidence contracts/common.md#clear-and-simple-design One landmark accessor owns the anchor arithmetic while source landmark admission and head transport remain separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing joints refuse instead of a guessed head location; caller finite/representable premises and absent clinical measurement remain explicit.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre frame, required identities and arithmetic/admission limits.
 * @evidence contracts/performance.md#efficient-algorithms Two property lookups and three midpoint calculations use fixed scalar work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each table supplies its own shaped anchor; this pure read implements no cross-state cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the new three-component vector escapes, without retaining the landmark table or acquiring a task.
 */
export function humanPersonEyeCentre(
  landmarks: Readonly<Record<string, IAutoMovieVector3>>,
): IAutoMovieVector3 {
  const left: IAutoMovieVector3 | undefined = landmarks["joint-l-eye"];
  const right: IAutoMovieVector3 | undefined = landmarks["joint-r-eye"];
  if (left === undefined || right === undefined)
    throw new Error(
      "The person head carry needs the body's joint-l-eye and joint-r-eye landmarks.",
    );
  return {
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2,
    z: (left.z + right.z) / 2,
  };
}
