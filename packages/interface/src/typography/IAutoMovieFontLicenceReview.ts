import type { IAutoMovieAssetLicense } from "../production/IAutoMovieAssetLicense";
import type { IAutoMovieFont } from "./IAutoMovieFont";

/**
 * One licensed font file's decoded embedding permissions and licence names
 * beside the licence its asset ledger records, so a review can compare what the
 * font says about itself with what the production recorded.
 *
 * The comparison is descriptive: neither side is judged, as
 * `IAutoMovieAssetLicense` and `IAutoMovieFont.fsType` state, and a font whose
 * `fsType` restricts embedding or whose `name` licence differs from the ledger
 * is not refused by it. `engine`'s `reviewAutoMovieFontLicences` builds one row
 * per `"asset"` font source.
 */
export interface IAutoMovieFontLicenceReview {
  /** The font source id a text layer cites. */
  id: string;

  /** The font file's canonical project-relative ledger path. */
  asset: string;

  /**
   * The decoded `OS/2` `fsType` embedding permission bits, or `null` when the
   * font has no `OS/2` table.
   */
  fsType: IAutoMovieFont["fsType"];

  /** The decoded `name` records: family, licence description and licence URL. */
  names: IAutoMovieFont["names"];

  /**
   * The licence the asset ledger records for the file, or `null` when its
   * record carries none or the path is not registered.
   */
  license: IAutoMovieAssetLicense | null;
}
