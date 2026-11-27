import type {
  IAutoMovieGaitCycle,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
} from "@automovie/interface";

/*
 * Concatenate nonempty admitted same-skeleton clips in seconds. Durations must
 * be finite and positive; later time-zero seam frames transfer their easing to
 * the retained previous endpoint. Pose and expression values remain borrowed.
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
