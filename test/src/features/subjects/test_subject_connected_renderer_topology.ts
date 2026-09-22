import { validateModel } from "@automovie/engine";
import {
  createHumanFaceBasisBuilder,
  portraitMeshBuffers,
} from "@automovie/human";
import type { IAutoMovieMesh } from "@automovie/interface";
import { createConnectedFaceRenderer } from "@automovie/playground/src/human/connectedRenderer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";

/**
 * Resident Float32 admission checks edge incidence in addition to face area.
 * Parallel planes have unit triangles before and after quantization; at Z=1e5
 * a 1mm separation disappears whereas a 10mm separation remains representable.
 * Scenarios:
 * 1. Separate planes prepare; rounding them onto equally wound edges refuses.
 * 2. A refused reused frame leaves the last positions intact and can recover.
 * 3. Positive optical thickness requires closure; a tetrahedron meets it and
 *    an open triangle refuses, while that triangle with zero thickness prepares.
 */
export const test_subject_connected_renderer_topology =
  async (): Promise<void> => {
    const { basis, document } = humanFaceBasisFixture();
    const model = createHumanFaceBasisBuilder(basis)(document);
    model.parts = [model.parts[0]];
    const geometry = model.parts[0].geometry;
    if (geometry.type !== "mesh") throw new Error("Expected resident mesh.");
    const planes = (gap: number): IAutoMovieMesh => ({
      positions: [
        0,
        0,
        1e5,
        1,
        0,
        1e5,
        0,
        1,
        1e5,
        0,
        0,
        1e5 + gap,
        1,
        0,
        1e5 + gap,
        0,
        1,
        1e5 + gap,
      ],
      indices: [0, 1, 2, 3, 4, 5],
      normals: null,
      uvs: null,
      skin: null,
    });
    geometry.mesh = planes(0.01);
    const renderer = createConnectedFaceRenderer({
      loadTexture: async () => new THREE.Texture(),
      maxAnisotropy: 1,
    });
    const first = await renderer.prepare(model);
    renderer.publish(first);
    const positions =
      first.resident.meshes[0].geometry.getAttribute("position");
    const before = Array.from(positions.array);
    const candidate = structuredClone(model);
    candidate.parts[0].geometry = { type: "mesh", mesh: planes(0.001) };
    TestValidator.equals(
      "source topology valid",
      validateModel({ model: candidate }).success,
      true,
    );
    TestValidator.equals(
      "face areas survive packing",
      portraitMeshBuffers(planes(0.001)).indices.length,
      6,
    );
    TestValidator.equals(
      "coincident equal winding refuses",
      await renderer
        .prepare(candidate)
        .catch((error: unknown) => (error as Error).message),
      "Connected Float32 geometry must preserve its required topology: " +
        model.parts[0].id,
    );
    TestValidator.equals(
      "refusal preserves positions",
      Array.from(positions.array),
      before,
    );
    renderer.publish(await renderer.prepare(model));
    TestValidator.equals(
      "valid recovery preserves planes",
      Array.from(positions.array),
      before,
    );

    const optical = structuredClone(model);
    optical.materials[0].thickness = 0.001;
    const tetrahedron: IAutoMovieMesh = {
      positions: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      indices: [0, 2, 1, 0, 1, 3, 1, 2, 3, 2, 0, 3],
      normals: null,
      uvs: null,
      skin: null,
    };
    optical.parts[0].geometry = { type: "mesh", mesh: tetrahedron };
    const closed = await renderer.prepare(optical);
    renderer.dispose(closed);
    tetrahedron.indices = [0, 2, 1];
    TestValidator.equals(
      "open optical volume refuses",
      await renderer
        .prepare(optical)
        .catch((error: unknown) => (error as Error).message),
      "Connected Float32 geometry must preserve its required topology: " +
        model.parts[0].id,
    );
    optical.materials[0].thickness = 0;
    renderer.dispose(await renderer.prepare(optical));
  };
