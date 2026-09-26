import { validateModel } from "@automovie/engine";
import type {
  IAutoMovieMaterial,
  IAutoMovieTextureReference,
} from "@automovie/interface";
import {
  DETAIL_NORMAL_TARGET,
  buildMaterial,
  detailNormalFragment,
  detailNormalVertex,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createModel } from "../internal/fixtures";
import { hasViolation } from "../internal/predicates";

const reference = (
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
 * A material's detail normal map is blended over its normal map with its own
 * UV transform, or stands in for a missing one.
 *
 * Scenarios:
 * 1. With a normal map and a detail map, the built material keeps the
 *    normal map, carries the detail texture and its scale, and compiles
 *    under the detail program key; with a subsurface radius as well both
 *    patches run, in the order they were added.
 * 2. A detail map alone becomes the normal map at the detail scale, with no
 *    patch.
 * 3. The vertex shader passes the detail map's transformed UV, and the
 *    fragment shader blends its slopes into the tangent-space normal before
 *    the frame turns it (whiteout).
 * 4. Validation reads the detail binding as a linear data map, refusing an
 *    sRGB one, and refuses a negative detail scale while admitting a
 *    nonnegative one.
 */
export const test_viewer_detail_normal = (): void => {
  const base = createModel().materials[0]!;
  const resolve = (binding: unknown) => {
    const texture = new THREE.Texture();
    texture.name =
      typeof binding === "string"
        ? binding
        : (binding as IAutoMovieTextureReference).asset;
    return texture;
  };
  const both = buildMaterial(
    {
      ...base,
      normalTexture: reference("coarse", 1),
      detailNormalTexture: reference("fine", 180),
      detailNormalScale: 0.5,
    },
    resolve,
  );
  TestValidator.predicate(
    "the detail map blends over the normal map",
    both.normalMap?.name === "coarse" &&
      both.userData.detailNormal.texture.name === "fine" &&
      both.userData.detailNormal.scale === 0.5 &&
      both.userData.detailNormal.texture.repeat.x === 180 &&
      both.customProgramCacheKey() === "automovie-detail-normal",
  );
  const translucent = buildMaterial(
    {
      ...base,
      subsurfaceRadius: { r: 0.003, g: 0.001, b: 0.0005 },
      normalTexture: reference("coarse", 1),
      detailNormalTexture: reference("fine", 180),
    },
    resolve,
  );
  TestValidator.equals(
    "both patches run in order",
    translucent.customProgramCacheKey(),
    "automovie-subsurface+automovie-detail-normal",
  );

  const alone = buildMaterial(
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
      Math.abs(alone.normalScale.x - 0.7) < 1e-12 &&
      alone.userData.detailNormal === undefined,
  );

  const vertex = detailNormalVertex(THREE.ShaderLib.physical.vertexShader);
  const fragment = detailNormalFragment(
    THREE.ShaderLib.physical.fragmentShader,
  );
  TestValidator.predicate(
    "the shaders pass the detail UV and blend its slopes",
    vertex.includes(
      "vDetailNormalUv = ( detailNormalTransform * vec3( uv, 1.0 ) ).xy;",
    ) &&
      fragment.includes(
        "mapN = normalize( vec3( mapN.xy + detailN.xy, mapN.z * detailN.z ) );",
      ) &&
      fragment.indexOf("mapN = normalize( vec3( mapN.xy") <
        fragment.indexOf(DETAIL_NORMAL_TARGET),
  );

  const model = createModel();
  const validate = (patch: Partial<IAutoMovieMaterial>) =>
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
      !hasViolation(
        validate({ detailNormalScale: 0.5 }),
        "range",
        ".detailNormalScale",
      ),
  );
};
