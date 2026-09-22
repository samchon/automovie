import { createHumanFaceBasisBuilder } from "@automovie/human";
import { createConnectedFacePreview } from "@automovie/playground/src/human/connectedPreview";
import { createConnectedFaceRenderer } from "@automovie/playground/src/human/connectedRenderer";
import type {
  ConnectedFaceRequest,
  ConnectedFaceResult,
} from "@automovie/playground/src/human/connectedRuntime";
import type { HumanResidentPort } from "@automovie/playground/src/human/residentWorker";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";

/**
 * One generation covers numerical work and asynchronous texture preparation.
 *
 * Scenarios:
 * 1. A normal preview is returned without publishing; export is independent.
 * 2. Cancelling worker work rejects its candidate and retains the connection.
 * 3. Supersession during preparation disposes the completed obsolete resource.
 * 4. Wrong reply alternatives refuse instead of publishing or downloading them.
 */
export const test_subject_connected_preview = async (): Promise<void> => {
  const { basis, document } = humanFaceBasisFixture();
  const model = createHumanFaceBasisBuilder(basis)(document);
  const sent: { id: number; input: ConnectedFaceRequest }[] = [];
  const port: HumanResidentPort<ConnectedFaceRequest, ConnectedFaceResult> = {
    onmessage: null,
    onerror: null,
    postMessage: (request) => {
      sent.push(request);
    },
    terminate: () => {},
  };
  const renderer = createConnectedFaceRenderer({
    loadTexture: async () => new THREE.Texture(),
    maxAnisotropy: 1,
  });
  let release!: () => void, entered!: () => void;
  const wait = new Promise<boolean>((resolve) => {
    release = () => resolve(true);
  });
  const started = new Promise<boolean>((resolve) => {
    entered = () => resolve(true);
  });
  let disposed = 0;
  const preview = createConnectedFacePreview({
    worker: () => port,
    renderer: {
      ...renderer,
      prepare: async (input) => {
        if (input.id === "delayed") {
          entered();
          await wait;
        }
        return renderer.prepare(input);
      },
      dispose: (frame) => {
        disposed++;
        renderer.dispose(frame);
      },
    },
  });
  const send = (index: number, value: ConnectedFaceResult): void => {
    port.onmessage!({ data: { id: sent[index].id, success: true, value } });
  };
  const numeric: ConnectedFaceResult = {
    operation: "preview",
    model,
    crossings: null,
  };
  const file: ConnectedFaceResult = {
    operation: "export",
    glb: new Uint8Array([1, 2]),
  };
  const first = preview.build(document);
  const output = preview.export(document);
  send(1, file);
  send(0, numeric);
  TestValidator.equals("independent export", await output, file.glb);
  const built = await first;
  TestValidator.equals("prepared region count", built.parts, 3);
  TestValidator.equals(
    "preparation does not publish",
    built.frame.resident.group.parent,
    null,
  );
  renderer.dispose(built.frame);
  const cancelled = preview
    .build(document)
    .catch((error: unknown) => (error as Error).message);
  preview.cancel();
  send(2, numeric);
  TestValidator.equals(
    "numerical cancellation",
    await cancelled,
    "Superseded by a newer face request.",
  );
  const obsolete = preview
    .build(document)
    .catch((error: unknown) => (error as Error).message);
  send(3, { ...numeric, model: { ...model, id: "delayed" } });
  await started;
  const current = preview.build(document, true);
  TestValidator.equals(
    "contact request forwarded",
    sent[4].input.measure,
    true,
  );
  send(4, numeric);
  const committed = await current;
  release();
  TestValidator.equals(
    "prepared cancellation",
    await obsolete,
    "Superseded while preparing face geometry.",
  );
  TestValidator.equals("obsolete resource released", disposed, 1);
  renderer.dispose(committed.frame);
  const wrongPreview = preview
    .build(document)
    .catch((error: unknown) => (error as Error).message);
  send(5, file);
  TestValidator.equals(
    "wrong preview reply",
    await wrongPreview,
    "Expected a numerical face preview.",
  );
  const wrongFile = preview
    .export(document)
    .catch((error: unknown) => (error as Error).message);
  send(6, numeric);
  TestValidator.equals(
    "wrong export reply",
    await wrongFile,
    "Expected an exported face file.",
  );
};
