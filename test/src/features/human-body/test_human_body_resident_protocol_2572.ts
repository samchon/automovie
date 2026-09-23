import {
  createHumanBodyBasisBuilder,
  serializeHumanBodyBasisDocument,
} from "@automovie/human";
import { packConnectedBodyModel } from "@automovie/playground/src/human/connectedBodyGeometry";
import { connectedBodyTransfers } from "@automovie/playground/src/human/connectedBodyProtocol";
import { createConnectedBodyRuntime } from "@automovie/playground/src/human/connectedBodyRuntime";
import { WebIO } from "@gltf-transform/core";
import {
  KHRMaterialsClearcoat,
  KHRMaterialsIOR,
  KHRMaterialsTransmission,
  KHRMaterialsVolume,
} from "@gltf-transform/extensions";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { rejectsError, throwsError } from "../internal/predicates";

/** One admitted analytic basis supplies transferable previews and explicit exports. */
export const test_human_body_resident_protocol_2572 =
  async (): Promise<void> => {
    const { basis, document } = humanBodyBasisFixture();
    const runtime = createConnectedBodyRuntime(basis);
    const text = serializeHumanBodyBasisDocument(document);
    const first = await runtime({
      operation: "preview",
      document: text,
      measure: false,
    });
    if (first.operation !== "preview") throw new Error("Expected preview.");
    const mesh = first.model.parts[0].geometry.mesh;
    TestValidator.predicate(
      "typed Float32 and Uint32 preview, no encoded file",
      mesh.positions instanceof Float32Array &&
        mesh.indices instanceof Uint32Array &&
        !("glb" in first) &&
        first.crossings === null &&
        Array.isArray(first.extras.bones),
    );
    TestValidator.equals(
      "preview buffers are the transfer list",
      connectedBodyTransfers(first).length,
      3,
    );
    const optional = structuredClone(first);
    optional.model.parts[0].geometry.mesh.normals = null;
    optional.model.parts[0].geometry.mesh.uvs = new Float32Array([0, 0]);
    optional.model.parts[0].geometry.mesh.colors = new Float32Array([1, 1, 1]);
    TestValidator.equals(
      "optional UV and color buffers transfer without a normal",
      connectedBodyTransfers(optional).length,
      4,
    );
    optional.model.parts = [];
    TestValidator.equals(
      "empty preview transfers nothing",
      connectedBodyTransfers(optional).length,
      0,
    );
    const measured = await runtime({
      operation: "preview",
      document: text,
      measure: true,
    });
    TestValidator.predicate(
      "contact check measures without encoding",
      measured.operation === "preview" &&
        Array.isArray(measured.crossings) &&
        !("glb" in measured),
    );
    const exported = await runtime({ operation: "export", document: text });
    if (exported.operation !== "export") throw new Error("Expected export.");
    TestValidator.equals(
      "explicit export carries GLB and transfers only it",
      [
        String.fromCharCode(...exported.glb.subarray(0, 4)),
        connectedBodyTransfers(exported).length,
      ],
      ["glTF", 1],
    );
    const file = await new WebIO()
      .registerExtensions([
        KHRMaterialsClearcoat,
        KHRMaterialsIOR,
        KHRMaterialsTransmission,
        KHRMaterialsVolume,
      ])
      .readBinary(exported.glb);
    const stored = file
      .getRoot()
      .listMeshes()[0]
      .listPrimitives()[0]
      .getAttribute("POSITION")
      ?.getArray();
    TestValidator.predicate(
      "file positions equal the displayed Float32 vertices",
      stored !== undefined &&
        stored.length === mesh.positions.length &&
        Array.from(stored).every(
          (value, index) => value === mesh.positions[index],
        ),
    );
    const primitive = file.getRoot().listMeshes()[0].listPrimitives()[0];
    const savedNormals = primitive.getAttribute("NORMAL")?.getArray();
    const finish = first.model.materials[0];
    TestValidator.predicate(
      "export keeps preview normals and material values",
      savedNormals !== undefined &&
        mesh.normals !== null &&
        Array.from(savedNormals).every(
          (value, index) => value === mesh.normals![index],
        ) &&
        primitive.getMaterial()?.getRoughnessFactor() === finish.roughness &&
        JSON.stringify(primitive.getMaterial()?.getBaseColorFactor()) ===
          JSON.stringify([
            finish.baseColor.r,
            finish.baseColor.g,
            finish.baseColor.b,
            finish.opacity,
          ]),
    );
    const changedDocument = { ...document, shape: { width: 1 } };
    const changed = await runtime({
      operation: "preview",
      document: serializeHumanBodyBasisDocument(changedDocument),
      measure: false,
    });
    TestValidator.predicate(
      "next document changes numerical geometry",
      changed.operation === "preview" &&
        changed.model.parts[0].geometry.mesh.positions[0] !== mesh.positions[0],
    );
    TestValidator.predicate(
      "bad document does not poison the resident evaluator",
      (await rejectsError(() =>
        runtime({ operation: "preview", document: "{}", measure: false }),
      )) &&
        (
          await runtime({
            operation: "preview",
            document: text,
            measure: false,
          })
        ).operation === "preview",
    );
    const built = createHumanBodyBasisBuilder(basis)(document).model;
    const part = built.parts[0];
    if (part.geometry.type !== "mesh")
      throw new Error("Expected fixture mesh.");
    const sourceMesh = part.geometry.mesh;
    const colored = packConnectedBodyModel({
      ...built,
      parts: [
        {
          ...part,
          geometry: {
            type: "mesh",
            mesh: {
              ...sourceMesh,
              colors: new Array<number>(sourceMesh.positions.length).fill(1),
            },
          },
        },
      ],
    });
    TestValidator.predicate(
      "authored vertex colors are Float32 transport attributes",
      colored.parts[0].geometry.mesh.colors instanceof Float32Array,
    );
    const noFinish = packConnectedBodyModel({
      ...built,
      parts: [{ ...part, material: null }],
    });
    TestValidator.equals(
      "unbound material still previews",
      noFinish.parts.length,
      1,
    );
    const optical = {
      ...built,
      materials: built.materials.map((material) => ({
        ...material,
        thickness: 1,
      })),
    };
    TestValidator.predicate(
      "closed optical surface passes while open one refuses",
      packConnectedBodyModel(optical).parts.length === 1 &&
        throwsError(
          () =>
            packConnectedBodyModel({
              ...optical,
              parts: [
                {
                  ...part,
                  geometry: {
                    type: "mesh",
                    mesh: { ...sourceMesh, indices: [0, 1, 2] },
                  },
                },
              ],
            }),
          "topology",
        ),
    );
    TestValidator.predicate(
      "static mesh admission refuses rig, primitive, attachment and skin",
      throwsError(() =>
        packConnectedBodyModel({ ...built, skeleton: {} as never }),
      ) &&
        throwsError(() =>
          packConnectedBodyModel({
            ...built,
            parts: [
              {
                ...part,
                geometry: {
                  type: "primitive",
                  shape: { type: "box", width: 1, height: 1, depth: 1 },
                },
              },
            ],
          }),
        ) &&
        throwsError(() =>
          packConnectedBodyModel({
            ...built,
            parts: [{ ...part, attachedBone: "hips" }],
          }),
        ) &&
        throwsError(() =>
          packConnectedBodyModel({
            ...built,
            parts: [
              {
                ...part,
                geometry: {
                  type: "mesh",
                  mesh: {
                    ...sourceMesh,
                    skin: { joints: [], boneIndices: [], weights: [] },
                  },
                },
              },
            ],
          }),
        ),
    );
  };
