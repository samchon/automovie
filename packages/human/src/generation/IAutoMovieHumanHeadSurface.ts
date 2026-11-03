import type { IAutoMovieHumanHeadCompiled } from "./IAutoMovieHumanHeadCompiled";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanHeadSides } from "./IAutoMovieHumanHeadSides";

/** The surface of one person, ready to cut. */
export interface IAutoMovieHumanHeadSurface {
  /** The prior's curves. */
  compiled: IAutoMovieHumanHeadCompiled;

  /** The person's stations and sizes. */
  plan: IAutoMovieHumanHeadLayout;

  /** Neck ring's radial difference from the law, left side. */
  neckLeft: number[];

  /** Neck ring's radial difference from the law, right side. */
  neckRight: number[];

  /** The neck's radial slope with height at its ring over the law's, left side. */
  slopeLeft: number[];

  /** See {@link slopeLeft}, right side. */
  slopeRight: number[];

  /** Neck ring's height off its plane, left side. */
  riseLeft: number[];

  /** Neck ring's height off its plane, right side. */
  riseRight: number[];

  /** Sections already cut, by station. */
  cut: Map<number, IAutoMovieHumanHeadSides>;
}
