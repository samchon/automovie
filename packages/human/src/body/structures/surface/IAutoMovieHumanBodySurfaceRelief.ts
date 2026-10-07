/**
 * UV-bound normal relief on one body surface; the appearance owner retains texture admission and anatomical qualification.
 *
 * @evidence contracts/common.md#principled-implementation Carries the material ID and UV0-bound relief texture, preserving the original texture-binding record.
 * @evidence contracts/common.md#clear-and-simple-design This named record owns only the original texture-binding record; computations remain at the existing consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The material ID and normal texture retain one UV0 binding; a texture is not replaced by generated anatomical relief.
 * @evidence contracts/common.md#meaningful-documentation Native field documentation names the retained members, their ownership and unchanged source meaning.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The source and consuming builder own the represented parts; this record transports their existing registration/evaluation.
 * @evidence contracts/modeling.md#parameter-channels The source normal texture varies one named material's tangent-space relief over UV0; it is an offline shared appearance resource rather than a public personal surface control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The existing geometry/appearance consumer owns emitted populations.
 * @evidence contracts/modeling.md#spatial-conventions The PNG carries linear tangent-space normal directions over source UV0; it carries no displacement in metres.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Source and assembly owners retain actual boundary construction.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consuming source/assembly owner observes the result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The original source and numerical owners retain acquisition and anatomical qualification; this record infers no new anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing source/document admission remains authoritative; this carrier changes no value or bound.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This record binds an offline renderer normal texture to a material; it defines no public anatomical measurement or motion input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySurfaceRelief {
  /** Existing material whose regions receive this relief. */
  material: string;

  /** Linear tangent-space normal PNG data URI, bound over UV0. */
  texture: string;
}
