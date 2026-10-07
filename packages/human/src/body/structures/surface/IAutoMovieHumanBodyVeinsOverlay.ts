/**
 * Source-authored superficial-vein tint and relief with its own attenuation sample region; this is an exterior appearance proxy.
 *
 * @evidence contracts/common.md#principled-implementation Carries the veins discriminant, finish resources, source sample vertices and attenuation, preserving the original exterior vein proxy and its own sample-region calculation.
 * @evidence contracts/common.md#clear-and-simple-design This named record owns only the original exterior vein proxy and its own sample-region calculation; computations remain at the existing consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The veins discriminant preserves authored texture and sample-vertex identity; the attenuation proxy does not claim an imaged vascular solid.
 * @evidence contracts/common.md#meaningful-documentation Native field documentation names the retained members, their ownership and unchanged source meaning.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The source and consuming builder own the represented parts; this record transports their existing registration/evaluation.
 * @evidence contracts/modeling.md#parameter-channels The source texture defines the vein appearance and attenuation controls its thickness-dependent fading; the source sample region supplies that thickness. Public vein strength remains independent of these offline resources.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The existing geometry/appearance consumer owns emitted populations.
 * @evidence contracts/modeling.md#spatial-conventions Attenuation is per metre and vertices index the source skin; createHumanBodySkinOverlays multiplies it by rest-minus-lean thickness in metres.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Source and assembly owners retain actual boundary construction.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consuming source/assembly owner observes the result.
 * @evidence contracts/anatomy.md#anatomical-source Authored vein tint and rest-minus-lean thickness attenuation are exterior proxies in createHumanBodySkinOverlays, not measured vessel depth, vascular capacity or reconstructed anatomy.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing source/document admission remains authoritative; this carrier changes no value or bound.
 * @evidence contracts/anatomy.md#parametric-authority Source vertex IDs belong to offline shared preparation; public document authoring uses the named vein-strength choice rather than personal vertex addressing.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyVeinsOverlay {
  /** Closed layer kind. */
  kind: "veins";

  /** Existing skin material receiving the layer. */
  material: string;

  /** sRGB colour and alpha coverage PNG data URI. */
  color: string;

  /** Optional linear tangent-space normal PNG data URI. */
  normal?: string;

  /** Source vertices at which the existing layer owner reads rest-minus-lean thickness. */
  vertices: number[];

  /** Authored attenuation coefficient, per metre, retaining its proxy qualification. */
  attenuation: number;
}
