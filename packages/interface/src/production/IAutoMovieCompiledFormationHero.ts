import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";

/**
 * One formation slot promoted out of anonymous batches into an explicit actor. Its base transform precedes source-authored hero performance.
 *
 * @evidence contracts/common.md#principled-implementation Slot identity selects the same deterministic formation position used by anonymous members, while actor identity promotes that slot into an explicit scene node whose compiled base transform can be checked against the formation.
 * @evidence contracts/common.md#clear-and-simple-design Slot, actor and base transform are the entire promotion record; full model geometry and performance remain on the ordinary scene actor instead of being duplicated in the population.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Promotion removes the slot from anonymous instance batches rather than drawing two members, and the actor's authored motion composes over its actual compiled base position.
 * @evidence contracts/common.md#meaningful-documentation Defines promoted slot identity, explicit node identity and ownership and timing of the compiler-produced base transform.
 * @author Samchon
 */
export interface IAutoMovieCompiledFormationHero {
  /** Exact promoted slot. */
  slot: number;

  /** Named explicit scene-node id. */
  actor: string;

  /** Compiler-owned base transform before source-authored performance. */
  transform: IAutoMovieTransform;
}
