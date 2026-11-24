import { reviewAutoMovieFontLicences } from "@automovie/engine";
import { decodeAutoMovieTrueTypeFont } from "@automovie/ingest";
import type {
  IAutoMovieFont,
  IAutoMovieFontLicenceReview,
  IAutoMovieFontSource,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { syntheticTrueTypeFont } from "../internal/syntheticTrueTypeFont";

/**
 * A licensed font file's decoded `fsType` and licence names are put beside the
 * licence its ledger records, one row per asset source, for a review to
 * compare.
 *
 * Scenarios:
 *
 * 1. Of an embedded source and two asset sources, only the asset sources give
 *    rows, in list order, each with its id and ledger path.
 * 2. Each row carries the decoded font's `fsType` and `name` records, the
 *    synthetic font's `fsType` 8 and family among them, beside the ledger's
 *    licence for that path.
 * 3. An asset whose ledger record carries no licence, or whose path the ledger
 *    lacks, pairs with `null`.
 * 4. An asset source with no decoded record is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the sources, the ledger and the rows each scenario expects.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public engine pairing with records the ingest decoder produced and reads the rows; a pairing that drops the decoded names, takes another path's licence or gives an embedded source a row fails.
 * @evidence contracts/development/testing.md#independent-expectations The decoded facts are the synthetic font's own `OS/2` and `name` tables, `fsType` 8 as the helper writes it, and the licences are the ledger rows written here; issue #4097 asks for the two side by side.
 * @evidence contracts/development/testing.md#distinguishing-cases An embedded source, a licensed asset, an unlicensed asset, an unregistered asset and a missing decoded record. The refusal of an unlicensed font belongs to test_validation_texture_assets_fonts.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test over in-memory bytes and records.
 */
export function test_engine_font_licence_review(): void {
  const font: IAutoMovieFont = decodeAutoMovieTrueTypeFont(
    syntheticTrueTypeFont(),
  );
  const sources: IAutoMovieFontSource[] = [
    {
      kind: "embedded",
      id: "block",
      data: "AAEAAA==",
      digest: `sha256:${"0".repeat(64)}`,
      origin: "src/fonts/blockFont.ts#blockFont",
    },
    { kind: "asset", id: "sign", asset: "assets/fonts/sign.ttf" },
    { kind: "asset", id: "plain", asset: "assets/fonts/plain.ttf" },
    { kind: "asset", id: "loose", asset: "assets/fonts/loose.ttf" },
  ];
  const fonts: Map<string, IAutoMovieFont> = new Map(
    ["block", "sign", "plain", "loose"].map(
      (id: string): [string, IAutoMovieFont] => [id, font],
    ),
  );
  const licence: { identifier: string; url: string } = {
    identifier: "OFL-1.1",
    url: "urn:automovie:licence",
  };
  const rows: IAutoMovieFontLicenceReview[] = reviewAutoMovieFontLicences({
    sources,
    fonts,
    assets: [
      {
        path: "assets/fonts/sign.ttf",
        digest: `sha256:${"a".repeat(64)}`,
        license: licence,
        uses: [],
      },
      {
        path: "assets/fonts/plain.ttf",
        digest: `sha256:${"b".repeat(64)}`,
        uses: [],
      },
    ],
  });

  // 1, 2 and 3. Asset rows, in order, with the decoded facts beside the
  // licence, or beside null for an unlicensed or unregistered file.
  TestValidator.equals("one row per asset source, in order", rows, [
    {
      id: "sign",
      asset: "assets/fonts/sign.ttf",
      fsType: font.fsType,
      names: font.names,
      license: licence,
    },
    {
      id: "plain",
      asset: "assets/fonts/plain.ttf",
      fsType: font.fsType,
      names: font.names,
      license: null,
    },
    {
      id: "loose",
      asset: "assets/fonts/loose.ttf",
      fsType: font.fsType,
      names: font.names,
      license: null,
    },
  ]);
  TestValidator.predicate(
    "the decoded font's own description is carried",
    rows[0]!.fsType === 8 && rows[0]!.names.family !== null,
  );

  // 4. A missing decoded record.
  TestValidator.error("an asset source needs its decoded record", () =>
    reviewAutoMovieFontLicences({
      sources,
      fonts: new Map([["block", font]]),
      assets: [],
    }),
  );
}
