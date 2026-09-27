import {
  bakeHumanFaceOcclusion,
  createHumanFaceBasisBuilder,
  decodePortraitPng,
} from "@automovie/human";
import type {
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanFaceContactFixture } from "../internal/humanFaceContactFixture";
import { throwsError } from "../internal/predicates";

const material = (
  id: string,
  alphaMode?: "opaque" | "mask" | "blend",
): IAutoMovieMaterial => ({
  id,
  name: id,
  baseColor: { r: 1, g: 1, b: 1, a: 1, hex: null },
  roughness: 0.5,
  metallic: 0,
  opacity: 1,
  emissive: null,
  baseColorTexture: null,
  doubleSided: false,
  ...(alphaMode === undefined ? {} : { alphaMode }),
});

/**
 * A unit square in z = `z` facing `facing` (+1 up, -1 down), `half` metres
 * across, its UVs covering [0, `uv`] in both axes.
 */
const square = (
  id: string,
  materialId: string,
  z: number,
  half: number,
  facing: 1 | -1,
  uv: number | null,
): IAutoMovieModelPart => ({
  id,
  name: id,
  material: materialId,
  geometry: {
    type: "mesh",
    mesh: {
      positions: [
        -half,
        -half,
        z,
        half,
        -half,
        z,
        half,
        half,
        z,
        -half,
        half,
        z,
      ],
      normals: [0, 0, facing, 0, 0, facing, 0, 0, facing, 0, 0, facing],
      indices: facing === 1 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2],
      uvs: uv === null ? null : [0, 0, uv, 0, uv, uv, 0, uv],
      skin: null,
    },
  },
  attachedBone: null,
  transform: null,
});

const model = (parts: IAutoMovieModelPart[]): IAutoMovieModel => ({
  id: "m",
  name: "m",
  origin: "imported",
  parts,
  materials: [
    material("floor"),
    material("roof", "opaque"),
    material("veil", "blend"),
    material("bare"),
    material("side"),
    material("raw"),
  ],
  skeleton: null,
  body: null,
  asset: null,
});

/**
 * Ambient occlusion baked from an evaluated model's own geometry.
 * Scenarios:
 * 1. A floor alone sees the whole sky: every texel is 255. A blended veil
 *    above it occludes nothing; a material whose mesh has no UVs receives
 *    no texture, nor does one whose meshes are only partly UV mapped (a
 *    texture binds them all). A lone wall facing +x drawn without indices, and patches
 *    without normals or with zero ones (taken as fully visible), read 255.
 * 2. A wide opaque roof 1 cm above the floor closes most of its sky: the
 *    floor's texels read under a tenth, and the roof receives a texture of
 *    its own; the baking is deterministic and leaves the model as it was.
 * 3. Texels no triangle covers take the mean of filled neighbours for four
 *    rings: with the floor's UVs on a 4 x 4 corner of an 8 x 8 texture, the
 *    texel beside the corner is filled with the floor's value and the far
 *    corner, eight steps away, stays 255.
 * 4. The builder bakes with `occlusion` into the materials it builds and
 *    bakes none without it.
 * 5. A ray count or size that is not a positive integer refuses.
 */
