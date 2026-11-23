import type { AutoMovieVector3Tuple } from "@automovie/interface";

import { len } from "./len";
import { mul } from "./mul";

/**
 * Unit direction; a zero input remains zero so callers can handle degeneracy
 * explicitly.
 */
export const norm: (a: AutoMovieVector3Tuple) => AutoMovieVector3Tuple = (
  a: AutoMovieVector3Tuple,
): AutoMovieVector3Tuple => mul(a, 1 / (len(a) || 1));
