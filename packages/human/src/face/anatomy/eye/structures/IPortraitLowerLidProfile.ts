import { IPortraitLowerLidSection } from "./IPortraitLowerLidSection";

/**
 * Optional longitudinal detail for one eye. Sections progress from anatomical
 * medial zero to lateral one, independently of the head-X ordering of an eye.
 * Omission is handled by the eye and retains its complete basic row formulas.
 * A supplied list replaces this detailed population and must span both ends.
 * The eye blends the detailed section into its basic canthi with a declared
 * sine weight; it does not add the new projections to the old lower roll.
 *
 * @evidence contracts/common.md#principled-implementation An ordered list of complete transverse sections at medial-to-lateral witnesses is what the shared section sampler reads, so the lower lid's basic row formula can be replaced by interpolated sections without adding a second relief.
 * @evidence contracts/common.md#clear-and-simple-design A single list of witnesses with one owner for validation and interpolation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A type carries no mechanism and no field names a subject or fixture.
 * @evidence contracts/common.md#meaningful-documentation The record states the witness count, ordering, progress meaning and that a supplied list replaces the detailed population.
 * @evidence contracts/modeling.md#spatial-conventions Progress is a dimensionless anatomical medial-to-lateral fraction independent of head-X side and the section values are millimetres, as the member types state.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record parameterizes one lid's tissue and defines no part or group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record owns no part and displays nothing.
 *
 * @author Samchon
 */
export interface IPortraitLowerLidProfile {
  /** Two through 32 strictly ordered section witnesses, including zero and one. */
  sections: readonly {
    /** Medial-to-lateral progress in [0,1]. */
    at: number;

    /** Complete transverse tissue section at this progress. */
    section: IPortraitLowerLidSection;
  }[];
}
