/**
 * One stable treatment promise with its authored narrative text.
 *
 * @evidence contracts/common.md#principled-implementation Two strings carry a beat address and authored promise; uniqueness, nonblank text and coverage resolution are conventions not checked by the interface.
 * @evidence contracts/common.md#clear-and-simple-design Two fields retain address and narrative content without generated word-count, lexical or fingerprint artifacts for prose.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Similar words do not establish canonical coverage identity, and copying text does not prove compiled performance realized the dramatic promise.
 * @evidence contracts/common.md#meaningful-documentation Defines stable beat address and nonblank authored narrative promise, with downstream realization remaining a separate obligation.
 * @author Samchon
 */
export interface IAutoMovieTreatmentBeat {
  /** Stable beat id used for diagnosis and human navigation. */
  id: string;

  /**
   * Nonblank authored narrative promise; a scene cites its canonical id and may retain descriptive text, which is not automatic proof of realization.
   */
  text: string;
}
