import type {
  IAutoMovieImage,
  IAutoMovieMaterial,
  IAutoMovieModel,
} from "@automovie/interface";
import {
  AutoMovieTextureCache,
  buildAutoMovieMaterialLibrary,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { encodeTestPng } from "../internal/encodeTestPng";
import { createModel } from "../internal/fixtures";
import { namedFacts, rejectsError } from "../internal/predicates";

/** Three rows of three RGBA pixels with distinct bytes, so any row or channel swap shows. */
const RGBA: number[] = Array.from(
  { length: 3 * 3 * 4 },
  (_: unknown, i: number): number => (i * 37 + 11) % 256,
);

const carried: (id: string, data: string) => IAutoMovieImage = (
  id: string,
  data: string,
): IAutoMovieImage => ({ id, mimeType: "image/png", data });

const texels: (texture: THREE.Texture) => number[] = (
  texture: THREE.Texture,
): number[] =>
  Array.from((texture.image as { data: Uint8Array }).data as Uint8Array);

/**
 * The shot texture cache decodes images a model carries before asking the host loader, keeps one image per id for the shot, and the material library primes the images of the models that declare its materials.
 *
 * Scenarios:
 *
 * 1. An RGBA image whose rows use the Sub, Up and Paeth filters, an RGB image using Average, a greyscale-alpha image and a greyscale image decode to the authored samples expanded to RGBA, first PNG row first, with flipY false and image-like sampling; the host loader is asked only for the uncarried asset, and an unbound carried image is not decoded.
 * 2. Priming the same id again with the same bytes decodes nothing new; the same id with different bytes, a carried id earlier loaded from the host, and two different carried images under one id in one call are refused.
 * 3. A truncated compressed stream and a palette header reject naming the image id.
 * 4. A material library over a model that carries its base-colour image resolves that image's texels, while a carried image of an unrelated model with the same id does not conflict.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls prime, resolve and buildAutoMovieMaterialLibrary and reads decoded texel bytes, loader calls and refusals, catching a broken filter, a flipped row order, a loader fallback for carried ids and a silent id collision.
 * @evidence contracts/testing.md#independent-expectations PNG bytes come from Node's zlib with filters applied forward by an independent encoder, and the expected texels are the authored samples expanded by the PNG colour-type rules; the row order is glTF's.
 * @evidence contracts/testing.md#distinguishing-cases Covers all five filters and four colour types, carried against loaded ids, equal against different bytes, bound against unbound images, and declaring against unrelated models; admission of headers is owned by the engine image test.
 * @evidence contracts/testing.md#execution-ownership The discoverable exported async unit decodes with the platform DecompressionStream on CPU Texture objects, disposes its caches and libraries, and starts no browser, renderer or GPU.
 */
export async function test_viewer_carried_images(): Promise<void> {
  const loaded: string[] = [];
  const loader: (asset: string) => Promise<THREE.Texture> = async (
    asset: string,
  ): Promise<THREE.Texture> => {
    loaded.push(asset);
    return new THREE.Texture();
  };
  const images: IAutoMovieImage[] = [
    carried(
      "rgba",
      encodeTestPng({
        width: 3,
        height: 3,
        colourType: 6,
        samples: RGBA,
        filters: [1, 2, 4],
      }),
    ),
    carried(
      "rgb",
      encodeTestPng({
        width: 2,
        height: 2,
        colourType: 2,
        samples: [10, 20, 30, 250, 240, 230, 1, 2, 3, 99, 98, 97],
        filters: [0, 3],
      }),
    ),
    carried(
      "grey-alpha",
      encodeTestPng({
        width: 2,
        height: 1,
        colourType: 4,
        samples: [5, 6, 7, 8],
      }),
    ),
    carried(
      "grey",
      encodeTestPng({ width: 1, height: 2, colourType: 0, samples: [42, 43] }),
    ),
    carried(
      "unbound",
      encodeTestPng({ width: 1, height: 1, colourType: 0, samples: [0] }),
    ),
  ];
  const cache: AutoMovieTextureCache = new AutoMovieTextureCache(loader);
  await cache.prime(["rgba", "rgb", "grey-alpha", "grey", "floor.png"], images);
  const rgba: THREE.Texture = cache.resolve("rgba");
  TestValidator.equals(
    "carried images decode to their authored samples",
    namedFacts([
      ["rgba", (): boolean => texels(rgba).join() === RGBA.join()],
      [
        "rgb",
        (): boolean =>
          texels(cache.resolve("rgb")).join() ===
          [
            10, 20, 30, 255, 250, 240, 230, 255, 1, 2, 3, 255, 99, 98, 97, 255,
          ].join(),
      ],
      [
        "greyAlpha",
        (): boolean =>
          texels(cache.resolve("grey-alpha")).join() ===
          [5, 5, 5, 6, 7, 7, 7, 8].join(),
      ],
      [
        "grey",
        (): boolean =>
          texels(cache.resolve("grey")).join() ===
          [42, 42, 42, 255, 43, 43, 43, 255].join(),
      ],
      [
        "orientation",
        (): boolean =>
          rgba.flipY === false &&
          (rgba.image as { width: number; height: number }).width === 3,
      ],
      [
        "sampling",
        (): boolean =>
          rgba.magFilter === THREE.LinearFilter &&
          rgba.minFilter === THREE.LinearMipmapLinearFilter &&
          rgba.generateMipmaps === true,
      ],
      ["loaderOnlyForAsset", (): boolean => loaded.join() === "floor.png"],
      ["unboundSkipped", (): boolean => cache.size === 5],
    ]),
    {
      rgba: true,
      rgb: true,
      greyAlpha: true,
      grey: true,
      orientation: true,
      sampling: true,
      loaderOnlyForAsset: true,
      unboundSkipped: true,
    },
  );

  await cache.prime(["rgba"], [images[0]!]);
  const sameBytes: boolean = cache.size === 5 && loaded.length === 1;
  const differentBytes: boolean = await rejectsError(
    (): Promise<void> =>
      cache.prime(["rgba"], [carried("rgba", images[1]!.data)]),
    'Texture asset "rgba" names different images in one shot',
  );
  const loadedThenCarried: boolean = await rejectsError(
    (): Promise<void> =>
      cache.prime(["floor.png"], [carried("floor.png", images[3]!.data)]),
    'Texture asset "floor.png" names different images in one shot',
  );
  const twoInOneCall: boolean = await rejectsError(
    (): Promise<void> =>
      cache.prime(
        ["pair"],
        [carried("pair", images[2]!.data), carried("pair", images[3]!.data)],
      ),
    'Texture asset "pair" names two different carried images',
  );
  await cache.dispose();
  TestValidator.equals(
    "one id names one image for the shot",
    { sameBytes, differentBytes, loadedThenCarried, twoInOneCall },
    {
      sameBytes: true,
      differentBytes: true,
      loadedThenCarried: true,
      twoInOneCall: true,
    },
  );

  const faulty: AutoMovieTextureCache = new AutoMovieTextureCache(loader);
  const truncated: boolean = await rejectsError(
    (): Promise<void> =>
      faulty.prime(
        ["cut"],
        [
          carried(
            "cut",
            encodeTestPng({
              width: 3,
              height: 3,
              colourType: 6,
              samples: RGBA,
              truncate: 6,
            }),
          ),
        ],
      ),
    "could not be decoded: cut",
  );
  const palette: boolean = await rejectsError(
    (): Promise<void> =>
      faulty.prime(
        ["indexed"],
        [
          carried(
            "indexed",
            encodeTestPng({
              width: 1,
              height: 1,
              colourType: 0,
              samples: [0],
              header: { colourType: 3 },
            }),
          ),
        ],
      ),
    "could not be decoded: indexed",
  );
  await faulty.dispose();
  TestValidator.equals(
    "undecodable carried images reject by id",
    { truncated, palette },
    { truncated: true, palette: true },
  );

  const base: IAutoMovieModel = createModel();
  const surface: IAutoMovieMaterial = {
    ...base.materials[0]!,
    id: "surface",
    baseColorTexture: "grey",
  };
  const declaring: IAutoMovieModel = {
    ...base,
    id: "declaring",
    materials: [surface],
    images: [images[3]!],
  };
  const unrelated: IAutoMovieModel = {
    ...base,
    id: "unrelated",
    images: [carried("grey", images[0]!.data)],
  };
  const shot: AutoMovieTextureCache = new AutoMovieTextureCache(loader);
  const library: Awaited<ReturnType<typeof buildAutoMovieMaterialLibrary>> =
    await buildAutoMovieMaterialLibrary({
      models: [declaring, unrelated],
      materialIds: ["surface"],
      textures: shot,
    });
  const map: THREE.Texture | null =
    (library.resolve("surface") as THREE.MeshPhysicalMaterial | undefined)
      ?.map ?? null;
  const libraryTexels: string = map === null ? "" : texels(map).join();
  library.dispose();
  await shot.dispose();
  TestValidator.equals(
    "the library primes the images of the declaring models",
    libraryTexels,
    [42, 42, 42, 255, 43, 43, 43, 255].join(),
  );
}
