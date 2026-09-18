import { exportHumanFace, portraitGltfExtensions } from "@automovie/human";
import { WebIO } from "@gltf-transform/core";
import type { IOR } from "@gltf-transform/extensions";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../internal/fixtures";
import { nclose } from "../internal/predicates";

/**
 * The face package owns both glTF document creation and serialization so a
 * consumer crosses the module boundary with bytes, not class-instance state.
 *
 * Scenarios:
 * 1. GLB and glTF/resources round-trip a triangle's three actual positions and
 *    its optical material through an independent reader without changing input.
 * 2. Repeated exports are byte-identical for the same model in one runtime.
 * 3. Unsupported texture input rejects before any portable result is returned.
 * 4. Both encodings glTF admits are accepted, and a label the bytes contradict is not.
 */
export const test_subject_human_export = async (): Promise<void> => {
  const model = createModel(null);
  model.parts[0].geometry = {
    type: "mesh",
    mesh: {
      positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
      indices: [0, 1, 2],
      normals: null,
      uvs: null,
      skin: null,
    },
  };
  model.materials[0].ior = 1.376;
  const original = structuredClone(model);
  const exported = await exportHumanFace(model);
  const reader = new WebIO().registerExtensions(portraitGltfExtensions);
  for (const document of [
    await reader.readBinary(exported.glb),
    await reader.readJSON(exported.gltf),
  ]) {
    const primitive = document.getRoot().listMeshes()[0].listPrimitives()[0];
    TestValidator.equals(
      "resident position count",
      primitive.getAttribute("POSITION")!.getCount(),
      3,
    );
    const positions = [0, 1, 2].flatMap((index) =>
      primitive.getAttribute("POSITION")!.getElement(index, [0, 0, 0]),
    );
    TestValidator.predicate(
      "actual metric positions",
      positions.every((value, i) =>
        nclose(value, [0, 0, 0, 1, 0, 0, 0, 1, 0][i]),
      ),
    );
    TestValidator.equals(
      "resident triangle",
      primitive.getIndices()!.getCount(),
      3,
    );
    TestValidator.predicate(
      "optical extension preserved",
      nclose(
        primitive
          .getMaterial()!
          .getExtension<IOR>("KHR_materials_ior")!
          .getIOR(),
        1.376,
      ),
    );
  }
  const repeated = await exportHumanFace(model);
  TestValidator.equals(
    "repeat binary",
    Array.from(repeated.glb),
    Array.from(exported.glb),
  );
  TestValidator.equals("input stays owned by caller", model, original);
  // The two encodings glTF admits, each as its own smallest valid file: a 1x1
  // PNG and a 1x1 JPEG. A photographic skin map is several megabytes lossless
  // and a few hundred kilobytes as JPEG, so refusing one of the two would
  // decide an appearance cannot ship rather than decide anything about format.
  const png =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const jpeg =
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==";
  // A textured group needs its coordinates; the untextured cases above
  // deliberately have none, so the triangle gets them only from here on.
  (model.parts[0].geometry as { mesh: { uvs: number[] | null } }).mesh.uvs = [
    0, 0, 1, 0, 0, 1,
  ];
  for (const [label, binding] of [
    ["png", png],
    ["jpeg", jpeg],
  ] as const) {
    model.materials[0].baseColorTexture = binding;
    const textured = await exportHumanFace(model);
    TestValidator.predicate(
      "an admitted encoding exports: " + label,
      textured.glb.length > 0,
    );
  }
  // The bytes decide, not the label: a JPEG announced as a PNG is a
  // mislabelled image that only fails once somebody looks at the face.
  const refusals: string[] = [];
  for (const binding of [
    "unsupported",
    "data:image/png;base64," + jpeg.slice("data:image/jpeg;base64,".length),
  ]) {
    model.materials[0].baseColorTexture = binding;
    try {
      await exportHumanFace(model);
      refusals.push("accepted");
    } catch (error) {
      refusals.push(error instanceof Error ? error.message : String(error));
    }
  }
  TestValidator.predicate(
    "an unsupported binding names the encodings that are admitted",
    refusals[0].includes("PNG or JPEG data URIs"),
  );
  TestValidator.predicate(
    "bytes that contradict their declared type refuse",
    refusals[1].includes("declared type"),
  );
};
