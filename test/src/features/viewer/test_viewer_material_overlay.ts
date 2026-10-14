import { validateModel } from "@automovie/engine";
import type {
  AutoMovieTextureBinding,
  IAutoMovieModel,
  IAutoMovieMaterial,
  IAutoMovieMaterialOverlay,
  IAutoMovieTextureReference,
} from "@automovie/interface";
import {
  DETAIL_NORMAL_TARGET,
  buildMaterial,
  detailNormalFragment,
  materialOverlayFragment,
  materialOverlayVertex,
  materialTextureBindings,
  type IMaterialOverlayShading,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createModel } from "../internal/fixtures";
import { hasViolation, namedFacts, nclose } from "../internal/predicates";

const reference: (asset: string, colorSpace: "srgb" | "linear") => IAutoMovieTextureReference = (
  asset: string,
  colorSpace: "srgb" | "linear",
): IAutoMovieTextureReference => ({
  asset,
  texCoord: 0,
  colorSpace,
  sampler: {
    wrapS: "clamp",
    wrapT: "clamp",
    minFilter: "linearMipmapLinear",
    magFilter: "linear",
  },
});

const VEINS: IAutoMovieMaterialOverlay = {
  baseColorTexture: reference("veins", "srgb"),
  blend: "multiply",
  normalTexture: reference("veins-relief", "linear"),
  normalScale: 0.5,
  strength: 0.4,
};
const NAILS: IAutoMovieMaterialOverlay = {
  baseColorTexture: reference("nails", "srgb"),
  blend: "replace",
  colorFactor: { r: 0.5, g: 0.4, b: 0.3 },
  roughness: 0.25,
  strength: 1,
};

/**
 * Material overlay metadata and generated shader programs preserve the declared blend order and texture roles. The unit observes these products without native shader compilation or composited pixels.
 *
 * Scenarios:
 * 1. Tint/normal and replacement/roughness overlays preserve their images, factors and strengths, image listing order and generated program-key shape after subsurface/detail patches.
 * 2. A normal overlay supplies a flat fallback when no base normal exists; an absent resolver applies no overlay.
 * 3. Generated programs carry transformed UVs and insert color, roughness and tangent-normal operations at their declared boundaries, after an earlier detail patch where applicable.
 * 4. Validation refuses malformed or oversized lists, non-record entries, missing images, unknown blends, invalid factors/strength/roughness/scales and wrong texture color spaces, while admitting the authored pair.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds real overlay materials, reads published texture/factor records and generated shader programs, and validates authored declarations; catches dropped fields, wrong patch order and malformed layers admitted to projection.
 * @evidence contracts/testing.md#independent-expectations Authored scalar factors, multiply-versus-replace composition and native shader-stage boundaries define expected output. Generated shader text is product output but does not establish compiled GLSL or observed colors/normals.
 * @evidence contracts/testing.md#distinguishing-cases Covers ordered layer shapes, optional normal/roughness fields, flat normal fallback, missing resolver and malformed/count-limit declarations with admitted twins; disposal and unsupported shader boundaries have separate cases.
 * @evidence contracts/testing.md#execution-ownership This named portable unit reuses existing generic model data and actual CPU-side Three textures/materials through maintained shader/validator entries, creating no browser, GPU, process or new Human driver.
 */
