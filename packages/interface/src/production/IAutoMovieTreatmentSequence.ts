import { IAutoMovieTreatmentBeat } from "./IAutoMovieTreatmentBeat";

/** One ordered treatment sequence and its causal beat promises. */
export interface IAutoMovieTreatmentSequence {
  /** Stable sequence id. */
  id: string;

  /** Human-readable sequence title. */
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
   */
  path?: string;

  /** Ordered beats the screenplay must cover. */
  beats: IAutoMovieTreatmentBeat[];
}
