import type { IAutoMovieHumanFaceSkinRegionAppearance } from "../../structures/IAutoMovieHumanFaceSkinRegionAppearance";

/**
 * Identity appearance for an unedited named skin area.
 * White gain and zero strength preserve the basis albedo exactly. This is an
 * algebraic identity, not a population-derived skin colour or a measurement.
 * A product preparing a new editable region takes an owned copy of this record;
 * source appearance itself stays with the immutable basis.
 *
 * @evidence contracts/common.md#principled-implementation White gain and zero strength both make 1 + strength * (gain - 1) equal one.
 * @evidence contracts/common.md#clear-and-simple-design One canonical record supplies the product's identity edit without inventing a person's skin colour.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The values are algebraic identities and select no person, population or fixture.
 * @evidence contracts/common.md#meaningful-documentation States copying and the distinction between identity gain and biological colour.
 * @evidence contracts/modeling.md#parameter-channels Each named area begins with no change to source appearance.
 * @evidence contracts/modeling.md#spatial-conventions Values are dimensionless linear RGB multipliers and a fraction.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Appearance describes existing skin rather than a part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Basis registration owns shared skin membership.
 * @evidenceExclude contracts/modeling.md#rendered-observation The coupled builder observes appearance.
 * @evidenceExclude contracts/anatomy.md#anatomical-source No measured biological value is asserted.
 * @evidenceExclude contracts/anatomy.md#permitted-range Appearance admission remains numerical rather than physiological.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record adds no person-authoring authority beyond the named appearance type.
 */
export const HUMAN_FACE_SKIN_REGION_APPEARANCE: IAutoMovieHumanFaceSkinRegionAppearance = {
  gain: [1, 1, 1],
  strength: 0,
};
