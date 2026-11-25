import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";

/**
 * One formation slot promoted out of anonymous batches into an explicit actor.
 * Its base transform precedes source-authored hero performance.
 */
export interface IAutoMovieCompiledFormationHero {
  /** Exact promoted slot. */
  slot: number;

  /** Named explicit scene-node id. */
  actor: string;

  /** Compiler-owned base transform before source-authored performance. */
  transform: IAutoMovieTransform;
}
