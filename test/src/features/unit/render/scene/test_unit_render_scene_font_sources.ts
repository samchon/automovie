import { decodeAutoMovieTrueTypeFont } from "@automovie/ingest";
import type {
  IAutoMovieFont,
  IAutoMovieFontSource,
} from "@automovie/interface";
import { decodeAutoMovieFontSources } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";

import { rejectsError } from "../../../internal/predicates";
import { syntheticTrueTypeFont } from "../../../internal/syntheticTrueTypeFont";

/**
 * A shot's font sources decode to the decoder's records by id, and a source
 * whose bytes are not what it states is refused before any frame.
 *
 * Scenarios:
 *
 * 1. A valid embedded source and a valid asset source return records deep-equal to
 *    the decoder's own output, keyed by their ids.
 * 2. An embedded source whose digest is not the SHA-256 of its bytes is refused as
 *    a digest mismatch.
 * 3. An embedded source with a correct digest over bytes the decoder refuses (a
 *    CFF `OTTO` font) is refused with the decoder's diagnostic and the source
 *    id.
 * 4. An asset source without an asset reader, an asset whose read fails (refused
 *    naming the source, the asset and the reader's error) and a duplicate id
 *    are refused.
 */
export async function test_unit_render_scene_font_sources(): Promise<void> {
  const bytes: Uint8Array = syntheticTrueTypeFont();
  const embedded: (data: Uint8Array) => IAutoMovieFontSource.IEmbedded = (
    data: Uint8Array,
  ): IAutoMovieFontSource.IEmbedded => ({
    kind: "embedded",
    id: "block",
    data: Buffer.from(data).toString("base64"),
    digest: `sha256:${createHash("sha256").update(data).digest("hex")}`,
    origin:
      "test/src/features/internal/syntheticTrueTypeFont.ts#syntheticTrueTypeFont",
  });
  const readAsset: (path: string) => Promise<Uint8Array> = async (
    path: string,
  ): Promise<Uint8Array> => {
    if (path !== "assets/fonts/licensed.ttf")
      throw new Error(`no asset ${path}`);
    return syntheticTrueTypeFont({ cmapFormat: 12 });
  };

  // 1. Both kinds decode to the decoder's records.
  const fonts: Map<string, IAutoMovieFont> = await decodeAutoMovieFontSources({
    sources: [
      embedded(bytes),
      { kind: "asset", id: "licensed", asset: "assets/fonts/licensed.ttf" },
    ],
    readAsset,
  });
  TestValidator.equals("ids", [...fonts.keys()], ["block", "licensed"]);
  TestValidator.equals(
    "embedded record equals the decoder's",
    fonts.get("block"),
    decodeAutoMovieTrueTypeFont(bytes),
  );
  TestValidator.equals(
    "asset record equals the decoder's",
    fonts.get("licensed"),
    decodeAutoMovieTrueTypeFont(syntheticTrueTypeFont({ cmapFormat: 12 })),
  );

  // 2. A wrong digest.
  const other: Uint8Array = syntheticTrueTypeFont({ cmapFormat: 12 });
  TestValidator.predicate(
    "a digest that is not the bytes' refuses",
    await rejectsError(
      (): Promise<unknown> =>
        decodeAutoMovieFontSources({
          sources: [{ ...embedded(bytes), digest: embedded(other).digest }],
        }),
      ["block", "not its recorded digest"],
    ),
  );

  // 3. The decoder's refusal passes through.
  const cff: Uint8Array = syntheticTrueTypeFont();
  cff.set([0x4f, 0x54, 0x54, 0x4f]);
  TestValidator.predicate(
    "a font the decoder refuses is refused with its diagnostic",
    await rejectsError(
      (): Promise<unknown> =>
        decodeAutoMovieFontSources({ sources: [embedded(cff)] }),
      ['Font source "block" cannot be decoded', "CFF outlines"],
    ),
  );

  // 4. Missing reader and duplicate id.
  TestValidator.predicate(
    "an asset source without a reader refuses",
    await rejectsError(
      (): Promise<unknown> =>
        decodeAutoMovieFontSources({
          sources: [
            {
              kind: "asset",
              id: "licensed",
              asset: "assets/fonts/licensed.ttf",
            },
          ],
        }),
      "no asset reader",
    ),
  );
  TestValidator.predicate(
    "a failed asset read refuses naming the source and the asset",
    await rejectsError(
      (): Promise<unknown> =>
        decodeAutoMovieFontSources({
          sources: [
            { kind: "asset", id: "missing", asset: "assets/fonts/gone.ttf" },
          ],
          readAsset,
        }),
      [
        'Font source "missing" cannot read asset "assets/fonts/gone.ttf"',
        "no asset assets/fonts/gone.ttf",
      ],
    ),
  );
  TestValidator.predicate(
    "a duplicate id refuses",
    await rejectsError(
      (): Promise<unknown> =>
        decodeAutoMovieFontSources({
          sources: [embedded(bytes), embedded(bytes)],
        }),
      "listed twice",
    ),
  );
}
