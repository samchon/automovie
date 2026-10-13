import {
  IAutoMovieGeneratedAcquisition,
  IAutoMovieValidation,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { SHA256_DIGEST_PATTERN } from "../validation/constants/SHA256_DIGEST_PATTERN";

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
 *
 * @param props.acquisition Generation identity recorded for one set of bytes.
 * @param props.digest Digest the bytes must still have, or null when replaced.
 * @returns Success, possibly with the seed warning, or every violation found.
 *
 * @evidence contracts/common.md#principled-implementation Each claim is checked against what would back it: `Number.isSafeInteger` is the exact set of integers a JSON number carries without rounding, the digest form is one lowercase spelling so equal bytes compare equal as strings, and the reproducibility rules are evaluated only after the seed is known to be a real draw.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the acquisition record's honesty rules, using the collector's blank-string rule and the shared digest pattern instead of private copies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No provider or model is special-cased; an irreproducible seed is a warning by contract because it is not a defect in the bytes, and nothing is normalized to pass.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why each rule exists, the seed domain and its precedence, every field rule, the null-digest meaning, the path root, which finding is a warning, and that inputs are not resolved.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the input path count, with constant work for every other field.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A check of one generation record per call; each acquisition is validated once by its caller and nothing is shared.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Builds only the returned validation from a local collector, a bounded number of findings per field and one per input path; nothing else outlives the call.
 */
export const validateGeneratedAcquisition: (props: { /** Generation identity recorded for one set of returned bytes. */ acquisition : IAutoMovieGeneratedAcquisition ; /** Digest the returned bytes must still have, or null when a recorded local transformation has since replaced them. */ digest : string | null ; }) => IAutoMovieValidation = (props: {
  /** Generation identity recorded for one set of returned bytes. */
  acquisition: IAutoMovieGeneratedAcquisition;

  /**
   * Digest the returned bytes must still have, or null when a recorded local
   * transformation has since replaced them.
   */
  digest: string | null;
}): IAutoMovieValidation => {
  const acquisition: IAutoMovieGeneratedAcquisition = props.acquisition;
  const out: ViolationCollector = new ViolationCollector();
  const root: string = "$input";
  out.nonEmpty(`${root}.provider`, acquisition.provider, "generator provider");
  out.nonEmpty(`${root}.model`, acquisition.model, "generator model");
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
    if (!SHA256_DIGEST_PATTERN.test(acquisition[key]))
      out.push(
        "type",
        `${root}.${key}`,
        `${key} must be a lowercase "sha256:" hex digest, but was ${String(acquisition[key])}`,
        acquisition[key],
      );
  acquisition.inputs.forEach((input: string, index: number): void =>
    out.nonEmpty(
      `${root}.inputs[${index}]`,
      input,
      "generator input asset path",
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
