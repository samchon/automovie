import type { IAutoMovieHeightRule } from "./IAutoMovieHeightRule";
import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/** Structural height input shared by scene, world and prepared support faces. */
export interface IAutoMovieHeightSurface {
  /** The general ground rule, when the surface states one. */
  readonly height?: IAutoMovieHeightRule | undefined;

  /** First height anchor of the two-anchor spelling. */
  readonly anchor?: IAutoMovieVector3 | undefined;

  /** Second height anchor of the two-anchor spelling; `null` when flat. */
  readonly rampTo?: IAutoMovieVector3 | null | undefined;
}
