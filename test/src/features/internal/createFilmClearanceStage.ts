import type {
  IAutoMovieCameraClearanceEnvelope,
  IAutoMovieStage,
} from "@automovie/interface";

import { makeStagingWrite } from "./filmFixtures";

/** Preserve the original duel camera, depth precision and caller-authored clearance envelope. */
export function createFilmClearanceStage(
  clearance: IAutoMovieCameraClearanceEnvelope,
): IAutoMovieStage {
  const base: ReturnType<typeof makeStagingWrite> = makeStagingWrite();
  return {
    ...base,
    cameras: [
      {
        ...base.cameras[0]!,
        near: 0.1,
        far: 100,
        depthPrecision: {
          minimumDepthBits: 24,
          maximumStepMeters: 1,
        },
        clearance,
      },
    ],
  };
}
