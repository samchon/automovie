/**
 * Physical exterior skin section around one fitted nasal aperture, in mm.
 *
 * @author Samchon
 */
export interface IPortraitNasalRimSection {
  /** Positive width from the aperture to the surrounding skin attachment. */
  width: number;

  /** Signed crest projection along the outward aperture normal, in mm. */
  crest: number;
}
