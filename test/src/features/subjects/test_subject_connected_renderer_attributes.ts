import {
  createHumanFaceBasisBuilder,
  portraitMeshBuffers,
} from "@automovie/human";
import { createConnectedFaceRenderer } from "@automovie/playground/src/human/connectedRenderer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";

/**
 * Resident attributes must retain finite, aligned GPU representations.
 * Scenarios:
 * 1. Complete UV0 packs identically to the displayed attribute; null stays absent.
 * 2. Incomplete, NaN and finite-double-but-overflowing UV0 refuse before textures.
 * 3. Overflowed positions/normals and zero normals refuse without changing the
 *    active group; the following valid preparation can reuse that group.
 */
export const test_subject_connected_renderer_attributes =
  async (): Promise<void> => {
    const { basis, document } = humanFaceBasisFixture();
    const model = createHumanFaceBasisBuilder(basis)(document);
    const renderer = createConnectedFaceRenderer({
      loadTexture: async () => new THREE.Texture(),
      maxAnisotropy: 1,
    });
    const first = await renderer.prepare(model);
    const group = renderer.publish(first);
    const source = first.meshes[0];
    TestValidator.equals(
      "UV0 packing matches GPU",
      Array.from(portraitMeshBuffers(source).uvs!),
      Array.from(first.resident.meshes[0].geometry.getAttribute("uv").array),
    );
    TestValidator.equals(
      "absent UV0 stays absent",
      portraitMeshBuffers({ ...source, uvs: null }).uvs,
      null,
    );
    for (const uvs of [
      [0, 0],
      [0, 0, 1, 0, 1, NaN],
      [0, 0, 1, 0, 1, 1e100],
    ]) {
      const invalid = structuredClone(model);
      invalid.parts[0].geometry = { type: "mesh", mesh: { ...source, uvs } };
      TestValidator.equals(
        "unrepresentable UV0 refuses",
        await renderer
          .prepare(invalid)
          .catch((error: unknown) => (error as Error).message),
        "Portrait UV0 must remain complete and finite at Float32 precision.",
      );
    }
    for (const [attribute, value] of [
      ["positions", 1e100],
      ["normals", 1e100],
      ["normals", 0],
    ] as const) {
      const invalid = structuredClone(model);
      const geometry = invalid.parts[0].geometry;
      if (geometry.type !== "mesh") throw new Error("Expected resident mesh.");
      geometry.mesh[attribute]![2] = value;
      TestValidator.equals(
        "unrepresentable attribute refuses",
        await renderer
          .prepare(invalid)
          .catch((error: unknown) => (error as Error).message),
        attribute === "normals" && value === 0
          ? "Portrait GLTF NORMAL values must be unit directions."
          : "Portrait Float32 buffers must contain only finite components.",
      );
    }
    TestValidator.predicate(
      "refusals retain resident group",
      renderer.publish(await renderer.prepare(model)) === group,
    );
  };
