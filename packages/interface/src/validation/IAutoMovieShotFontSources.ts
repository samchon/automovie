import type { IAutoMovieFontSource } from "../typography/IAutoMovieFontSource";

/**
 * The font sources one compiled shot lists, as texture closure admits them
 * against the asset ledger.
 *
 * Texture closure checks the list as `engine` font admission does, unique
 * nonblank ids and each kind's required fields, and, holding the ledger, each
 * `"asset"` source's file: registered, its provenance carrying `license`, and
 * authorized by a `"font"` use of this production whose id is the source's id.
 * Ids are unique within one shot's list only, so one row is one shot.
 */
export interface IAutoMovieShotFontSources {
  /** Exact shot id whose `fonts` list this is. */
  shot: string;

  /** The shot's font sources, in list order. */
  sources: readonly IAutoMovieFontSource[];
}
