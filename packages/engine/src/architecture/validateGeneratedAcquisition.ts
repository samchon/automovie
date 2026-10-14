import {
  IAutoMovieGeneratedAcquisition,
  IAutoMovieValidation,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { SHA256_DIGEST_PATTERN } from "../validation/constants/SHA256_DIGEST_PATTERN";

/**
 * Validate authored generation metadata beside a supplied output-digest identity.
 *
 * A record claiming reproducibility must carry a seed, while a seed beside a false reproducibility claim produces a consistency warning. Presence is evidence that the field was recorded; this gate invokes no provider and proves neither replay nor whether the output was externally served.
 *
 * A seed must be a safe integer within ±(2^53-1), so adjacent integer identities survive JSON-number transport; fractional, nonfinite and larger-magnitude values are refused before the presence/warning rules. The actual provider's seed domain remains outside this metadata gate.
 *
 * Provider and model must be non-blank, present request ids and prompts non-blank, and both digests lowercase `sha256:` hex. A supplied digest must equal outputDigest. Findings use `$input` paths; an irreproducible seed is a non-blocking warning. Input slots, including holes, are visited by index and checked for nonblank strings without resolving paths. Non-throwing collection assumes the declared acquisition/container and string shapes; malformed runtime containers can throw before findings are returned.
 *
 * @param props.acquisition Generation identity recorded for one set of bytes.
 * @param props.digest Digest the bytes must still have, or null when replaced.
 * @returns Success, possibly with the seed warning, or every violation found.
 *
 * @evidence contracts/common.md#principled-implementation Number.isSafeInteger admits the integer range whose adjacent seed identities survive JSON-number transport. Digest spelling is lowercase SHA-256, and seed-presence rules run after seed-domain admission; this metadata gate does not execute the provider or certify replay of its bytes.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the acquisition record's honesty rules, using the collector's blank-string rule and the shared digest pattern instead of private copies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No provider or model is special-cased; an irreproducible seed is a warning by contract because it is not a defect in the bytes, and nothing is normalized to pass.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why each rule exists, the seed domain and its precedence, every field rule, the null-digest meaning, the path root, which finding is a warning, and that inputs are not resolved.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the input path count plus lengths of strings trimmed or tested; numeric and Boolean fields add constant work. Findings retain rejected values instead of copying asset bytes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One supplied generation record is checked per call; this gate retains no shared result and makes no equivalence assumption about mutable records.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Builds only the returned validation from a local collector, a bounded number of findings per field and one per input path; nothing else outlives the call.
 */
export const validateGeneratedAcquisition: (props: {
  /** Generation identity recorded for one set of returned bytes. */ acquisition: IAutoMovieGeneratedAcquisition;
  /** Digest the returned bytes must still have, or null when a recorded local transformation has since replaced them. */ digest:
    | string
    | null;
}) => IAutoMovieValidation = (props: {
  /** Generation identity recorded for one set of returned bytes. */
  acquisition: IAutoMovieGeneratedAcquisition;

  /** Digest the returned bytes must still have, or null after a recorded local transformation. */
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
