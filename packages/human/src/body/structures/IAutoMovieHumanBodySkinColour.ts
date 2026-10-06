import type { IAutoMovieHumanBodyLinearRgb } from "./IAutoMovieHumanBodyLinearRgb";

/**
 * The body's cheek albedo reference in linear RGB. Appearance derives its
 * other sites through the existing site table; a linked person derives this
 * reference from its face instead of authoring an independent body colour.
 *
 * @evidence contracts/common.md#principled-implementation Reuses the existing linear RGB carrier and retains cheek as the one document reference site.
 * @evidence contracts/common.md#clear-and-simple-design One named site reference supplies the existing appearance owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cheek remains the single linear RGB reference, and a linked person obtains it from face appearance rather than introducing a second independent body pigmentation authority.
 * @evidence contracts/common.md#meaningful-documentation States site ownership, linear units and linked-person derivation.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part.
 * @evidence contracts/modeling.md#parameter-channels The three cheek albedo components retain their independent authored values; regional coupling belongs to the site table.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Cheek albedo is dimensionless linear RGB with components in (0,1]; regional site conversion remains at createHumanBodySkinColour.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Appearance and person assembly own colour continuity.
 * @evidenceExclude contracts/modeling.md#rendered-observation Appearance consumers own the rendered observation.
 * @evidence contracts/anatomy.md#anatomical-source The cheek value is authored albedo; createHumanBodySkinColour owns regional site derivation and its qualification. A cheek reference does not reconstruct personal tissue pigmentation.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing colour admission owns the component interval.
 * @evidence contracts/anatomy.md#parametric-authority This input preserves one named cheek albedo reference and linked-person face authority; regional derived colours are not separately authored body sites.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinColour {
  /** Cheek albedo, linear RGB with each component in (0,1]. */
  cheek: IAutoMovieHumanBodyLinearRgb;
}
