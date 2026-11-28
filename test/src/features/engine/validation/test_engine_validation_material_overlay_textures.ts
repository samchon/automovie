import { AutoMovieEngineValidation } from "@automovie/engine";
import {
  IAutoMovieAssetProvenance,
  IAutoMovieMaterial,
  IAutoMovieMaterialOverlay,
  IAutoMovieModel,
  IAutoMovieModelPart,
  type IAutoMovieTextureImageFacts,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../../internal/fixtures";
import { hasViolation } from "../../internal/predicates";

const PRODUCTION: string = "atrium";
const VEINS: string = "public/textures/veins.png";

const facts: (asset: string) => IAutoMovieTextureImageFacts | undefined = (
  asset: string,
): IAutoMovieTextureImageFacts | undefined =>
  asset === VEINS
    ? { mediaType: "image/png", width: 2048, height: 2048 }
    : undefined;

const record: (path: string) => IAutoMovieAssetProvenance = (
  path: string,
): IAutoMovieAssetProvenance => ({
  path,
  digest: `sha256:${"0".repeat(64)}`,
  original: {
    url: "https://example.com/source",
    digest: `sha256:${"0".repeat(64)}`,
  },
  license: { identifier: "CC0-1.0", url: "https://example.com/licence" },
  processing: [],
  uses: [
    {
      production: PRODUCTION,
      consumer: { kind: "material-texture", id: "arm" },
      reason: "surface overlay",
    },
  ],
});

const skin: (
  coordinateSource: "normalized" | "source-uv",
) => IAutoMovieMaterial = (
  coordinateSource: "normalized" | "source-uv",
): IAutoMovieMaterial => ({
  ...createModel().materials[0]!,
  id: "skin",
  overlays: [
    {
      baseColorTexture: {
        asset: VEINS,
        texCoord: 0,
        colorSpace: "srgb",
        coordinateSource,
      },
      blend: "multiply",
      strength: 1,
    },
  ],
});

const part: IAutoMovieModelPart = {
  id: "forearm",
  name: null,
  geometry: {
    type: "mesh",
    mesh: {
      positions: [],
      normals: null,
      uvs: [0, 0, 9, 0, 9, 4, 0, 4],
      indices: null,
      skin: null,
    },
  },
  material: "skin",
  attachedBone: null,
  transform: null,
};

const model: (material: IAutoMovieMaterial) => IAutoMovieModel = (
  material: IAutoMovieMaterial,
): IAutoMovieModel => ({
  ...createModel(),
  id: "arm",
  parts: [part],
  materials: [material],
});

/**
 * Exercise overlay image closure, UV-coordinate scale meaning and overlay
 * factor ranges through the owning validators.
 *
 * Scenarios:
 *
 * 1. A registered overlay image closes and an unregistered one reports its exact
 *    color slot.
 * 2. A normalized nine-by-four UV span is refused while source-uv coordinates
 *    remain exempt.
 * 3. A negative colorFactor channel is refused at its path.
 * 4. A finite nonnegative RGB factor, including zero and a value above one,
 *    remains admitted by the factor contract.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers overlay image closure, normalized versus source-coordinate scale and color factor admission.
 * @evidence contracts/development/testing.md#behavioral-verification Calls validateTextureAssets, validateTextureScale and validateModel on the same typed overlay fixture with separately exchanged image, UV intent or factor.
 * @evidence contracts/development/testing.md#independent-expectations The registered id is available and the alternate id is absent. A nine-by-four measured normalized span exceeds one; source UV makes no such claim. The factor range includes finite zero and values above one but excludes negatives.
 */
export function test_engine_validation_material_overlay_textures(): void {
  const closure: (
    assets: IAutoMovieAssetProvenance[],
  ) => IAutoMovieValidation = (
    assets: IAutoMovieAssetProvenance[],
  ): IAutoMovieValidation =>
    AutoMovieEngineValidation.validateTextureAssets({
      production: PRODUCTION,
      models: [model(skin("source-uv"))],
      scenes: [{ shot: "opening" }],
      assets,
      facts,
    });
  TestValidator.equals(
    "a registered overlay image closes",
    closure([record(VEINS)]).success,
    true,
  );
  TestValidator.predicate(
    "an unregistered overlay image is located at its slot",
    hasViolation(
      closure([]),
      "type",
      "materials[0].overlays[0].baseColorTexture",
    ),
  );

  const measured: IAutoMovieValidation = AutoMovieEngineValidation.validateTextureScale({
    models: [model(skin("normalized"))],
  });
  TestValidator.predicate(
    "a normalized overlay over a larger set is refused at its slot",
    hasViolation(
      measured,
      "type",
      "parts[0].material.overlays[0].baseColorTexture.u",
    ) &&
      measured.success === false &&
      measured.violations[0]!.expected.includes(
        "on overlays[0].baseColorTexture;",
      ),
  );
  TestValidator.equals(
    "a source-uv overlay makes no claim to measure",
    AutoMovieEngineValidation.validateTextureScale({ models: [model(skin("source-uv"))] }).success,
    true,
  );

  const structural: (
    overlays: IAutoMovieMaterialOverlay[],
  ) => IAutoMovieValidation = (
    overlays: IAutoMovieMaterialOverlay[],
  ): IAutoMovieValidation => {
    const base: IAutoMovieModel = createModel();
    return AutoMovieEngineValidation.validateModel({
      model: {
        ...base,
        materials: [{ ...base.materials[0]!, overlays }],
      },
    });
  };
  const validOverlay: IAutoMovieMaterialOverlay = {
    baseColorTexture: VEINS,
    blend: "multiply",
    strength: 1,
  };
  TestValidator.predicate(
    "a negative overlay color factor is refused",
    hasViolation(
      structural([{ ...validOverlay, colorFactor: { r: -1, g: 0, b: 0 } }]),
      "range",
      "$input.materials[0].overlays[0].colorFactor.r",
    ),
  );
  TestValidator.equals(
    "a finite nonnegative overlay color factor remains admitted",
    structural([{ ...validOverlay, colorFactor: { r: 0, g: 1, b: 2 } }])
      .success,
    true,
  );
}
