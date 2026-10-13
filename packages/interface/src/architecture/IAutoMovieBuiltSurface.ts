import { IAutoMovieSurface } from "../scene/IAutoMovieSurface";

/** A support surface and the logical space in which it can be used. */
export interface IAutoMovieBuiltSurface {
  /** Logical space containing the support patch. */
  space: string;

  /** Existing deterministic support/height representation. */
  surface: IAutoMovieSurface;
}
