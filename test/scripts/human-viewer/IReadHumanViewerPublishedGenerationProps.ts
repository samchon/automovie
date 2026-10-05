import type { IHumanViewerGenerationFiles } from "./IHumanViewerGenerationFiles";
import type { IHumanViewerSidecarFacts } from "./IHumanViewerSidecarFacts";

/**
 * Access to the published generation views for the catalogue.
 *
 * @evidence contracts/common.md#clear-and-simple-design The host supplies existence and off-request facts; the reader owns the verdict.
 * @evidence contracts/common.md#meaningful-documentation Names every input.
 * @author Samchon
 */
export interface IReadHumanViewerPublishedGenerationProps {
  /** Repository-relative paths of the two views, used in reasons. */
  files: IHumanViewerGenerationFiles;

  /** Whether a view file exists. */
  exists: (file: "head" | "body") => boolean;

  /** A view's facts, or null while it is still being read off the request path. */
  facts: (file: "head" | "body") => IHumanViewerSidecarFacts | null;
}
