import type { IAutoMovieRenderSoftPropFrame } from "@automovie/interface";

/** The soft meshes one scene projection owns for its current film instant. */
export interface IAutoMovieRenderSceneSoftProps {
  /**
   * Replace the projected set from the given film instant. Existing subjects
   * keep their mesh identity, and omitted subjects are removed.
   */
  update(frames: readonly IAutoMovieRenderSoftPropFrame[]): void;

  /** Remove and release the meshes held by the projection, then close updates. */
  dispose(): void;
}
