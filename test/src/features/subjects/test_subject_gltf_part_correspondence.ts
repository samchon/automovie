import { createGltfDocument } from "@automovie/human/common/export/createGltfDocument";
import { readHumanStaticPartCorrespondence } from "@automovie/human/common/export/readHumanStaticPartCorrespondence";
import { exportHumanFace } from "@automovie/human/face/export/exportHumanFace";
import { exportHumanBody } from "@automovie/human/body/export/exportHumanBody";
import { exportHumanPerson } from "@automovie/human/human/export/exportHumanPerson";
import { encodePng } from "@automovie/human/common/mesh/encodePng";
import { WebIO } from "@gltf-transform/core";
import { TestValidator } from "@nestia/e2e";

import { createModel, IDENTITY_TRANSFORM } from "../internal/fixtures";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Source ID binding follows prepared geometry and material order without changing default writer output.
 *
 * Scenarios:
 * 1. Indexed and sequential triangles, a transformed source and a primitive retain independent IDs in interleaved materials.
 * 2. Omitted/undefined/false options and the real face/body/person writers preserve identical legacy bytes and metadata absence.
 * 3. Unknown option fields/types refuse; owned readback does not mutate the primitive.
 */
export async function test_subject_gltf_part_correspondence(): Promise<void> {
  const model = createModel(null);
  const source = model.parts[0];
  const mesh = { positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 2], normals: null, uvs: null, skin: null };
  model.parts = [
    { ...source, id: "indexed", geometry: { type: "mesh", mesh }, transform: { ...IDENTITY_TRANSFORM, translation: { x: 10, y: 20, z: 30 }, rotation: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 }, scale: { x: 2, y: 3, z: 1 } } },
    { ...source, id: "box", material: "second" },
    { ...source, id: "sequential", geometry: { type: "mesh", mesh: { ...mesh, positions: [3, 0, 0, 4, 0, 0, 3, 1, 0], indices: null } } },
  ];
  model.materials.push({ ...model.materials[0], id: "second" }, { ...model.materials[0], id: "unused" });
  const before = JSON.stringify(model);
  const io = new WebIO();
  const plain = await io.writeBinary(createGltfDocument(model));
  for (const options of [undefined, {}, { sourcePartIdentity: undefined }, { sourcePartIdentity: false }])
    TestValidator.equals("default option bytes", Array.from(await io.writeBinary(createGltfDocument(model, options))), Array.from(plain));
  for (const writer of [exportHumanFace, exportHumanBody, exportHumanPerson])
    TestValidator.equals("legacy actual writer bytes", Array.from((await writer(model)).glb), Array.from(plain));
  const defaultPrimitive = (await io.readBinary(plain)).getRoot().listMeshes()[0].listPrimitives()[0];
  TestValidator.equals("legacy namespace absent", readHumanStaticPartCorrespondence(defaultPrimitive), undefined);
  const bound = await io.readBinary(await io.writeBinary(createGltfDocument(model, { sourcePartIdentity: true })));
  const primitives = bound.getRoot().listMeshes().map((one) => one.listPrimitives()[0]);
  TestValidator.equals("unused material does not invent a group", primitives.length, 2);
  const first = readHumanStaticPartCorrespondence(primitives[0])!;
  TestValidator.equals("prepared indexed and sequential populations", first.parts, [
    { id: "indexed", vertexOffset: 0, vertexCount: 3, indexOffset: 0, indexCount: 3 },
    { id: "sequential", vertexOffset: 3, vertexCount: 3, indexOffset: 3, indexCount: 3 },
  ]);
  TestValidator.equals("primitive retains its own source ID", readHumanStaticPartCorrespondence(primitives[1])!.parts.map((one) => one.id), ["box"]);
  const positions = primitives[0].getAttribute("POSITION")!.getArray()!;
  TestValidator.predicate("actual TRS positions", [10, 20, 30, 10, 22, 30, 7, 20, 30].every((value, index) => nclose(positions[index], value)));
  TestValidator.equals("sequential indices are rebased", Array.from(primitives[0].getIndices()!.getArray()!), [0, 1, 2, 3, 4, 5]);
  first.parts[0].id = "changed";
  TestValidator.equals("owned metadata", readHumanStaticPartCorrespondence(primitives[0])!.parts[0].id, "indexed");
  const extra = { sourcePartIdentity: true, unknown: true };
  TestValidator.predicate("unknown opt-in fields refuse", throwsError(() => createGltfDocument(model, extra)));
  for (const options of [null, { sourcePartIdentity: "yes" }])
    TestValidator.predicate("nonboolean opt-in refuses", throwsError(() => createGltfDocument(model, JSON.parse(JSON.stringify(options)))));
  TestValidator.equals("caller model immutable", JSON.stringify(model), before);
  for (const invalid of [
    { ...model, id: " " },
    { ...model, parts: [{ ...model.parts[0], id: " " }] },
    { ...model, parts: [model.parts[0], { ...model.parts[2], id: model.parts[0].id }] },
    { ...model, parts: [{ ...model.parts[0], material: "missing" }] },
  ]) TestValidator.predicate("opt-in never hides invalid source IDs/materials", throwsError(() => createGltfDocument(invalid, { sourcePartIdentity: true })));
  const textured = createModel(null);
  textured.parts[0].geometry = { type: "mesh", mesh: { ...mesh, normals: [0, 0, 1, 0, 0, 1, 0, 0, 1], uvs: [0, 0, 1, 0, 0, 1], colors: [1, 0, 0, 0, 1, 0, 0, 0, 1] } };
  textured.materials[0].baseColorTexture = encodePng({ width: 1, height: 1, rgba: new Uint8Array([255, 64, 32, 255]) });
  const texturePlain = await io.readBinary(await io.writeBinary(createGltfDocument(textured)));
  const textureBound = await io.readBinary(await io.writeBinary(createGltfDocument(textured, { sourcePartIdentity: true })));
  const a = texturePlain.getRoot().listMeshes()[0].listPrimitives()[0];
  const b = textureBound.getRoot().listMeshes()[0].listPrimitives()[0];
  for (const attribute of ["POSITION", "NORMAL", "TEXCOORD_0", "COLOR_0"])
    TestValidator.equals("opt-in preserves every resident attribute", Array.from(b.getAttribute(attribute)!.getArray()!), Array.from(a.getAttribute(attribute)!.getArray()!));
  TestValidator.equals("resident texture bytes preserved", Array.from(textureBound.getRoot().listTextures()[0].getImage()!), Array.from(texturePlain.getRoot().listTextures()[0].getImage()!));
  TestValidator.equals("textured source population", readHumanStaticPartCorrespondence(b)!.parts[0].vertexCount, 3);
}
