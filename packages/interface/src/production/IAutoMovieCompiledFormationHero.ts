import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";

/** One slot promoted out of anonymous batches into an explicit scene node. */
export interface IAutoMovieCompiledFormationHero {
  /** Exact promoted slot. */
  slot: number;

  /** Named explicit scene-node id. */
  actor: string;

  /** Compiler-owned base transform before source-authored performance. */
  transform: IAutoMovieTransform;
}
