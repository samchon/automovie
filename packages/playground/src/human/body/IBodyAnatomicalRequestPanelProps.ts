import type { IAutoMovieHumanBodyAnatomicalAssembly } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";

import type { IBodyAnatomicalRequestModel } from "./IBodyAnatomicalRequestModel";
import type { IBodyAnatomicalRequestViewport } from "./IBodyAnatomicalRequestViewport";

/**
 * Inputs of `mountBodyAnatomicalRequestPanel`.
 *
 * `basis` names the neutral reference rig requests are evaluated against, `viewport` builds and shows frames, and `download` saves an explicitly exported candidate file. Omitted `source` leaves the document parser's unsupported-path refusals in force; it does not supply a fallback anatomical authority.
 *
 * @evidence contracts/common.md#principled-implementation Requests are bound to a named neutral basis and optional loaded source authority, while the viewport supplies numerical construction and explicit candidate export.
 * @evidence contracts/common.md#clear-and-simple-design The mount contract groups source identity, frame operations and a download sink without giving the panel renderer internals or filesystem access.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source absence preserves unsupported-path refusal instead of substituting another subject's data or claiming resolved clinical geometry.
 * @evidence contracts/common.md#meaningful-documentation Comments identify neutral basis identity, source admission authority, viewport responsibility and candidate-only download behavior.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This mounting input type chooses no parsing, numerical construction or export algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source and viewport references describe dependencies but implement no cross-request frame sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The panel receives borrowed operations; frame retirement remains in the viewport and download resource lifetime belongs to its sink.
 *
 * @author Samchon
 */
export interface IBodyAnatomicalRequestPanelProps<
  Model extends IBodyAnatomicalRequestModel,
> {
  /** Exact basis identity of the neutral reference rig. */
  basis: string;

  /** Loaded source quantity authority for request admission and persistence; absent sources retain legacy unsupported-path refusals. */
  source?: IAutoMovieHumanBodyAnatomicalAssembly;

  /** Viewport that builds, publishes and exports frames. */
  viewport: IBodyAnatomicalRequestViewport<Model>;

  /**
   * Save bytes under a file name and MIME type when the user requests a document or candidate export.
   *
   * @evidence contracts/common.md#principled-implementation The download sink receives encoded bytes and explicit media metadata, keeping transport separate from numerical qualification.
   * @evidence contracts/common.md#clear-and-simple-design One sink handles document and candidate files without giving the request panel browser URL management.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Downloading bytes does not reclassify a candidate export as validated whole-body geometry.
   * @evidence contracts/common.md#meaningful-documentation The sink comment names file metadata and the explicit user-triggered export boundary.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This file-delivery signature selects no encoding or browser-download strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work User file delivery is an effect with no declared sharing across equal byte payloads.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Blob and object-URL acquisition belong to the injected download implementation, not this callback declaration.
   */
  download: (name: string, bytes: BlobPart, mime: string) => void;
}
