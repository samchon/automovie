import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Shared medial caruncle/plica sheet and lower wet-margin patch.
 *
 * createPortraitOcularTissues returns these owned lattices in head millimetres.
 * Null preserves an explicitly zero authored extent rather than an empty mesh.
 *
 * @evidence contracts/common.md#principled-implementation Two independently nullable fields distinguish the medial patch from the lower wet margin while preserving each producer's actual zero-extent result.
 * @evidence contracts/common.md#clear-and-simple-design One producer result names the two ocular patches built from the same live boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries the generator's actual meshes or null without replacing unavailable anatomy with another primitive.
 * @evidence contracts/common.md#meaningful-documentation States the producing owner, native units and explicit zero-extent meaning.
 * @evidence contracts/modeling.md#spatial-conventions Both native lattices retain the producer's head-millimetre frame; model packing owns metre conversion.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The eye builder assigns emitted part identities; this intermediate result only names its two patch roles.
 * @evidenceExclude contracts/modeling.md#parameter-channels The tissue profile and generator own dimensions; this result adds no authored channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry createPortraitOcularTissues owns lattice construction; this carrier adds no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The generator owns live lid and globe boundary sampling; the result changes neither.
 * @evidenceExclude contracts/modeling.md#rendered-observation The constructed eye and face assemblies own current rendered observation, not this intermediate record.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The tissue profile and generator own authored source conventions; this result carries no new anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Producer admission retains dimension and aperture feasibility; this carrier introduces no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived patch buffers are not personal sculpt input or an anatomical inverse.
 * @author Samchon
 */
export interface IPortraitOcularTissueMeshes {
  /** Shared medial caruncle/plica lattice, or null when its authored extent is zero. */
  corner: IAutoMovieMesh | null;

  /** Lower wet-margin lattice, or null when its authored maximum width is zero. */
  lowerMargin: IAutoMovieMesh | null;
}
