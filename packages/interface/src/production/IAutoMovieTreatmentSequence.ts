import { IAutoMovieTreatmentBeat } from "./IAutoMovieTreatmentBeat";

/**
 * One ordered treatment sequence and its causal beat promises.
 *
 * @evidence requirements/story/treatment-and-sequences.md#story-treatment-coverage Exposes `IAutoMovieTreatmentSequence` as the portable data boundary for the story treatment coverage requirement.
 * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-sequence-refinement Types `IAutoMovieTreatmentSequence` for the narrative intent sequence refinement system contract.
 */
export interface IAutoMovieTreatmentSequence {
  /**
   * Stable sequence id.
   *
   * @evidence requirements/story/treatment-and-sequences.md#story-treatment-coverage Exposes `id` as the portable data boundary for the story treatment coverage requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-sequence-refinement Types `id` for the narrative intent sequence refinement system contract.
   */
  id: string;

  /**
   * Human-readable sequence title.
   *
   * @evidence requirements/story/treatment-and-sequences.md#story-treatment-coverage Exposes `title` as the portable data boundary for the story treatment coverage requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-sequence-refinement Types `title` for the narrative intent sequence refinement system contract.
   */
  title: string;

  /**
   * Project-relative document holding this sequence's prose, when the treatment
   * is split one file per sequence.
   *
   * Omit it while the treatment is a single document; the index's
   * `treatment.path` is then the address, exactly as before. A split layout
   * needs a per-unit address because a folder is only a population of units if
   * each unit is its own file, and the beats of a later sequence are not in the
   * first sequence's file.
   *
   * @evidence requirements/story/treatment-and-sequences.md#story-treatment-coverage Exposes `path` as the portable data boundary for the story treatment coverage requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-sequence-refinement Types `path` for the narrative intent sequence refinement system contract.
   */
  path?: string;

  /**
   * Ordered beats the screenplay must cover.
   *
   * @evidence requirements/story/treatment-and-sequences.md#story-treatment-coverage Exposes `beats` as the portable data boundary for the story treatment coverage requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-sequence-refinement Types `beats` for the narrative intent sequence refinement system contract.
   */
  beats: IAutoMovieTreatmentBeat[];
}
