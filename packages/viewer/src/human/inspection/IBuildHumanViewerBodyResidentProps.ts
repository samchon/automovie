import type { ConnectedBodyRequest } from "@automovie/human/body/runtime/ConnectedBodyRequest";
import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";
import type { HumanResidentPort } from "@automovie/viewer/human/common/HumanResidentPort";

import type { createHumanViewerViewportHost } from "./createHumanViewerViewportHost.js";

/**
 * What a body or whole-person resident is built from.
 *
 * @author Samchon
 */
export interface IBuildHumanViewerBodyResidentProps<Document> {
  /** The viewport host the resident owns. */
  host: ReturnType<typeof createHumanViewerViewportHost>;

  /** The body or person document. */
  document: Document;

  /**
   * Use the existing product construct entry and retain its admission report.
   */
  operation?: "preview" | "construct";

  /** The document's text form, when it is not a body basis document. */
  serialize?: (document: Document) => string;

  /** Open the numerical port for this document. */
  worker: () => HumanResidentPort<ConnectedBodyRequest, ConnectedBodyResult>;
}
