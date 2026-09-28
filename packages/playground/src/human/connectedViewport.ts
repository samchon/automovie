import type * as THREE from "three";

import { createConnectedFacePreview } from "./connectedPreview";
import { createConnectedFaceRenderer } from "./connectedRenderer";
import { createHumanPreviewStage } from "./previewStage";

/**
 * Compose resident numerical editing with the shared facial display stage.
 * This adapter owns publication order: prepared buffers become visible together,
 * and exports are requested separately from the same numerical worker.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Provides numerical preview, independent export and display-only camera controls.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Composes resident geometry and the common lighting/camera stage.
 */
export function createConnectedFaceViewport(
  props: Parameters<typeof createHumanPreviewStage>[0] & {
    worker: Parameters<typeof createConnectedFacePreview>[0]["worker"];
    loadTexture: (asset: string) => Promise<THREE.Texture>;
  },
) {
  const stage = createHumanPreviewStage(props);
  const renderer = createConnectedFaceRenderer({
    loadTexture: props.loadTexture,
    maxAnisotropy: props.renderer.capabilities.getMaxAnisotropy(),
  });
  const preview = createConnectedFacePreview({
    worker: props.worker,
    renderer,
  });
  type Model = Awaited<ReturnType<typeof preview.build>>;
  return {
    ...stage,
    ...preview,
    publish: (model: Model): void =>
      stage.publish(renderer.publish(model.frame)),
    dispose: (model: Model): void => renderer.dispose(model.frame),
  };
}
