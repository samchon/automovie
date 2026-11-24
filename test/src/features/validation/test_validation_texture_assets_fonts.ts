import { validateTextureAssets } from "@automovie/engine";
import type {
  IAutoMovieAssetProvenance,
  IAutoMovieAssetUse,
  IAutoMovieFontSource,
  IAutoMovieShotFontSources,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { hasViolation } from "../internal/hasViolation";

/**
 * Texture closure, the check that holds the production's asset ledger, admits
 * each shot's font sources against it: a licensed font file with its font use
 * passes, and one without a licence or a use is refused.
 *
 * Scenarios:
 *
 * 1. A shot listing an embedded font and a font file whose ledger record carries a
 *    licence and a `"font"` use of the production under the source's id is
 *    admitted.
 * 2. The same font file without `license` in its provenance is refused at the
 *    source's `asset`, as unlicensed.
 * 3. The same file without the font use, and a font asset path the ledger lacks,
 *    are each refused at the source's `asset`.
 * 4. A ledger font use of this production that no listed source names is refused
 *    as stale, at the use; a use of another production is left alone.
 * 5. A duplicate id within one shot's list is refused, while one id listed by two
 *    shots is admitted, since ids are unique per shot.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the ledger, the font rows and the finding each scenario expects.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public texture closure with font rows and reads its violations; a closure that ignores the fonts admits the unlicensed file of scenario 2 and fails, as does one that never reports a stale font use.
 * @evidence contracts/development/testing.md#independent-expectations Issue #4097's rule: an `"asset"` font's provenance must carry `license`, and the ledger's typed `"font"` use names the source id; stale-use refusal follows the ledger's rule for every consumer closure checks.
 * @evidence contracts/development/testing.md#distinguishing-cases A clean list beside a removed licence, a removed use, an unregistered path, a stale use, another production's use, and an id repeated within and across shots. The font record rules themselves belong to test_engine_font_source_admission; byte decoding to test_render_font_sources.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test over in-memory ledger rows.
 */
export function test_validation_texture_assets_fonts(): void {
  const path: string = "assets/fonts/licensed.ttf";
  const asset: IAutoMovieFontSource.IAsset = {
    kind: "asset",
    id: "licensed",
    asset: path,
  };
  const embedded: IAutoMovieFontSource.IEmbedded = {
    kind: "embedded",
    id: "block",
    data: "AAEAAA==",
    digest: `sha256:${"0".repeat(64)}`,
    origin: "src/fonts/blockFont.ts#blockFont",
  };
  const ledger: (props: {
    licensed: boolean;
    uses: { production: string; id: string }[];
  }) => IAutoMovieAssetProvenance[] = (props: {
    licensed: boolean;
    uses: { production: string; id: string }[];
  }): IAutoMovieAssetProvenance[] => [
    {
      path,
      digest: `sha256:${"a".repeat(64)}`,
      ...(props.licensed
        ? { license: { identifier: "OFL-1.1", url: "urn:automovie:licence" } }
        : {}),
      uses: props.uses.map(
        (use: { production: string; id: string }): IAutoMovieAssetUse => ({
          production: use.production,
          consumer: { kind: "font", id: use.id },
          reason: "storefront lettering",
        }),
      ),
    },
  ];
  const close: (
    assets: IAutoMovieAssetProvenance[],
    fonts: IAutoMovieShotFontSources[],
  ) => IAutoMovieValidation = (
    assets: IAutoMovieAssetProvenance[],
    fonts: IAutoMovieShotFontSources[],
  ): IAutoMovieValidation =>
    validateTextureAssets({
      production: "film",
      models: [],
      scenes: [],
      fonts,
      assets,
      facts: (): undefined => undefined,
    });
  const shop: IAutoMovieShotFontSources = {
    shot: "shop",
    sources: [embedded, asset],
  };
  const used: { production: string; id: string }[] = [
    { production: "film", id: "licensed" },
  ];

  // 1. Clean.
  TestValidator.equals(
    "a licensed font file with its use is admitted",
    close(ledger({ licensed: true, uses: used }), [shop]).success,
    true,
  );

  // 2. No licence.
  TestValidator.predicate(
    "a font file without a licence is refused",
    hasViolation(
      close(ledger({ licensed: false, uses: used }), [shop]),
      "type",
      "$input.fonts[0].sources[1].asset",
    ),
  );

  // 3. No use, or no record.
  TestValidator.equals(
    "a font file without its use, and an unregistered one, are refused",
    [
      hasViolation(
        close(ledger({ licensed: true, uses: [] }), [shop]),
        "type",
        "$input.fonts[0].sources[1].asset",
      ),
      hasViolation(
        close([], [shop]),
        "type",
        "$input.fonts[0].sources[1].asset",
      ),
    ],
    [true, true],
  );

  // 4. A stale use, and another production's.
  TestValidator.equals(
    "a font use no source names is stale; another production's is left alone",
    [
      hasViolation(
        close(ledger({ licensed: true, uses: used }), [
          { shot: "shop", sources: [embedded] },
        ]),
        "type",
        "$input.assets[0].uses[0]",
      ),
      close(
        ledger({
          licensed: true,
          uses: [...used, { production: "sequel", id: "other" }],
        }),
        [shop],
      ).success,
    ],
    [true, true],
  );

  // 5. Ids are unique per shot.
  TestValidator.equals(
    "a repeated id within a shot is refused, across shots admitted",
    [
      hasViolation(
        close(ledger({ licensed: true, uses: used }), [
          { shot: "shop", sources: [asset, { ...asset }] },
        ]),
        "type",
        "$input.fonts[0].sources[1].id",
      ),
      close(ledger({ licensed: true, uses: used }), [
        shop,
        { shot: "street", sources: [asset] },
      ]).success,
    ],
    [true, true],
  );
}
