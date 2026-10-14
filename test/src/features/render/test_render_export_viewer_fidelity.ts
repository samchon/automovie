import {
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  Accessor,
  Document,
  GLTF,
  Material,
  NodeIO,
  Primitive,
  TypedArray,
} from "@gltf-transform/core";
import { TestValidator } from "@nestia/e2e";

import { exportModelToGLB } from "../../../../packages/render/src/node/exportModelToGLB";
import { nclose, vclose } from "../internal/predicates";

const material: (
  id: string,
  opacity: number,
  a: number | null,
) => IAutoMovieMaterial = (
  id: string,
  opacity: number,
  a: number | null,
): IAutoMovieMaterial => ({
  id,
  name: null,
  baseColor: { r: 0.2, g: 0.4, b: 0.9, a, hex: null },
  metallic: 0,
  roughness: 0.5,
  emissive: null,
  opacity,
  baseColorTexture: null,
});

const model: (over: Partial<IAutoMovieModel>) => IAutoMovieModel = (
  over: Partial<IAutoMovieModel>,
): IAutoMovieModel => ({
  id: "fidelity",
  name: null,
  origin: "generated",
  body: null,
  skeleton: null,
  materials: [],
  parts: [],
  asset: null,
  ...over,
});

/**
 * Static GLB material and normal conversion at the represented export fields; no live-viewer appearance is observed.
 *
 * Scenarios:
 *
 * 1. Opacity folds into the exported alpha: the export multiplies authored alpha and `material.opacity`, so `{opacity: 0.5, a: null}` (declared half opacity) must not export fully opaque. Exported alpha = `(a ?? 1) × opacity`; an authored `a` multiplies in; a fully opaque material stays alpha 1 (negative twin).
 * 2. A mesh with `normals: null` and indices exports smooth vertex normals, observed on the authored planar case: a flat indexed quad exports (0,0,1) at every referenced vertex, and an unreferenced vertex keeps the zero normal (no NaN from the degenerate normalize).
 * 3. Negative twin: a non-indexed soup still omits NORMAL; the assertion checks the absent attribute and does not compare the resulting shading.
 * 4. Alpha mode, cutoff and sidedness follow the represented export contract: an authored `mask` exports MASK with its cutoff, or 0.5 when omitted, an authored `opaque` stays OPAQUE below full opacity, the legacy derivation still gives BLEND below full opacity, and `doubleSided: true` exports a double-sided material while the default stays single-sided.
 *
 * @evidence contracts/testing.md#behavioral-verification Parses exported material alpha, cutoff and sidedness and indexed smooth normals, detecting omitted opacity or incorrect normal generation without claiming full viewer equivalence.
 * @evidence contracts/testing.md#independent-expectations Alpha follows the export contract (a or 1) times opacity; the current viewer uses opacity alone, so the authored-alpha case pins an acknowledged difference. A planar indexed quad independently has +Z normals and an unreferenced vertex has zero normal; NodeIO shares the export SDK, and no rendered pixels are compared.
 * @evidence contracts/testing.md#distinguishing-cases Null and authored alpha, opaque and masked defaults, sidedness, indexed flat geometry, an unreferenced vertex and unindexed soup distinguish the represented fields. Textures, skin, curved normal weighting and visual appearance are outside these assertions.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_export_viewer_fidelity owns its cases. Portable SDK byte parsing and numeric assertions, despite the historical fidelity name; no viewer, browser or GPU is started.
 */
