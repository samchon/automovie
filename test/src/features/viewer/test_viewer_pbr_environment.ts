import { validateModel } from "@automovie/engine";
import type {
  AutoMovieTextureBinding,
  IAutoMovieModel,
  IAutoMovieMaterial,
  IAutoMovieSceneEnvironment,
  IAutoMovieTextureReference,
} from "@automovie/interface";
import { buildGeometry, buildMaterial } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { assertViewerEnvironmentState } from "../internal/assertViewerEnvironmentState";
import { assertViewerEnvironmentTextureOwnership } from "../internal/assertViewerEnvironmentTextureOwnership";
import { assertViewerPbrDeclarationRefusals } from "../internal/assertViewerPbrDeclarationRefusals";
import { createModel } from "../internal/fixtures";
import { namedFacts, nclose } from "../internal/predicates";

const reference: (asset: string, colorSpace: "srgb" | "linear", wrapS: NonNullable<IAutoMovieTextureReference["sampler"]>["wrapS"], minFilter: NonNullable<IAutoMovieTextureReference["sampler"]>["minFilter"]) => IAutoMovieTextureReference = (
  asset: string,
  colorSpace: "srgb" | "linear",
  wrapS: NonNullable<IAutoMovieTextureReference["sampler"]>["wrapS"],
  minFilter: NonNullable<IAutoMovieTextureReference["sampler"]>["minFilter"],
): IAutoMovieTextureReference => ({
  asset,
  texCoord: 0,
  colorSpace,
  transform: {
    offset: { x: 0.25, y: -0.5 },
    scale: { x: 2, y: 3 },
    rotationDeg: 90,
  },
  sampler: {
    wrapS,
    wrapT: "mirror",
    minFilter,
    magFilter: "nearest",
  },
});

const ENVIRONMENT: IAutoMovieSceneEnvironment = {
  image: "studio.hdr",
  background: null,
  intensity: 0.75,
  rotationDeg: 90,
  exposure: 1.25,
  toneMapping: "acesFilmic",
  shadows: { enabled: true, type: "pcfSoft" },
};

const validateMaterial: (patch: Record<string, unknown>) => ReturnType<typeof validateModel> = (patch: Record<string, unknown>): ReturnType<typeof validateModel> => {
  const model: IAutoMovieModel = createModel();
  return validateModel({
    model: {
      ...model,
      materials: [
        {
          ...model.materials[0]!,
          ...patch,
        } as IAutoMovieMaterial,
      ],
    },
  });
};

/**
 * Admitted PBR declarations lower their selected fields into native material and environment state. Separate validation cases refuse malformed declarations; the builder itself is not claimed to enforce that admission boundary.
 *
 * Scenarios:
 *
 * 1. Five maps, UV transform, sampler, alpha coverage and physical lobes lower onto MeshPhysicalMaterial; bare asset IDs, unresolved bindings, absent resolver and omitted alpha/cutoff retain their declared defaults.
 * 2. validateModel refuses malformed bindings, samplers, UV sets, coordinates, transforms and contradictory alpha/transmission at authored paths, while negative normal scale, opaque transmission and legacy opacity blending remain admitted.
 * 3. Generated geometry exposes one UV attribute with the expected CPU-side values.
 * 4. Image lighting mounts environment and background, uses byte-sRGB or float-linear texture metadata and restores structural-pass state; unresolved images fall back to solid or transparent background.
 * 5. Environment, delivery and structural policy precedence installs curve, exposure and shadow settings on the supplied host state and restores them idempotently; no native renderer is started.
 * 6. Declared shadow settings reach the native light's camera and map settings, while absence preserves the no-shadow default.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds physical materials/UV attributes, validates declarations and invokes the existing environment-state/texture-owner helpers; catches dropped map/physical fields, wrong policy precedence and incompatible texture-sharing handoffs.
 * @evidence contracts/testing.md#independent-expectations Literal coefficients, sampler enums, shadow-camera values and scene-versus-delivery precedence define expected projection. Texture versions and dispose events are public CPU-side observations rather than independent upload, PMREM pixel or physical-release proof.
 * @evidence contracts/testing.md#distinguishing-cases Covers complete maps, legacy/missing bindings, mask/blend/default cutoff, malformed combinations, positive one-away twins and existing environment sharing/refusal/recovery cases; generated shaders and current native pixels remain separate obligations.
 * @evidence contracts/testing.md#execution-ownership This named asynchronous unit owns cases delegated to three existing portable helpers and calls maintained source. Supplied renderer fields exercise policy requests without acquiring a browser, GPU renderer or process.
 */
