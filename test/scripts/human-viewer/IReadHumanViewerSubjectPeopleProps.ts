import type { IHumanViewerBasisIdentity } from "./IHumanViewerBasisIdentity";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions";
import type { IHumanViewerSubjectDocument } from "./IHumanViewerSubjectDocument";

/**
 * What the subject people are built from.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every input.
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