export const test_subject_human_face_occlusion = (): void => {
  const value = (uri: string, x: number, y: number, size: number) =>
    decodePortraitPng(uri).rgba[4 * (y * size + x)]!;
  const alone = bakeHumanFaceOcclusion(
    model([
      square("floor", "floor", 0, 0.05, 1, 1),
      square("veil", "veil", 0.01, 1, -1, 1),
      square("bare", "bare", -1, 0.05, 1, null),
    ]),
    { rays: 16, size: 8 },
  );
  // A wall facing +x, drawn without indices, and a patch without normals.
  const wall: IAutoMovieModelPart = {
    ...square("side", "side", 0, 0.05, 1, 1),
    geometry: {
      type: "mesh",
      mesh: {
        positions: [2, -0.05, 0, 2, 0.05, 0, 2, 0.05, 0.1],
        normals: [1, 0, 0, 1, 0, 0, 1, 0, 0],
        indices: null,
        uvs: [0, 0, 1, 0, 1, 1],
        skin: null,
      },
    },
  };
  const raw: IAutoMovieModelPart = {
    ...square("raw", "raw", -3, 0.05, 1, 1),
    geometry: {
      type: "mesh",
      mesh: {
        positions: [-3, 0, 0, -2.9, 0, 0, -2.9, 0.1, 0],
        normals: null,
        indices: [0, 1, 2],
        uvs: [0, 0, 1, 0, 1, 1],
        skin: null,
      },
    },
  };
  const flat: IAutoMovieModelPart = {
    ...raw,
    id: "flat",
    geometry: {
      type: "mesh",
      mesh: {
        positions: [-3, 0.2, 0, -2.9, 0.2, 0, -2.9, 0.3, 0],
        normals: [0, 0, 0, 0, 0, 0, 0, 0, 0],
        indices: [0, 1, 2],
        uvs: [0, 0, 1, 0, 1, 1],
        skin: null,
      },
    },
  };
  const loose = bakeHumanFaceOcclusion(
    model([square("floor", "floor", 0, 0.05, 1, 1), wall, raw, flat]),
    { rays: 16, size: 8 },
  );
  const mixed = bakeHumanFaceOcclusion(
    model([
      square("floor", "floor", 0, 0.05, 1, 1),
      square("under", "floor", -1, 0.05, 1, null),
    ]),
    { rays: 4, size: 4 },
  );
  const open = decodePortraitPng(alone.get("floor")!);
  TestValidator.predicate(
    "an open floor",
    open.rgba.every((byte, k) => k % 4 === 3 || byte === 255) &&
      !alone.has("veil") &&
      !alone.has("bare") &&
      !mixed.has("floor") &&
      value(loose.get("side")!, 6, 5, 8) === 255 &&
      value(loose.get("raw")!, 6, 5, 8) === 255,
  );
  const roofed = model([
    square("floor", "floor", 0, 0.05, 1, 1),
    square("roof", "roof", 0.01, 1, -1, 1),
  ]);
  const before = JSON.stringify(roofed);
  const closed = bakeHumanFaceOcclusion(roofed, { rays: 16, size: 8 });
  const again = bakeHumanFaceOcclusion(roofed, { rays: 16, size: 8 });
  TestValidator.predicate(
    "a roofed floor",
    value(closed.get("floor")!, 4, 4, 8) < 26 &&
      closed.has("roof") &&
      closed.get("floor") === again.get("floor") &&
      JSON.stringify(roofed) === before,
  );
  const corner = bakeHumanFaceOcclusion(
    model([
      square("floor", "floor", 0, 0.05, 1, 0.5),
      square("roof", "roof", 0.01, 1, -1, null),
    ]),
    { rays: 16, size: 8 },
  ).get("floor")!;
  // UV v = 0 is the image's bottom row: the floor fills rows 4 to 7,
  // columns 0 to 3.
  TestValidator.predicate(
    "seam filling",
    value(corner, 1, 6, 8) < 26 &&
      value(corner, 4, 6, 8) === value(corner, 3, 6, 8) &&
      value(corner, 7, 0, 8) === 255,
  );
  const { basis, document } = humanFaceContactFixture();
  const region = basis.surfaces[0]!.regions[0]!;
  for (const surface of basis.surfaces)
    for (const one of surface.regions)
      if (one.material === region.material)
        one.uvs = one.indices.flatMap(() => [0.5, 0.5]);
  const baked = createHumanFaceBasisBuilder(basis, {
    occlusion: { rays: 4, size: 4 },
  })(document);
  const plain = createHumanFaceBasisBuilder(basis)(document);
  TestValidator.predicate(
    "the builder's option",
    baked.materials.some(
      (one) =>
        one.id === region.material && typeof one.occlusionTexture === "string",
    ) && plain.materials.every((one) => !one.occlusionTexture),
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => bakeHumanFaceOcclusion(roofed, { rays: 0, size: 8 }),
      "positive integer",
    ) &&
      throwsError(
        () => bakeHumanFaceOcclusion(roofed, { rays: 4, size: 2.5 }),
        "positive integer",
      ),
  );
};
