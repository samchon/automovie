/** One treatment beat cited verbatim by a screenplay scene. */
export interface IAutoMovieSceneBeatCoverage {
  /**
   * Stable {@link IAutoMovieTreatmentBeat.id} carried by this scene.
   *
   * Identity, rather than coincidentally equal prose, keeps a beat in the
   * scene that owns it when two scenes use similar words.
   */
  id: string;

  /** Why this scene is responsible for the cited dramatic beat. */
  reason: string;

  /** Exact {@link IAutoMovieTreatmentBeat.text} value. */
  beat: string;
}
