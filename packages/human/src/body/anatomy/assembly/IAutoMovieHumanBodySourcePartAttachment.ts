import type { AutoMovieHumanBodyBoneId } from "../identity/AutoMovieHumanBodyBoneId";

/**
 * A tissue origin, insertion or support referencing one shared graph site.
 *
 * Source joint and tissue consumers resolve the same site. An account names
 * original annotation or reproducible authoring; membership alone supplies no
 * anatomical endpoint and no person-specific validity.
 *
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
