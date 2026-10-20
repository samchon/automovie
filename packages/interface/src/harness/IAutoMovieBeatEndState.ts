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
 * @evidence contracts/common.md#principled-implementation `resolveBeatSnapshot` samples each supplied scene node at one shot-local instant and throws on duplicate motion ids, performance nodes, mount nodes or plant-entry nodes and missing referenced motions. Scene identity and finite, compatible nested values remain admitted-input premises; this snapshot is not an independent scene validator.
 * @evidence contracts/common.md#clear-and-simple-design The beat and shot ids plus one actor state per node are the whole record, so the same shape serves the closing state, the opening state and the slate entry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts One producer body serves measured opening and end states. `compileDefinedShot` subsequently substitutes prior resumable gait, velocity, plants and mount into its opening record; the continuity comparator checks position, facing and a prior mount, rather than proving pose, velocity or foot-contact continuity. Returned joints, plant records and mount bindings may borrow inputs and must not be mutated as an isolated deep copy.
 * @evidence contracts/common.md#meaningful-documentation States the producer and instant, who stores and who reads it, and the paired opening shape; members give the id each field holds and the actor order.
 */
export interface IAutoMovieBeatEndState {
  /** Beat id whose end state this describes. */
  beat: string;

  /** Shot id that realized the beat. */
  shot: string;

  /** One state per scene node, in scene node order. */
  actors: IAutoMovieBeatEndActorState[];
}
