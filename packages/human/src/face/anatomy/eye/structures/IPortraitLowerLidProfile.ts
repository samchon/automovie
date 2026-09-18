import { IPortraitLowerLidSection } from "./IPortraitLowerLidSection";

/**
 * Optional longitudinal detail for one eye. Sections progress from anatomical
 * medial zero to lateral one, independently of the head-X ordering of an eye.
 * Omission is handled by the eye and retains its complete basic row formulas.
 * A supplied list replaces this detailed population and must span both ends.
 * The eye blends the detailed section into its basic canthi with a declared
 * sine weight; it does not add the new projections to the old lower roll.
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Allows a complete sequence of lower-lid sections to replace the basic tissue profile.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines two-to-32 medial-to-lateral witnesses spanning both canthi without assuming head-X handedness.
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
