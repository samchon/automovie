import {
  IAutoMovieGait,
  IAutoMovieMotion,
  IAutoMovieProfile,
} from "@automovie/interface";

import { gaitMotion } from "./gaitMotion";

const assertUniqueProfileGaitNames: (
  gaits: readonly IAutoMovieGait[],
) => void = (gaits: readonly IAutoMovieGait[]): void => {
  const seen: Set<string> = new Set<string>();
  for (const gait of gaits) {
    if (seen.has(gait.name))
      throw new Error(`duplicate profile gait name ${gait.name}`);
    seen.add(gait.name);
  }
};

/**
 * Synthesize each uniquely named profile gait into a clip targeting the supplied skeleton id, keyed by the exact gait name; absent gaits yield an empty object. This assigns clinical controls and identity without inspecting body geometry.
 *
 * @evidence contracts/common.md#principled-implementation Checks gait-name uniqueness then delegates each declared gait to gaitMotion with the requested sampling count and skeleton id; binding preserves profile gait semantics rather than deriving body-specific angles from an unavailable rig.
 * @evidence contracts/common.md#clear-and-simple-design The binder owns profile-scoped clip identity and name indexing while gaitMotion owns sampling, phase and scalar gait admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicate names refuse before synthesis, and own data-property definition preserves names such as __proto__ without mutating the result prototype or silently losing a clip.
 * @evidence contracts/common.md#meaningful-documentation States exact-name keys, empty-gait behavior, skeleton-id binding and the absence of geometry-dependent retargeting.
 * @evidence contracts/performance.md#efficient-algorithms Name admission is O(G) with a set; synthesis is O(sum of sampled gait keyframes times declared limb rows), and the output stores one clip per gait without extra entry arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work Each declared gait is synthesized once per call; different skeleton ids produce independently identified clips rather than reusing a mutable cache by profile name.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The result owns its clips and keyframe populations; the temporary name set is released after return/throw and no profile object or resource handle is retained.
 */
export const bindProfileGaits: (
  profile: IAutoMovieProfile,
  skeleton: string,
  samples: number,
) => Record<string, IAutoMovieMotion> = (
  profile: IAutoMovieProfile,
  skeleton: string,
  samples: number,
): Record<string, IAutoMovieMotion> => {
  const gaits: IAutoMovieGait[] = profile.gaits ?? [];
  assertUniqueProfileGaitNames(gaits);
  const clips: Record<string, IAutoMovieMotion> = {};
  for (const gait of gaits)
    Object.defineProperty(clips, gait.name, {
      value: gaitMotion(`${profile.id}:${gait.name}`, skeleton, gait, samples),
      enumerable: true,
      writable: true,
      configurable: true,
    });
  return clips;
};
