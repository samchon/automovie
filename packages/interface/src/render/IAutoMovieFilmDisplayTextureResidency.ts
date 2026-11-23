/**
 * Owned scalar copy of an acquired film beauty compositor's display-storage
 * extent. readAutoMovieFilmDisplayTextureResidency reports three RGBA8
 * nonmipmapped copies per fade/dissolve owner. Failed terminal owners remain
 * reported; successful disposal removes their rows, and these bounds are not
 * proof of physical GPU allocation or retirement.
 */
export interface IAutoMovieFilmDisplayTextureResidency {
  /** Acquired fade or dissolve compositor identity. */
  owner: "film-fade" | "film-dissolve";
  /** Retained display-copy width in pixels. */
  width: number;
  /** Retained display-copy height in pixels. */
  height: number;
  /** Three RGBA8 display copies with no mip levels. */
  copies: 3;
}