export async function test_render_export_viewer_fidelity(): Promise<void> {
  // 1. opacity folds into the one alpha glTF has
  const glb: Uint8Array<ArrayBufferLike> = await exportModelToGLB(
    model({
      materials: [
        material("ghost", 0.5, null),
        material("tinted", 0.5, 0.8),
        material("solid", 1, null),
      ],
    }),
  );
  const doc: Document = await new NodeIO().readBinary(glb);
  const alphas: Map<string, number> = new Map(
    doc
      .getRoot()
      .listMaterials()
      .map((m: Material): [string, number] => [
        m.getName(),
        m.getBaseColorFactor()[3],
      ]),
  );
  TestValidator.predicate(
    "a null-alpha translucent material exports its opacity",
    nclose(alphas.get("ghost")!, 0.5),
  );
  TestValidator.predicate(
    "an authored alpha multiplies with opacity",
    nclose(alphas.get("tinted")!, 0.4),
  );
  TestValidator.predicate(
    "a fully opaque material keeps alpha 1",
    nclose(alphas.get("solid")!, 1),
  );

  // 2. indexed mesh without authored normals exports smooth vertex normals
  const smooth: Uint8Array<ArrayBufferLike> = await exportModelToGLB(
    model({
      parts: [
        {
          id: "quad",
          name: "quad",
          geometry: {
            type: "mesh",
            mesh: {
              // a flat quad plus one unreferenced vertex (the zero-area case)
              positions: [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 9, 9, 9],
              normals: null,
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
    }),
  );
  const smoothDoc: Document = await new NodeIO().readBinary(smooth);
  const prim: Primitive = smoothDoc
    .getRoot()
    .listMeshes()[0]!
    .listPrimitives()[0]!;
  const normals: Accessor | null = prim.getAttribute("NORMAL");
  if (normals === null) throw new Error("indexed mesh must export NORMAL");
  const array: TypedArray = normals.getArray()!;
  const normalAt: (v: number) => IAutoMovieVector3 = (
    v: number,
  ): IAutoMovieVector3 => ({
    x: array[v * 3]!,
    y: array[v * 3 + 1]!,
    z: array[v * 3 + 2]!,
  });
  TestValidator.predicate(
    "every referenced vertex carries the smooth +Z normal",
    [0, 1, 2, 3].every((v: number): boolean =>
      vclose(normalAt(v), { x: 0, y: 0, z: 1 }),
    ),
  );
  TestValidator.predicate(
    "an unreferenced vertex keeps the zero normal, never NaN",
    vclose(normalAt(4), { x: 0, y: 0, z: 0 }),
  );

  // 3. negative twin: a non-indexed soup still omits NORMAL
  const soup: Uint8Array<ArrayBufferLike> = await exportModelToGLB(
    model({
      parts: [
        {
          id: "tri",
          name: "tri",
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
      ],
    }),
  );
  const soupDoc: Document = await new NodeIO().readBinary(soup);
  TestValidator.equals(
    "a non-indexed soup omits NORMAL (glTF flat = viewer flat)",
    soupDoc
      .getRoot()
      .listMeshes()[0]!
      .listPrimitives()[0]!
      .getAttribute("NORMAL"),
    null,
  );

  // 4. Observe exported alpha mode, cutoff and sidedness fields.
  const surfaces: Document = await new NodeIO().readBinary(
    await exportModelToGLB(
      model({
        materials: [
          {
            ...material("cutout", 1, null),
            alphaMode: "mask",
            alphaCutoff: 0.3,
          },
          { ...material("defaultCutout", 1, null), alphaMode: "mask" },
          { ...material("forcedOpaque", 0.5, null), alphaMode: "opaque" },
          material("legacyBlend", 0.5, null),
          { ...material("twoSided", 1, null), doubleSided: true },
          material("oneSided", 1, null),
        ],
      }),
    ),
  );
  const exported: Map<string, Material> = new Map(
    surfaces
      .getRoot()
      .listMaterials()
      .map((m: Material): [string, Material] => [m.getName(), m]),
  );
  TestValidator.equals(
    "alpha mode and sidedness match the viewer's material rule",
    Object.fromEntries(
      [...exported].map(
        ([name, m]: [string, Material]): [
          string,
          { alphaMode: GLTF.MaterialAlphaMode; doubleSided: boolean },
        ] => [
          name,
          { alphaMode: m.getAlphaMode(), doubleSided: m.getDoubleSided() },
        ],
      ),
    ),
    {
      cutout: { alphaMode: "MASK", doubleSided: false },
      defaultCutout: { alphaMode: "MASK", doubleSided: false },
      forcedOpaque: { alphaMode: "OPAQUE", doubleSided: false },
      legacyBlend: { alphaMode: "BLEND", doubleSided: false },
      twoSided: { alphaMode: "OPAQUE", doubleSided: true },
      oneSided: { alphaMode: "OPAQUE", doubleSided: false },
    },
  );
  TestValidator.predicate(
    "an authored mask cutoff is exported",
    nclose(exported.get("cutout")!.getAlphaCutoff(), 0.3),
  );
  TestValidator.predicate(
    "an omitted mask cutoff exports the viewer's 0.5",
    nclose(exported.get("defaultCutout")!.getAlphaCutoff(), 0.5),
  );
}
