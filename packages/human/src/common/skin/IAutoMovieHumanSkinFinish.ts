import type { IAutoMovieHumanSkinScattering } from "./IAutoMovieHumanSkinScattering";

/**
 * Reusable finish properties for skin materials supplied by different bases.
 *
 * A person's skin is one organ drawn from two surfaces, the head's and the
 * body's, that meet at the neck. Whatever the renderer does to skin beyond
 * its albedo has to be the same on both sides of that join, or the join shows
 * as a change of material where the geometry is continuous. This record is
 * that shared part. Albedo is not in it: a person states one cheek colour,
 * the face wears it, and the body derives its sites from it and returns to
 * the cheek's own colour at the neck's cut.
 *
 * @evidence contracts/common.md#principled-implementation The record holds only the properties that must agree across the join and that neither basis may choose alone; colour stays with the site model that already meets the face at the cut.
 * @evidence contracts/common.md#clear-and-simple-design Two members; a property enters only when both skins must share it.
 * @evidence contracts/common.md#meaningful-documentation States why the record exists and why albedo is outside it.
 * @evidence contracts/modeling.md#shared-boundaries This record defines the common finish both consumers must apply for material continuity at a skin join.
 * @evidence contracts/modeling.md#spatial-conventions Scattering distances are metres; the material id is a name.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The explicit material identity and shared scattering record retain one finish authority instead of replacing an anatomical surface or source value.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Material identity is not a new anatomical part identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels The finish carries optical appearance without a geometry or motion channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry applyHumanSkinFinish assigns material coefficients and emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation Consuming face/body assemblies own the observed finish and neck join; the record asserts no captured appearance.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The record transports renderer appearance; HUMAN_SKIN_FINISH owns the shared default's optical-source derivation.
 * @evidenceExclude contracts/anatomy.md#permitted-range Optical material values declare no physiological skin envelope.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Matching material finish across surfaces does not infer personal tissue geometry or clinical properties.
 * @author Samchon
 */
export interface IAutoMovieHumanSkinFinish {
  /** Material id consumers use to identify their skin. */
  material: string;

  /** Subsurface scattering distance per linear RGB primary. */
  scattering: IAutoMovieHumanSkinScattering;
}
