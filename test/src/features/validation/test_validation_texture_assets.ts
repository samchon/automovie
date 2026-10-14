import {
  IAutoMovieTextureImageFacts,
  validateTextureAssets,
} from "@automovie/engine";
import {
  IAutoMovieAssetProvenance,
  IAutoMovieAssetUse,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieSceneEnvironment,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { ITextureAssetClosureOverrides } from "../internal/ITextureAssetClosureOverrides";
import { assertTextureAssetImageFacts } from "../internal/assertTextureAssetImageFacts";
import { createModel } from "../internal/fixtures";
import {
  hasViolation,
  namedFacts,
  violationCount,
} from "../internal/predicates";

const PRODUCTION: string = "atrium";

const FACTS: Record<string, IAutoMovieTextureImageFacts> = {
  "public/textures/tile-base.png": {
    mediaType: "image/png",
    width: 1024,
    height: 1024,
  },
  "public/textures/tile-normal.png": {
    mediaType: "image/png",
    width: 1024,
    height: 1024,
  },
  "public/textures/studio.hdr": {
    mediaType: "image/vnd.radiance",
    width: 2048,
    height: 1024,
  },
};

const facts: (asset: string) => IAutoMovieTextureImageFacts | undefined = (
  asset: string,
): IAutoMovieTextureImageFacts | undefined => FACTS[asset];

const use: (
  kind: "material-texture" | "scene-environment" | "audio-cue",
  id: string,
  production?: string,
) => IAutoMovieAssetUse = (
  kind: "material-texture" | "scene-environment" | "audio-cue",
  id: string,
  production: string = PRODUCTION,
): IAutoMovieAssetUse => ({
  production,
  consumer: { kind, id },
  reason: "built environment finish",
});

const record: (
  path: string,
  uses: IAutoMovieAssetUse[],
) => IAutoMovieAssetProvenance = (
  path: string,
  uses: IAutoMovieAssetUse[],
): IAutoMovieAssetProvenance => ({
  path,
  digest: `sha256:${"0".repeat(64)}`,
  original: {
    url: "https://example.com/source",
    digest: `sha256:${"0".repeat(64)}`,
  },
  license: { identifier: "CC0-1.0", url: "https://example.com/licence" },
  processing: [],
  uses,
});

const material: (patch: Partial<IAutoMovieMaterial>) => IAutoMovieMaterial = (
  patch: Partial<IAutoMovieMaterial>,
): IAutoMovieMaterial => ({
  ...createModel().materials[0]!,
  ...patch,
});

const model: (
  id: string,
  materials: IAutoMovieMaterial[],
) => IAutoMovieModel = (
  id: string,
  materials: IAutoMovieMaterial[],
): IAutoMovieModel => ({ ...createModel(), id, materials });

const TILED_FLOOR: IAutoMovieModel = model("floor", [
  material({
    id: "tile",
    baseColorTexture: {
      asset: "public/textures/tile-base.png",
      texCoord: 0,
      colorSpace: "srgb",
    },
    normalTexture: {
      asset: "public/textures/tile-normal.png",
      texCoord: 0,
      colorSpace: "linear",
    },
  }),
]);

const ENVIRONMENT: IAutoMovieSceneEnvironment = {
  image: "public/textures/studio.hdr",
  background: null,
  intensity: 1,
  rotationDeg: 0,
  exposure: 1,
  toneMapping: "acesFilmic",
  shadows: { enabled: true, type: "pcfSoft" },
};

const CLEAN_ASSETS: IAutoMovieAssetProvenance[] = [
  record("public/textures/tile-base.png", [use("material-texture", "floor")]),
  record("public/textures/tile-normal.png", [use("material-texture", "floor")]),
  record("public/textures/studio.hdr", [use("scene-environment", "opening")]),
];

const closure: (
  props: ITextureAssetClosureOverrides,
) => ReturnType<typeof validateTextureAssets> = (
  props: ITextureAssetClosureOverrides,
): ReturnType<typeof validateTextureAssets> =>
  validateTextureAssets({
    production: PRODUCTION,
    models: props.models ?? [TILED_FLOOR],
    scenes: props.scenes ?? [{ shot: "opening", environment: ENVIRONMENT }],
    assets: props.assets ?? CLEAN_ASSETS,
    facts: props.facts ?? facts,
  });

/**
 * A compiled production may sample only images its asset ledger authorizes.
 *
 * Scenarios:
 *
 * 1. A tiled floor binding two registered images and a shot lighting itself from a
 *    registered HDR closes cleanly, and a production that binds no image at all
 *    stays clean whether its scene declares no environment, a null one, or one
 *    with no image.
 * 2. Each failure mode is located at the authored path: an unregistered image, a
 *    registered one with no typed use, a use whose production or consumer id
 *    does not match, and a ledger entry for a consumer that no longer binds
 *    it.
 * 3. Supplied image facts decide media and size: unavailable facts, HDR base color, a
 *    zero, fractional or over-budget edge are all refused, while the exact
 *    portable limit and a PNG environment are accepted.
 * 4. One image bound as both a colour and a measurement is refused at every
 *    contradicting slot, including through legacy bare-id bindings whose intent
 *    comes from the slot itself.
 * 5. A scene environment joins that rule with intent from its supplied media facts: a
 *    PNG sky and a linear material map over the same asset are refused at
 *    both consumers, the same sky beside a base-color binding of that asset is
 *    clean, and a Radiance sky beside a separate normal-map asset is accepted.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual texture-asset closure over material/environment bindings, typed ledger uses and supplied image facts. Missing or mismatched authorization, stale uses, media/edge limits and contradictory decoding must produce addressed failures while matching and image-free consumers remain accepted.
 * @evidence contracts/testing.md#independent-expectations Authored production/consumer identities, color versus linear slot roles and supplied PNG/Radiance dimensions define expected closure and field paths. Edge limit 8192 has an exact accepted case and 8193 refuses; the facts callback is an explicit seam, so no bytes are decoded or hashed and the fixed digest placeholders prove no content identity.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts registered/missing/stale/wrong-kind/wrong-production uses, absent/null/imageless environments, unavailable or invalid facts and exact edge budget. Shared assets distinguish agreeing roles from color/data conflicts across material and environment consumers, including legacy bindings; actual decoder and provenance-byte integrity belong to other owners.
 * @evidence contracts/testing.md#execution-ownership The named portable unit directly invokes closure semantics and its existing local assertion helper with authored records and a synchronous facts port. It creates no image assets, network requests, native viewer or GPU, and helper cases are owned by this discoverable entry.
 */
export function test_validation_texture_assets(): void {
  TestValidator.equals(
    "an authorized floor and environment close cleanly",
    closure({}).success,
    true,
  );
  TestValidator.equals(
    "a production binding no image needs no texture ledger",
    namedFacts([
      [
        "noEnvironmentKey",
        (): boolean =>
          closure({
            models: [model("bare", [material({})])],
            scenes: [{ shot: "opening" }],
            assets: [],
          }).success,
      ],
      [
        "nullEnvironment",
        (): boolean =>
          closure({
            models: [],
            scenes: [{ shot: "opening", environment: null }],
            assets: [],
          }).success,
      ],
      [
        "imagelessEnvironment",
        (): boolean =>
          closure({
            models: [],
            scenes: [
              {
                shot: "opening",
                environment: {
                  ...ENVIRONMENT,
                  image: null,
                  background: { r: 0, g: 0, b: 0, a: null, hex: null },
                },
              },
            ],
            assets: [],
          }).success,
      ],
      [
        "otherProductionLedgerIgnored",
        (): boolean =>
          closure({
            models: [],
            scenes: [{ shot: "opening" }],
            assets: [
              record("public/textures/tile-base.png", [
                use("material-texture", "floor", "other-production"),
              ]),
            ],
          }).success,
      ],
      [
        "nonTextureConsumerIgnored",
        (): boolean =>
          closure({
            models: [],
            scenes: [{ shot: "opening" }],
            assets: [
              record("public/audio/stem.wav", [use("audio-cue", "theme")]),
            ],
          }).success,
      ],
    ]),
    {
      noEnvironmentKey: true,
      nullEnvironment: true,
      imagelessEnvironment: true,
      otherProductionLedgerIgnored: true,
      nonTextureConsumerIgnored: true,
    },
  );

  TestValidator.equals(
    "every closure failure is located at its authored path",
    namedFacts([
      [
        "unregisteredTexture",
        (): boolean =>
          hasViolation(
            closure({ assets: CLEAN_ASSETS.slice(1) }),
            "type",
            "$input.models[0].materials[0].baseColorTexture",
          ),
      ],
      [
        "unregisteredEnvironment",
        (): boolean =>
          hasViolation(
            closure({ assets: CLEAN_ASSETS.slice(0, 2) }),
            "type",
            "$input.scenes[0].environment.image",
          ),
      ],
      [
        "noTypedUse",
        (): boolean =>
          hasViolation(
            closure({
              assets: [
                record("public/textures/tile-base.png", []),
                ...CLEAN_ASSETS.slice(1),
              ],
            }),
            "type",
            "$input.models[0].materials[0].baseColorTexture",
          ),
      ],
      [
        "wrongConsumerId",
        (): boolean =>
          hasViolation(
            closure({
              assets: [
                record("public/textures/tile-base.png", [
                  use("material-texture", "ceiling"),
                ]),
                ...CLEAN_ASSETS.slice(1),
              ],
            }),
            "type",
            "$input.models[0].materials[0].baseColorTexture",
          ),
      ],
      [
        "wrongConsumerKind",
        (): boolean =>
          hasViolation(
            closure({
              assets: [
                ...CLEAN_ASSETS.slice(0, 2),
                record("public/textures/studio.hdr", [
                  use("material-texture", "opening"),
                ]),
              ],
            }),
            "type",
            "$input.scenes[0].environment.image",
          ),
      ],
      [
        "wrongProduction",
        (): boolean =>
          hasViolation(
            closure({
              assets: [
                record("public/textures/tile-base.png", [
                  use("material-texture", "floor", "other-production"),
                ]),
                ...CLEAN_ASSETS.slice(1),
              ],
            }),
            "type",
            "$input.models[0].materials[0].baseColorTexture",
          ),
      ],
      [
        "staleMaterialUse",
        (): boolean =>
          hasViolation(
            closure({
              models: [model("floor", [material({})])],
              scenes: [{ shot: "opening" }],
              assets: [CLEAN_ASSETS[0]!],
            }),
            "type",
            "$input.assets[0].uses[0]",
          ),
      ],
      [
        "staleEnvironmentUse",
        (): boolean =>
          hasViolation(
            closure({
              models: [],
              scenes: [{ shot: "opening" }],
              assets: [CLEAN_ASSETS[2]!],
            }),
            "type",
            "$input.assets[0].uses[0]",
          ),
      ],
    ]),
    {
      unregisteredTexture: true,
      unregisteredEnvironment: true,
      noTypedUse: true,
      wrongConsumerId: true,
      wrongConsumerKind: true,
      wrongProduction: true,
      staleMaterialUse: true,
      staleEnvironmentUse: true,
    },
  );

  assertTextureAssetImageFacts(closure, facts);
  const contradiction: ReturnType<typeof closure> = closure({
    models: [
      model("floor", [
        material({
          baseColorTexture: {
            asset: "public/textures/tile-base.png",
            texCoord: 0,
            colorSpace: "srgb",
          },
          normalTexture: {
            asset: "public/textures/tile-base.png",
            texCoord: 0,
            colorSpace: "linear",
          },
        }),
      ]),
    ],
    scenes: [{ shot: "opening" }],
    assets: [CLEAN_ASSETS[0]!],
  });
  TestValidator.equals(
    "one image cannot be both a colour and a measurement",
    [
      hasViolation(contradiction, "type", ".baseColorTexture"),
      hasViolation(contradiction, "type", ".normalTexture"),
      violationCount(contradiction),
    ],
    [true, true, 2],
  );

  const legacyContradiction: ReturnType<typeof closure> = closure({
    models: [
      model("floor", [
        material({
          baseColorTexture: "public/textures/tile-base.png",
          emissiveTexture: "public/textures/tile-base.png",
          occlusionTexture: "public/textures/tile-base.png",
        }),
      ]),
    ],
    scenes: [{ shot: "opening" }],
    assets: [CLEAN_ASSETS[0]!],
  });
  TestValidator.equals(
    "a legacy bare-id binding takes its intent from the slot it fills",
    violationCount(legacyContradiction),
    3,
  );

  TestValidator.equals(
    "one image serving two agreeing slots of one model stays clean",
    closure({
      models: [
        model("floor", [
          material({
            metallicRoughnessTexture: "public/textures/tile-normal.png",
            occlusionTexture: "public/textures/tile-normal.png",
          }),
        ]),
      ],
      scenes: [{ shot: "opening" }],
      assets: [CLEAN_ASSETS[1]!],
    }).success,
    true,
  );

  // The supplied PNG media role gives the environment sRGB intent; this unit does not inspect image bit depth or decode bytes.
  const litByLdr: (
    patch: Partial<IAutoMovieMaterial>,
  ) => ReturnType<typeof closure> = (
    patch: Partial<IAutoMovieMaterial>,
  ): ReturnType<typeof closure> =>
    closure({
      models: [model("floor", [material(patch)])],
      scenes: [
        {
          shot: "opening",
          environment: {
            ...ENVIRONMENT,
            image: "public/textures/tile-base.png",
          },
        },
      ],
      assets: [
        record("public/textures/tile-base.png", [
          use("material-texture", "floor"),
          use("scene-environment", "opening"),
        ]),
      ],
    });
  const skyAsMeasurement: ReturnType<typeof closure> = litByLdr({
    normalTexture: {
      asset: "public/textures/tile-base.png",
      texCoord: 0,
      colorSpace: "linear",
    },
  });
  TestValidator.equals(
    "a PNG sky and a linear map over the same asset are both refused",
    [
      hasViolation(
        skyAsMeasurement,
        "type",
        "$input.scenes[0].environment.image",
      ),
      hasViolation(skyAsMeasurement, "type", ".normalTexture"),
      violationCount(skyAsMeasurement),
    ],
    [true, true, 2],
  );
  TestValidator.equals(
    "the same sky beside a base-color binding of that asset agrees",
    litByLdr({
      baseColorTexture: {
        asset: "public/textures/tile-base.png",
        texCoord: 0,
        colorSpace: "srgb",
      },
    }).success,
    true,
  );
  TestValidator.equals(
    "a Radiance sky and a separate normal-map asset remain accepted",
    closure({
      models: [
        model("floor", [
          material({ normalTexture: "public/textures/tile-normal.png" }),
        ]),
      ],
      assets: [CLEAN_ASSETS[1]!, CLEAN_ASSETS[2]!],
    }).success,
    true,
  );
}
