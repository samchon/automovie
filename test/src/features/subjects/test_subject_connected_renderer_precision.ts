import { validateModel } from "@automovie/engine";
import { createHumanFaceBasisBuilder } from "@automovie/human";
import { portraitMeshBuffers } from "@automovie/human/face/mesh/portraitMeshBuffers";
import { createConnectedFaceRenderer } from "@automovie/playground/src/human/connectedRenderer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * A valid double-precision face can lose a triangle in its resident GPU buffer.
 * Scenarios:
 * 1. A translated unit triangle remains valid in doubles but collapses at Float32 precision.
 * 2. Preview preparation refuses the same loss as export before changing active buffers.
 * 3. The same loss refuses before the first resident or any texture request.
 * 4. An adjacent representable translation prepares and a subsequent valid edit recovers.
 */
export const test_subject_connected_renderer_precision =
  async (): Promise<void> => {
    const { basis, document } = humanFaceBasisFixture();
    const model = createHumanFaceBasisBuilder(basis)(document);
    const renderer = createConnectedFaceRenderer({
      loadTexture: async () => new THREE.Texture(),
      maxAnisotropy: 1,
    });
    const first = await renderer.prepare(model);
    renderer.publish(first);
    const position = first.resident.meshes[0].geometry.getAttribute("position");
    const candidate = structuredClone(model);
    const geometry = candidate.parts[0].geometry;
    if (geometry.type !== "mesh")
      throw new Error("Expected resident face geometry.");
    for (let i = 0; i < geometry.mesh.positions.length; i += 3)
      geometry.mesh.positions[i] += 2 ** 25;
    TestValidator.equals(
      "double model is admitted",
      validateModel({ model: candidate }).success,
      true,
    );
    TestValidator.equals(
      "double edge is distinct",
      geometry.mesh.positions[3] - geometry.mesh.positions[0],
      1,
    );
    TestValidator.equals(
      "Float32 edge collapses",
      Math.fround(geometry.mesh.positions[3]) -
        Math.fround(geometry.mesh.positions[0]),
      0,
    );
    TestValidator.predicate(
      "export precision refuses",
      throwsError(
        () => portraitMeshBuffers(geometry.mesh),
        "preserve nonredundant triangle",
      ),
    );
    TestValidator.equals(
      "preview precision refuses",
      await renderer
        .prepare(candidate)
        .then(() => "accepted")
        .catch(() => "refused"),
      "refused",
    );
    TestValidator.equals(
      "refusal preserves active buffer",
      position.getX(1),
      1,
    );
    let textures = 0;
    const fresh = createConnectedFaceRenderer({
      loadTexture: async () => {
        textures++;
        return new THREE.Texture();
      },
      maxAnisotropy: 1,
    });
    const textured = structuredClone(candidate);
    textured.materials[0].baseColorTexture = "resident:texture";
    TestValidator.equals(
      "first preparation also refuses",
      await fresh
        .prepare(textured)
        .catch((error: unknown) => (error as Error).message),
      "Portrait Float32 conversion must preserve nonredundant triangle 0.",
    );
    TestValidator.equals("precision admission precedes resources", textures, 0);
    for (let i = 0; i < geometry.mesh.positions.length; i += 3)
      geometry.mesh.positions[i] -= 2 ** 25 - 2 ** 23;
    const adjacent = await renderer.prepare(candidate);
    TestValidator.equals("preparation remains staged", position.getX(1), 1);
    renderer.publish(adjacent);
    TestValidator.equals(
      "representable edge survives",
      position.getX(1) - position.getX(0),
      1,
    );
    renderer.publish(await renderer.prepare(model));
    TestValidator.equals("valid recovery", position.getX(1), 1);
  };
