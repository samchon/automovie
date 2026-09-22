import { createHumanFaceBasisBuilder } from "@automovie/human";
import type { IAutoMovieModel } from "@automovie/interface";
import { createConnectedFaceRenderer } from "@automovie/playground/src/human/connectedRenderer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";

/**
 * A failed resource preparation cannot become a partially textured preview.
 *
 * Scenarios:
 * 1. Rigs, primitives, bone attachments and skin weights refuse resident updates.
 * 2. Failed texture decoding refuses; the next preparation can retry successfully.
 * 3. Failed display preparation releases decoded texture sources.
 */
export const test_subject_connected_renderer_refusal =
  async (): Promise<void> => {
    const { basis, document } = humanFaceBasisFixture();
    const model = createHumanFaceBasisBuilder(basis)(document);
    let broken = false;
    let decoded = 0,
      disposed = 0;
    const loadTexture = async (): Promise<THREE.Texture> => {
      decoded++;
      if (broken) throw new Error("decode failure");
      const texture = new THREE.Texture();
      texture.addEventListener("dispose", () => {
        disposed++;
      });
      return texture;
    };
    const renderer = createConnectedFaceRenderer({
      loadTexture,
      maxAnisotropy: 4,
    });
    const malformed: IAutoMovieModel[] = [];
    const rigged = structuredClone(model);
    rigged.skeleton = { id: "rig", bones: [] };
    malformed.push(rigged);
    const primitive = structuredClone(model);
    primitive.parts[0].geometry = {
      type: "primitive",
      shape: { type: "sphere", radius: 1 },
    };
    malformed.push(primitive);
    const attached = structuredClone(model);
    attached.parts[0].attachedBone = "head";
    malformed.push(attached);
    const skinned = structuredClone(model);
    if (skinned.parts[0].geometry.type !== "mesh")
      throw new Error("Expected analytic mesh.");
    skinned.parts[0].geometry.mesh.skin = {
      joints: [],
      boneIndices: [],
      weights: [],
    };
    malformed.push(skinned);
    for (const invalid of malformed)
      TestValidator.equals(
        "unsupported model refuses",
        await renderer.prepare(invalid).catch(() => "refused"),
        "refused",
      );
    TestValidator.equals("admission precedes resources", decoded, 0);
    model.materials[0].baseColorTexture = "resident:texture";
    broken = true;
    TestValidator.equals(
      "decode refusal",
      await renderer.prepare(model).catch(() => "refused"),
      "refused",
    );
    broken = false;
    const recovery = await renderer.prepare(model);
    TestValidator.equals(
      "resident atlas keeps the glTF UV orientation",
      (recovery.resident.meshes[0].material as THREE.MeshPhysicalMaterial).map!
        .flipY,
      false,
    );
    renderer.dispose(recovery);
    await Promise.resolve();
    await Promise.resolve();
    TestValidator.equals("successful retry released source", disposed, 1);
    const invalidDisplay = createConnectedFaceRenderer({
      loadTexture,
      maxAnisotropy: NaN,
    });
    TestValidator.equals(
      "display preparation refusal",
      await invalidDisplay.prepare(model).catch(() => "refused"),
      "refused",
    );
    TestValidator.equals("failed display releases source", disposed, 2);
  };
