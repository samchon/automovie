import type { ConnectedBodyRequest } from "@automovie/playground/src/human/body/ConnectedBodyRequest";
import type { ConnectedBodyResult } from "@automovie/playground/src/human/body/ConnectedBodyResult";
import type { HumanResidentPort } from "@automovie/playground/src/human/common/HumanResidentPort";

import type { createHumanViewerViewportHost } from "./createHumanViewerViewportHost";

/**
 * What a body or whole-person resident is built from.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 * @author Samchon
 */
export interface IBuildHumanViewerBodyResidentProps<Document> {
  /** The viewport host the resident owns. */
  host: ReturnType<typeof createHumanViewerViewportHost>;

  /** The body or person document. */
  document: Document;

  /** Use the existing product construct entry and retain its admission report. */
  operation?: "preview" | "construct";

  /** The document's text form, when it is not a body basis document. */
  serialize?: (document: Document) => string;

  /** Open the numerical port for this document. */
  worker: () => HumanResidentPort<ConnectedBodyRequest, ConnectedBodyResult>;
}
