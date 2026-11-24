import {
  ViolationCollector,
  validateAutoMovieFontSources,
} from "@automovie/engine";
import type {
  IAutoMovieAssetProvenance,
  IAutoMovieConstraintViolation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Font source admission checks what the source records state: ids, required
 * fields and an asset's licence and use in the ledger.
 *
 * Scenarios:
 *
 * 1. A valid embedded source and a licensed asset source with its font use admit
 *    with no finding.
 * 2. A duplicate source id is refused at the second id.
 * 3. An asset source whose ledger provenance has no `license` is refused as
 *    unlicensed.
 * 4. An asset source whose ledger carries no `"font"` use for its id, and an
 *    unregistered asset, are refused.
 * 5. An embedded source with malformed base64, an uppercase digest and a blank
 *    origin gets one finding on each field, and an unknown kind is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public engine admission with a collector and asserts the findings' paths and words; it catches a skipped duplicate check, an asset admitted without a licence and an embedded source admitted without provenance.
 * @evidence contracts/development/testing.md#independent-expectations The rules are #4097's: unique nonblank ids, base64 data, a sha256 digest, a nonblank origin, and a licence plus a typed font use for every asset font; each case breaks one.
 * @evidence contracts/development/testing.md#distinguishing-cases A clean list beside one change per refusal: a duplicate id, a removed licence, a removed use, an unregistered path, and each embedded field malformed. Byte decoding and digest matching are owned by test_render_font_sources.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test of engine admission over in-memory records.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each naming the records and the findings expected.
 */
export function test_engine_font_source_admission(): void {
  const ledger: (
    licensed: boolean,
    used: boolean,
  ) => IAutoMovieAssetProvenance[] = (
    licensed: boolean,
    used: boolean,
  ): IAutoMovieAssetProvenance[] => [
    {
      path: "assets/fonts/licensed.ttf",
      digest: `sha256:${"a".repeat(64)}`,
      ...(licensed
        ? { license: { identifier: "OFL-1.1", url: "urn:automovie:licence" } }
        : {}),
      uses: used
        ? [
            {
              production: "film",
              consumer: { kind: "font", id: "licensed" },
              reason: "storefront lettering",
            },
          ]
        : [],
    },
  ];
  const embedded: Record<string, unknown> = {
    kind: "embedded",
    id: "block",
    data: "AAEAAA==",
    digest: `sha256:${"0".repeat(64)}`,
    origin: "src/fonts/blockFont.ts#blockFont",
  };
  const asset: Record<string, unknown> = {
    kind: "asset",
    id: "licensed",
    asset: "assets/fonts/licensed.ttf",
  };
  const admit: (
    sources: unknown,
    assets?: IAutoMovieAssetProvenance[],
  ) => IAutoMovieConstraintViolation[] = (
    sources: unknown,
    assets?: IAutoMovieAssetProvenance[],
  ): IAutoMovieConstraintViolation[] => {
    const collector: ViolationCollector = new ViolationCollector();
    validateAutoMovieFontSources(
      sources,
      "$input.fonts",
      collector,
      assets === undefined ? undefined : { production: "film", assets },
    );
    return collector.items;
  };
  const found: (
    violations: IAutoMovieConstraintViolation[],
    path: string,
    words: string,
  ) => boolean = (
    violations: IAutoMovieConstraintViolation[],
    path: string,
    words: string,
  ): boolean =>
    violations.some(
      (v: IAutoMovieConstraintViolation): boolean =>
        v.path === path && v.expected.includes(words),
    );

  // 1. Clean.
  TestValidator.equals(
    "valid sources admit",
    admit([embedded, asset], ledger(true, true)),
    [],
  );

  // 2. Duplicate id.
  TestValidator.predicate(
    "a duplicate id refuses",
    found(
      admit([embedded, { ...embedded }], ledger(true, true)),
      "$input.fonts[1].id",
      "must be unique",
    ),
  );

  // 3. No licence.
  TestValidator.predicate(
    "an unlicensed asset font refuses",
    found(
      admit([asset], ledger(false, true)),
      "$input.fonts[0].asset",
      "no licence",
    ),
  );

  // 4. No font use, unregistered.
  TestValidator.predicate(
    "an asset font without its use refuses",
    found(
      admit([asset], ledger(true, false)),
      "$input.fonts[0].asset",
      "no font use",
    ),
  );
  TestValidator.predicate(
    "an unregistered asset font refuses",
    found(admit([asset], []), "$input.fonts[0].asset", "not registered"),
  );

  // 5. Embedded fields and kind.
  const broken: IAutoMovieConstraintViolation[] = admit([
    {
      ...embedded,
      data: "data:font/ttf;base64,AAEAAA==",
      digest: `sha256:${"A".repeat(64)}`,
      origin: " ",
    },
    { kind: "url", id: "web" },
  ]);
  for (const [path, words] of [
    ["$input.fonts[0].data", "base64"],
    ["$input.fonts[0].digest", "sha256"],
    ["$input.fonts[0].origin", "origin"],
    ["$input.fonts[1].kind", "embedded"],
  ] as const)
    TestValidator.predicate(`${path} refuses`, found(broken, path, words));
}
