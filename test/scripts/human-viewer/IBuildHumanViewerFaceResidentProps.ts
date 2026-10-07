import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";
import type { ConnectedFaceRequest } from "@automovie/playground/src/human/common/ConnectedFaceRequest";
import type { ConnectedFaceResult } from "@automovie/playground/src/human/common/ConnectedFaceResult";
import type { HumanResidentPort } from "@automovie/playground/src/human/common/HumanResidentPort";

import type { createHumanViewerViewportHost } from "./createHumanViewerViewportHost";

/**
 * What a face resident is built from.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 * @author Samchon
 */
export interface IBuildHumanViewerFaceResidentProps {
  /** The viewport host the resident owns. */
  host: ReturnType<typeof createHumanViewerViewportHost>;

  /** The face document. */
  document: IAutoMovieHumanFaceBasisDocument;

  /** Whether ambient occlusion is evaluated. */
  ao: boolean;

  /** Explicit owner construction inspection; omission retains admitted preview. */
  operation?: "preview" | "construct";

  /** Open the numerical port for this document. */
  worker: () => HumanResidentPort<ConnectedFaceRequest, ConnectedFaceResult>;
}
