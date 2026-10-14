import type { IHumanViewerBasisIdentity } from "./IHumanViewerBasisIdentity.js";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";
import type { IHumanViewerSubjectDocument } from "./IHumanViewerSubjectDocument.js";

/**
 * What the subject people are built from.
 *
 * @evidence contracts/common.md#principled-implementation Legacy subject-person composition receives published face descriptors and both published basis authorities with the numerical source digests.
 * @evidence contracts/common.md#clear-and-simple-design A readonly subject list and separate basis/source records give the application factory its required inputs without embedding subject presets in Viewer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Subject descriptors are externally supplied and do not authorize bypassing face/body/person construction admission.
 * @evidence contracts/common.md#meaningful-documentation Members specify published subjects, face/body bases and the three domain digests required for person keys.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The subject-factory input shape implements no subject traversal or numerical composition strategy.
 * @evidence contracts/performance.md#reuse-equivalent-work A subject person's cache authority depends on its full document, both basis digests and all numerical source domains rather than its display identity alone.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Readonly subject descriptors and basis metadata retain no worker or displayed mesh; the application owns their input lifetime.
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
