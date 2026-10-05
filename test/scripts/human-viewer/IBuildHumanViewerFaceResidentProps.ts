import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";
import type {
  ConnectedFaceRequest,
  ConnectedFaceResult,
} from "@automovie/playground/src/human/common/connectedRuntime";
import type { HumanResidentPort } from "@automovie/playground/src/human/common/residentWorker";

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

  /** Open the numerical port for this document. */
  worker: () => HumanResidentPort<ConnectedFaceRequest, ConnectedFaceResult>;
}
