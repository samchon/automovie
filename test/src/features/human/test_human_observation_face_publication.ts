import { createHumanFaceBasisBuilder } from "@automovie/human";
import type {
  ConnectedFaceRequest,
  ConnectedFaceResult,
} from "@automovie/playground/src/human/common/connectedRuntime";
import type { HumanResidentPort } from "@automovie/playground/src/human/common/residentWorker";
import { createConnectedFaceViewport } from "@automovie/playground/src/human/face/connectedViewport";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createHumanViewportFixture } from "../internal/createHumanViewportFixture";
import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";

/**
 * The actual face publication adapter restores inspection materials before
 * the numerical renderer disposes its previous resident.
 *
 * Scenarios:
 * 1. A material-changing publication under outline disposes each original
 *    material exactly once and leaves no inspection hull on the old source.
 * 2. Repeated publication and disposal retain requested outline/isolation,
 *    while source materials are returned before the numerical disposal call.
 * 3. Plain face materials admit albedo; a tampered publication refuses after
 *    restoring the original materials and preserves the requested pass.
 */
export const test_human_observation_face_publication =
  async (): Promise<void> => {
    const fixture = createHumanViewportFixture();
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
    const viewport = createConnectedFaceViewport({
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
            articulation: null,
            contact: null,
            crossings: null,
          },
        },
      });
      return pending;
    };
    const first = await build(0.4);
    viewport.publish(first);
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
    viewport.observe.pass("albedo");
    viewport.finish();
    TestValidator.predicate(
      "analytic face consumer admits base-colour observation",
      meshes.every(
        (mesh, index) =>
          mesh.material instanceof THREE.MeshBasicMaterial &&
          !mesh.material.toneMapped &&
          mesh.material.color.equals(
            (originals[index] as THREE.MeshStandardMaterial).color,
          ),
      ),
    );
    const position = first.frame.meshes[0].positions[0];
    first.frame.meshes[0].positions[0] += 0.125;
    let refusal = "";
    try {
      viewport.publish(first);
    } catch (error) {
      refusal = (error as Error).message;
    }
    TestValidator.predicate(
      "refused publication returns source ownership",
      refusal.includes("geometry changed") &&
        meshes.every((mesh, index) => mesh.material === originals[index]),
    );
    first.frame.meshes[0].positions[0] = position;
    viewport.observe.pass("outline");
    viewport.observe.isolate([meshes[0].name]);
    viewport.finish();
    TestValidator.predicate(
      "arranged temporary materials",
      meshes.every(
        (mesh, index) =>
          mesh.material !== originals[index] && mesh.children.length === 1,
      ),
    );
    const second = await build(0.7);
    viewport.publish(second);
    TestValidator.predicate(
      "originals disposed once on replacement",
      [...disposalCounts.values()].every((count) => count === 1),
    );
    TestValidator.predicate(
      "old source restored before release",
      meshes.every(
        (mesh, index) =>
          mesh.material === originals[index] &&
          mesh.children.length === 0 &&
          mesh.visible,
      ),
    );
    viewport.finish();
    const current = second.frame.resident.meshes;
    viewport.publish(second);
    TestValidator.predicate(
      "publication restores current materials",
      current.every((mesh) => mesh.children.length === 0),
    );
    viewport.finish();
    viewport.dispose(second);
    TestValidator.predicate(
      "disposal restores current source",
      current.every((mesh) => mesh.children.length === 0 && mesh.visible),
    );
    TestValidator.equals(
      "requested display survives source transitions",
      viewport.observe.state(),
      {
        pass: "outline",
        isolated: [meshes[0].name],
        hidden: [],
      },
    );
    viewport.dispose(first);
    TestValidator.predicate(
      "departed originals are not disposed again",
      [...disposalCounts.values()].every((count) => count === 1),
    );
  };
