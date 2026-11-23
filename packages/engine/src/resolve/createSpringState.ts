import type { IAutoMovieSpringState } from "@automovie/interface";

/** A fresh, empty spring state. */
export const createSpringState: () => IAutoMovieSpringState =
  (): IAutoMovieSpringState => ({
    prev: new Map(),
    centers: new Map(),
    sprung: new Map(),
  });
