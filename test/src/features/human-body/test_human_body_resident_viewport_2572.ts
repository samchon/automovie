import { createHumanBodyBasisBuilder } from "@automovie/human";
import { packConnectedBodyModel } from "@automovie/playground/src/human/body/connectedBodyGeometry";
import { createConnectedBodyPort } from "@automovie/playground/src/human/body/connectedBodyPort";
import { createConnectedBodyViewport } from "@automovie/playground/src/human/body/connectedBodyViewport";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Body framing, companion, lighting and publication are driven through the
 * real viewport with supported renderer/worker IO adapters, without WebGL.
 *
 * Scenarios:
 * 1. Publication, material passes and caster changes invalidate static shadows.
 * 2. Every named light follows a 3:4 direction, retaining its radius and finish;
 *    repeating a setting requests no extra shadow refresh and null restores defaults.
 * 3. Unknown names and zero/nonfinite/overflow norms preserve the current stage.
 * 4. Subnormal and large finite directions remain representable; selecting a
 *    new light restores the previously selected one before applying its goal.
 */
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
      shadowMap: { enabled: false, type: Number(THREE.BasicShadowMap), autoUpdate: true, needsUpdate: false },
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
    TestValidator.equals("body stage owns static initial shadows", [gpu.shadowMap.autoUpdate, gpu.shadowMap.needsUpdate], [false, true]);
    viewport.fitView();
    viewport.cameraView(45);
    viewport.setShadows(false);
    TestValidator.equals("caster removal invalidates body shadows", gpu.shadowMap.needsUpdate, true);
    gpu.shadowMap.needsUpdate = false;
    viewport.setShadows(true);
    TestValidator.equals("caster restoration invalidates body shadows", gpu.shadowMap.needsUpdate, true);
    viewport.setClay(true);
    TestValidator.equals("clay invalidates shadow policy", gpu.shadowMap.needsUpdate, true);
    viewport.finish();
    TestValidator.predicate(
      "manual finish uses current clay and GPU frame",
      finishCount === 1 &&
        (scene?.overrideMaterial as THREE.MeshStandardMaterial | null)
          ?.isMeshStandardMaterial === true &&
        viewport.renderer() === "ANGLE test GPU",
    );
    const lights = scene!.children.filter(
      (child): child is THREE.DirectionalLight =>
        "isDirectionalLight" in child && child.isDirectionalLight === true,
    );
    TestValidator.equals("the real studio owns the three named light roles", lights.map((light) => light.name), ["key", "fill", "rim"]);
    const defaults = lights.map((light) => ({
      name: light.name,
      position: light.position.clone(),
      color: light.color.clone(),
      intensity: light.intensity,
      castShadow: light.castShadow,
    }));
    gpu.shadowMap.needsUpdate = false;
    viewport.setLightDirection(null);
    TestValidator.equals("the initial studio default requests no extra shadow refresh", gpu.shadowMap.needsUpdate, false);
    for (const light of lights) {
      const own = defaults.find((one) => one.name === light.name)!;
      gpu.shadowMap.needsUpdate = false;
      viewport.setLightDirection({ name: light.name, direction: [3, 4, 0] });
      TestValidator.predicate("the named light follows the independent 3:4 direction at its original radius",
        nclose(light.position.length(), own.position.length()) &&
        nclose(light.position.x, own.position.length() * 3 / 5) &&
        nclose(light.position.y, own.position.length() * 4 / 5) &&
        nclose(light.position.z, 0));
      TestValidator.predicate("direction retains colour, power and caster policy", light.color.equals(own.color) && light.intensity === own.intensity && light.castShadow === own.castShadow);
      TestValidator.equals("changed direction invalidates shadows", gpu.shadowMap.needsUpdate, true);
      gpu.shadowMap.needsUpdate = false;
      viewport.setLightDirection({ name: light.name, direction: [3, 4, 0] });
      TestValidator.equals("the same direction requests no extra shadow refresh", gpu.shadowMap.needsUpdate, false);
      TestValidator.predicate("one address changes only one light", lights.every((other) => other === light || other.position.equals(defaults.find((one) => one.name === other.name)!.position)));
    }
    const beforeRefusal = lights.map((light) => light.position.clone());
    gpu.shadowMap.needsUpdate = false;
    for (const name of ["missing", "constructor"])
      TestValidator.predicate("unknown light refuses before mutation", throwsError(() => viewport.setLightDirection({ name, direction: [1, 0, 0] }), "Unknown inspection light"));
    for (const direction of [
      [0, 0, 0], [NaN, 1, 0], [Infinity, 0, 0],
      [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE],
    ] as const)
      TestValidator.predicate("invalid norm refuses before mutation", throwsError(() => viewport.setLightDirection({ name: lights[0].name, direction }), "finite nonzero direction"));
    TestValidator.predicate("refusal preserves every light and its shadow refresh request", lights.every((light, i) => light.position.equals(beforeRefusal[i])) && !gpu.shadowMap.needsUpdate);
    const first = lights[0];
    const radius = defaults[0].position.length();
    viewport.setLightDirection({ name: first.name, direction: [1e-320, 0, 0] });
    TestValidator.predicate("subnormal normalization stays finite", nclose(first.position.x, radius) && first.position.y === 0 && first.position.z === 0);
    viewport.setLightDirection({ name: first.name, direction: [Number.MIN_VALUE, Number.MIN_VALUE, 0] });
    TestValidator.predicate("the smallest diagonal retains its original radius", nclose(first.position.length(), radius) && nclose(first.position.x, radius / Math.sqrt(2)) && nclose(first.position.y, radius / Math.sqrt(2)) && first.position.z === 0);
    viewport.setLightDirection({ name: first.name, direction: [1e308, 1e308, 0] });
    TestValidator.predicate("large finite normalization stays finite", nclose(first.position.x, radius / Math.sqrt(2)) && nclose(first.position.y, radius / Math.sqrt(2)) && first.position.z === 0);
    viewport.setLightDirection(null);
    TestValidator.predicate("omission restores every exact default", lights.every((light, i) => light.position.equals(defaults[i].position)));
    gpu.shadowMap.needsUpdate = false;
    viewport.setLightDirection(null);
    TestValidator.equals("unchanged defaults request no extra shadow refresh", gpu.shadowMap.needsUpdate, false);
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
    gpu.shadowMap.needsUpdate = false;
    viewport.publish(frame);
    TestValidator.equals("publication invalidates body shadows", gpu.shadowMap.needsUpdate, true);
    viewport.fitView();
    viewport.setClay(false);
    viewport.finish();
    TestValidator.predicate(
      "published body enters the scene with its finish",
      scene?.children.some((child) => child.name === model.name) === true &&
        scene.overrideMaterial === null &&
        finishCount === 2,
    );
    gpu.shadowMap.needsUpdate = false;
    const part = viewport.observe.parts()[0];
    TestValidator.predicate("published body has a caster", part !== undefined);
    viewport.observe.hide([part]);
    viewport.finish();
    TestValidator.equals("hidden body caster invalidates shadows", gpu.shadowMap.needsUpdate, true);
    gpu.shadowMap.needsUpdate = false;
    viewport.finish();
    TestValidator.equals("unchanged body visibility requests no extra shadow refresh", gpu.shadowMap.needsUpdate, false);
    viewport.observe.hide(null);
    viewport.finish();
    TestValidator.equals("restored body caster invalidates shadows", gpu.shadowMap.needsUpdate, true);
    gpu.shadowMap.needsUpdate = false;
    const face = new THREE.Group();
    viewport.companion.show(face);
    TestValidator.equals("companion membership invalidates shadows", gpu.shadowMap.needsUpdate, true);
    gpu.shadowMap.needsUpdate = false;
    const placement = new THREE.Matrix4().makeTranslation(1, 2, 3);
    viewport.companion.place(placement);
    TestValidator.equals("companion transform invalidates shadows", gpu.shadowMap.needsUpdate, true);
    TestValidator.predicate(
      "companion is display only and can be hidden",
      scene?.children.includes(face) === true &&
        face.matrix.elements[12] === 1 &&
        face.matrixAutoUpdate === false,
    );
    viewport.companion.show(undefined);
    TestValidator.equals("companion removal invalidates shadows", gpu.shadowMap.needsUpdate, true);
    gpu.shadowMap.needsUpdate = false;
    viewport.companion.place(placement);
    TestValidator.equals("absent companion requests no extra shadow refresh", gpu.shadowMap.needsUpdate, false);
    TestValidator.predicate(
      "hidden companion leaves scene",
      scene?.children.includes(face) === false,
    );
    viewport.dispose(frame);
  };
