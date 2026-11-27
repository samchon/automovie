import { AutoMovieEngineCurveMath64 as M } from "../AutoMovieEngineCurveMath64";
import { AutoMovieEngineContourSlit64 as Slit } from "../AutoMovieEngineContourSlit64";

export namespace AutoMovieContourLoftCurves64Data {
  /*
   * Local vector aliases preserve the engine's complete binary64 arithmetic.
   */
  export const add: typeof M.add = M.add,
    sub: typeof M.sub = M.sub,
    mul: typeof M.scale = M.scale;

  /*
   * Three-dimensional projection helpers in one common physical chart.
   */
  /*
   * Stable private binding preserves internal call ownership across the public
   * facade.
   */
  export const closestPoint: typeof Slit.closest = Slit.closest;
}
