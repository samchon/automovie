/** One exact prose beat promised by the treatment. */
export interface IAutoMovieTreatmentBeat {
  /** Stable beat id used for diagnosis and human navigation. */
  id: string;

  /**
   * Exact non-blank prose copied by a scene's `covers` entry.
   *
   * Verbatim matching keeps the machine layer from pretending that a nearby
   * label proves the dramatic promise was actually carried forward.
   */
  text: string;
}
