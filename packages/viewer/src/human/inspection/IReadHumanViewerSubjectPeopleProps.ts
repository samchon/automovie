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
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Subject person composition reads published subject identities, face/body basis authorities and whole-person source dependencies.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity A readonly subject projection is kept separate from basis identities and the revision record.
 * @author Samchon
 */
export interface IReadHumanViewerSubjectPeopleProps {
  /**
   * The published face subjects.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document The published face subjects. Subject person composition reads published subject identities, face/body basis authorities and whole-person source dependencies.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document The published face subjects. A readonly subject projection is kept separate from basis identities and the revision record.
   */
  subjects: readonly IHumanViewerSubjectDocument[];

  /**
   * The published face and body bases.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure The published face and body bases. Subject person composition reads published subject identities, face/body basis authorities and whole-person source dependencies.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The published face and body bases. A readonly subject projection is kept separate from basis identities and the revision record.
   */
  bases: Record<"face" | "body", IHumanViewerBasisIdentity>;

  /**
   * Source digests; all three enter a person key.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Source digests; all three enter a person key. Subject person composition reads published subject identities, face/body basis authorities and whole-person source dependencies.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Source digests; all three enter a person key. A readonly subject projection is kept separate from basis identities and the revision record.
   */
  sources: IHumanViewerRevisions;
}
