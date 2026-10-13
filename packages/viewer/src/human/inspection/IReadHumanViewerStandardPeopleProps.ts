import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration.js";
import type { IHumanViewerReferenceFaceDocument } from "./IHumanViewerReferenceFaceDocument.js";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";
import type { HumanViewerBodyExamples } from "./HumanViewerBodyExamples.js";

/**
 * What the standard people are built from.
 *
 * @evidence contracts/common.md#principled-implementation Standard people combine one reference face and admitted generation with all face/body/person source digests.
 * @evidence contracts/common.md#clear-and-simple-design The input record separates the reference face, generation authority and application-owned body examples.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The composed person's keys do not substitute a single domain revision for their three actual source dependencies.
 * @evidence contracts/common.md#meaningful-documentation Documents the reference face, published generation, full person revision inputs and body example ownership.
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Standard people combine one reference face and admitted generation with all face/body/person source digests.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The input record separates the reference face, generation authority and application-owned body examples.
 * @author Samchon
 */
export interface IReadHumanViewerStandardPeopleProps {
  /**
   * The reference face the standard people wear.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document The reference face the standard people wear. Standard people combine one reference face and admitted generation with all face/body/person source digests.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document The reference face the standard people wear. The input record separates the reference face, generation authority and application-owned body examples.
   */
  reference: IHumanViewerReferenceFaceDocument;

  /**
   * The usable published person generation.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure The usable published person generation. Standard people combine one reference face and admitted generation with all face/body/person source digests.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The usable published person generation. The input record separates the reference face, generation authority and application-owned body examples.
   */
  generation: IHumanViewerPublishedGeneration;

  /**
   * Source digests; all three enter a person key.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Source digests; all three enter a person key. Standard people combine one reference face and admitted generation with all face/body/person source digests.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Source digests; all three enter a person key. The input record separates the reference face, generation authority and application-owned body examples.
   */
  sources: IHumanViewerRevisions;

  /**
   * Application-owned body parameter sets composed with the reference face.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-document Application-owned body parameter sets composed with the reference face. Standard people combine one reference face and admitted generation with all face/body/person source digests.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-document Application-owned body parameter sets composed with the reference face. The input record separates the reference face, generation authority and application-owned body examples.
   */
  examples: HumanViewerBodyExamples;
}
