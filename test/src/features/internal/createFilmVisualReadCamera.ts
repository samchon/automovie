import type { IAutoMovieCamera } from "@automovie/interface";

import { createFilmVisualReadTransform } from "./createFilmVisualReadTransform";

/** Preserve the existing origin camera and its explicit optional overrides. */
export const createFilmVisualReadCamera = (over: Partial<IAutoMovieCamera> = {}): IAutoMovieCamera => ({
  id: "cam",
  transform: createFilmVisualReadTransform(0, 0, 0),
  fovY: 60,
  near: 0.1,
  far: 100,
  ...over,
  depthPrecision: over.depthPrecision ?? {
    minimumDepthBits: 24,
    maximumStepMeters: 100,
  },
});
