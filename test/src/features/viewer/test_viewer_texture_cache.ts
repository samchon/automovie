import { IAutoMovieMaterial } from "@automovie/interface";
import {
  AutoMovieTextureCache,
  buildMaterial,
  materialTextureBindings,
  textureBindingAsset,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createModel } from "../internal/fixtures";
import { namedFacts, nclose, throwsError } from "../internal/predicates";

/** The existing callback counts host load requests and lets one named asset fail. */
const recordingLoader: (props?: { fails?: string }) => {
  decoded: string[];
  disposals: string[];
  load: (asset: string) => Promise<THREE.Texture>;
} = (props?: {
  fails?: string;
}): {
  decoded: string[];
  disposals: string[];
  load: (asset: string) => Promise<THREE.Texture>;
} => {
  const decoded: string[] = [];
  const disposals: string[] = [];
  const load: (asset: string) => Promise<THREE.Texture> = async (
    asset: string,
  ): Promise<THREE.Texture> => {
    decoded.push(asset);
    if (asset === props?.fails)
      throw new Error(`decode refused for "${asset}"`);
    const texture: THREE.Texture<unknown, THREE.TextureEventMap> =
      new THREE.Texture();
    texture.name = asset;
    texture.addEventListener("dispose", (): number => disposals.push(asset));
    return texture;
  };
  return { decoded, disposals, load };
};

const TILE: string = "public/textures/tile.png";
const NORMAL: string = "public/textures/tile-normal.png";

const material: (patch: Partial<IAutoMovieMaterial>) => IAutoMovieMaterial = (
  patch: Partial<IAutoMovieMaterial>,
): IAutoMovieMaterial => ({
  ...createModel().materials[0]!,
  ...patch,
});

/**
 * Exercises asset-keyed host loads, binding-private Texture state and one cache close completion.
 *
 * Scenarios:
 * 1. Repeated priming loads each asset once; issued clones share Source identity but retain independent repeats and optional normal bindings.
 * 2. Repeated close requests exactly one disposal event for every observed source/clone and rejects later priming/resolution.
 * 3. An unprimed asset refuses; a failed controlled host load names its own asset and still retires the healthy source.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls real cache/material/binding APIs and observes loader calls, actual shared Source identity, distinct wrappers, sampler projection and disposal requests/refusal.
 * @evidence contracts/testing.md#independent-expectations Authored asset names/transforms and independently counted wrapper/source events define expectations. The existing loader produces CPU Texture objects, not real image decoding or native uploads.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts repeated priming/shared assets, independent repeats, absent normals, unprimed/closed refusal and partial load failure with healthy resource retirement.
 * @evidence contracts/testing.md#execution-ownership The named async entry reuses its existing owned loader callback and actual CPU Texture objects, closes its caches/materials and starts no browser, decoder, renderer or new driver.
 */
