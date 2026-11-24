/**
 * Where a shot's font bytes come from: a font the production builds in its own
 * code, or a licensed font file it holds as a project asset.
 *
 * A closed union on `kind`. `engine` admission checks only what the record
 * states: unique nonblank ids, the required fields, and for an asset its ledger
 * licence and `"font"` use. `render`, or a host that calls `engine` itself,
 * decodes the bytes with the `ingest` TrueType decoder before any frame is
 * drawn and refuses with the decoder's diagnostic.
 */
export type IAutoMovieFontSource =
  | IAutoMovieFontSource.IEmbedded
  | IAutoMovieFontSource.IAsset;

/** The two font source kinds. */
export namespace IAutoMovieFontSource {
  /**
   * A font the production synthesizes in its own code. Its provenance is the
   * code that makes it, fixed by the digest of the bytes it produced, as
   * `IAutoMovieImage` carries code-generated PNG bytes.
   */
  export interface IEmbedded {
    /** Discriminator. */
    kind: "embedded";

    /** Nonblank id a text layer's `font` cites, unique among the shot's fonts. */
    id: string;

    /**
     * Standard-alphabet padded base64 (RFC 4648 section 4) of the TrueType
     * bytes, without a `data:` prefix.
     */
    data: string;

    /**
     * `sha256:` and the 64 lowercase hexadecimal digits of the SHA-256 of the
     * decoded bytes; `render` refuses bytes that do not hash to it.
     */
    digest: string;

    /**
     * Nonblank record of the production source file and function that build the
     * bytes, such as `src/fonts/blockFont.ts#blockFont`.
     */
    origin: string;
  }

  /**
   * A licensed font file a user production supplies as a project asset. The
   * asset ledger's `digest` fixes the bytes; its provenance must carry
   * `license` and a `"font"` use whose id is this source's id. The decoded
   * `fsType` and licence names stay beside that licence so a review can compare
   * them; the comparison is descriptive.
   */
  export interface IAsset {
    /** Discriminator. */
    kind: "asset";

    /** Nonblank id a text layer's `font` cites, unique among the shot's fonts. */
    id: string;

    /** Canonical project-relative path of the font file in the asset ledger. */
    asset: string;
  }
}
