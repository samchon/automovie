import { IAutoMovieTreatmentBeat } from "./IAutoMovieTreatmentBeat";

/**
 * One ordered treatment sequence and the stable narrative promises its screenplay coverage addresses.
 *
 * @evidence contracts/common.md#principled-implementation Sequence id and ordered beats preserve authored narrative relationships, with an optional exact document path when treatment ownership is split by sequence.
 * @evidence contracts/common.md#clear-and-simple-design The index carries semantic ids and promises while full sequence prose stays in its authoritative Markdown document; optional per-unit addressing avoids treating a directory as one document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing per-sequence paths use the index's declared single-document address, not a guessed neighbouring file; prose ordering does not become an inferred numerical shot-duration contract.
 * @evidence contracts/common.md#meaningful-documentation Defines stable sequence identity, title, optional split-document addressing and ordered beat coverage obligations.
 * @author Samchon
 */
export interface IAutoMovieTreatmentSequence {
  /** Stable sequence id. */
  id: string;

  /** Human-readable sequence title. */
  title: string;

  /**
   * Project-relative document holding this sequence's prose, when the treatment is split one file per sequence.
   *
   * Omit it while the treatment is a single document; the index's `treatment.path` is then the address, exactly as before. A split layout needs a per-unit address because a folder is only a population of units if each unit is its own file, and the beats of a later sequence are not in the first sequence's file.
   */
  path?: string;

  /** Ordered beats the screenplay must cover. */
  beats: IAutoMovieTreatmentBeat[];
}
