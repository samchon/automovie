import { IAutoMovieContinuityProof } from "./IAutoMovieContinuityProof";
import { IAutoMovieSceneEvidence } from "./IAutoMovieSceneEvidence";

/**
 * One canon fact and the only evidence family allowed to prove it.
 *
 * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `IAutoMovieContinuityClaim` as the portable data boundary for the story screenplay index prose requirement.
 * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `IAutoMovieContinuityClaim` for the narrative intent scene prose index system contract.
 */
export interface IAutoMovieContinuityClaim {
  /**
   * Stable claim identity cited by downstream evidence.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `id` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `id` for the narrative intent scene prose index system contract.
   */
  id: string;

  /**
   * Human-readable canon fact, such as handedness or persistent weather.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `text` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `text` for the narrative intent scene prose index system contract.
   */
  text: string;

  /**
   * Evidence family that alone can discharge this claim.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `verification` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `verification` for the narrative intent scene prose index system contract.
   */
  verification: "frame-review" | "geometry" | "acceptance";

  /**
   * Exact claim-specific evidence selected inside that family.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `proof` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `proof` for the narrative intent scene prose index system contract.
   */
  proof: IAutoMovieContinuityProof;

  /**
   * Authored scenes in which the canon fact must hold.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `evidence` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `evidence` for the narrative intent scene prose index system contract.
   */
  evidence: IAutoMovieSceneEvidence[];
}
