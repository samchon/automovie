import type * as THREE from "three";

import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";
import { restoreAutoMovieRenderModeState } from "../../restoreAutoMovieRenderModeState.js";
import { createConnectedFacePreview } from "./createConnectedFacePreview.js";
import { createConnectedFaceRenderer } from "./createConnectedFaceRenderer.js";
import { createHumanPreviewStage } from "./createHumanPreviewStage.js";

/**
 * Compose resident numerical editing with the shared facial display stage.
 * This adapter owns publication order: prepared buffers become visible together,
 * and exports are requested separately from the same numerical worker.
 *
 * @evidence contracts/common.md#principled-implementation Numerical preparation stays offscreen and publication first restores observation-owned materials, then writes admitted frame buffers and swaps display membership. Export remains a separately correlated document request; the input's static part/configuration correspondence must remain stable while holding a prepared frame.
 * @evidence contracts/common.md#clear-and-simple-design Composition joins the existing numerical renderer/preview to one display stage, with no second scene or browser allocation. Capability lookup and lazy numerical coordinators precede stage acquisition so their setup refusal cannot orphan stage listeners or materials.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No face geometry is registered or substituted in Viewer. Model publication is synchronous after numerical checks, but native failures can interrupt writes; the adapter does not claim an arbitrary callback failure is an atomic previous-frame transaction.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes explicit publication from export and the close member states acquired connection ownership versus borrowed host renderer. Discard restores observation state before numerical resident retirement.
 * @evidence contracts/performance.md#efficient-algorithms Composition adds fixed callback/handle wrapping to numerical model preparation/upload and native stage draw costs. Settlement independently visits the two existing retirement owners rather than duplicating resource traversal here.
 * @evidence contracts/performance.md#reuse-equivalent-work Stage, resident worker and compatible native residents persist across edits. Repeated close shares one complete outcome; exports are independent effects and are not reused from a displayed preview.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Close independently cancels preview authority, stops the stage and retires numerical groups/caches and the acquired worker. Renderer, controls and canvas remain host-owned; the browser factory releases them after stage settlement. Before the stage factory returns, numerical coordinators are empty and have acquired no connection or frame.
 */
export function createConnectedFaceViewport(
  props: Parameters<typeof createHumanPreviewStage>[0] & {
    worker: Parameters<typeof createConnectedFacePreview>[0]["worker"];
    loadTexture: (asset: string) => Promise<THREE.Texture>;
  },
): Omit<ReturnType<typeof createHumanPreviewStage>, "publish"> &
  ReturnType<typeof createConnectedFacePreview> & {
    publish: (
      model: Awaited<
        ReturnType<ReturnType<typeof createConnectedFacePreview>["build"]>
      >,
    ) => void;
    dispose: (
      model: Awaited<
        ReturnType<ReturnType<typeof createConnectedFacePreview>["build"]>
      >,
    ) => void;
  } {
  const renderer: ReturnType<typeof createConnectedFaceRenderer> =
    createConnectedFaceRenderer({
      loadTexture: props.loadTexture,
      maxAnisotropy: props.renderer.capabilities.getMaxAnisotropy(),
    });
  const preview: ReturnType<typeof createConnectedFacePreview> =
    createConnectedFacePreview({
      worker: props.worker,
      renderer,
    });
  const stage: ReturnType<typeof createHumanPreviewStage> =
    createHumanPreviewStage(props);
  type Model = Awaited<ReturnType<typeof preview.build>>;
  const close: () => Promise<void> = createAutoMovieResourceRetirement([
    (): void => preview.cancel(),
    (): Promise<void> => stage.close(),
    (): Promise<void> => renderer.close(),
    (): void => preview.disposeWorker(),
  ]);
  return {
    ...stage,
    ...preview,
    /** Await requested frame retirements; failures remain owned by the numerical renderer. */
    settleRetirements: (): Promise<void> =>
      createAutoMovieResourceRetirement([
        (): Promise<void> => stage.settleRetirements(),
        (): Promise<void> => renderer.settleRetirements(),
      ])(),
    /** Retire owned display resources and numerical connection while preserving the borrowed host renderer. */
    close,
    publish: (model: Model): void => {
      stage.restoreObservation();
      stage.publish(renderer.publish(model.frame));
    },
    dispose: (model: Model): void => {
      restoreAutoMovieRenderModeState([
        (): void => stage.restoreObservation(),
        (): void => renderer.dispose(model.frame),
      ]);
    },
  };
}
