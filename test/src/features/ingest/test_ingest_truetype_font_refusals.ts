import { AutoMovieIngestFont } from "@automovie/ingest";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

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
 * 6. Shorten a table or subtable extent while retaining its bytes to detect reads
 *    beyond the declared boundary.
 * 7. The unaltered font decodes, so each refusal comes from its one change.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Feeds the original and altered in-memory fonts to the public decoder and checks refusals by format, table or glyph.
 * @evidence contracts/development/testing.md#independent-expectations OpenType specifies the sfnt tags, required tables and declared byte spans. Each negative case modifies just one fact of the unchanged positive font. A shortened table keeps its original bytes, so only checking the total file would miss the defect.
 * @evidence contracts/development/common.md#meaningful-documentation Names the malformed inputs and the independent edited and unedited cases in seven scenarios.
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
  for (const [table, length] of [
    ["hmtx", 0],
    ["cmap", 12],
    ["name", 6],
  ] as const) {
    const bytes: Uint8Array = syntheticTrueTypeFont();
    const view: DataView = new DataView(bytes.buffer);
    view.setUint32(recordOf(view, table) + 12, length);
    assert.throws(
      () => AutoMovieIngestFont.decode(bytes),
      new RegExp(table, "u"),
    );
  }
  for (const format of [4, 12] as const) {
    const bytes: Uint8Array = syntheticTrueTypeFont({ cmapFormat: format });
    const view: DataView = new DataView(bytes.buffer);
    const cmap: number = view.getUint32(recordOf(view, "cmap") + 8);
    const subtable: number = cmap + view.getUint32(cmap + 8);
    if (format === 4) view.setUint16(subtable + 2, 14);
    else view.setUint32(subtable + 4, 16);
    assert.throws(() => AutoMovieIngestFont.decode(bytes), /cmap format/);
  }
  const shortKern: Uint8Array = syntheticTrueTypeFont();
  const kernView: DataView = new DataView(shortKern.buffer);
  const kern: number = kernView.getUint32(recordOf(kernView, "kern") + 8);
  kernView.setUint16(kern + 4 + 2, 6);
  assert.throws(() => AutoMovieIngestFont.decode(shortKern), /kern format/);

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

function recordOf(font: DataView, tag: string): number {
  for (let index: number = 0; index < font.getUint16(4); ++index) {
    const record: number = 12 + index * 16;
    const name: string = String.fromCharCode(
      font.getUint8(record),
      font.getUint8(record + 1),
      font.getUint8(record + 2),
      font.getUint8(record + 3),
    );
    if (name === tag) return record;
  }
  throw new Error(`Missing synthetic font table "${tag}".`);
}
