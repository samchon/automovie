import type { IHumanViewerGenerationFiles } from "./IHumanViewerGenerationFiles.js";
import type { IHumanViewerSidecarFacts } from "./IHumanViewerSidecarFacts.js";

/**
 * Access to the published generation views for the catalogue.
 *
 * @author Samchon
 */
export interface IReadHumanViewerPublishedGenerationProps {
  /** Repository-relative paths of the two views, used in reasons. */
  files: IHumanViewerGenerationFiles;

  /** Whether a view file exists. */
  exists: (file: "head" | "body") => boolean;

  /**
   * A view's facts, or null while it is still being read off the request path.
   */
  facts: (file: "head" | "body") => IHumanViewerSidecarFacts | null;
}
