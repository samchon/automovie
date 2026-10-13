import type { IHumanViewerBasisIdentity } from "./IHumanViewerBasisIdentity.js";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";
import type { IHumanViewerSubjectDocument } from "./IHumanViewerSubjectDocument.js";

/**
 * What the subject people are built from.
 *
 * @author Samchon
 */
export interface IReadHumanViewerSubjectPeopleProps {
  /** The published face subjects. */
  subjects: readonly IHumanViewerSubjectDocument[];

  /** The published face and body bases. */
  bases: Record<"face" | "body", IHumanViewerBasisIdentity>;

  /** Source digests; all three enter a person key. */
  sources: IHumanViewerRevisions;
}
