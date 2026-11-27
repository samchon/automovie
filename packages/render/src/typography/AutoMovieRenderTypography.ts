import type { IAutoMovieFont } from "@automovie/interface";

import type { IAutoMovieRenderTypographyDecodeFontSourcesProps } from "./IAutoMovieRenderTypographyDecodeFontSourcesProps";
import { decodeFontSourcesImplementation } from "./internal/decodeFontSourcesImplementation";

/** Render-owned typography preparation. */
export namespace AutoMovieRenderTypography {
  /**
   * Decode a shot's font sources into the records text layout reads, by source
   * id, before any frame of the shot is drawn.
   *
   * An `"embedded"` source's base64 is decoded and its SHA-256, from the Web
   * Crypto `SubtleCrypto.digest` that Node and a page in a secure context
   * (`localhost` or HTTPS, as the draw and Viewer pages are served) both
   * provide, compared with its `digest`, then its bytes go to the `ingest`
   * TrueType decoder. An `"asset"` source's bytes come from `readAsset`, the
   * host's reader of project assets, whose ledger digest the host has already
   * verified. A source the decoder refuses is refused with the decoder's
   * diagnostic, prefixed by the source id. Sources are decoded in list order
   * and the first refusal rejects the whole list, so a shot with an undecodable
   * font draws nothing.
   *
   * `engine` admission already checked ids, fields and licences; this method
   * still refuses a duplicate id, malformed base64 and an asset source without
   * a reader, because it is also what a host calls directly.
   *
   * @param props The shot's font sources and optional project asset reader.
   * @returns A new map from source id to decoded font; each record shares
   *   nothing with the input or another record.
   * @throws {Error} A duplicate id, malformed base64, a digest mismatch, a
   *   missing reader, a failed read or a decoder refusal, each naming the
   *   source.
   */
  export async function decodeFontSources(
    props: IAutoMovieRenderTypographyDecodeFontSourcesProps,
  ): Promise<Map<string, IAutoMovieFont>> {
    return decodeFontSourcesImplementation(props);
  }
}
