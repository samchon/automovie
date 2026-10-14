import { Document, Root, Node, Mesh, Primitive, Material, NodeIO } from "@gltf-transform/core";
import { IAutoMovieBone, IAutoMovieModelPart, IAutoMovieModel, IAutoMovieTransform } from "@automovie/interface";
import { exportModelToGLB } from "../../../../packages/render/src/node/exportModelToGLB";
import { TestValidator } from "@nestia/e2e";
const T: () => IAutoMovieTransform = (): IAutoMovieTransform => ({
  translation: { x: 0, y: 1, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const rejectsError: (task: () => Promise<unknown>, messageIncludes: string) => Promise<boolean> = async (
  task: () => Promise<unknown>,
  messageIncludes: string,
): Promise<boolean> => {
  try {
    await task();
    return false;
  } catch (error: unknown) {
    return error instanceof Error && error.message.includes(messageIncludes);
  }
};

/** A rigged character: skeleton (root + child) + primitive parts + a material. */
const CHARACTER: IAutoMovieModel = {
  id: "char",
  name: "character",
  origin: "generated",
  body: null,
  skeleton: {
    id: "rig",
    bones: [
      { bone: "hips", parent: null, rest: T(), constraint: null },
      { bone: "spine", parent: "hips", rest: T(), constraint: null },
    ],
  },
  materials: [
    {
      id: "skin",
      name: "skin",
      baseColor: { r: 0.8, g: 0.6, b: 0.5, a: null, hex: null },
      metallic: 0,
      roughness: 0.7,
      emissive: null,
      opacity: 1,
      baseColorTexture: null,
    },
  ],
  parts: [
    {
      id: "head",
      name: "head",
      geometry: { type: "primitive", shape: { type: "sphere", radius: 0.12 } },
      material: "skin",
      attachedBone: "hips",
      transform: T(),
    },
    {
      id: "torso",
      name: "torso",
      geometry: {
        type: "primitive",
        shape: { type: "capsule", radius: 0.1, height: 0.4 },
      },
      material: "skin",
      attachedBone: "spine",
      transform: T(),
    },
  ],
  asset: null,
};

/** A skeletonless object: a raw mesh part (no normals/indices), no material. */
const OBJECT: IAutoMovieModel = {
  id: "obj",
  name: null,
  origin: "imported",
  body: null,
  skeleton: null,
  materials: [
    {
      id: "glass",
      name: null,
      baseColor: { r: 0.2, g: 0.4, b: 0.9, a: 0.5, hex: null },
      metallic: 0.1,
      roughness: 0.2,
      emissive: { r: 0.1, g: 0.1, b: 0.1, a: 1, hex: null },
      opacity: 0.5,
      baseColorTexture: null,
    },
  ],
  parts: [
    {
      id: "tri",
      name: null,
      geometry: {
        type: "mesh",
        mesh: {
          positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
          normals: null,
          uvs: null,
          indices: null,
          skin: null,
        },
      },
      material: null,
      attachedBone: null,
      transform: null,
    },
    {
      // A mesh with authored normals and indices supplies the positive twin.
      id: "quad",
      name: null,
      geometry: {
        type: "mesh",
        mesh: {
          positions: [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
          normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
          uvs: null,
          indices: [0, 1, 2, 0, 2, 3],
          skin: null,
        },
      },
      material: null,
      attachedBone: null,
      transform: null,
    },
  ],
  asset: null,
};

/**
 * The AST → glTF binary export (`exportModelToGLB`), the export half of the glTF round-trip. Pins that a model's skeleton becomes a node hierarchy, its parts become mesh nodes (rigid parts parented to their bone), and its materials map onto glTF metallic-roughness, verified by reading the emitted `.glb` back with an independent glTF reader.
 *
 * Scenarios:
 *
 * 1. The bytes are a valid binary glTF: non-empty and prefixed with the `glTF` magic.
 * 2. A rigged character round-trips with one node per bone and part, the child bone under the root, a mesh per part carrying POSITION, NORMAL and indices, and its material attached.
 * 3. A skeletonless object with a raw, non-indexed, norm-less mesh and no material exports the bare positions only (no NORMAL, no indices, no material binding): the negative twin of the character's every branch.
 * 4. The transparent/emissive material on the object becomes a BLEND material with an emissive factor.
 *
 * @evidence contracts/testing.md#behavioral-verification Exports model bytes and independently reads the GLB to observe bone parenting, mesh attributes, material presence and explicit missing-parent, attached-bone and material refusals.
 * @evidence contracts/testing.md#independent-expectations Binary glTF magic and the two-bone/two-part authored graph supply exact header, count and hierarchy expectations; NodeIO is a format reader independent of the model conversion but shares the serializer SDK. Attribute presence does not prove capsule silhouette or pixel fidelity.
 * @evidence contracts/testing.md#distinguishing-cases Rigged primitives contrast with unattached indexed and unindexed meshes; absent normals, indices and material binding remain absent, and transparent emissive material data and three broken references retain their cases.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_export_glb owns its cases. In-memory Node SDK serialization and parsing, without writing a GLB file or starting an external viewer, browser or GPU.
 */
export async function test_render_export_glb(): Promise<void> {
  const io: NodeIO = new NodeIO();

  // 1. valid GLB magic
  const glb: Uint8Array<ArrayBufferLike> = await exportModelToGLB(CHARACTER);
  TestValidator.predicate("glb is non-empty", glb.length > 0);
  TestValidator.equals(
    "glb magic 'glTF'",
    [glb[0], glb[1], glb[2], glb[3]],
    [0x67, 0x6c, 0x54, 0x46],
  );

  // 2. character round-trips with skeleton + parts
  const charDoc: Document = await io.readBinary(glb);
  const charRoot: Root = charDoc.getRoot();
  TestValidator.equals(
    "character node count = bones + parts",
    charRoot.listNodes().length,
    4,
  );
  TestValidator.equals(
    "character mesh per part",
    charRoot.listMeshes().length,
    2,
  );
  TestValidator.equals(
    "character material count",
    charRoot.listMaterials().length,
    1,
  );
  const hips: Node = charRoot.listNodes().find((n: Node): boolean => n.getName() === "hips")!;
  TestValidator.predicate(
    "spine is parented under hips",
    hips.listChildren().some((c: Node): boolean => c.getName() === "spine"),
  );
  const headMesh: Mesh = charRoot.listMeshes().find((m: Mesh): boolean => m.getName() === "head")!;
  const headPrim: Primitive = headMesh.listPrimitives()[0]!;
  TestValidator.predicate(
    "head primitive has POSITION",
    headPrim.getAttribute("POSITION") !== null,
  );
  TestValidator.predicate(
    "head primitive has NORMAL",
    headPrim.getAttribute("NORMAL") !== null,
  );
  TestValidator.predicate(
    "head primitive is indexed",
    headPrim.getIndices() !== null,
  );
  TestValidator.predicate(
    "head primitive has a material",
    headPrim.getMaterial() !== null,
  );

  // 3 & 4. skeletonless object: bare mesh, no material binding, BLEND material
  const objDoc: Document = await io.readBinary(await exportModelToGLB(OBJECT));
  const objRoot: Root = objDoc.getRoot();
  TestValidator.equals(
    "object node count = parts only",
    objRoot.listNodes().length,
    2,
  );
  const triMesh: Mesh = objRoot.listMeshes().find((m: Mesh): boolean => m.getName() === "tri")!;
  const tri: Primitive = triMesh.listPrimitives()[0]!;
  TestValidator.predicate(
    "raw mesh has POSITION",
    tri.getAttribute("POSITION") !== null,
  );
  TestValidator.equals(
    "raw mesh has no NORMAL",
    tri.getAttribute("NORMAL"),
    null,
  );
  TestValidator.equals("raw mesh is non-indexed", tri.getIndices(), null);
  TestValidator.equals("raw mesh has no material", tri.getMaterial(), null);
  const mat: Material = objRoot.listMaterials()[0]!;
  TestValidator.equals(
    "emissive/transparent → BLEND",
    mat.getAlphaMode(),
    "BLEND",
  );
  TestValidator.predicate(
    "emissive factor set",
    mat.getEmissiveFactor()[0] > 0,
  );

  TestValidator.predicate(
    "missing skeleton parent rejects",
    await rejectsError(
      (): Promise<Uint8Array<ArrayBufferLike>> =>
        exportModelToGLB({
          ...CHARACTER,
          skeleton: {
            ...CHARACTER.skeleton!,
            bones: CHARACTER.skeleton!.bones.map((bone: IAutoMovieBone): IAutoMovieBone =>
              bone.bone === "spine" ? { ...bone, parent: "leftHand" } : bone,
            ),
          },
        }),
      'skeleton bone "spine" references missing parent "leftHand"',
    ),
  );

  TestValidator.predicate(
    "missing attached bone rejects",
    await rejectsError(
      (): Promise<Uint8Array<ArrayBufferLike>> =>
        exportModelToGLB({
          ...CHARACTER,
          parts: CHARACTER.parts.map((part: IAutoMovieModelPart): IAutoMovieModelPart =>
            part.id === "head" ? { ...part, attachedBone: "leftHand" } : part,
          ),
        }),
      'part "head" references missing attachedBone "leftHand"',
    ),
  );

  TestValidator.predicate(
    "missing material rejects",
    await rejectsError(
      (): Promise<Uint8Array<ArrayBufferLike>> =>
        exportModelToGLB({
          ...CHARACTER,
          parts: CHARACTER.parts.map((part: IAutoMovieModelPart): IAutoMovieModelPart =>
            part.id === "head" ? { ...part, material: "missing" } : part,
          ),
        }),
      'part "head" references missing material "missing"',
    ),
  );
}
