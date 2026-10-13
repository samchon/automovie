import { IAutoMovieBeatEndActorState } from "./IAutoMovieBeatEndActorState";

/** Resolved forward-state produced by one completed beat. */
export interface IAutoMovieBeatEndState {
  /** Beat id whose end-state this describes. */
  beat: string;

  /** Shot id that realized the beat. */
  shot: string;

  /** Per actor end-state, in scene node order. */
  actors: IAutoMovieBeatEndActorState[];
}
