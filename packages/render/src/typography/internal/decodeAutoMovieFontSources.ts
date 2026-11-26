import { AutoMovieIngestFont } from "@automovie/ingest";
import type { IAutoMovieFont } from "@automovie/interface";

import type { IAutoMovieRenderTypographyDecodeFontSourcesProps } from "../AutoMovieRenderTypography.js";

/**
 * RFC 4648 section 4 base64: the standard alphabet in padded four-character
 * groups.
 */
const BASE64: RegExp =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

/** Decode the font-source records used by surface text layout. */
export async function decodeAutoMovieFontSources(
  props: IAutoMovieRenderTypographyDecodeFontSourcesProps,
): Promise<Map<string, IAutoMovieFont>> {
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
