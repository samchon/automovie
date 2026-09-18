import { IAutoMovieSceneEvidence } from "./IAutoMovieSceneEvidence";

/**
 * One discovered character, faction, or location grounded in scene evidence.
 *
 * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `IAutoMovieScreenplayCatalogEntry` as the portable data boundary for the story screenplay index prose requirement.
 * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `IAutoMovieScreenplayCatalogEntry` for the narrative intent scene prose index system contract.
 */
export interface IAutoMovieScreenplayCatalogEntry {
  /**
   * Stable catalog identity consumed by downstream design.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `id` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `id` for the narrative intent scene prose index system contract.
   */
  id: string;
  /**
   * Human-readable canonical name.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `name` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `name` for the narrative intent scene prose index system contract.
   */
  name: string;
  /**
   * At least one authored scene proving this subject exists in the film.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `evidence` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `evidence` for the narrative intent scene prose index system contract.
   */
  evidence: IAutoMovieSceneEvidence[];
  /**
   * Production-scoped joins to shared downstream design.
   *
   * Character entries bind model recipes, faction entries bind formations, and
   * location entries bind world landmarks. Keeping these joins in the
   * screenplay index lets two productions cast the same shared design
   * differently.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `bindings` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `bindings` for the narrative intent scene prose index system contract.
   */
  bindings: Array<{
    /** Downstream design family allowed by this catalog section. */
    kind: "model" | "formation" | "world-landmark";
    /** Existing shared design identity. */
    id: string;
  }>;
}
