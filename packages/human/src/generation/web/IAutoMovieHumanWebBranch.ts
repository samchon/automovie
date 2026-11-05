import type { IAutoMovieLoftChain } from "@automovie/engine";
import type { IAutoMovieHumanWebColumn } from "./IAutoMovieHumanWebColumn";

/** A child (a digit or toe) and its columns down from the parent's ring. */
export interface IAutoMovieHumanWebBranch {
  /** Chain name. */
  name: string;

  /** The child's chain. */
  chain: IAutoMovieLoftChain;

  /** The station of the child's end section on its chain. */
  station: number;

  /** Its columns in ring order. */
  columns: IAutoMovieHumanWebColumn[];
}
