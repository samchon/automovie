import type {
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";
import type { createConnectedBodyViewport } from "@automovie/playground/src/human/body/connectedBodyViewport";
import type { createConnectedFaceViewport } from "@automovie/playground/src/human/face/connectedViewport";

/**
 * The product viewport a resident draws through: the face viewport, or the
 * body viewport for a body or a whole person.
 *
 * @evidence contracts/common.md#principled-implementation The viewer drives the product viewports themselves, never a copy.
 * @evidence contracts/common.md#meaningful-documentation Names each member of the union.
 */
export type HumanViewerStage =
  | ReturnType<typeof createConnectedFaceViewport>
  | ReturnType<typeof createConnectedBodyViewport<IAutoMovieHumanBodyBasisDocument>>
  | ReturnType<typeof createConnectedBodyViewport<IAutoMovieHumanPersonDocument>>;
