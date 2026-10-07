import type { AutoMovieHumanBodyBoneId } from "../identity/AutoMovieHumanBodyBoneId";

/**
 * A tissue origin, insertion or support referencing one shared graph site.
 *
 * Source joint and tissue consumers resolve the same site. An account names
 * original annotation or reproducible authoring; membership alone supplies no
 * anatomical endpoint and no person-specific validity.
 *
 * @evidence contracts/common.md#principled-implementation A site reference preserves one shared anatomical endpoint rather than copying world coordinates.
 * @evidence contracts/common.md#clear-and-simple-design Bone, site, role and account name the complete attachment reference.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The actual closed bone, named site, attachment role and source account cannot be replaced by copied world points or claimed from part membership alone.
 * @evidence contracts/common.md#meaningful-documentation States annotation ownership and qualification limits.
 * @evidence contracts/modeling.md#part-identity-and-grouping The closed bone and named site identify the shared attachment owner.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record is not a user control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The assembly consumes the reference.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The referenced graph site owns its metre frame.
 * @evidence contracts/modeling.md#shared-boundaries Joint and tissue consumers share the same source site identity.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembly owns observation.
 * @evidence contracts/anatomy.md#anatomical-source The annotation account distinguishes authored support from imaged origin or insertion.
 * @evidenceExclude contracts/anatomy.md#permitted-range Source joints own motion admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority An offline reference is not editor-authored placement.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourcePartAttachment {
  /** Closed source bone owning the attachment's local site definition. */
  bone: AutoMovieHumanBodyBoneId;
  /** Stable site ID on that source bone, resolved by the same posed graph. */
  site: string;
  /** Source-authored endpoint or support role; it does not certify a clinical footprint. */
  role: "origin" | "insertion" | "support";
  /** Original annotation or reproducible artist registration, including its limitations. */
  account: string;
}
