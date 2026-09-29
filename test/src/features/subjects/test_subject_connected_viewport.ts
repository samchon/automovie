import { createHumanFaceBasisBuilder } from "@automovie/human";
import type {
  ConnectedFaceRequest,
  ConnectedFaceResult,
} from "@automovie/playground/src/human/common/connectedRuntime";
import { createConnectedFaceViewport } from "@automovie/playground/src/human/face/connectedViewport";
import type { HumanResidentPort } from "@automovie/playground/src/human/common/residentWorker";
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
 * 4. A static face keeps shadow maps resident between edits; first display,
 *    repeated resident publication, clay and caster transitions refresh them.
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
  TestValidator.equals(
    "static connected face suspends automatic shadow updates",
    f.renderer.shadowMap.autoUpdate,
    false,
  );
  TestValidator.equals(
    "initial connected shadow map requested",
    f.renderer.shadowMap.needsUpdate,
    true,
  );
  const pending = viewport.build(document);
  port.onmessage!({
    data: {
      id: sent[0].id,
      success: true,
      value: {
        operation: "preview",
        model: createHumanFaceBasisBuilder(basis)(document),
        articulation: null,
        contact: null,
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
  f.renderer.shadowMap.needsUpdate = false;
  viewport.publish(built);
  TestValidator.equals(
    "newly published face refreshes shadows",
    f.renderer.shadowMap.needsUpdate,
    true,
  );
  f.renderer.shadowMap.needsUpdate = false;
  viewport.publish(built);
  TestValidator.equals(
    "resident deformation refreshes shadows",
    f.renderer.shadowMap.needsUpdate,
    true,
  );
  viewport.finish();
  TestValidator.predicate(
    "shared stage receives numerical group",
    built.frame.resident.group.parent === f.frames[0].scene,
  );
  f.renderer.shadowMap.needsUpdate = false;
  viewport.cameraView(90);
  TestValidator.equals(
    "orbit camera leaves static shadow maps resident",
    f.renderer.shadowMap.needsUpdate,
    false,
  );
  viewport.setClay(true);
  TestValidator.equals(
    "clay transition refreshes shadow policy",
    f.renderer.shadowMap.needsUpdate,
    true,
  );
  f.renderer.shadowMap.needsUpdate = false;
  viewport.setClay(false);
  TestValidator.equals(
    "return to material refreshes shadow policy",
    f.renderer.shadowMap.needsUpdate,
    true,
  );
  f.renderer.shadowMap.needsUpdate = false;
  viewport.setShadows(false);
  TestValidator.equals(
    "caster removal refreshes shadow policy",
    f.renderer.shadowMap.needsUpdate,
    true,
  );
  f.renderer.shadowMap.needsUpdate = false;
  viewport.setShadows(true);
  TestValidator.equals(
    "caster restoration refreshes shadow policy",
    f.renderer.shadowMap.needsUpdate,
    true,
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
