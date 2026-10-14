/**
 * One treatment beat identified and cited by the screenplay scene that realizes it.
 *
 * @evidence contracts/common.md#principled-implementation A string beat id names the intended treatment promise beside descriptive text and a reason; the type does not check canonical existence or compare coverage with prose.
 * @evidence contracts/common.md#clear-and-simple-design Keeps identity, citation and responsibility explanation together without turning narrative prose into a generated execution contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Similar text cannot substitute for the exact beat id, and cited prose does not prove a downstream shot or motion realized that beat.
 * @evidence contracts/common.md#meaningful-documentation Defines the stable treatment id, descriptive cited text and scene-local coverage reason; text is not automatic proof of dramatic realization.
 * @author Samchon
 */
export interface IAutoMovieSceneBeatCoverage {
  /**
   * Stable {@link IAutoMovieTreatmentBeat.id} carried by this scene.
   *
   * Identity, rather than coincidentally equal prose, keeps a beat in the scene that owns it when two scenes use similar words.
   */
  id: string;

  /** Why this scene is responsible for the cited dramatic beat. */
  reason: string;

  /** Authored descriptive text of the cited treatment promise; canonical coverage is addressed by id. */
  beat: string;
}
