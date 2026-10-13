import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration.js";
import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";

/**
 * What the generation subject people are read from.
 *
 * @evidence contracts/common.md#principled-implementation Generation subject text is paired with its originating path, published generation and whole-person dependency revisions.
 * @evidence contracts/common.md#clear-and-simple-design The reader receives already-read text while the host retains filesystem access and publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Subject people must retain their declared published generation rather than silently use separate face/body bases.
 * @evidence contracts/common.md#meaningful-documentation Defines original text, refusal-path context, generation identity and the three person-key revision inputs.
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Generation subject text is paired with its originating path, published generation and whole-person dependency revisions.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The reader receives already-read text while the host retains filesystem access and publication.
 * @author Samchon
 */
export interface IReadHumanViewerGenerationSubjectsProps {
  /**
   * The subject people file's bytes as text.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure The subject people file's bytes as text. Generation subject text is paired with its originating path, published generation and whole-person dependency revisions.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The subject people file's bytes as text. The reader receives already-read text while the host retains filesystem access and publication.
   */
  text: string;

  /**
   * The file's path relative to the repository, for refusal reasons.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure The file's path relative to the repository, for refusal reasons. Generation subject text is paired with its originating path, published generation and whole-person dependency revisions.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The file's path relative to the repository, for refusal reasons. The reader receives already-read text while the host retains filesystem access and publication.
   */
  file: string;

  /**
   * The published generation the people must name.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure The published generation the people must name. Generation subject text is paired with its originating path, published generation and whole-person dependency revisions.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The published generation the people must name. The reader receives already-read text while the host retains filesystem access and publication.
   */
  generation: IHumanViewerPublishedGeneration;

  /**
   * Source digests; all three enter a person key.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Source digests; all three enter a person key. Generation subject text is paired with its originating path, published generation and whole-person dependency revisions.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Source digests; all three enter a person key. The reader receives already-read text while the host retains filesystem access and publication.
   */
  sources: IHumanViewerRevisions;
}
