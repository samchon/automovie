import { validateModel } from "@automovie/engine";
import type {
  AutoMovieTextureBinding,
  IAutoMovieMaterial,
  IAutoMovieTextureReference,
} from "@automovie/interface";
import { buildMaterial } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createModel } from "../../../internal/fixtures";
import { hasViolation, nclose } from "../../../internal/predicates";

const reference: (
  asset: string,
  repeat: number,
) => IAutoMovieTextureReference = (
  asset: string,
  repeat: number,
): IAutoMovieTextureReference => ({
  asset,
  texCoord: 0,
  colorSpace: "linear",
  transform: {
    offset: { x: 0, y: 0 },
    scale: { x: repeat, y: repeat },
    rotationDeg: 0,
  },
  sampler: {
    wrapS: "repeat",
    wrapT: "repeat",
    minFilter: "linearMipmapLinear",
    magFilter: "linear",
  },
});

/**
 * Material construction registers a detail normal map with its own UV transform
 * or uses it as the normal-map fallback; these cases observe registration
 * metadata.
 *
 * Scenarios:
 *
 * 1. With a normal map and a detail map, the built material keeps the normal map,
 *    carries the detail texture and its scale, and exposes the detail program
 *    key; subsurface and detail registrations contribute ordered cache-key
 *    components. No shader compilation is performed here.
 * 2. A detail map alone becomes the normal map at the detail scale, with no patch.
 * 3. Validation reads the detail binding as a linear data map, refusing an sRGB
 *    one, and refuses a negative detail scale while admitting a nonnegative
 *    one.
 */
export function test_unit_render_scene_build_material_detail_normal(): void {
  const base: IAutoMovieMaterial = createModel().materials[0]!;
  const resolve: (binding: AutoMovieTextureBinding) => THREE.Texture = (
    binding: AutoMovieTextureBinding,
  ): THREE.Texture => {
    const texture: THREE.Texture = new THREE.Texture();
    texture.name = typeof binding === "string" ? binding : binding.asset;
    return texture;
  };
  const both: THREE.MeshPhysicalMaterial = buildMaterial(
    {
      ...base,
      normalTexture: reference("coarse", 1),
      detailNormalTexture: reference("fine", 180),
      detailNormalScale: 0.5,
    },
    resolve,
  );
  TestValidator.predicate(
    "the material retains the base map and registers the detail binding",
    both.normalMap?.name === "coarse" &&
      both.userData.detailNormal.texture.name === "fine" &&
      nclose(both.userData.detailNormal.scale, 0.5, 0) &&
      nclose(both.userData.detailNormal.texture.repeat.x, 180, 0) &&
      both.customProgramCacheKey() === "automovie-detail-normal",
  );
  const translucent: THREE.MeshPhysicalMaterial = buildMaterial(
    {
      ...base,
      subsurfaceRadius: { r: 0.003, g: 0.001, b: 0.0005 },
      normalTexture: reference("coarse", 1),
      detailNormalTexture: reference("fine", 180),
    },
    resolve,
  );
  TestValidator.equals(
    "both registrations contribute ordered cache keys",
    translucent.customProgramCacheKey(),
    "automovie-subsurface+automovie-detail-normal",
  );

  const alone: THREE.MeshPhysicalMaterial = buildMaterial(
    {
      ...base,
      detailNormalTexture: reference("fine", 180),
      detailNormalScale: 0.7,
    },
    resolve,
  );
  TestValidator.predicate(
    "a detail map alone stands in as the normal map",
    alone.normalMap?.name === "fine" &&
      nclose(alone.normalScale.x, 0.7) &&
      alone.userData.detailNormal === undefined,
  );

  const model: ReturnType<typeof createModel> = createModel();
  const validate: (
    patch: Partial<IAutoMovieMaterial>,
  ) => ReturnType<typeof validateModel> = (
    patch: Partial<IAutoMovieMaterial>,
  ): ReturnType<typeof validateModel> =>
    validateModel({
      model: {
        ...model,
        materials: [{ ...model.materials[0]!, ...patch } as IAutoMovieMaterial],
      },
    });
  TestValidator.predicate(
    "the detail binding and scale are validated",
    hasViolation(
      validate({
        detailNormalTexture: { ...reference("fine", 180), colorSpace: "srgb" },
      }),
      "type",
      ".detailNormalTexture.colorSpace",
    ) &&
      hasViolation(
        validate({ detailNormalScale: -1 }),
        "range",
        ".detailNormalScale",
      ) &&
      validate({ detailNormalScale: 0.5 }).success,
  );
}
