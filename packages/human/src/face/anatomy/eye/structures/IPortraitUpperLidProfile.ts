import { IPortraitUpperLidSection } from "./IPortraitUpperLidSection";

/**
 * Independently authored medial-to-lateral upper-lid sections. The eye blends
 * these into the basic canthi with a sine envelope and retains the same wet
 * aperture, optical identity and shared skin attachment during performance.
 * A supplied section population replaces its predecessor; omission is handled
 * by the eye and preserves the original basic upper-lid formulas.
 *
 * @evidence contracts/common.md#principled-implementation An ordered list of complete transverse sections at medial-to-lateral witnesses, with optional closed sections at the same witnesses, is what the section sampler and the unfolding blend read; requiring the same witnesses and attachment distances is what makes the observed-to-closed blend defined.
 * @evidence contracts/common.md#clear-and-simple-design Two lists of witnesses with one owner for validation and interpolation, and the optional closed list is the only extra.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A type carries no mechanism and no field names a subject or fixture.
 * @evidence contracts/common.md#meaningful-documentation The record states the witness count, ordering and progress meaning, what the closed sections do and when omission preserves the basic formula.
 * @evidence contracts/modeling.md#spatial-conventions Progress is a dimensionless anatomical medial-to-lateral fraction independent of head-X side and the section values are millimetres, as the member types state.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record parameterizes one lid's tissue and defines no part or group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no surface; the shared attachment distances it holds are consumed by the lid rows and stay fixed under closure.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record owns no part and displays nothing.
 *
 * @author Samchon
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