export async function test_viewer_pbr_environment(): Promise<void> {
  const base: IAutoMovieMaterial = createModel().materials[0]!;
  const material: IAutoMovieMaterial = {
    ...base,
    baseColorTexture: reference("base.png", "srgb", "clamp", "nearest"),
    metallicRoughnessTexture: reference(
      "metal.png",
      "linear",
      "repeat",
      "linear",
    ),
    normalTexture: reference(
      "normal.png",
      "linear",
      "mirror",
      "nearestMipmapLinear",
    ),
    normalScale: 0.6,
    occlusionTexture: reference(
      "ao.png",
      "linear",
      "clamp",
      "linearMipmapLinear",
    ),
    occlusionStrength: 0.4,
    emissiveTexture: { asset: "emissive.png", texCoord: 0, colorSpace: "srgb" },
    emissive: null,
    opacity: 0.8,
    alphaMode: "mask",
    alphaCutoff: 0.3,
    doubleSided: true,
    transmission: 0.7,
    ior: 1.4,
    thickness: 0.02,
    clearcoat: 0.5,
  };
  const resolved: string[] = [];
  const built: THREE.MeshPhysicalMaterial = buildMaterial(material, (binding: AutoMovieTextureBinding): THREE.Texture<unknown, THREE.TextureEventMap> => {
    resolved.push(typeof binding === "string" ? binding : binding.asset);
    return new THREE.Texture();
  }) as THREE.MeshPhysicalMaterial;
  TestValidator.equals(
    "every PBR map and physical coefficient reaches Three.js",
    namedFacts([
      ["fiveAssets", (): boolean => resolved.length === 5],
      ["baseSrgb", (): boolean => built.map?.colorSpace === THREE.SRGBColorSpace],
      ["metalShared", (): boolean => built.metalnessMap === built.roughnessMap],
      [
        "normal",
        (): boolean => built.normalMap !== null && nclose(built.normalScale.x, 0.6),
      ],
      ["ao", (): boolean => built.aoMap !== null && nclose(built.aoMapIntensity, 0.4)],
      ["emissive", (): boolean => built.emissiveMap !== null && nclose(built.emissive.r, 1, 0)],
      ["mask", (): boolean => !built.transparent && nclose(built.alphaTest, 0.3)],
      ["maskDepth", (): boolean => built.depthWrite],
      ["double", (): boolean => built.side === THREE.DoubleSide],
      [
        "physical",
        (): boolean =>
          nclose(built.transmission, 0.7) &&
          nclose(built.ior, 1.4) &&
          nclose(built.thickness, 0.02) &&
          nclose(built.clearcoat, 0.5),
      ],
      [
        "transform",
        (): boolean =>
          built.map !== null && nclose(built.map.offset.x, 0.25, 0) &&
          nclose(built.map.repeat.y, 3, 0) &&
          nclose(built.map.rotation, Math.PI / 2),
      ],
      [
        "sampler",
        (): boolean =>
          built.map?.wrapS === THREE.ClampToEdgeWrapping &&
          built.map.wrapT === THREE.MirroredRepeatWrapping &&
          built.map.minFilter === THREE.NearestFilter &&
          built.map.magFilter === THREE.NearestFilter,
      ],
      ["repeat", (): boolean => built.metalnessMap?.wrapS === THREE.RepeatWrapping],
      ["mirror", (): boolean => built.normalMap?.wrapS === THREE.MirroredRepeatWrapping],
      [
        "mipmapNearest",
        (): boolean => built.normalMap?.minFilter === THREE.NearestMipmapLinearFilter,
      ],
      [
        "mipmapLinear",
        (): boolean => built.aoMap?.minFilter === THREE.LinearMipmapLinearFilter,
      ],
    ]),
    {
      fiveAssets: true,
      baseSrgb: true,
      metalShared: true,
      normal: true,
      ao: true,
      emissive: true,
      mask: true,
      maskDepth: true,
      double: true,
      physical: true,
      transform: true,
      sampler: true,
      repeat: true,
      mirror: true,
      mipmapNearest: true,
      mipmapLinear: true,
    },
  );
  const unresolved: THREE.MeshPhysicalMaterial = buildMaterial({ ...base, baseColorTexture: "base.png" });
  TestValidator.equals(
    "legacy material and unresolved texture preserve the no-map path",
    { mapped: unresolved.map !== null, transparent: unresolved.transparent },
    { mapped: false, transparent: false },
  );
  const missing: THREE.MeshPhysicalMaterial = buildMaterial(
    { ...base, baseColorTexture: "missing.png" },
    (): undefined => undefined,
  );
  TestValidator.equals(
    "missing resolver result remains no-map",
    missing.map,
    null,
  );
  const legacyTexture: THREE.MeshPhysicalMaterial = buildMaterial(
    { ...base, baseColorTexture: "legacy.png" },
    (): THREE.Texture<unknown, THREE.TextureEventMap> => new THREE.Texture(),
  );
  TestValidator.equals(
    "legacy base texture derives the slot color space",
    legacyTexture.map?.colorSpace,
    THREE.SRGBColorSpace,
  );
  const emissive: THREE.MeshPhysicalMaterial = buildMaterial({
    ...base,
    emissive: { r: 0.2, g: 0.3, b: 0.4, a: null, hex: null },
  });
  TestValidator.predicate(
    "flat emissive color is preserved",
    nclose(emissive.emissive.g, 0.3),
  );
  const blend: THREE.MeshPhysicalMaterial = buildMaterial({ ...base, opacity: 0.5, alphaMode: "blend" });
  TestValidator.equals(
    "blend mode enables blending without writing opaque depth",
    { transparent: blend.transparent, depthWrite: blend.depthWrite },
    { transparent: true, depthWrite: false },
  );
  const legacyBlend: THREE.MeshPhysicalMaterial = buildMaterial({ ...base, opacity: 0.5 });
  TestValidator.equals(
    "omitted alpha mode preserves legacy opacity blending",
    {
      transparent: legacyBlend.transparent,
      depthWrite: legacyBlend.depthWrite,
    },
    { transparent: true, depthWrite: false },
  );
  const defaultMask: THREE.MeshPhysicalMaterial = buildMaterial({ ...base, alphaMode: "mask" });
  TestValidator.predicate(
    "mask cutoff has a stable default",
    nclose(defaultMask.alphaTest, 0.5, 0),
  );
  const linearMagnification: THREE.MeshPhysicalMaterial = buildMaterial(
    {
      ...base,
      baseColorTexture: {
        asset: "linear-mag.png",
        texCoord: 0,
        colorSpace: "srgb",
        sampler: {
          wrapS: "clamp",
          wrapT: "clamp",
          minFilter: "linear",
          magFilter: "linear",
        },
      },
    },
    (): THREE.Texture<unknown, THREE.TextureEventMap> => new THREE.Texture(),
  );
  TestValidator.equals(
    "linear magnification maps exactly",
    linearMagnification.map?.magFilter,
    THREE.LinearFilter,
  );

  assertViewerPbrDeclarationRefusals(validateMaterial);
  TestValidator.predicate(
    "negative normal scale and opaque transmission are valid",
    validateMaterial({
      normalScale: -1,
      transmission: 0.5,
      emissive: { r: 0.2, g: 0.1, b: 0, a: null, hex: null },
    }).success,
  );
  TestValidator.predicate(
    "omitted alpha mode still derives legacy blend validation",
    validateMaterial({ opacity: 0.5 }).success,
  );

  const geometry: THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap> = buildGeometry({
    type: "mesh",
    mesh: {
      positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
      normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
      uvs: [0, 0, 1, 0, 0, 1],
      indices: [0, 1, 2],
      skin: null,
    },
  });
  const uv: number[] = Array.from(geometry.getAttribute("uv").array);
  const expectedUv: readonly number[] = [0, 0, 1, 0, 0, 1];
  TestValidator.predicate("the authored UV values reach the first channel",
    uv.length === expectedUv.length && uv.every((value: number, index: number): boolean =>
      nclose(value, expectedUv[index]!, 0)));
  TestValidator.equals(
    "one UV attribute is stored, the only set a binding may address",
    [
      geometry.hasAttribute("uv1"),
      built.map?.channel,
      built.aoMap?.channel,
    ],
    [false, 0, 0],
  );

  assertViewerEnvironmentState(ENVIRONMENT);
  await assertViewerEnvironmentTextureOwnership();
}
