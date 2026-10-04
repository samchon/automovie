import { createHumanBodyBasisBuilder } from "@automovie/human";
import { packConnectedBodyModel } from "@automovie/playground/src/human/body/connectedBodyGeometry";
import type {
  ConnectedBodyRequest,
  ConnectedBodyResult,
} from "@automovie/playground/src/human/body/connectedBodyProtocol";
import { createConnectedBodyViewport } from "@automovie/playground/src/human/body/connectedBodyViewport";
import type { HumanResidentPort } from "@automovie/playground/src/human/common/residentWorker";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createHumanViewportFixture } from "../internal/createHumanViewportFixture";
import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";

/**
 * The body viewport restores borrowed inspection materials before numerical
 * publication releases an earlier resident, independent of face publication.
 *
 * Scenarios:
 * 1. A material-changing publication under outline disposes original source
 *    materials exactly once and removes all temporary hulls before disposal.
 * 2. Disposing the current frame restores its material and visibility while
 *    retaining requested display hooks for the next render.
 * 3. The body skin's actual shader hook causes a named albedo refusal without
 *    a source swap; publishing a discarded candidate restores source ownership.
 */
export const test_human_observation_body_publication =
  async (): Promise<void> => {
    const fixture = createHumanViewportFixture();
    const { basis, document } = humanBodyBasisFixture();
    const built = createHumanBodyBasisBuilder(basis)(document);
    const model = packConnectedBodyModel(built.model);
    const sent: { id: number; input: ConnectedBodyRequest }[] = [];
    const port: HumanResidentPort<ConnectedBodyRequest, ConnectedBodyResult> = {
      onmessage: null,
      onerror: null,
      postMessage: (request) => {
        sent.push(request);
      },
      terminate: () => {},
    };
    const viewport = createConnectedBodyViewport({
      canvas: { getBoundingClientRect: () => ({ width: 640, height: 480 }) },
      pixelRatio: 1,
      renderer: fixture.renderer,
      orbit: () => fixture.orbit,
      observeResize: () => {},
      loadTexture: async () => new THREE.Texture(),
      worker: () => port,
    });
    const build = async (roughness: number) => {
      const pending = viewport.build(document);
      port.onmessage!({
        data: {
          id: sent.at(-1)!.id,
          success: true,
          value: {
            operation: "preview",
            model: {
              ...model,
              materials: model.materials.map((material) => ({
                ...material,
                roughness,
              })),
            },
            crossings: null,
            anatomy: null,
            extras: { bones: built.bones },
          },
        },
      });
      return pending;
    };
    const first = await build(0.4);
    viewport.publish(first);
    viewport.finish();
    const meshes = first.frame.resident.meshes;
    const originals = meshes.map((mesh) => mesh.material);
    const materials = new Set(
      originals.flatMap((one) => (Array.isArray(one) ? one : [one])),
    );
    const disposalCounts = new Map<THREE.Material, number>();
    for (const material of materials) {
      disposalCounts.set(material, 0);
      material.addEventListener("dispose", () => {
        disposalCounts.set(material, disposalCounts.get(material)! + 1);
      });
    }
    TestValidator.predicate(
      "body source carries a custom shading hook",
      [...materials].some(
        (material) =>
          material.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile,
      ),
    );
    viewport.observe.pass("albedo");
    let albedoRefusal = "";
    try {
      viewport.finish();
    } catch (error) {
      albedoRefusal = (error as Error).message;
    }
    TestValidator.predicate(
      "body custom shading refuses without replacing its source",
      albedoRefusal.includes("custom shader hooks") &&
        meshes.every((mesh, index) => mesh.material === originals[index]),
    );
    viewport.observe.pass("outline");
    const discarded = await build(0.9);
    viewport.dispose(discarded);
    viewport.finish();
    let refusal = "";
    try {
      viewport.publish(discarded);
    } catch (error) {
      refusal = (error as Error).message;
    }
    TestValidator.predicate(
      "refused body publication returns source ownership",
      refusal.includes("released") &&
        meshes.every((mesh, index) => mesh.material === originals[index]),
    );
    viewport.observe.pass("outline");
    viewport.observe.hide([meshes[0].name]);
    viewport.finish();
    TestValidator.predicate(
      "arranged temporary body material",
      meshes[0].material !== originals[0] && !meshes[0].visible,
    );
    const second = await build(0.7);
    viewport.publish(second);
    TestValidator.predicate(
      "body original disposal exactly once",
      [...disposalCounts.values()].every((count) => count === 1),
    );
    TestValidator.predicate(
      "departed body source restored",
      meshes.every(
        (mesh, index) =>
          mesh.material === originals[index] &&
          mesh.visible &&
          mesh.children.length === 0,
      ),
    );
    viewport.finish();
    viewport.dispose(second);
    TestValidator.predicate(
      "current source restored at disposal boundary",
      second.frame.resident.meshes.every(
        (mesh) => mesh.visible && mesh.children.length === 0,
      ),
    );
    TestValidator.equals(
      "body hooks remain requested",
      viewport.observe.state(),
      { pass: "outline", isolated: null, hidden: [meshes[0].name] },
    );
    viewport.dispose(first);
    TestValidator.predicate(
      "departed body source not disposed twice",
      [...disposalCounts.values()].every((count) => count === 1),
    );
  };