export async function test_viewer_texture_cache(): Promise<void> {
  const loader: {
    decoded: string[];
    disposals: string[];
    load: (asset: string) => Promise<THREE.Texture>;
  } = recordingLoader();
  const cache: AutoMovieTextureCache = new AutoMovieTextureCache(loader.load);
  const floor: IAutoMovieMaterial = material({
    id: "floor",
    baseColorTexture: {
      asset: TILE,
      texCoord: 0,
      colorSpace: "srgb",
      transform: {
        offset: { x: 0, y: 0 },
        scale: { x: 40, y: 40 },
        rotationDeg: 0,
      },
    },
    normalTexture: { asset: NORMAL, texCoord: 0, colorSpace: "linear" },
  });
  const tabletop: IAutoMovieMaterial = material({
    id: "tabletop",
    baseColorTexture: {
      asset: TILE,
      texCoord: 0,
      colorSpace: "srgb",
      transform: {
        offset: { x: 0, y: 0 },
        scale: { x: 2, y: 2 },
        rotationDeg: 0,
      },
    },
  });
  await cache.prime([
    ...materialTextureBindings(floor),
    ...materialTextureBindings(tabletop),
  ]);
  // A second model in the same shot primes again; it must request no second host load for the same asset.
  await cache.prime(materialTextureBindings(tabletop));

  const builtFloor: THREE.MeshPhysicalMaterial = buildMaterial(
    floor,
    cache.resolve,
  );
  const builtTable: THREE.MeshPhysicalMaterial = buildMaterial(
    tabletop,
    cache.resolve,
  );
  const cloneDisposals: number[] = [0, 0, 0];
  const clones: THREE.Texture[] = [
    builtFloor.map!,
    builtFloor.normalMap!,
    builtTable.map!,
  ];
  clones.forEach((texture: THREE.Texture, index: number): void => {
    texture.addEventListener("dispose", (): void => {
      cloneDisposals[index] = cloneDisposals[index]! + 1;
    });
  });
  TestValidator.equals(
    "one host load per asset, shared Source and separate sampling state",
    namedFacts([
      [
        "decodedOnce",
        (): boolean =>
          loader.decoded.filter((a: string): boolean => a === TILE).length ===
          1,
      ],
      [
        "twoAssets",
        (): boolean => loader.decoded.length === 2 && cache.size === 2,
      ],
      ["distinctObjects", (): boolean => builtFloor.map !== builtTable.map],
      [
        "sharedSource",
        (): boolean => builtFloor.map!.source === builtTable.map!.source,
      ],
      [
        "independentRepeat",
        (): boolean =>
          nclose(builtFloor.map!.repeat.x, 40, 0) &&
          nclose(builtTable.map!.repeat.x, 2, 0),
      ],
      ["normalResolved", (): boolean => builtFloor.normalMap?.name === NORMAL],
      ["tableHasNoNormal", (): boolean => builtTable.normalMap === null],
    ]),
    {
      decodedOnce: true,
      twoAssets: true,
      distinctObjects: true,
      sharedSource: true,
      independentRepeat: true,
      normalResolved: true,
      tableHasNoNormal: true,
    },
  );

  TestValidator.equals(
    "a binding names the one asset it samples",
    [textureBindingAsset(TILE), textureBindingAsset(floor.baseColorTexture!)],
    [TILE, TILE],
  );

  await cache.dispose();
  await cache.dispose();
  TestValidator.equals(
    "each issued clone receives one disposal event despite repeated close",
    cloneDisposals,
    [1, 1, 1],
  );
  const primeAfterDispose: string | null = await cache
    .prime([TILE])
    .then((): null => null)
    .catch((error: unknown): string =>
      error instanceof Error ? error.message : String(error),
    );
  TestValidator.equals(
    "each original source receives one disposal event and the cache is closed",
    namedFacts([
      [
        "sourcesDisposedOnce",
        (): boolean =>
          loader.disposals.length === 2 && new Set(loader.disposals).size === 2,
      ],
      ["emptied", (): boolean => cache.size === 0],
      [
        "primeRefused",
        (): boolean =>
          primeAfterDispose?.includes("already been disposed") === true,
      ],
      [
        "resolveRefused",
        (): boolean =>
          throwsError(
            (): THREE.Texture<unknown, THREE.TextureEventMap> =>
              cache.resolve(TILE),
            "already been disposed",
          ),
      ],
    ]),
    {
      sourcesDisposedOnce: true,
      emptied: true,
      primeRefused: true,
      resolveRefused: true,
    },
  );
  builtFloor.dispose();
  builtTable.dispose();

  const strict: AutoMovieTextureCache = new AutoMovieTextureCache(
    recordingLoader().load,
  );
  TestValidator.predicate(
    "an unprimed asset is refused rather than rendered untextured",
    throwsError(
      (): THREE.Texture<unknown, THREE.TextureEventMap> => strict.resolve(TILE),
      [TILE, "was never primed into this shot cache"],
    ),
  );
  await strict.dispose();

  const failing: {
    decoded: string[];
    disposals: string[];
    load: (asset: string) => Promise<THREE.Texture>;
  } = recordingLoader({ fails: NORMAL });
  const partial: AutoMovieTextureCache = new AutoMovieTextureCache(
    failing.load,
  );
  const refusal: string | null = await partial
    .prime([TILE, NORMAL])
    .then((): null => null)
    .catch((error: unknown): string =>
      error instanceof Error ? error.message : String(error),
    );
  await partial.dispose();
  TestValidator.equals(
    "a failed host load names its asset and leaves the rest releasable",
    [
      refusal !== null && refusal.includes(NORMAL),
      refusal !== null && refusal.includes(TILE),
      failing.disposals,
    ],
    [true, false, [TILE]],
  );
}
