import { IAutoMovieBeatEndActorState } from "./IAutoMovieBeatEndActorState";

/**
 * Resolved forward state produced by one completed beat.
 *
 * `resolveBeatEnd` samples it at the shot end and `compileDefinedShot` returns
 * it as the shot's closing continuity. The next beat blocks against it,
 * `resolveBeatOpening` produces the same shape at `t = 0` so the continuity
 * check can compare the two, and a `getBeatEnd` context request reads it from
 * the slate.
 *
 * @evidence contracts/common.md#principled-implementation `resolveBeatSnapshot` builds it by sampling every scene node at one shot-local instant, throwing on duplicated motions, performances, mounts or plant entries and on a missing motion so the state is unambiguous.
 * @evidence contracts/common.md#clear-and-simple-design The beat and shot ids plus one actor state per node are the whole record, so the same shape serves the closing state, the opening state and the slate entry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts One producer body serves both the end and the opening, so continuity compares two measurements of the same kind instead of an authored value against a measured one.
 * @evidence contracts/common.md#meaningful-documentation States the producer and instant, who stores and who reads it, and the paired opening shape; members give the id each field holds and the actor order.
 * @author Samchon
 */
export interface IAutoMovieBeatEndState {
  /** Beat id whose end state this describes. */
  beat: string;

  /** Shot id that realized the beat. */
  shot: string;

  /** One state per scene node, in scene node order. */
  actors: IAutoMovieBeatEndActorState[];
}
