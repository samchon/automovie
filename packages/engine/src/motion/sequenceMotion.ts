import type {
  IAutoMovieGaitCycle,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
} from "@automovie/interface";

/**
 * Concatenate nonempty admitted same-skeleton clips in seconds. Durations must be finite and positive; later time-zero seam frames transfer their easing to the retained previous endpoint. Pose and expression values remain borrowed.
 *
 * @evidence contracts/common.md#principled-implementation Shifts each part by the cumulative duration and preserves incoming segment easing at dropped duplicate seams; the stride clock survives only equal period/phase clips spanning whole cycles within 1e-9 cycle tolerance.
 * @evidence contracts/common.md#clear-and-simple-design The single traversal owns timeline concatenation and its stride-clock decision; playback and interpolation remain with sampleMotion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 1e-9 whole-cycle comparison is the existing clock-continuity tolerance; incompatible clocks are cleared instead of synthesized, and no skeleton-specific seam correction exists.
 * @evidence contracts/common.md#meaningful-documentation States same-skeleton admission, seconds, seam easing, borrowed pose data, loop choice and honest clock loss.
 * @evidence contracts/performance.md#efficient-algorithms For P parts and K total keyframes, validation, concatenation and clock comparison cost O(P+K) time and O(K) output storage; all keyframes must be visited to place their times.
 * @evidence contracts/performance.md#reuse-equivalent-work Part pose/expression objects are reused while clock-bearing keyframes are copied; equal gait metadata is carried once rather than rebaked.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the sequence and copied keyframes; input parts and nested pose values are borrowed and no sequence cache or task remains.
 */
export const sequenceMotion: (
  id: string,
  parts: IAutoMovieMotion[],
  loop?: boolean,
) => IAutoMovieMotion = (
  id: string,
  parts: IAutoMovieMotion[],
  loop: boolean = false,
): IAutoMovieMotion => {
  if (parts.length === 0) throw new Error("sequence parts must not be empty");

  const skeleton: string = parts[0]!.skeleton;
  for (const part of parts) {
    if (part.skeleton !== skeleton)
      throw new Error("sequence part skeletons must match");
    if (!Number.isFinite(part.duration))
      throw new Error("sequence part duration must be finite and positive");
    if (part.duration <= 0)
      throw new Error("sequence part duration must be finite and positive");
  }

  const keyframes: IAutoMovieKeyframe[] = [];
  let offset: number = 0;
  for (let p: number = 0; p < parts.length; ++p) {
    const part: IAutoMovieMotion = parts[p]!;
    for (const k of part.keyframes) {
      if (p > 0 && k.time === 0) {
        // the kept seam keyframe carries the incoming part's first-segment
        // easing, sampleMotion eases each segment from its start (#1012)
        const seam: IAutoMovieKeyframe = keyframes[keyframes.length - 1]!;
        keyframes[keyframes.length - 1] = {
          ...seam,
          easing: k.easing,
          bezier: k.bezier,
        };
        continue;
      }
      keyframes.push({ ...k, time: k.time + offset });
    }
    offset += part.duration;
  }
  // A concatenation keeps a stride clock only when every part carries the
  // SAME cycle and each part spans whole cycles, then the phase runs
  // continuously across the seams (`phase(t) = (phaseAt + t) % period` holds
  // for the whole sequence). Any mismatch or partial cycle breaks the clock,
  // so it is honestly dropped rather than approximated.
  const first: IAutoMovieGaitCycle | null = parts[0]!.gaitCycle ?? null;
  const continuous: boolean =
    first !== null &&
    parts.every(
      (part: IAutoMovieMotion): boolean =>
        (part.gaitCycle ?? null) !== null &&
        part.gaitCycle!.period === first.period &&
        part.gaitCycle!.phaseAt === first.phaseAt &&
        Math.abs(
          part.duration / first.period -
            Math.round(part.duration / first.period),
        ) < 1e-9,
    );

  return {
    id,
    skeleton,
    duration: offset,
    loop,
    keyframes,
    gaitCycle: continuous ? first : null,
  };
};
