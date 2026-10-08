import type { IAutoMovieHumanFaceNativeLipMargin } from "./IAutoMovieHumanFaceNativeLipMargin";
import type { IAutoMovieHumanFaceVertexLipMargin } from "./IAutoMovieHumanFaceVertexLipMargin";

/**
 * Two source-registered contact trajectories on the contact's lips surface.
 *
 * Existing resident vertex chains retain their original registration. A
 * material course instead carries native facet seats and original source
 * stops without inventing resident vertices. The common margin reader admits
 * both representations and supplies canonical performed points. Source rest
 * ordering does not prove performed ordering or contact: the closure and gap
 * owners verify the actual graph, tissue budget and residual independently.
 *
 * @evidence contracts/common.md#principled-implementation Explicit native and legacy registrations share one reader while actual performed contact remains a separate verified result.
 * @evidence contracts/common.md#clear-and-simple-design A discriminator distinguishes resident vertex chains from native material courses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preparation owns registration; runtime does not guess a course or replace native seats with vertices.
 * @evidence contracts/common.md#meaningful-documentation States the two representations and separates source ordering from performed contact.
 * @evidence contracts/modeling.md#part-identity-and-grouping Both trajectories belong to the lips surface the contact names.
 * @evidenceExclude contracts/modeling.md#parameter-channels The margin is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The margin emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The representation owners define native indices and dimensionless weights; consumers read head-frame metres.
 * @evidence contracts/modeling.md#shared-boundaries Registered source identities support common contact and oral consumers without coordinate-based welding.
 * @evidenceExclude contracts/modeling.md#rendered-observation The contact summary reports the residual apertures.
 * @evidenceExclude contracts/anatomy.md#anatomical-source This representation adds no acquired clinical boundary; native interior trajectories remain a source-authoring convention.
 * @evidenceExclude contracts/anatomy.md#permitted-range The margin bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The margin is basis registration, not a caller input.
 * @author Samchon
 */
export type IAutoMovieHumanFaceLipMargin =
  | IAutoMovieHumanFaceVertexLipMargin
  | IAutoMovieHumanFaceNativeLipMargin;
