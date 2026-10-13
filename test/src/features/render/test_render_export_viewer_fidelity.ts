import { IAutoMovieMaterial, IAutoMovieModel } from "@automovie/interface";
import { exportModelToGLB } from "@automovie/render/node";
import { NodeIO } from "@gltf-transform/core";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

const material = (
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

const model = (over: Partial<IAutoMovieModel>): IAutoMovieModel => ({
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
 * Export fidelity against the LIVE viewer (#1088): what the viewer renders is
 * what the `.glb` must say.
 *
 * Scenarios:
 *
 * 1. Opacity folds into the exported alpha: the viewer renders `material.opacity`
 *    and ignores `baseColor.a`, so `{opacity: 0.5, a: null}` (50% transparent
 *    live) must not export fully opaque. Exported alpha = `(a ?? 1) × opacity`;
 *    an authored `a` multiplies in; a fully opaque material stays alpha 1
 *    (negative twin).
 * 2. A mesh with `normals: null` and indices exports SMOOTH vertex normals, the
 *    same area-weighted accumulation the viewer's `computeVertexNormals`
 *    performs: a flat indexed quad exports (0,0,1) at every referenced vertex,
 *    and an unreferenced vertex keeps the zero normal (no NaN from the
 *    degenerate normalize).
 * 3. Negative twin: a non-indexed soup still omits NORMAL; glTF's mandated flat
 *    shading equals what the viewer computes for a soup.
 * 4. Alpha mode, cutoff and sidedness follow the viewer's material rule: an
 *    authored `mask` exports MASK with its cutoff, or 0.5 when omitted, an
 *    authored `opaque` stays OPAQUE below full opacity, the legacy derivation
 *    still gives BLEND below full opacity, and `doubleSided: true` exports a
 *    double-sided material while the default stays single-sided.
 */
export const test_render_export_viewer_fidelity = async (): Promise<void> => {
  // 1. opacity folds into the one alpha glTF has
  const glb = await exportModelToGLB(
    model({
      materials: [
        material("ghost", 0.5, null),
        material("tinted", 0.5, 0.8),
        material("solid", 1, null),
      ],
    }),
  );
  const doc = await new NodeIO().readBinary(glb);
  const alphas = new Map(
    doc
      .getRoot()
      .listMaterials()
      .map((m) => [m.getName(), m.getBaseColorFactor()[3]]),
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
  const smooth = await exportModelToGLB(
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
  const smoothDoc = await new NodeIO().readBinary(smooth);
  const prim = smoothDoc.getRoot().listMeshes()[0]!.listPrimitives()[0]!;
  const normals = prim.getAttribute("NORMAL");
  if (normals === null) throw new Error("indexed mesh must export NORMAL");
  const array = normals.getArray()!;
  const normalAt = (v: number) => ({
    x: array[v * 3]!,
    y: array[v * 3 + 1]!,
    z: array[v * 3 + 2]!,
  });
  TestValidator.predicate(
    "every referenced vertex carries the smooth +Z normal",
    [0, 1, 2, 3].every((v) => vclose(normalAt(v), { x: 0, y: 0, z: 1 })),
  );
  TestValidator.predicate(
    "an unreferenced vertex keeps the zero normal, never NaN",
    vclose(normalAt(4), { x: 0, y: 0, z: 0 }),
  );

  // 3. negative twin: a non-indexed soup still omits NORMAL
  const soup = await exportModelToGLB(
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
  const soupDoc = await new NodeIO().readBinary(soup);
  TestValidator.equals(
    "a non-indexed soup omits NORMAL (glTF flat = viewer flat)",
    soupDoc
      .getRoot()
      .listMeshes()[0]!
      .listPrimitives()[0]!
      .getAttribute("NORMAL"),
    null,
  );

  // 4. alpha mode, cutoff and sidedness follow the viewer
  const surfaces = await new NodeIO().readBinary(
    await exportModelToGLB(
      model({
        materials: [
          { ...material("cutout", 1, null), alphaMode: "mask", alphaCutoff: 0.3 },
          { ...material("defaultCutout", 1, null), alphaMode: "mask" },
          { ...material("forcedOpaque", 0.5, null), alphaMode: "opaque" },
          material("legacyBlend", 0.5, null),
          { ...material("twoSided", 1, null), doubleSided: true },
          material("oneSided", 1, null),
        ],
      }),
    ),
  );
  const exported = new Map(
    surfaces
      .getRoot()
      .listMaterials()
      .map((m) => [m.getName(), m]),
  );
  TestValidator.equals(
    "alpha mode and sidedness match the viewer's material rule",
    Object.fromEntries(
      [...exported].map(([name, m]) => [
        name,
        { alphaMode: m.getAlphaMode(), doubleSided: m.getDoubleSided() },
      ]),
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
};
