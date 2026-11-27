import type {
  IAutoMovieAssetProvenance,
  IAutoMovieAssetUse,
  IAutoMovieFontSource,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { AutoMovieEngineSha256DigestPattern } from "../../validation/AutoMovieEngineSha256DigestPattern";

/*
 * Admit a shot's font sources from what the records state, appending findings
 * to `collector` under `path`.
 *
 * The list is optional; when present its ids must be unique within it. An
 * `"embedded"` source needs nonempty padded standard base64 `data`, a
 * `sha256:` lowercase hexadecimal `digest` and a nonblank `origin`. When the
 * asset ledger is supplied, an `"asset"` source's path must be registered, its
 * provenance must carry `license`, and it must carry a `"font"` use for this
 * production whose id is the source's id.
 *
 * No byte is decoded or hashed here: `engine` cannot reach the `ingest`
 * decoder, so `render`, or a host that builds lettering itself, decodes the
 * font, checks an embedded digest against its bytes and refuses with the
 * decoder's diagnostic. Without a ledger the asset path is not resolved, as at an
 * artifact boundary that carries no ledger.
 */
export const validateFontSources: (
  sources: readonly IAutoMovieFontSource[] | undefined,
  path: string,
  collector: IAutoMovieViolationCollector,
  ledger?: {
    /*
     * Production id whose asset uses authorize the files.
     */
    production: string;

    /*
     * The project asset ledger.
     */
    assets: readonly IAutoMovieAssetProvenance[];
  },
) => void = (
  sources: readonly IAutoMovieFontSource[] | undefined,
  path: string,
  collector: IAutoMovieViolationCollector,
  ledger?: {
    production: string;
    assets: readonly IAutoMovieAssetProvenance[];
  },
): void => {
  if (sources === undefined) return;
  const records: Map<string, IAutoMovieAssetProvenance> | undefined =
    ledger === undefined
      ? undefined
      : new Map(
          ledger.assets.map(
            (
              asset: IAutoMovieAssetProvenance,
            ): [string, IAutoMovieAssetProvenance] => [asset.path, asset],
          ),
        );
  const ids: Set<string> = new Set();
  sources.forEach((source: IAutoMovieFontSource, index: number): void => {
    const at: string = `${path}[${index}]`;
    if (ids.has(source.id))
      collector.push(
        "type",
        `${at}.id`,
        `font source id "${source.id}" must be unique among the shot's fonts`,
        source.id,
      );
    ids.add(source.id);

    if (source.kind === "embedded") {
      if (source.data.length === 0 || !BASE64.test(source.data))
        collector.push(
          "type",
          `${at}.data`,
          "embedded font data must be nonempty padded standard base64 without a data: prefix",
          source.data.slice(0, 32),
        );
      if (!AutoMovieEngineSha256DigestPattern.test(source.digest))
        collector.push(
          "type",
          `${at}.digest`,
          "embedded font digest must be sha256: and 64 lowercase hexadecimal digits",
          source.digest,
        );
      if (source.origin.trim() === "")
        collector.push(
          "type",
          `${at}.origin`,
          "embedded font origin must name the production source file and function that build the bytes",
          source.origin,
        );
      return;
    }

    if (records === undefined || ledger === undefined) return;
    const record: IAutoMovieAssetProvenance | undefined = records.get(
      source.asset,
    );
    if (record === undefined) {
      collector.push(
        "type",
        `${at}.asset`,
        `font asset "${source.asset}" is not registered in the project asset ledger; register its path, digest, licence and font use`,
        source.asset,
      );
      return;
    }
    if (record.license === undefined)
      collector.push(
        "type",
        `${at}.asset`,
        `font asset "${source.asset}" has no licence in its provenance; a font file needs a licence record`,
        source.asset,
      );
    if (
      !record.uses.some(
        (use: IAutoMovieAssetUse): boolean =>
          use.production === ledger.production &&
          use.consumer.kind === "font" &&
          use.consumer.id === source.id,
      )
    )
      collector.push(
        "type",
        `${at}.asset`,
        `font asset "${source.asset}" carries no font use for "${source.id}" in production "${ledger.production}"; add the exact typed ledger entry`,
        source.asset,
      );
  });
};

/*
 * RFC 4648 section 4 base64: the standard alphabet in padded four-character
 * groups.
 */
const BASE64: RegExp =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;