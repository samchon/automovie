import {
  IAutoMovieTextureImageFacts,
  validateTextureAssets,
  validateTextureScale,
} from "@automovie/engine";
import {
  IAutoMovieAssetProvenance,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../internal/fixtures";
import { hasViolation } from "../internal/predicates";

const PRODUCTION = "atrium";
const VEINS = "public/textures/veins.png";

const facts = (asset: string): IAutoMovieTextureImageFacts | undefined =>
  asset === VEINS
    ? { mediaType: "image/png", width: 2048, height: 2048 }
    : undefined;

const record = (path: string): IAutoMovieAssetProvenance => ({
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

const skin = (
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

const model = (material: IAutoMovieMaterial): IAutoMovieModel => ({
  ...createModel(),
  id: "arm",
  parts: [part],
  materials: [material],
});

/**
 * An overlay's images are closed and measured like the material's own.
 *
 * Scenarios:
 * 1. The asset ledger closes a registered overlay image cleanly and locates an
 *    unregistered one at the overlay's colour slot.
 * 2. A `"normalized"` overlay image over a set spanning nine by four is
 *    refused at the overlay's slot, whose name the message carries; a
 *    `"source-uv"` one is left alone.
 */
export const test_validation_material_overlay_textures = (): void => {
  const closure = (assets: IAutoMovieAssetProvenance[]) =>
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

  const measured = validateTextureScale({
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
};
