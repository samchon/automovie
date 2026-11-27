import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { AutoMovieVector3Tuple } from "@automovie/interface";

/*
 * Unit direction; a zero input remains zero so callers can handle degeneracy
 * explicitly.
 */
export const norm: (a: AutoMovieVector3Tuple) => AutoMovieVector3Tuple = (
  a: AutoMovieVector3Tuple,
): AutoMovieVector3Tuple => AutoMovieEngineVector3.normalizeTuple(a);
