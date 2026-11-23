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
 * Synthesize each uniquely named profile gait into a clip targeting the
 * supplied skeleton id, keyed by the exact gait name; absent gaits yield an
 * empty object. This assigns clinical controls and identity without inspecting
 * body geometry.
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
