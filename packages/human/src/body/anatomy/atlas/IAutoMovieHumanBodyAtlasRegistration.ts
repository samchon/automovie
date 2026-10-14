import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyBoneWorldRest } from "../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";

/**
 * Offline reference placement of an atlas surface against one body shape.
 *
 * The compiler registers the mesh into common body metres and records the carrying rig frame on that exact shape. Runtime only carries it rigidly; an authored placement does not establish imaged articular centres, fitted tissue contact or person-specific anatomy.
 *
 * @evidence contracts/common.md#principled-implementation A common-metre carrier frame/exact shape bind an atlas surface to its compiled basis before runtime rigid carry.
 * @evidence contracts/common.md#clear-and-simple-design Basis, humanoid carrier, frame and weights accompany the protocol that qualifies their correspondence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored placement establishes no personal articular centre, tissue contact or clinical registration.
 * @evidence contracts/common.md#meaningful-documentation Comments state stale-basis refusal, omitted-zero weights, carrier limits and authored-only qualification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Reference registration supplies operands without executing pose carry or shape comparison.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Basis/shape dependencies declare no completed rigid-placement reuse policy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Atlas registration owns no fitting session, native buffer or active asset handle.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAtlasRegistration {
  /** Exact compiled body basis revision; copied stale resources refuse. */
  basis: string;

  /** Humanoid carrier; separate anatomical joints require another rig owner. */
  bone: AutoMovieHumanoidBone;

  /** Carrying frame against which the registered mesh was authored. */
  reference: IAutoMovieHumanBodyBoneWorldRest;

  /** Exact basis weights; omission of a channel means zero. */
  shape: Record<string, number>;

  /** Named paired references, conversions and unresolved registration limits. */
  protocol: string;

  /** Authored reference placement supplies no personal tissue registration. */
  qualification: "authored-reference-only";
}
