import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";

/**
 * What the inspector holds between edits: the one request every control edits
 * and the canvas draws, and the last refusal.
 */
export interface IAutoMovieViewerInspectorState {
  /** The request drawn, as the plan grammar read it. */
  request: IAutoMovieCapturePlanRequest;

  /**
   * Why the last edit was refused, naming the key, or null when it was
   * accepted.
   */
  error: string | null;
}
