import type { AutoMovieHumanBodyBoneId } from "../identity/AutoMovieHumanBodyBoneId";

/**
 * A tissue origin, insertion or support referencing one shared graph site.
 *
 * Source joint and tissue consumers resolve the same site. An account names original annotation or reproducible authoring; membership alone supplies no anatomical endpoint and no person-specific validity.
 *
 * @evidence contracts/common.md#principled-implementation A closed source bone and stable local site address make origins, insertions and supports consume the same posed graph site as joints.
 * @evidence contracts/common.md#clear-and-simple-design Attachment role and registration account accompany the bone/site reference so tissue endpoints do not acquire an independent coordinate owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Membership alone supplies no anatomical endpoint or individual validity; the account must describe original annotation or reproducible authoring.
 * @evidence contracts/common.md#meaningful-documentation Fields define bone-local site ownership, shared graph resolution, closed endpoint/support roles and annotation limitations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Attachment references specify endpoint inputs without evaluating graph-site transforms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Joint and tissue consumers share site identity, while this record stores no repeated posed-endpoint result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The attachment interface owns no contact constraint, tissue buffer or registration process.
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
