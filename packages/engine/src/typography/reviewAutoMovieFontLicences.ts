import type {
  IAutoMovieAssetProvenance,
  IAutoMovieFont,
  IAutoMovieFontLicenceReview,
  IAutoMovieFontSource,
} from "@automovie/interface";

/**
 * Pair each licensed font file's decoded `fsType` and licence names with the
 * licence its asset ledger records, for a review to compare.
 *
 * `fonts` is the decoded record of each source by id, as `render`'s
 * `decodeAutoMovieFontSources` returns it, since `engine` cannot decode font
 * bytes. One row is returned per `"asset"` source, in list order; an
 * `"embedded"` source is the production's own code and has no ledger licence.
 * The ledger is looked up by the source's `asset` path, and a path the ledger
 * lacks, or a record without `license`, pairs with `null`, which
 * `validateTextureAssets` refuses separately. Nothing is judged: the rows only
 * put the two descriptions side by side.
 *
 * @param props The shot's font sources, their decoded records by id and the
 *   project asset ledger.
 * @returns The rows, sharing no storage with the inputs.
 * @throws {Error} An `"asset"` source has no decoded record in `fonts`.
 */
export function reviewAutoMovieFontLicences(props: {
  /** The shot's font sources, in list order. */
  sources: readonly IAutoMovieFontSource[];

  /** Each source's decoded record by source id. */
  fonts: ReadonlyMap<string, IAutoMovieFont>;

  /** The project asset ledger. */
  assets: readonly IAutoMovieAssetProvenance[];
}): IAutoMovieFontLicenceReview[] {
  const ledger: Map<string, IAutoMovieAssetProvenance> = new Map(
    props.assets.map(
      (
        asset: IAutoMovieAssetProvenance,
      ): [string, IAutoMovieAssetProvenance] => [asset.path, asset],
    ),
  );
  const rows: IAutoMovieFontLicenceReview[] = [];
  for (const source of props.sources) {
    if (source.kind !== "asset") continue;
    const font: IAutoMovieFont | undefined = props.fonts.get(source.id);
    if (font === undefined)
      throw new Error(`Font source "${source.id}" has no decoded record`);
    const license: IAutoMovieAssetProvenance["license"] = ledger.get(
      source.asset,
    )?.license;
    rows.push({
      id: source.id,
      asset: source.asset,
      fsType: font.fsType,
      names: { ...font.names },
      license: license === undefined ? null : { ...license },
    });
  }
  return rows;
}
