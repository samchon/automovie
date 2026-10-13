import { IAutoMovieBeatEndActorState } from "./IAutoMovieBeatEndActorState";

/**
 * Resolved forward-state produced by one completed beat.
 *
 * `resolveBeatEnd` samples it at the shot end. The next beat blocks against it,
 * `resolveBeatOpening` produces the same shape at `t = 0` so the continuity
 * check can compare the two, and a `getBeatEnd` context request reads it from
 * the slate.
 *
 * @evidence contracts/common.md#principled-implementation One snapshot per scene node sampled at a single shot-local instant, so the continuity linter can compare a beat's end with the next beat's opening field by field.
 * @evidence contracts/common.md#clear-and-simple-design Beat id, shot id and an actor list; the same shape serves the end and the opening snapshot, so no second type exists for the comparison.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No actor is omitted or special-cased: every scene node gets an entry, held actors at their staged placement and performed actors sampled from their motion.
 * @evidence contracts/common.md#meaningful-documentation States which ids it carries, that actors follow scene node order, which function produces it, and its three readers: blocking, continuity and the slate query.
 * @author Samchon
 */
export interface IAutoMovieBeatEndState {
  /** Beat id whose end-state this describes. */
  beat: string;

  /** Shot id that realized the beat. */
  shot: string;

  /** Per actor end-state, one per scene node, in scene node order. */
  actors: IAutoMovieBeatEndActorState[];
}
