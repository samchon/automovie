import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration.js";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";
import type { HumanViewerBodyExamples } from "./HumanViewerBodyExamples.js";

/**
 * What the standard body states are built from.
 *
 * @evidence contracts/common.md#principled-implementation Standard body keys use the published generation and their actual body/companion dependency revisions.
 * @evidence contracts/common.md#clear-and-simple-design Application example parameters remain explicit data beside numerical generation and source authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Examples supply authoring values without moving their catalogue content into the numerical builder.
 * @evidence contracts/common.md#meaningful-documentation Explains usable generation, paired-body source keys and application-owned body parameter sets.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-document Standard body keys use the published generation and their actual body/companion dependency revisions.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-document Application example parameters remain explicit data beside numerical generation and source authority.
 * @author Samchon
 */
export interface IReadHumanViewerStandardBodiesProps {
  /**
   * The usable published person generation.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure The usable published person generation. Standard body keys use the published generation and their actual body/companion dependency revisions.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The usable published person generation. Application example parameters remain explicit data beside numerical generation and source authority.
   */
  generation: IHumanViewerPublishedGeneration;

  /**
   * Source digests; body and companion-source consumers enter the paired body's keys.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Source digests; body and companion-source consumers enter the paired body's keys. Standard body keys use the published generation and their actual body/companion dependency revisions.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Source digests; body and companion-source consumers enter the paired body's keys. Application example parameters remain explicit data beside numerical generation and source authority.
   */
  sources: IHumanViewerRevisions;

  /**
   * Parameter sets supplied by the application, independent of the numerical builder.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-document Parameter sets supplied by the application, independent of the numerical builder. Standard body keys use the published generation and their actual body/companion dependency revisions.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-document Parameter sets supplied by the application, independent of the numerical builder. Application example parameters remain explicit data beside numerical generation and source authority.
   */
  examples: HumanViewerBodyExamples;
}
