import type { IAutoMovieMaterial, IAutoMovieModel } from "@automovie/interface";
import {
  AutoMovieTextureCache,
  type IAutoMovieMaterialLibrary,
  buildAutoMovieMaterialLibrary,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { throwsError } from "../../../internal/predicates";
import { boxModel, material } from "../../../internal/renderFixtures";

/**
 * Simulated surfaces borrow one shot-owned material and texture lifetime.
 *
 * Scenarios:
 *
 * 1. Null selects a builder's own default, while absent, conflicting, and
 *    unrequested ids are refused rather than rendered with a fallback.
 * 2. Repeated requests for one flat material build one shared object without
 *    requiring a texture cache, and library disposal releases it exactly once.
 * 3. A textured material requires the shot cache, decodes once, and separates
 *    ownership: the library disposes the material while the cache later
 *    disposes its binding-private texture and decoded source.
 * 4. A throwing first material listener cannot skip another material's release;
 *    repeated disposal preserves the same failure without another attempt.
 */
export async function test_unit_viewer_viewer_material_library(): Promise<void> {
  const stone: IAutoMovieMaterial = material("stone");
  const flatModel: IAutoMovieModel = boxModel({
    id: "flat-model",
    materials: [stone],
  });
  const defaults: IAutoMovieMaterialLibrary =
    await buildAutoMovieMaterialLibrary({
      models: [flatModel],
      materialIds: [null],
    });
  TestValidator.equals(
    "null selects the renderer default and unrequested ids are refused",
    [
      defaults.resolve(null),
      throwsError(
        (): THREE.Material | undefined => defaults.resolve("stone"),
        "was not requested",
      ),
    ],
    [undefined, true],
  );
  defaults.dispose();

  const absent: string | null = await buildAutoMovieMaterialLibrary({
    models: [flatModel],
    materialIds: ["fabric"],
  })
    .then((): null => null)
    .catch((error: unknown): string => (error as Error).message);
  const conflictingModel: IAutoMovieModel = boxModel({
    id: "conflicting-model",
    materials: [{ ...stone, roughness: 0.25 }],
  });
  const conflicting: string | null = await buildAutoMovieMaterialLibrary({
    models: [conflictingModel, flatModel],
    materialIds: ["stone"],
  })
    .then((): null => null)
    .catch((error: unknown): string => (error as Error).message);
  TestValidator.equals(
    "invalid cross-model identities retain the resolver's explicit refusal",
    [
      absent?.includes("is absent") === true,
      conflicting?.includes(
        'conflicting definitions in models: "conflicting-model", "flat-model"',
      ) === true,
    ],
    [true, true],
  );

  const flat: IAutoMovieMaterialLibrary = await buildAutoMovieMaterialLibrary({
    models: [flatModel],
    materialIds: ["stone", "stone"],
  });
  const first: THREE.Material = flat.resolve("stone")!;
  let flatDisposals: number = 0;
  first.addEventListener("dispose", (): void => {
    ++flatDisposals;
  });
  TestValidator.predicate(
    "one requested id is one shared runtime material",
    first === flat.resolve("stone"),
  );
  flat.dispose();
  flat.dispose();
  TestValidator.equals(
    "library materials are released once and cannot be borrowed afterwards",
    [
      flatDisposals,
      throwsError(
        (): THREE.Material | undefined => flat.resolve("stone"),
        "already been disposed",
      ),
      throwsError(
        (): THREE.Material | undefined => flat.resolve(null),
        "already been disposed",
      ),
    ],
    [1, true, true],
  );

  const TILE: string = "textures/water.png";
  const decoded: string[] = [];
  let sourceDisposals: number = 0;
  const cache: AutoMovieTextureCache = new AutoMovieTextureCache(
    async (asset: string): Promise<THREE.Texture> => {
      decoded.push(asset);
      const texture: THREE.Texture = new THREE.Texture();
      texture.name = asset;
      texture.addEventListener("dispose", (): void => {
        ++sourceDisposals;
      });
      return texture;
    },
  );
  const water: IAutoMovieMaterial = {
    ...material("water"),
    baseColorTexture: TILE,
    transmission: 0.8,
    thickness: 0.1,
  };
  const texturedModel: IAutoMovieModel = boxModel({
    id: "textured-model",
    materials: [water],
  });
  const missingCache: string | null = await buildAutoMovieMaterialLibrary({
    models: [texturedModel],
    materialIds: ["water"],
  })
    .then((): null => null)
    .catch((error: unknown): string => (error as Error).message);
  const textured: IAutoMovieMaterialLibrary =
    await buildAutoMovieMaterialLibrary({
      models: [texturedModel],
      materialIds: ["water", "water"],
      textures: cache,
    });
  const built: THREE.MeshPhysicalMaterial = textured.resolve(
    "water",
  ) as THREE.MeshPhysicalMaterial;
  let materialDisposals: number = 0;
  let cloneDisposals: number = 0;
  built.addEventListener("dispose", (): void => {
    ++materialDisposals;
  });
  built.map!.addEventListener("dispose", (): void => {
    ++cloneDisposals;
  });
  textured.dispose();
  textured.dispose();
  TestValidator.equals(
    "the library owns the material but leaves texture lifetime to the cache",
    {
      refusal: missingCache?.includes("no shot texture cache") === true,
      decoded,
      cacheSize: cache.size,
      materialDisposals,
      cloneDisposals,
      sourceDisposals,
      texture: built.map?.name,
    },
    {
      refusal: true,
      decoded: [TILE],
      cacheSize: 1,
      materialDisposals: 1,
      cloneDisposals: 0,
      sourceDisposals: 0,
      texture: TILE,
    },
  );
  await cache.dispose();
  await cache.dispose();
  TestValidator.equals(
    "the cache later releases its clone and source exactly once",
    [cache.size, cloneDisposals, sourceDisposals],
    [0, 1, 1],
  );

  const fragile: IAutoMovieMaterialLibrary =
    await buildAutoMovieMaterialLibrary({
      models: [
        boxModel({
          id: "retirement-model",
          materials: [material("first"), material("later")],
        }),
      ],
      materialIds: ["first", "later"],
    });
  const failure: Error = new Error(
    "First material retirement listener refused.",
  );
  let attemptedFirst: number = 0;
  let attemptedLater: number = 0;
  fragile.resolve("first")!.addEventListener("dispose", (): never => {
    ++attemptedFirst;
    throw failure;
  });
  fragile.resolve("later")!.addEventListener("dispose", (): void => {
    ++attemptedLater;
  });
  let firstFailure: unknown;
  let repeatedFailure: unknown;
  try {
    fragile.dispose();
  } catch (error) {
    firstFailure = error;
  }
  try {
    fragile.dispose();
  } catch (error) {
    repeatedFailure = error;
  }
  TestValidator.predicate(
    "failed retirement preserves the original failure for every caller",
    firstFailure === failure && repeatedFailure === failure,
  );
  TestValidator.equals(
    "a failing first material cannot skip a later release or cause retries",
    [attemptedFirst, attemptedLater],
    [1, 1],
  );
}
