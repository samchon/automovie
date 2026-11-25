import {
  validateModel,
  validateTextureAssets,
  validateTextureScale,
} from "@automovie/engine";
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

import { createModel } from "../../../internal/fixtures";
import { hasViolation } from "../../../internal/predicates";

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
 * Exercise overlay image closure, UV-coordinate scale meaning and overlay factor ranges through the owning validators.
 *
 * Scenarios:
 * 1. A registered overlay image closes and an unregistered one reports its exact color slot.
 * 2. A normalized nine-by-four UV span is refused while source-uv coordinates remain exempt.
 * 3. A negative colorFactor channel is refused at its path.
 * 4. A finite nonnegative RGB factor, including zero and a value above one, remains admitted by the factor contract.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Call actual texture closure/scale and model validators, checking cited slots and factor range reports.
 * @evidence contracts/development/testing.md#independent-expectations Manifest authorization supplies the image identity, authored UV extrema yield nine-by-four span, and optional RGB factor semantics require a record of nonnegative finite scalars rather than a null object or absent array element.
 * @evidence contracts/development/testing.md#distinguishing-cases Preserve registered/unregistered and normalized/source-uv twins, then add a negative factor failure plus zero/positive/>1 factor controls; codec decoding and full material palettes are owned elsewhere.
 * @evidence contracts/development/testing.md#execution-ownership The discoverable exported unit calls portable engine seams with existing fixtures and a local facts callback, acquiring no file, process, browser or GPU resource.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A registered overlay image closes and an unregistered one reports its exact color slot.).
 */
export function test_unit_engine_validation_material_overlay_textures(): void {
  const closure: (
    assets: IAutoMovieAssetProvenance[],
  ) => IAutoMovieValidation = (
    assets: IAutoMovieAssetProvenance[],
  ): IAutoMovieValidation =>
    validateTextureAssets({
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

  const measured: IAutoMovieValidation = validateTextureScale({
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
    validateTextureScale({ models: [model(skin("source-uv"))] }).success,
    true,
  );

  const structural: (
    overlays: IAutoMovieMaterialOverlay[],
  ) => IAutoMovieValidation = (
    overlays: IAutoMovieMaterialOverlay[],
  ): IAutoMovieValidation => {
    const base: IAutoMovieModel = createModel();
    return validateModel({
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
