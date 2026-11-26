import { AutoMovieIngestFont } from "@automovie/ingest";
import type {
  IAutoMovieFont,
  IAutoMovieFontSource,
} from "@automovie/interface";

/**
 * RFC 4648 section 4 base64: the standard alphabet in padded four-character
 * groups.
 */
const BASE64: RegExp =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

/**
 * Decode a shot's font sources into the records text layout reads, by source
 * id, before any frame of the shot is drawn.
 *
 * An `"embedded"` source's base64 is decoded and its SHA-256, from the Web
 * Crypto `SubtleCrypto.digest` that Node and a page in a secure context
 * (`localhost` or HTTPS, as the draw and Viewer pages are served) both provide,
 * compared with its `digest`, then its bytes go to the `ingest` TrueType
 * decoder. An `"asset"` source's bytes come from `readAsset`, the host's reader
 * of project assets, whose ledger digest the host has already verified. A
 * source the decoder refuses is refused with the decoder's diagnostic, prefixed
 * by the source id. Sources are decoded in list order and the first refusal
 * rejects the whole list, so a shot with an undecodable font draws nothing.
 *
 * `engine` admission already checked ids, fields and licences; this function
 * still refuses a duplicate id, malformed base64 and an asset source without a
 * reader, because it is also what a host calls directly.
 *
 * @param props.sources The shot's font sources.
 * @param props.readAsset Reads a project asset's bytes by its ledger path;
 *   required only when an `"asset"` source is listed.
 * @returns A new map from source id to decoded font; each record shares nothing
 *   with the input or another record.
 * @throws {Error} A duplicate id, malformed base64, a digest mismatch, a
 *   missing reader, a failed read or a decoder refusal, each naming the
 *   source.
 */
export async function decodeAutoMovieFontSources(props: {
  /** The shot's font sources, in list order. */
  sources: readonly IAutoMovieFontSource[];

  /** Project asset reader for `"asset"` sources. */
  readAsset?: (path: string) => Promise<Uint8Array>;
}): Promise<Map<string, IAutoMovieFont>> {
  const fonts: Map<string, IAutoMovieFont> = new Map();
  for (const source of props.sources) {
    if (fonts.has(source.id))
      throw new Error(`Font source "${source.id}" is listed twice`);

    let bytes: Uint8Array;
    if (source.kind === "embedded") {
      if (!BASE64.test(source.data) || source.data.length === 0)
        throw new Error(
          `Embedded font "${source.id}" data is not padded standard base64`,
        );
      // Decoded into a buffer of its own, which `digest` takes as a source.
      const decoded: Uint8Array<ArrayBuffer> = Uint8Array.from(
        atob(source.data),
        (character: string): number => character.charCodeAt(0),
      );
      bytes = decoded;
      const hash: Uint8Array = new Uint8Array(
        await globalThis.crypto.subtle.digest("SHA-256", decoded),
      );
      const digest: string = `sha256:${Array.from(
        hash,
        (byte: number): string => byte.toString(16).padStart(2, "0"),
      ).join("")}`;
      if (digest !== source.digest)
        throw new Error(
          `Embedded font "${source.id}" bytes hash to ${digest}, not its recorded digest ${source.digest}`,
        );
    } else {
      if (props.readAsset === undefined)
        throw new Error(
          `Font source "${source.id}" names asset "${source.asset}" but no asset reader was supplied`,
        );
      try {
        bytes = await props.readAsset(source.asset);
      } catch (error) {
        throw new Error(
          `Font source "${source.id}" cannot read asset "${source.asset}": ${error instanceof Error ? error.message : String(error)}`,
          { cause: error },
        );
      }
    }

    try {
      fonts.set(source.id, AutoMovieIngestFont.decode(bytes));
    } catch (error) {
      throw new Error(
        `Font source "${source.id}" cannot be decoded: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }
  return fonts;
}
