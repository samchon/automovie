import { IAutoMovieTreatmentBeat } from "./IAutoMovieTreatmentBeat";

/**
 * One ordered treatment sequence and the stable narrative promises its screenplay coverage addresses.
 *
 * @evidence contracts/common.md#principled-implementation A sequence id and beat array carry authored narrative order, with an optional document path for split prose; strings do not establish identity uniqueness or document existence.
 * @evidence contracts/common.md#clear-and-simple-design The index carries semantic ids and promises while full sequence prose stays in its authoritative Markdown document; optional per-unit addressing avoids treating a directory as one document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The documented absent-path convention names the index's single treatment document; this record contains no file lookup, guessed-path fallback or inferred shot-duration behavior.
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
   * Omit it while the treatment is a single document and use the index's `treatment.path`. In a split layout, provide the document containing this sequence's beats; the type does not resolve the path.
   */
  path?: string;

  /** Ordered beats the screenplay must cover. */
  beats: IAutoMovieTreatmentBeat[];
}
