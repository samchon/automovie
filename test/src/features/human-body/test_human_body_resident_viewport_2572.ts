import { createHumanBodyBasisBuilder } from "@automovie/human";
import { packConnectedBodyModel } from "@automovie/playground/src/human/connectedBodyGeometry";
import { createConnectedBodyPort } from "@automovie/playground/src/human/connectedBodyPort";
import { createConnectedBodyViewport } from "@automovie/playground/src/human/connectedBodyViewport";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";

/** Body framing, companion, clay and publication can be driven without WebGL IO. */
export const test_human_body_resident_viewport_2572 =
  async (): Promise<void> => {
    const { basis, document } = humanBodyBasisFixture();
    const built = createHumanBodyBasisBuilder(basis)(document);
    const model = packConnectedBodyModel(built.model);
    let loop: (() => void) | undefined;
    let scene: THREE.Scene | undefined;
    let finishCount = 0;
    let size: [number, number] | undefined;
    const gpu = {
      capabilities: { getMaxAnisotropy: () => 1 },
      setPixelRatio: (_ratio: number) => {},
      outputColorSpace: "",
      toneMapping: THREE.NoToneMapping,
      toneMappingExposure: 0,
      shadowMap: { enabled: false, type: Number(THREE.BasicShadowMap) },
      setSize: (width: number, height: number) => {
        size = [width, height];
      },
      setAnimationLoop: (render: () => void) => {
        loop = render;
      },
      render: (current: THREE.Scene) => {
        scene = current;
      },
      getContext: () => ({
        finish: () => {
          ++finishCount;
        },
        getExtension: () => null,
        getParameter: () => "ANGLE test GPU",
        RENDERER: 0,
      }),
    };
    const sent: Array<{ id: number; input: { operation: string } }> = [];
    const native = {
      onmessage: null as Worker["onmessage"],
      onerror: null as Worker["onerror"],
      onmessageerror: null as Worker["onmessageerror"],
      postMessage: (request: { id: number; input: { operation: string } }) => {
        sent.push(request);
      },
      terminate: () => {},
    };
    const viewport = createConnectedBodyViewport({
      canvas: { getBoundingClientRect: () => ({ width: 800, height: 600 }) },
      pixelRatio: 2,
      renderer: gpu as unknown as Parameters<
        typeof createConnectedBodyViewport
      >[0]["renderer"],
      orbit: (camera) => ({
        target: new THREE.Vector3(),
        enableDamping: false,
        minDistance: 0,
        maxDistance: 0,
        update: () => camera.updateMatrixWorld(),
      }),
      worker: () => createConnectedBodyPort(native),
      loadTexture: async () => new THREE.Texture(),
      observeResize: (resize) => {
        resize();
      },
    });
    TestValidator.predicate(
      "metre-scale stage is configured and sized",
      size?.[0] === 800 &&
        size[1] === 600 &&
        gpu.shadowMap.enabled &&
        gpu.shadowMap.type === THREE.PCFSoftShadowMap &&
        loop !== undefined,
    );
    viewport.fitView();
    viewport.cameraView(45);
    viewport.setShadows(false);
    viewport.setShadows(true);
    viewport.setClay(true);
    viewport.finish();
    TestValidator.predicate(
      "manual finish uses current clay and GPU frame",
      finishCount === 1 &&
        (scene?.overrideMaterial as THREE.MeshStandardMaterial | null)
          ?.isMeshStandardMaterial === true &&
        viewport.renderer() === "ANGLE test GPU",
    );
    const pending = viewport.build(document);
    const request = sent[0];
    (native.onmessage as ((event: MessageEvent) => void) | null)?.({
      data: {
        id: request.id,
        success: true,
        value: {
          operation: "preview",
          model,
          crossings: null,
          extras: { bones: built.bones },
        },
      },
    } as MessageEvent);
    const frame = await pending;
    viewport.publish(frame);
    viewport.fitView();
    viewport.setClay(false);
    viewport.finish();
    TestValidator.predicate(
      "published body enters the scene with its finish",
      scene?.children.some((child) => child.name === model.name) === true &&
        scene.overrideMaterial === null &&
        finishCount === 2,
    );
    const face = new THREE.Group();
    viewport.companion.show(face);
    const placement = new THREE.Matrix4().makeTranslation(1, 2, 3);
    viewport.companion.place(placement);
    TestValidator.predicate(
      "companion is display only and can be hidden",
      scene?.children.includes(face) === true &&
        face.matrix.elements[12] === 1 &&
        face.matrixAutoUpdate === false,
    );
    viewport.companion.show(undefined);
    viewport.companion.place(placement);
    TestValidator.predicate(
      "hidden companion leaves scene",
      scene?.children.includes(face) === false,
    );
    viewport.dispose(frame);
  };
