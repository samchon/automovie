import type { IAutoMovieSpringState } from "@automovie/interface";

/*
 * A fresh, empty spring state.
 */
export function createSpringState(): IAutoMovieSpringState {
  return {
    prev: new Map(),
    centers: new Map(),
    sprung: new Map(),
  };
}
