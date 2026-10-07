import type { AutoMovieHumanBodyBoneId } from "../identity/AutoMovieHumanBodyBoneId";

/**
 * Offline source weights over the anatomical graph, not humanoid bone aliases.
 *
 * Four entries per vertex identify source bone ordinals and nonnegative weights
 * summing to one. Vertices are in the graph's common neutral metre frame; the
 * renderer applies each posed times inverse rest transform. No editor accepts
 * these arrays. A bone normally binds to itself; soft tissue requires actual
 * authored attachment accounts and does not acquire physiological validity
 * from linear blending.
 *
 * @evidence contracts/common.md#principled-implementation Shared anatomical graph identities bind geometry to the same rest and pose evaluation.
 * @evidence contracts/common.md#clear-and-simple-design One source-only four-slot binding format owns weight correspondence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Actual anatomical bone ordinals, four-slot source weights and their authoring account remain explicit; a humanoid alias or invented rigid carrier cannot replace them.
 * @evidence contracts/common.md#meaningful-documentation States cardinality, neutral frame and authoring authority.
 * @evidence contracts/modeling.md#part-identity-and-grouping Closed anatomical bone IDs retain independent radius, ulna and digital attachment ownership.
 * @evidenceExclude contracts/modeling.md#parameter-channels These source arrays are not public authoring controls.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The assembly performer owns mesh evaluation.
 * @evidence contracts/modeling.md#spatial-conventions Common-neutral metre points share the owning source graph's rest frame.
 * @evidence contracts/modeling.md#shared-boundaries Tissue accounts preserve source attachment responsibility; weights alone certify no sliding interface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The actual assembly consumer owns observation.
 * @evidence contracts/anatomy.md#anatomical-source An explicit source account qualifies authored weights independently of clinical resolution.
 * @evidenceExclude contracts/anatomy.md#permitted-range Source joints own motion admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Offline source arrays are never document parameters.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourceVertexBinding {
  /** The ordinal-to-anatomical-bone map; each bone occurs once. */
  bones: readonly AutoMovieHumanBodyBoneId[];
  /** Four bone ordinals per surface vertex; zero-weight slots still use valid ordinals. */
  boneIndices: readonly number[];
  /** Four finite nonnegative weights per vertex, summing to one. */
  weights: readonly number[];
  /** Original or authored weighting method, site references and limitations. */
  account: string;
}
