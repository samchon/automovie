import type { IAutoMovieModel } from "@automovie/interface";
import { createConnectedFaceRenderer } from "@automovie/playground/src/human/face/connectedRenderer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";

/**
 * A published exact source witness permits appearance edits to reuse Float32
 * and topology admission; changed geometry or closure takes the full gate.
 * Preparation and publication remain separate mutation boundaries.
 */
export const test_subject_connected_renderer_witness =
  async (): Promise<void> => {
    const basis = humanFaceBasisFixture().basis;
    const model: IAutoMovieModel = {
      id: "witness",
      name: "Witness",
      origin: "imported",
      parts: [
        {
          id: "triangle",
          name: "Triangle",
          material: "skin",
          geometry: {
            type: "mesh",
            mesh: {
              positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
              indices: [0, 1, 2],
              normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
              uvs: null,
              skin: null,
            },
          },
          attachedBone: null,
          transform: null,
        },
      ],
      materials: basis.materials,
      skeleton: null,
      body: null,
      asset: null,
    };
    const renderer = createConnectedFaceRenderer({
      loadTexture: async () => new THREE.Texture(),
      maxAnisotropy: 1,
    });
    const first = await renderer.prepare(model);
    const original = renderer.publish(first);
    const appearance = structuredClone(model);
    if (model.parts[0].geometry.type !== "mesh")
      throw new Error("Expected mesh geometry.");
    model.parts[0].geometry.mesh.positions[0] = 0.25;
    appearance.materials.find((material) => material.id === "skin")!.roughness =
      0.3;
    const repeated = await renderer.prepare(appearance);
    TestValidator.predicate(
      "equal geometry reuses the exact validation witness",
      repeated.witnesses[0] === first.witnesses[0],
    );
    const next = renderer.publish(repeated);
    TestValidator.predicate(
      "material edit still stages a new group",
      next !== original,
    );
    const changed = structuredClone(appearance);
    if (changed.parts[0].geometry.type !== "mesh")
      throw new Error("Expected mesh geometry.");
    changed.parts[0].geometry.mesh.positions[0] = 0.1;
    const prepared = await renderer.prepare(changed);
    TestValidator.predicate(
      "changed position takes a new witness",
      prepared.witnesses[0] !== repeated.witnesses[0],
    );
    const position = (next.children[0] as THREE.Mesh).geometry.getAttribute(
      "position",
    );
    const before = position.getX(0);
    prepared.meshes[0].positions[0] = NaN;
    TestValidator.equals(
      "mutation after preparation refuses publication",
      (() => {
        try {
          renderer.publish(prepared);
          return "published";
        } catch (error) {
          return (error as Error).message;
        }
      })(),
      "Prepared face geometry changed before publication: triangle",
    );
    TestValidator.equals(
      "refusal leaves resident buffer",
      position.getX(0),
      before,
    );
    const malformedNormal = structuredClone(appearance);
    if (malformedNormal.parts[0].geometry.type !== "mesh")
      throw new Error("Expected mesh geometry.");
    malformedNormal.parts[0].geometry.mesh.normals![2] = 0;
    TestValidator.equals(
      "changed normal retakes Float32 admission",
      await renderer
        .prepare(malformedNormal)
        .catch((error: unknown) => (error as Error).message),
      "Portrait GLTF NORMAL values must be unit directions.",
    );
    const malformedUv = structuredClone(appearance);
    if (malformedUv.parts[0].geometry.type !== "mesh")
      throw new Error("Expected mesh geometry.");
    malformedUv.parts[0].geometry.mesh.uvs = [0, 0, 1, 0, NaN, 1];
    TestValidator.equals(
      "changed UV retakes Float32 admission",
      await renderer
        .prepare(malformedUv)
        .catch((error: unknown) => (error as Error).message),
      "Portrait UV0 must remain complete and finite at Float32 precision.",
    );
    const tampered = await renderer.prepare(appearance);
    tampered.model.parts.push(structuredClone(tampered.model.parts[0]));
    TestValidator.equals(
      "part population cannot change after preparation",
      (() => {
        try {
          renderer.publish(tampered);
          return "published";
        } catch (error) {
          return (error as Error).message;
        }
      })(),
      "Prepared face geometry changed before publication: parts",
    );
    tampered.model.parts.pop();
    tampered.witnesses.pop();
    TestValidator.equals(
      "witness population cannot change after preparation",
      (() => {
        try {
          renderer.publish(tampered);
          return "published";
        } catch (error) {
          return (error as Error).message;
        }
      })(),
      "Prepared face geometry changed before publication: parts",
    );
    const optical = structuredClone(appearance);
    optical.materials.find((material) => material.id === "skin")!.thickness =
      0.001;
    TestValidator.equals(
      "new closure obligation rejects an open mesh",
      await renderer.prepare(optical).catch(() => "refused"),
      "refused",
    );
  };
