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
 * @evidence contracts/common.md#principled-implementation ReturnType follows the actual connected face viewport and the body viewport specialized for body/person documents, keeping inspection operations aligned with those product constructors.
 * @evidence contracts/common.md#clear-and-simple-design One stage union lets page.ts, framing and PNG capture use their shared viewport operations without a second hand-written method inventory.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No probe renderer or alternate geometry path is substituted; the concrete product viewport remains responsible for numerical output, display and teardown.
 * @evidence contracts/common.md#meaningful-documentation Names face, body and person display variants and their constructor ownership; selecting this type proves no completed GPU frame or physiological admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms ReturnType and the union produce no allocation or draw; connected viewport constructors and render operations own their runtime costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reusing a stage requires the page's document/basis/source/operation cache key and live GPU ownership; sharing method types is not cache equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Residents own concrete viewport retirement and the shared renderer remains with the page; this union owns neither geometry buffers nor context lifetime or resident byte limits.
 */
export type HumanViewerStage =
  | ReturnType<typeof createConnectedFaceViewport>
  | ReturnType<
      typeof createConnectedBodyViewport<IAutoMovieHumanBodyBasisDocument>
    >
  | ReturnType<
      typeof createConnectedBodyViewport<IAutoMovieHumanPersonDocument>
    >;
