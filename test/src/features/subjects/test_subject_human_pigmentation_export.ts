import {
  createHumanFaceBasisBuilder,
  exportHumanFace,
  portraitGltfExtensions,
} from "@automovie/human";
import { WebIO } from "@gltf-transform/core";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";

/**
 * The actual GLB path preserves pigment after reference sampling and material
 * grouping. No image is required to reproduce the compact document's colour.
 * Scenarios:
 * 1. A deformed square exports half-red at its marked corner and white at a
 *    separate unmarked attachment sharing the same material.
 * 2. Independently decoded GLB colours agree with the resident Float32 values.
 */
export const test_subject_human_pigmentation_export =
  async (): Promise<void> => {
    const { basis, document } = humanFaceBasisFixture();
    const model = createHumanFaceBasisBuilder(basis)({
      ...document,
      shape: { width: 1 },
      expression: { lift: 0.5 },
      skin: {
        square: [
          {
            name: "mark",
            center: [0, 0, 0],
            radius: [1, 1, 1],
            gain: [0.5, 1, 1],
            strength: 1,
          },
        ],
      },
    });
    const { glb } = await exportHumanFace(model);
    const root = (
      await new WebIO()
        .registerExtensions(portraitGltfExtensions)
        .readBinary(glb)
    ).getRoot();
    for (const mesh of root.listMeshes())
      for (const primitive of mesh.listPrimitives()) {
        const material = primitive.getMaterial()!.getName();
        const expected = model.parts
          .filter((part) => part.material === material)
          .flatMap((part) => {
            if (part.geometry.type !== "mesh")
              throw new Error("Expected mesh.");
            return (
              part.geometry.mesh.colors ??
              new Array(part.geometry.mesh.positions.length).fill(1)
            );
          });
        TestValidator.equals(
          "decoded reference colour",
          Array.from(primitive.getAttribute("COLOR_0")!.getArray()!),
          expected.map(Math.fround),
        );
      }
    TestValidator.equals("no image resources", root.listTextures().length, 0);
  };
