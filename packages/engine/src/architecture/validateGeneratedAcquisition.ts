import {
  IAutoMovieGeneratedAcquisition,
  IAutoMovieValidation,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";

/** A plain SHA-256 content digest as this project writes it. */
const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/;

/**
 * Validate the generation identity recorded for bytes nothing served.
 *
 * The rules that matter are all about honesty rather than shape. A record that
 * claims to be reproducible must carry the seed that reproduces it, or the
 * claim is unbacked; a record that admits it is not reproducible but still
 * carries a seed is warned about, because a seed that does not replay the bytes
 * is decoration a later reader will mistake for a replay handle.
 *
 * A recorded seed must also be a number a provider could have handed back. A
 * fractional, infinite, `NaN`, or beyond-2^53 value is not null and so passes
 * both rules above while naming no draw at all, which is the invented replay
 * handle they exist to prevent. It is therefore refused before either speaks.
 *
 * Provider and model must be non-blank, a present request id or prompt must be
 * non-blank, both digests must be lowercase `sha256:` hex, and when `digest`
 * is given `outputDigest` must equal it. Findings are returned with `$input`
 * paths and nothing throws; the irreproducible-seed case is a warning, so it
 * leaves the validation successful. Input asset paths are checked for
 * blankness only, not resolved.
 */
export const validateGeneratedAcquisition = (props: {
  /** Generation identity recorded for one set of returned bytes. */
  acquisition: IAutoMovieGeneratedAcquisition;

  /**
   * Digest the returned bytes must still have, or null when a recorded local
   * transformation has since replaced them.
   */
  digest: string | null;
}): IAutoMovieValidation => {
  const { acquisition } = props;
  const out = new ViolationCollector();
  const root = "$input";
  nonEmpty(acquisition.provider, `${root}.provider`, "generator provider", out);
  nonEmpty(acquisition.model, `${root}.model`, "generator model", out);
  if (acquisition.request !== null && acquisition.request.trim() === "")
    out.push(
      "type",
      `${root}.request`,
      "generator request id must be null or non-blank",
      acquisition.request,
    );
  if (acquisition.prompt !== null && acquisition.prompt.trim() === "")
    out.push(
      "type",
      `${root}.prompt`,
      "generator prompt must be null or non-blank",
      acquisition.prompt,
    );
  for (const key of ["promptDigest", "outputDigest"] as const)
    if (!DIGEST_PATTERN.test(acquisition[key]))
      out.push(
        "type",
        `${root}.${key}`,
        `${key} must be a lowercase "sha256:" hex digest, but was ${String(acquisition[key])}`,
        acquisition[key],
      );
  acquisition.inputs.forEach((input, index) =>
    nonEmpty(
      input,
      `${root}.inputs[${index}]`,
      "generator input asset path",
      out,
    ),
  );
  if (props.digest !== null && acquisition.outputDigest !== props.digest)
    out.push(
      "type",
      `${root}.outputDigest`,
      `generated output digest ${acquisition.outputDigest} does not match the current bytes ${props.digest}`,
      acquisition.outputDigest,
    );
  if (acquisition.seed !== null && !Number.isSafeInteger(acquisition.seed))
    out.push(
      "range",
      `${root}.seed`,
      `a recorded seed must be a whole number a provider could have used, but was ${acquisition.seed}`,
      acquisition.seed,
    );
  else if (acquisition.reproducible && acquisition.seed === null)
    out.push(
      "type",
      `${root}.seed`,
      "a reproducible generation must record the seed that reproduces it",
      acquisition.seed,
    );
  else if (!acquisition.reproducible && acquisition.seed !== null)
    out.warn(
      "type",
      `${root}.seed`,
      "a seed recorded against an irreproducible generation is not a replay handle",
      acquisition.seed,
    );
  return out.toValidation();
};

const nonEmpty = (
  value: string,
  path: string,
  label: string,
  out: ViolationCollector,
): void => {
  if (value.trim().length === 0)
    out.push("type", path, `${label} must be non-empty`, value);
};
