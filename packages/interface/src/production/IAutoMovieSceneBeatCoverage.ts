/**
 * One treatment beat identified and cited by the screenplay scene that realizes it.
 *
 * @evidence contracts/common.md#principled-implementation Stable beat identity joins coverage to the treatment promise, while authored text and reason retain the cited meaning; screenplay ledger validation checks canonical beat existence and coverage independently from lexical similarity.
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
