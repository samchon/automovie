import { IPortraitUpperLidSection } from "./IPortraitUpperLidSection";

/**
 * Independently authored medial-to-lateral upper-lid sections. The eye blends
 * these into the basic canthi with a sine envelope and retains the same wet
 * aperture, optical identity and shared skin attachment during performance.
 * A supplied section population replaces its predecessor; omission is handled
 * by the eye and preserves the original basic upper-lid formulas.
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Allows medial and lateral upper folds to have different transverse tissue profiles.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Requires two through 32 ordered witnesses spanning anatomical medial zero to lateral one.
 */
export interface IPortraitUpperLidProfile {
  /** Two through 32 complete sections, strictly ordered and including both ends. */
  sections: readonly {
    /** Anatomical medial-to-lateral progress in [0,1], independent of head-X side. */
    at: number;
    /** Complete transverse tissue section at this witness. */
    section: IPortraitUpperLidSection;
  }[];
  /**
   * Optional fully closed, unfolded sections at exactly the same witnesses and
   * with unchanged attachment distances. Selecting them admits an inward hood
   * return in the observed sections. Current closure interpolates from those
   * observed sections; opening farther extrapolates and must remain valid.
   * Omission retains strictly ordered observed sections and prior performance.
   */
  closedSections?: IPortraitUpperLidProfile["sections"];
}
