import { AutoMovieCurveMath64 as M } from "../AutoMovieCurveMath64";
import { AutoMovieContourSlit64 as Slit } from "../AutoMovieContourSlit64";

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
