import type { IHumanViewerBasisIdentity } from "./IHumanViewerBasisIdentity.js";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";
import type { IHumanViewerSubjectDocument } from "./IHumanViewerSubjectDocument.js";

/**
 * What the subject people are built from.
 *
 * @evidence contracts/common.md#principled-implementation Subject person composition reads published subject identities, face/body basis authorities and whole-person source dependencies.
 * @evidence contracts/common.md#clear-and-simple-design A readonly subject projection is kept separate from basis identities and the revision record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Published subjects remain authoring inputs, with no subject-specific shape rules encoded in this transport.
 * @evidence contracts/common.md#meaningful-documentation Defines the subject list, paired basis identities and all three source digests used by person keys.
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
