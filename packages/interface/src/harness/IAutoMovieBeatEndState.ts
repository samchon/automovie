import type { IAutoMovieBeatEndActorState } from "./IAutoMovieBeatEndActorState";

/**
 * Resolved forward state produced by one completed beat.
 *
 * `resolveBeatEnd` samples it at the shot end and `compileDefinedShot` returns
 * it as the shot's closing continuity. The next beat blocks against it,
 * `resolveBeatOpening` produces the same shape at `t = 0` so the continuity
 * check can compare the two, and a `getBeatEnd` context request reads it from
 * the slate.
 */
export interface IAutoMovieBeatEndState {
  /** Beat id whose end state this describes. */
  beat: string;

  /** Shot id that realized the beat. */
  shot: string;

  /** One state per scene node, in scene node order. */
  actors: IAutoMovieBeatEndActorState[];
}
