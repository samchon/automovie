import { validateModel } from "@automovie/engine";
import type {
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
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createModel } from "../internal/fixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

const reference = (
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
 * A material's overlays composite over it in order, each where its colour
 * image covers.
 *
 * Scenarios:
 * 1. Built with a tinting overlay carrying a normal map and a replacing one
 *    carrying a roughness, the material keeps both with their images,
 *    factors and strengths, lists their images after its own, and compiles
 *    under a program key naming each overlay's shape after the subsurface
 *    and detail patches.
 * 2. An overlay's normal map on a material without one gives it a flat
 *    one-texel normal map; without a texture resolver no overlay is applied.
 * 3. The vertex shader passes each image's transformed UV. The fragment
 *    shader tints or replaces the colour after the vertex colours, moves the
 *    roughness after the roughness map, and, before the frame turns the
 *    normal and after the detail blend when that patch ran first, adds a
 *    tint's slopes and replaces the normal by a replacing layer's coverage.
 * 4. Validation refuses a list that is not one or holds more than four, a
 *    negative colour factor, an
 *    entry that is not a record, a missing colour image, an unknown blend, a
 *    strength or roughness outside [0, 1], a negative normal scale, an sRGB
 *    normal map and a linear colour image, and admits the two overlays.
 */
export const test_viewer_material_overlay = (): void => {
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
      subsurfaceRadius: { r: 0.003, g: 0.001, b: 0.0005 },
      normalTexture: reference("relief", "linear"),
      detailNormalTexture: reference("micro", "linear"),
      overlays: [VEINS, NAILS],
    },
    resolve,
  );
  const [veins, nails] = both.userData.overlays;
  TestValidator.predicate(
    "the overlays keep their images and factors",
    veins.color.name === "veins" &&
      veins.normal.name === "veins-relief" &&
      veins.normalScale === 0.5 &&
      veins.strength === 0.4 &&
      veins.roughness === null &&
      nails.color.name === "nails" &&
      nails.normal === null &&
      nails.roughness === 0.25 &&
      nails.colorFactor.g === 0.4 &&
      veins.colorFactor.r === 1 &&
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
    }).map((binding) => (binding as IAutoMovieTextureReference).asset),
    ["relief", "veins", "veins-relief", "nails"],
  );

  const bare = buildMaterial({ ...base, overlays: [VEINS] }, resolve);
  const flat = bare.normalMap as THREE.DataTexture | null;
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

  const shapes = [
    { blend: "multiply", roughness: false, normal: true },
    { blend: "replace", roughness: true, normal: false },
    { blend: "replace", roughness: false, normal: true },
  ] as const;
  const vertex = materialOverlayVertex(
    THREE.ShaderLib.physical.vertexShader,
    shapes,
  );
  const fragment = materialOverlayFragment(
    detailNormalFragment(THREE.ShaderLib.physical.fragmentShader),
    shapes,
  );
  const after = (text: string, anchor: string): boolean =>
    fragment.indexOf(text) > fragment.indexOf(anchor);
  TestValidator.equals(
    "the shaders composite each overlay in its place",
    namedFacts([
      [
        "colourUv",
        () =>
          vertex.includes(
            "vOverlayColorUv0 = ( overlayColorTransform0 * vec3( uv, 1.0 ) ).xy;",
          ) &&
          vertex.includes("vOverlayColorUv1 = ") &&
          vertex.includes("vOverlayNormalUv0 = ") &&
          !vertex.includes("vOverlayNormalUv1 = "),
      ],
      [
        "tint",
        () =>
          after(
            "diffuseColor.rgb = mix( diffuseColor.rgb, diffuseColor.rgb * overlayColor0.rgb, overlayCover0 );",
            "#include <color_fragment>",
          ),
      ],
      [
        "colourFactor",
        () =>
          after(
            "overlayColor1.rgb *= overlayColorFactor1;",
            "vec4 overlayColor1 = texture2D(",
          ),
      ],
      [
        "replace",
        () =>
          fragment.includes(
            "diffuseColor.rgb = mix( diffuseColor.rgb, overlayColor1.rgb, overlayCover1 );",
          ),
      ],
      [
        "roughness",
        () =>
          after(
            "roughnessFactor = mix( roughnessFactor, overlayRoughness1, overlayCover1 );",
            "#include <roughnessmap_fragment>",
          ),
      ],
      [
        "replacedNormal",
        () =>
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
        () =>
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

  const model = createModel();
  const validate = (overlays: unknown) =>
    validateModel({
      model: {
        ...model,
        materials: [{ ...model.materials[0]!, overlays } as IAutoMovieMaterial],
      },
    });
  TestValidator.equals(
    "overlays are validated",
    namedFacts([
      ["notList", () => hasViolation(validate("veins"), "type", ".overlays")],
      [
        "tooMany",
        () =>
          hasViolation(
            validate([VEINS, NAILS, VEINS, NAILS, VEINS]),
            "range",
            ".overlays",
          ),
      ],
      ["notRecord", () => hasViolation(validate([7]), "type", ".overlays[0]")],
      [
        "noColour",
        () =>
          hasViolation(
            validate([{ ...NAILS, baseColorTexture: null }]),
            "type",
            ".overlays[0].baseColorTexture",
          ),
      ],
      [
        "blend",
        () =>
          hasViolation(
            validate([{ ...NAILS, blend: "screen" }]),
            "type",
            ".overlays[0].blend",
          ),
      ],
      [
        "strength",
        () =>
          hasViolation(
            validate([{ ...NAILS, strength: 1.5 }]),
            "range",
            ".overlays[0].strength",
          ),
      ],
      [
        "roughness",
        () =>
          hasViolation(
            validate([{ ...NAILS, roughness: -0.1 }]),
            "range",
            ".overlays[0].roughness",
          ),
      ],
      [
        "colourFactor",
        () =>
          hasViolation(
            validate([{ ...NAILS, colorFactor: { r: 1, g: -1, b: 1 } }]),
            "range",
            ".overlays[0].colorFactor.g",
          ),
      ],
      [
        "normalScale",
        () =>
          hasViolation(
            validate([{ ...VEINS, normalScale: -1 }]),
            "range",
            ".overlays[0].normalScale",
          ),
      ],
      [
        "normalSpace",
        () =>
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
        () =>
          hasViolation(
            validate([
              { ...NAILS, baseColorTexture: reference("nails", "linear") },
            ]),
            "type",
            ".overlays[0].baseColorTexture.colorSpace",
          ),
      ],
      ["admitted", () => validate([VEINS, NAILS]).success],
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
};
