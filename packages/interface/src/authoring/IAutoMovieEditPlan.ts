import { IAutoMovieNamedId } from "../core/IAutoMovieNamedId";
import { IAutoMovieEditEntry } from "./IAutoMovieEditEntry";

/** Coding-agent-owned edit over already validated shot artifacts. */
export interface IAutoMovieEditPlan {
  /** Stable finished-film identity and optional display name. */
  sequence: IAutoMovieNamedId;

  /** Positive playback frame rate. */
  fps: number;

  /** Shot placements in playback order. */
  entries: IAutoMovieEditEntry[];

  /** Why the trims and transitions serve the film's rhythm. */
  pacing: string;

  /** How adjacent opening/end states connect across each cut. */
  continuity: string;
}
