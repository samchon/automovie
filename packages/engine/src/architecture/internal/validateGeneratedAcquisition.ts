import {
  IAutoMovieGeneratedAcquisition,
  type IAutoMovieValidateGeneratedAcquisition,
  IAutoMovieValidation,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { AutoMovieEngineViolationCollector } from "../../validation/AutoMovieEngineViolationCollector";
import { SHA256_DIGEST_PATTERN } from "../../validation/constants/SHA256_DIGEST_PATTERN";

/**
 * Validate authored generation metadata beside a supplied output-digest
 * identity.
 *
 * A record claiming reproducibility must carry a seed, while a seed beside a
 * false reproducibility claim produces a consistency warning. Presence is
 * evidence that the field was recorded; this gate invokes no provider and
 * proves neither replay nor whether the output was externally served.
 *
 * A seed must be a safe integer within ±(2^53-1), so adjacent integer
 * identities survive JSON-number transport; fractional, nonfinite and
 * larger-magnitude values are refused before the presence/warning rules. The
 * actual provider's seed domain remains outside this metadata gate.
 *
 * Provider and model must be non-blank, a present prompt non-blank, and both
 * digests lowercase `sha256:` hex. A supplied digest must equal outputDigest.
 * Findings use `$input` paths; an irreproducible seed is a non-blocking
 * warning. Input slots, including holes, are visited by index and checked for
 * nonblank strings without resolving paths. Non-throwing collection assumes the
 * declared acquisition/container and string shapes; malformed runtime
 * containers can throw before findings are returned.
 *
 * @param props.acquisition Generation identity recorded for one set of bytes.
 * @param props.digest Digest the bytes must still have, or null when replaced.
 * @returns Success, possibly with the seed warning, or every violation found.
 */
export function validateGeneratedAcquisition(
  props: IAutoMovieValidateGeneratedAcquisition.IProps,
): IAutoMovieValidation {
  const acquisition: IAutoMovieGeneratedAcquisition = props.acquisition;
  const out: IAutoMovieViolationCollector = new AutoMovieEngineViolationCollector();
  const root: string = "$input";
  out.nonEmpty(`${root}.provider`, acquisition.provider, "generator provider");
  out.nonEmpty(`${root}.model`, acquisition.model, "generator model");
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
  for (let index: number = 0; index < acquisition.inputs.length; ++index) {
    const input: string | undefined = acquisition.inputs[index];
    if (input === undefined) {
      out.push(
        "type",
        `${root}.inputs[${index}]`,
        "a resident generator input slot must contain its declared path",
        input,
      );
      continue;
    }
    out.nonEmpty(
      `${root}.inputs[${index}]`,
      input,
      "generator input asset path",
    );
  }
  if (props.digest !== null && acquisition.outputDigest !== props.digest)
    out.push(
      "type",
      `${root}.outputDigest`,
      `generated output digest ${acquisition.outputDigest} does not match the current bytes ${props.digest}`,
      acquisition.outputDigest,
    );
  if (
    acquisition.seed !== null &&
    Math.abs(acquisition.seed) > Number.MAX_SAFE_INTEGER
  )
    out.push(
      "range",
      `${root}.seed`,
      `a recorded seed must lie within the exact integer range a provider could have used, but was ${acquisition.seed}`,
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
}
