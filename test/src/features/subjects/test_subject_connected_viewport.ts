import { createHumanFaceBasisBuilder } from "@automovie/human";
import type {
  ConnectedFaceRequest,
  ConnectedFaceResult,
} from "@automovie/playground/src/human/connectedRuntime";
import { createConnectedFaceViewport } from "@automovie/playground/src/human/connectedViewport";
import type { HumanResidentPort } from "@automovie/playground/src/human/residentWorker";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createHumanViewportFixture } from "../internal/createHumanViewportFixture";
import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";

/**
 * The composed connected viewport publishes numerical frames into its stage.
 *
 * Scenarios:
 * 1. A worker model appears in the actual Three scene only after publication.
 * 2. Export bytes travel independently; disposal preserves the active group.
 * 3. Cancellation withdraws a pending numerical candidate.
 */
export const test_subject_connected_viewport = async (): Promise<void> => {
  const f = createHumanViewportFixture();
  const { basis, document } = humanFaceBasisFixture();
  const sent: { id: number; input: ConnectedFaceRequest }[] = [];
  const port: HumanResidentPort<ConnectedFaceRequest, ConnectedFaceResult> = {
    onmessage: null,
    onerror: null,
    postMessage: (request) => {
      sent.push(request);
    },
    terminate: () => {},
  };
  const viewport = createConnectedFaceViewport({
    canvas: { getBoundingClientRect: () => ({ width: 640, height: 480 }) },
    pixelRatio: 1,
    renderer: f.renderer,
    orbit: () => f.orbit,
    observeResize: () => {},
    loadTexture: async () => new THREE.Texture(),
    worker: () => port,
  });
  const pending = viewport.build(document);
  port.onmessage!({
    data: {
      id: sent[0].id,
      success: true,
      value: {
        operation: "preview",
        model: createHumanFaceBasisBuilder(basis)(document),
        crossings: null,
      },
    },
  });
  const built = await pending;
  TestValidator.equals(
    "prepared group detached",
    built.frame.resident.group.parent,
    null,
  );
  viewport.publish(built);
  viewport.publish(built);
  viewport.finish();
  TestValidator.predicate(
    "shared stage receives numerical group",
    built.frame.resident.group.parent === f.frames[0].scene,
  );
  viewport.dispose(built);
  TestValidator.equals(
    "active buffers remain available",
    built.frame.resident.released,
    false,
  );
  const exported = viewport.export(document);
  port.onmessage!({
    data: {
      id: sent[1].id,
      success: true,
      value: { operation: "export", glb: new Uint8Array([9]) },
    },
  });
  TestValidator.equals("separate export", await exported, new Uint8Array([9]));
  const withdrawn = viewport.build(document).catch(() => "cancelled");
  viewport.cancel();
  TestValidator.equals(
    "pending candidate cancelled",
    await withdrawn,
    "cancelled",
  );
};
