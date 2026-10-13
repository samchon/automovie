import { IAutoMovieSpringState } from "./IAutoMovieSpringState";

/** A fresh, empty spring state. */
export const createSpringState = (): IAutoMovieSpringState => ({
  prev: new Map(),
  centers: new Map(),
  sprung: new Map(),
});
