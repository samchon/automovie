import type { IAutoMovieHumanBodyLinearRgb } from "../IAutoMovieHumanBodyLinearRgb";

/**
 * Source-authored nail appearance overlay, distinct from the underlying skin and authored vein layer.
 *
 * @evidence contracts/common.md#principled-implementation Carries the nails discriminant, finish resources, roughness and optional linear cheek reference, preserving the original nail appearance layer and its independent pigmentation reference.
 * @evidence contracts/common.md#clear-and-simple-design This named record owns only the original nail appearance layer and its independent pigmentation reference; computations remain at the existing consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The nails discriminant, optional normal and optional cheek reference remain separate from skin and vein fields; omitted resources are not fabricated.
 * @evidence contracts/common.md#meaningful-documentation Native field documentation names the retained members, their ownership and unchanged source meaning.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The source and consuming builder own the represented parts; this record transports their existing registration/evaluation.
 * @evidence contracts/modeling.md#parameter-channels The offline source's nail colour coverage, optional normal and roughness define its finish; optional cheek albedo feeds the existing pigmentation conversion. The consumer applies the layer at fixed full strength.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The existing geometry/appearance consumer owns emitted populations.
 * @evidence contracts/modeling.md#spatial-conventions Colour PNGs are sRGB with alpha coverage, normal PNGs are linear tangent-space directions, cheek values are linear RGB and roughness is dimensionless in [0,1].
 * @evidenceExclude contracts/modeling.md#shared-boundaries Source and assembly owners retain actual boundary construction.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consuming source/assembly owner observes the result.
 * @evidence contracts/anatomy.md#anatomical-source Source-authored nail coverage/finish and the optional cheek reference are appearance data; createHumanBodySkinOverlays owns the cheek-to-palm group-fit proxy, which does not determine personal nail anatomy.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing source/document admission remains authoritative; this carrier changes no value or bound.
 * @evidence contracts/anatomy.md#parametric-authority This offline source record preserves nail finish resources and its optional named cheek albedo reference; the consumer applies the layer at fixed strength one, with no document strength control.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyNailsOverlay {
  /** Closed layer kind. */
  kind: "nails";

  /** Existing skin material receiving the layer. */
  material: string;

  /** sRGB colour and alpha coverage PNG data URI. */
  color: string;

  /** Optional linear tangent-space normal PNG data URI. */
  normal?: string;

  /** Authored nail surface roughness in [0,1]. */
  roughness: number;

  /** Optional linear cheek reference used by the existing pigmentation owner. */
  cheek?: IAutoMovieHumanBodyLinearRgb;
}
