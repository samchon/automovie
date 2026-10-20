/** Independent eyelid support dimensions in the facial measurement chart.
 */
export interface IAutoMovieHumanEyeSupplement {
  /** Vertical canthal slant in the facial chart, degrees. */
  canthalSlantDegrees: number;

  /** Fore-aft canthal difference in the facial chart, mm. */
  canthalRecessionMm: number;

  /** Anterior eyelid-margin bulge relative to the canthal chord, mm. */
  marginDepthBulgeMm: number;

  /** Offset from the lid margin to the fold course in the local section, mm. */
  foldOffsetMm: number;

  /** Offset of the lid roll relative to the margin course, mm. */
  rollOffsetMm: number;
}
