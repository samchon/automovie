import { AutoMovieIngestFont } from "@automovie/ingest";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";
import { syntheticTrueTypeFont } from "../internal/syntheticTrueTypeFont";

/**
 * The TrueType decoder refuses every input outside its admitted subset, each
 * with its own diagnostic.
 *
 * Scenarios:
 *
 * 1. The `sfnt` tags `OTTO`, `ttcf`, `wOFF` and `wOF2` and an unknown version are
 *    refused as CFF outlines, a collection, WOFF, WOFF2 and not TrueType.
 * 2. Leaving out each required table refuses naming that table.
 * 3. Cutting the last table's final bytes off refuses as a table outside the
 *    bytes.
 * 4. A `loca` offset one byte past the end of `glyf` refuses as past the glyf
 *    table.
 * 5. A composite glyph citing itself refuses as containing itself.
 * 6. The unaltered font decodes, so each refusal comes from its one change.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Feeds altered font bytes to the public decoder and asserts the thrown diagnostic's distinguishing words; it catches a decoder that reads past the bytes, accepts an unsupported container or loops on a cyclic composite.
 * @evidence contracts/development/testing.md#independent-expectations ISO/IEC 14496-22 fixes the sfnt version tags, the required tables of a TrueType font and the loca offsets' bound by the glyf length; each case violates exactly one of them.
 * @evidence contracts/development/testing.md#distinguishing-cases Each refusal is one change from an admitted font, and the unchanged font is decoded as the adjacent positive case. Decoded content is owned by test_ingest_truetype_font.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test of the ingest decoder over in-memory bytes.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 numbered scenarios it runs, each naming the altered input and the diagnostic it expects.
 */
export function test_ingest_truetype_font_refusals(): void {
  const tagged: (tag: string) => Uint8Array = (tag: string): Uint8Array => {
    const bytes: Uint8Array = syntheticTrueTypeFont();
    for (let at: number = 0; at < 4; ++at) bytes[at] = tag.charCodeAt(at);
    return bytes;
  };
  for (const [tag, words] of [
    ["OTTO", "CFF outlines"],
    ["ttcf", "font collection"],
    ["wOFF", "a WOFF font"],
    ["wOF2", "a WOFF2 font"],
    ["abcd", "not a TrueType font"],
  ] as const)
    TestValidator.predicate(
      `sfnt tag ${tag} refuses`,
      throwsError(
        (): unknown => AutoMovieIngestFont.decode(tagged(tag)),
        words,
      ),
    );

  for (const table of ["head", "hhea", "maxp", "cmap", "hmtx", "loca", "glyf"])
    TestValidator.predicate(
      `missing ${table} refuses`,
      throwsError(
        (): unknown =>
          AutoMovieIngestFont.decode(syntheticTrueTypeFont({ omit: table })),
        `missing required table "${table}"`,
      ),
    );

  const whole: Uint8Array = syntheticTrueTypeFont();
  TestValidator.predicate(
    "a table outside the bytes refuses",
    throwsError(
      (): unknown =>
        AutoMovieIngestFont.decode(whole.subarray(0, whole.length - 4)),
      "lies outside the",
    ),
  );
  TestValidator.predicate(
    "a loca offset one byte past glyf refuses",
    throwsError(
      (): unknown =>
        AutoMovieIngestFont.decode(
          syntheticTrueTypeFont({ locaPastGlyf: true }),
        ),
      "past the end of the",
    ),
  );
  TestValidator.predicate(
    "a composite citing itself refuses",
    throwsError(
      (): unknown =>
        AutoMovieIngestFont.decode(
          syntheticTrueTypeFont({ selfComponent: true }),
        ),
      "contains itself",
    ),
  );
  TestValidator.predicate(
    "the unaltered font decodes",
    !throwsError((): unknown => AutoMovieIngestFont.decode(whole)),
  );
}
