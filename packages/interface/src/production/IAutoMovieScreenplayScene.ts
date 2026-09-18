import { IAutoMovieSceneBeatCoverage } from "./IAutoMovieSceneBeatCoverage";
import { IAutoMovieSceneDisposition } from "./IAutoMovieSceneDisposition";
import { IAutoMovieScreenplayParticipant } from "./IAutoMovieScreenplayParticipant";

/**
 * One indexed screenplay scene whose prose remains in Markdown.
 *
 * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `IAutoMovieScreenplayScene` as the portable data boundary for the story screenplay index prose requirement.
 * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `IAutoMovieScreenplayScene` for the narrative intent scene prose index system contract.
 */
export interface IAutoMovieScreenplayScene {
  /**
   * Stable scene number, such as `SCN-010`.
   *
   * After lock, inserted scenes use the `SCN-A11` form and existing ids remain
   * forever addressable.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `id` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `id` for the narrative intent scene prose index system contract.
   */
  id: string;
  /**
   * Human title following the exact id token in the Markdown heading.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `title` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `title` for the narrative intent scene prose index system contract.
   */
  title: string;
  /**
   * Active prose scene or retained deletion tombstone.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `status` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `status` for the narrative intent scene prose index system contract.
   */
  status: "active" | "OMITTED";
  /**
   * Project-relative document holding this scene's prose, when the screenplay
   * is split one file per scene.
   *
   * Omit it while the screenplay is a single document; the index's
   * `screenplay.path` is then the address. An `OMITTED` tombstone has no prose
   * to hold, so it carries no path either.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `path` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `path` for the narrative intent scene prose index system contract.
   */
  path?: string;
  /**
   * Exact treatment promises this scene realizes.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `covers` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `covers` for the narrative intent scene prose index system contract.
   */
  covers: IAutoMovieSceneBeatCoverage[];
  /**
   * Existing location catalog id for an active scene.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `location` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `location` for the narrative intent scene prose index system contract.
   */
  location: string | null;
  /**
   * Exact story-time identity stated by the authoritative prose carrier.
   *
   * Use `unknown` when the story deliberately leaves the time unresolved. An
   * absent carrier is different from that explicit state and is refused.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-place-time Exposes the exact story-time identity shared with authoritative prose.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types the story-time half of the scene authority join.
   */
  storyTime: string;
  /**
   * Exact scene-local participant identities and modes.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-participant-modes Exposes participation without inferring it from a global cast list.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types the participant set compared with the bounded prose carrier.
   */
  participants: IAutoMovieScreenplayParticipant[];
  /**
   * Explicit local exemption from shot realization, or null when required.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `disposition` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `disposition` for the narrative intent scene prose index system contract.
   */
  disposition: IAutoMovieSceneDisposition | null;
}
