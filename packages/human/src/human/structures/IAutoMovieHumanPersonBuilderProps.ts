import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanFaceBasis } from "../../face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceOcclusionOptions } from "../../face/structures/IAutoMovieHumanFaceOcclusionOptions";

/**
 * What a builder of whole people is compiled from: a face basis, a body
 * basis, and the face producer's optional occlusion bake.
 *
 * @evidence contracts/common.md#principled-implementation A person is the composition of one face basis and one body basis; occlusion is passed to the face producer unchanged.
 * @evidence contracts/common.md#clear-and-simple-design Three members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both bases are their compilers' own; omission of occlusion is the face producer's to interpret.
 * @evidence contracts/common.md#meaningful-documentation States each member.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The bases own their parts; the carrier defines none.
 * @evidenceExclude contracts/modeling.md#parameter-channels The bases own their channels; the carrier defines none.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The carrier emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The carrier adds no coordinate; each basis states its frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The builder, not this carrier, joins the skins.
 * @evidenceExclude contracts/modeling.md#rendered-observation The person assembly owns what is displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The bases own anatomical values.
 * @evidenceExclude contracts/anatomy.md#permitted-range Basis compilation precedes this carrier.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Compiled bases, not a caller's shaping input; documents arrive per build.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBuilderProps {
  /** The face basis. */
  face: IAutoMovieHumanFaceBasis;

  /** The body basis. */
  body: IAutoMovieHumanBodyBasis;

  /** The face producer's occlusion bake, or none. */
  occlusion?: IAutoMovieHumanFaceOcclusionOptions;
}
