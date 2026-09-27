import { encodePortraitPng, exportHumanFace } from "@automovie/human";
import { NodeIO } from "@gltf-transform/core";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../internal/fixtures";
import { throwsError } from "../internal/predicates";

/**
 * A baked occlusion map crosses the portable boundary in its own slot.
 * Scenarios:
 * 1. A UV triangle whose material holds a resident occlusion PNG exports and
 *    reopens with the same PNG bytes, UV0 with clamped sampling, and the
 *    default or authored occlusion strength; no colour or normal map is
 *    invented.
 * 2. An occlusion binding that is not a resident data URI refuses.
 */
export const test_subject_face_occlusion_export = async (): Promise<void> => {
  const model = createModel(null);
  model.parts[0]!.geometry = {
    type: "mesh",
    mesh: {
      positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
      indices: [0, 1, 2],
      normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
      uvs: [0, 0, 1, 0, 0, 1],
      skin: null,
    },
  };
  const uri = encodePortraitPng({
    width: 2,
    height: 2,
    rgba: new Uint8Array([
      255, 255, 255, 255, 128, 128, 128, 255, 64, 64, 64, 255, 0, 0, 0, 255,
    ]),
  });
  model.materials[0]!.occlusionTexture = uri;
  const io = new NodeIO();
  for (const strength of [undefined, 0.5]) {
    model.materials[0]!.occlusionStrength = strength;
    const root = (
      await io.readBinary((await exportHumanFace(model)).glb)
    ).getRoot();
    const material = root.listMaterials()[0]!;
    TestValidator.predicate(
      "occlusion slot",
      material.getOcclusionStrength() === (strength ?? 1) &&
        material.getBaseColorTexture() === null &&
        material.getNormalTexture() === null &&
        Buffer.from(material.getOcclusionTexture()!.getImage()!).equals(
          Buffer.from(uri.slice("data:image/png;base64,".length), "base64"),
        ) &&
        material.getOcclusionTextureInfo()!.getTexCoord() === 0 &&
        material.getOcclusionTextureInfo()!.getWrapS() === 33071 &&
        material.getOcclusionTextureInfo()!.getWrapT() === 33071,
    );
  }
  model.materials[0]!.occlusionTexture = "photo.png";
  TestValidator.predicate(
    "an external occlusion binding refuses",
    await exportHumanFace(model)
      .then(() => false)
      .catch((error: unknown) =>
        throwsError(() => {
          throw error;
        }, "resident PNG or JPEG"),
      ),
  );
};
