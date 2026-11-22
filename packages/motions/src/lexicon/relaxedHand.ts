import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

/** The digits' bone names, each beginning with its side. */
const DIGITS: readonly string[] = [
  "Thumb",
  "Index",
  "Middle",
  "Ring",
  "Little",
];

/**
 * A posture whose one hand's digits are blended from their angles toward the
 * angles an entry posture held them at: a hand that struck open relaxing back
 * into the hand it began with.
 *
 * @param posture The posture.
 * @param entry The posture the hand's digits relax toward.
 * @param side The hand.
 * @param share How far the digits have relaxed, from 0 (as struck) to 1 (as entered).
 * @returns The posture with that hand's digits blended.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is blended, toward what and the share's meaning.
 * @evidence contracts/development/implementation.md#principled-implementation Each digit joint's clinical angles are interpolated linearly, the digits' joints being single-axis flexions within their range at both ends.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the posture's joints.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A digit the entry did not set keeps its angles.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the posture's joints.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the entry's own angles.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function relaxedHand(
  posture: IAutoMovieMotionHumanPosture,
  entry: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide,
  share: number,
): IAutoMovieMotionHumanPosture {
  const w: number = Math.min(1, Math.max(0, share));
  if (w === 0) return posture;
  const joints: IAutoMovieMotionHumanPosture["joints"] = { ...posture.joints };
  for (const [bone, angles] of Object.entries(posture.joints) as [
    AutoMovieHumanoidBone,
    readonly [number, number, number],
  ][]) {
    if (
      !bone.startsWith(side) ||
      !DIGITS.some((digit: string): boolean => bone.includes(digit))
    )
      continue;
    const from: readonly [number, number, number] | undefined =
      entry.joints[bone];
    if (from === undefined) continue;
    joints[bone] = [
      angles[0] + (from[0] - angles[0]) * w,
      angles[1] + (from[1] - angles[1]) * w,
      angles[2] + (from[2] - angles[2]) * w,
    ];
  }
  return { ...posture, joints };
}
