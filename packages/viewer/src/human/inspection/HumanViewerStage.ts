import type {
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";
import type { createConnectedBodyViewport } from "@automovie/viewer/human/body/createConnectedBodyViewport";
import type { createConnectedFaceViewport } from "@automovie/viewer/human/face/createConnectedFaceViewport";

/**
 * The product viewport a resident draws through: the face viewport, or the
 * body viewport for a body or a whole person.
 *
 * @evidence contracts/common.md#principled-implementation The viewer drives the product viewports themselves, never a copy.
 * @evidence contracts/common.md#meaningful-documentation Names each member of the union.
 *
 * @evidence contracts/common.md#clear-and-simple-design The union reuses actual face and body viewport return types, including the body viewport's Person specialization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts All alternatives are existing product viewports; no inspection-only geometry producer is admitted by this alias.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The viewer drives the product viewports themselves, never a copy.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach All alternatives are existing product viewports; no inspection-only geometry producer is admitted by this alias.
 */
export type HumanViewerStage =
  | ReturnType<typeof createConnectedFaceViewport>
  | ReturnType<
      typeof createConnectedBodyViewport<IAutoMovieHumanBodyBasisDocument>
    >
  | ReturnType<
      typeof createConnectedBodyViewport<IAutoMovieHumanPersonDocument>
    >;
