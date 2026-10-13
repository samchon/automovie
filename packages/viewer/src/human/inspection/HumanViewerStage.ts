import type {
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";
import type { createConnectedBodyViewport } from "@automovie/viewer/human/body/createConnectedBodyViewport";
import type { createConnectedFaceViewport } from "@automovie/viewer/human/face/createConnectedFaceViewport";

/**
 * The product viewport a resident draws through: the face viewport, or the
 * body viewport for a body or a whole person.
 */
export type HumanViewerStage =
  | ReturnType<typeof createConnectedFaceViewport>
  | ReturnType<
      typeof createConnectedBodyViewport<IAutoMovieHumanBodyBasisDocument>
    >
  | ReturnType<
      typeof createConnectedBodyViewport<IAutoMovieHumanPersonDocument>
    >;