export function test_viewer_material_overlay(): void {
  const base: IAutoMovieMaterial = createModel().materials[0]!;
  const resolve: (binding: unknown) => THREE.Texture<unknown, THREE.TextureEventMap> = (binding: unknown): THREE.Texture<unknown, THREE.TextureEventMap> => {
    const texture: THREE.Texture<unknown, THREE.TextureEventMap> = new THREE.Texture();
    texture.name =
      typeof binding === "string"
        ? binding
        : (binding as IAutoMovieTextureReference).asset;
    return texture;
  };
  const both: THREE.MeshPhysicalMaterial = buildMaterial(
    {
      ...base,
      subsurfaceRadius: { r: 0.003, g: 0.001, b: 0.0005 },
      normalTexture: reference("relief", "linear"),
      detailNormalTexture: reference("micro", "linear"),
      overlays: [VEINS, NAILS],
    },
    resolve,
  );
  const [veins, nails]: IMaterialOverlayShading[] = both.userData.overlays as IMaterialOverlayShading[];
  TestValidator.predicate(
    "the overlays keep their images and factors",
    veins.color.name === "veins" &&
      veins.normal?.name === "veins-relief" &&
      nclose(veins.normalScale, 0.5, 0) &&
      nclose(veins.strength, 0.4, 0) &&
      veins.roughness === null &&
      nails.color.name === "nails" &&
      nails.normal === null &&
      nails.roughness !== null && nclose(nails.roughness, 0.25, 0) &&
      nclose(nails.colorFactor.g, 0.4, 0) &&
      nclose(veins.colorFactor.r, 1, 0) &&
      nails.blend === "replace",
  );
  TestValidator.equals(
    "the program key names every patch in order",
    both.customProgramCacheKey(),
    "automovie-subsurface+automovie-detail-normal+automovie-overlays-mn.rr",
  );
  TestValidator.equals(
    "the overlays' images follow the material's own",
    materialTextureBindings({
      ...base,
      normalTexture: reference("relief", "linear"),
      overlays: [VEINS, NAILS],
    }).map((binding: AutoMovieTextureBinding): string => (binding as IAutoMovieTextureReference).asset),
    ["relief", "veins", "veins-relief", "nails"],
  );

  const bare: THREE.MeshPhysicalMaterial = buildMaterial({ ...base, overlays: [VEINS] }, resolve);
  const flat: THREE.DataTexture | null = bare.normalMap as THREE.DataTexture | null;
  TestValidator.predicate(
    "an overlay's normal map gives a bare material a flat one",
    flat !== null &&
      flat.image.width === 1 &&
      Array.from(flat.image.data as Uint8Array).join() === "128,128,255,255",
  );
  TestValidator.predicate(
    "without a resolver no overlay is applied",
    buildMaterial({ ...base, overlays: [VEINS] }).userData.overlays ===
      undefined,
  );

  const shapes: readonly [{ readonly blend: "multiply"; readonly roughness: false; readonly normal: true; }, { readonly blend: "replace"; readonly roughness: true; readonly normal: false; }, { readonly blend: "replace"; readonly roughness: false; readonly normal: true; }] = [
    { blend: "multiply", roughness: false, normal: true },
    { blend: "replace", roughness: true, normal: false },
    { blend: "replace", roughness: false, normal: true },
  ] as const;
  const vertex: string = materialOverlayVertex(
    THREE.ShaderLib.physical.vertexShader,
    shapes,
  );
  const fragment: string = materialOverlayFragment(
    detailNormalFragment(THREE.ShaderLib.physical.fragmentShader),
    shapes,
  );
  const after: (text: string, anchor: string) => boolean = (text: string, anchor: string): boolean =>
    fragment.indexOf(text) > fragment.indexOf(anchor);
  TestValidator.equals(
    "the shaders composite each overlay in its place",
    namedFacts([
      [
        "colourUv",
        (): boolean =>
          vertex.includes(
            "vOverlayColorUv0 = ( overlayColorTransform0 * vec3( uv, 1.0 ) ).xy;",
          ) &&
          vertex.includes("vOverlayColorUv1 = ") &&
          vertex.includes("vOverlayNormalUv0 = ") &&
          !vertex.includes("vOverlayNormalUv1 = "),
      ],
      [
        "tint",
        (): boolean =>
          after(
            "diffuseColor.rgb = mix( diffuseColor.rgb, diffuseColor.rgb * overlayColor0.rgb, overlayCover0 );",
            "#include <color_fragment>",
          ),
      ],
      [
        "colourFactor",
        (): boolean =>
          after(
            "overlayColor1.rgb *= overlayColorFactor1;",
            "vec4 overlayColor1 = texture2D(",
          ),
      ],
      [
        "replace",
        (): boolean =>
          fragment.includes(
            "diffuseColor.rgb = mix( diffuseColor.rgb, overlayColor1.rgb, overlayCover1 );",
          ),
      ],
      [
        "roughness",
        (): boolean =>
          after(
            "roughnessFactor = mix( roughnessFactor, overlayRoughness1, overlayCover1 );",
            "#include <roughnessmap_fragment>",
          ),
      ],
      [
        "replacedNormal",
        (): boolean =>
          after(
            "mapN = normalize( mix( mapN, normalize( overlayN2 ), overlayCover2 ) );",
            "mapN = normalize( vec3( mapN.xy + overlayN0.xy",
          ) &&
          !fragment.includes(
            "overlayN2.xy *= overlayNormalScale2 * overlayStrength2",
          ),
      ],
      [
        "slopesAfterDetail",
        (): boolean =>
          after(
            "mapN = normalize( vec3( mapN.xy + overlayN0.xy, mapN.z * overlayN0.z ) );",
            "mapN = normalize( vec3( mapN.xy + detailN.xy",
          ) &&
          fragment.indexOf("overlayN0.xy *= overlayNormalScale0") <
            fragment.indexOf(DETAIL_NORMAL_TARGET),
      ],
    ]),
    {
      colourUv: true,
      tint: true,
      colourFactor: true,
      replace: true,
      roughness: true,
      replacedNormal: true,
      slopesAfterDetail: true,
    },
  );

  const model: IAutoMovieModel = createModel();
  const validate: (overlays: unknown) => ReturnType<typeof validateModel> = (overlays: unknown): ReturnType<typeof validateModel> =>
    validateModel({
      model: {
        ...model,
        materials: [{ ...model.materials[0]!, overlays } as IAutoMovieMaterial],
      },
    });
  TestValidator.equals(
    "overlays are validated",
    namedFacts([
      ["notList", (): boolean => hasViolation(validate("veins"), "type", ".overlays")],
      [
        "tooMany",
        (): boolean =>
          hasViolation(
            validate([VEINS, NAILS, VEINS, NAILS, VEINS]),
            "range",
            ".overlays",
          ),
      ],
      ["notRecord", (): boolean => hasViolation(validate([7]), "type", ".overlays[0]")],
      [
        "noColour",
        (): boolean =>
          hasViolation(
            validate([{ ...NAILS, baseColorTexture: null }]),
            "type",
            ".overlays[0].baseColorTexture",
          ),
      ],
      [
        "blend",
        (): boolean =>
          hasViolation(
            validate([{ ...NAILS, blend: "screen" }]),
            "type",
            ".overlays[0].blend",
          ),
      ],
      [
        "strength",
        (): boolean =>
          hasViolation(
            validate([{ ...NAILS, strength: 1.5 }]),
            "range",
            ".overlays[0].strength",
          ),
      ],
      [
        "roughness",
        (): boolean =>
          hasViolation(
            validate([{ ...NAILS, roughness: -0.1 }]),
            "range",
            ".overlays[0].roughness",
          ),
      ],
      [
        "colourFactor",
        (): boolean =>
          hasViolation(
            validate([{ ...NAILS, colorFactor: { r: 1, g: -1, b: 1 } }]),
            "range",
            ".overlays[0].colorFactor.g",
          ),
      ],
      [
        "normalScale",
        (): boolean =>
          hasViolation(
            validate([{ ...VEINS, normalScale: -1 }]),
            "range",
            ".overlays[0].normalScale",
          ),
      ],
      [
        "normalSpace",
        (): boolean =>
          hasViolation(
            validate([
              { ...VEINS, normalTexture: reference("veins-relief", "srgb") },
            ]),
            "type",
            ".overlays[0].normalTexture.colorSpace",
          ),
      ],
      [
        "colourSpace",
        (): boolean =>
          hasViolation(
            validate([
              { ...NAILS, baseColorTexture: reference("nails", "linear") },
            ]),
            "type",
            ".overlays[0].baseColorTexture.colorSpace",
          ),
      ],
      ["admitted", (): boolean => validate([VEINS, NAILS]).success],
    ]),
    {
      notList: true,
      tooMany: true,
      notRecord: true,
      noColour: true,
      blend: true,
      strength: true,
      roughness: true,
      colourFactor: true,
      normalScale: true,
      normalSpace: true,
      colourSpace: true,
      admitted: true,
    },
  );
}
