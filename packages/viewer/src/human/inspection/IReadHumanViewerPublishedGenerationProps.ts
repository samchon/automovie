import type { IHumanViewerGenerationFiles } from "./IHumanViewerGenerationFiles.js";
import type { IHumanViewerSidecarFacts } from "./IHumanViewerSidecarFacts.js";

/**
 * Access to the published generation views for the catalogue.
 *
 * @evidence contracts/common.md#principled-implementation Published generation admission reads both selected view paths and their asynchronously acquired sidecar facts.
 * @evidence contracts/common.md#clear-and-simple-design The reader owns the paired-generation verdict while the host owns existence and fact acquisition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing views and pending facts are explicit observations rather than triggers to substitute legacy bases.
 * @evidence contracts/common.md#meaningful-documentation Documents the head/body path projection and nullable off-request facts for each selected view.
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Published generation admission reads both selected view paths and their asynchronously acquired sidecar facts.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The reader owns the paired-generation verdict while the host owns existence and fact acquisition.
 * @author Samchon
 */
export interface IReadHumanViewerPublishedGenerationProps {
  /**
   * Repository-relative paths of the two views, used in reasons.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Repository-relative paths of the two views, used in reasons. Published generation admission reads both selected view paths and their asynchronously acquired sidecar facts.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Repository-relative paths of the two views, used in reasons. The reader owns the paired-generation verdict while the host owns existence and fact acquisition.
   */
  files: IHumanViewerGenerationFiles;

  /**
   * Whether a view file exists.
   *
   * @evidence contracts/common.md#principled-implementation Existence is queried separately for the explicitly selected head and body view.
   * @evidence contracts/common.md#clear-and-simple-design The host resolves view paths while the paired-generation reader owns the verdict.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing view cannot be treated as an existing legacy basis file.
   * @evidence contracts/common.md#meaningful-documentation Defines the closed head/body view selector and existence answer.
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Existence is queried separately for the explicitly selected head and body view.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The host resolves view paths while the paired-generation reader owns the verdict.
   */
  exists: (file: "head" | "body") => boolean;

  /**
   * A view's facts, or null while it is still being read off the request path.
   *
   * @evidence contracts/common.md#principled-implementation View facts are read from the selected publication and remain null during pending IO.
   * @evidence contracts/common.md#clear-and-simple-design The host owns off-request fact acquisition while the paired reader checks agreement.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A pending view is not assigned a synthetic generation or digest.
   * @evidence contracts/common.md#meaningful-documentation Defines head/body fact selection and the pending null result.
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure View facts are read from the selected publication and remain null during pending IO.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The host owns off-request fact acquisition while the paired reader checks agreement.
   */
  facts: (file: "head" | "body") => IHumanViewerSidecarFacts | null;
}
