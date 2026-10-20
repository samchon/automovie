/** Chin and sublabial dimensions in the head chart. */
export interface IAutoMovieHumanJawSupplement {
  /** Distance below menton to the under-chin neck transition, mm; must leave a positive simple-tube domain. */
  submentalDropMm: number;

  /** Transverse breadth of the chin mass, mm. */
  chinBreadthMm: number;

  /** Height of the chin prominence above the chin baseline, mm. */
  prominenceHeightMm: number;

  /** Anterior reach of the chin prominence relative to its baseline, mm. */
  prominenceForwardMm: number;

  /** Height of the sublabial observation above the chin baseline, mm. */
  sublabialHeightMm: number;

  /** Posterior offset of the sublabial observation from the facial baseline, mm. */
  sublabialRecessionMm: number;

  /** Posterior cheek offset relative to the enclosing head profile, mm. */
  cheekRecessionMm: number;
}
