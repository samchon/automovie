import { IAutoMovieGeneratedAcquisition, IAutoMovieValidation } from "@automovie/interface";
import { ViolationCollector } from "../validation/ViolationCollector";

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
 * @evidence requirements/production-design/references-and-provenance.md#production-design-reference-review `validateGeneratedAcquisition` validates the generation identity recorded for bytes nothing served. This ensures reviewers can trace each adopted design reading back to its source and uncertainty.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-manifest-review `validateGeneratedAcquisition` performs generated acquisition validation when the engine closes a reviewed reference from source identity through downstream consumers.
 * @evidence requirements/evidence-and-provenance/generation-transformation-and-derivation.md#provenance-generated-output-record `validateGeneratedAcquisition` checks provider, model, request, prompt digest, input identities, seed semantics, reproducibility claim, and adopted output digest for one generated asset.
 * @evidence specifications/evidence-and-provenance/generation-transformation-and-derivation.md#evp-generated-output-receipt The generated-acquisition record implements the Engine's adopted-output receipt subset while leaving terms and discarded-candidate retention to upstream provenance.
 * @evidence requirements/evidence-and-provenance/generation-transformation-and-derivation.md#provenance-nondeterministic-generation `validateGeneratedAcquisition` requires a seed for a reproducible claim and warns that a seed attached to an irreproducible generation is not a replay handle.
 * @evidence specifications/evidence-and-provenance/generation-transformation-and-derivation.md#evp-nondeterministic-attempt-model The validator preserves the stated reproducibility boundary of one adopted attempt without claiming retry or discarded-variant history.
 * @evidence requirements/evidence-and-provenance/third-party-sources-rights-and-attribution.md#third-party-generated-source `validateGeneratedAcquisition` requires the external generator provider and model identity alongside the request and content digests for adopted bytes.
 * @evidence specifications/evidence-and-provenance/third-party-sources-rights-and-attribution.md#evp-generated-provider-provenance The Engine validates provider and model provenance for generated output but does not claim rights, terms, or attribution clearance.
 * @evidence requirements/evidence-and-provenance/chain-of-custody-and-tamper-detection.md#custody-boundary-integrity-check `validateGeneratedAcquisition` compares the recorded generated-output digest with the bytes digest supplied at the current acquisition boundary.
 * @evidence specifications/evidence-and-provenance/chain-of-custody-and-tamper-detection.md#evp-custody-boundary-receipt The direct digest comparison implements one Engine boundary integrity check without claiming a signed or multi-hop custody ledger.
 * @evidence requirements/evidence-and-provenance/completeness-freshness-and-refusal.md#evidence-reproduction-boundary `validateGeneratedAcquisition` distinguishes a seeded reproducibility claim from an explicitly irreproducible generation and retains the exact adopted output digest.
 * @evidence specifications/evidence-and-provenance/completeness-freshness-and-refusal.md#evp-reproduction-verification-boundary The acquisition validator checks the recorded replay prerequisites and current byte identity; it does not claim that a provider rerun was performed.
 * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-generation-reproducibility-boundary `validateGeneratedAcquisition` treats the returned output digest as the durable replay boundary and refuses a reproducible claim that lacks its declared seed.
 * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-nondeterministic-generation-boundary The validator distinguishes recorded output identity from request replay and does not imply that provider execution is bit-deterministic.
 * @evidence requirements/external-inputs/credentials-rights-and-provenance.md#external-provenance-acquisition-activity `validateGeneratedAcquisition` checks the provider, model, request, prompt digest, input paths, seed boundary, and output digest captured for one acquisition.
 * @evidence specifications/interchange-and-adoption/provenance-rights-and-secrets.md#interchange-generated-acquisition-snapshot The Engine validates the generated-acquisition snapshot fields it consumes while leaving credentials, rights, and network execution outside this boundary.
 * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-reproducibility-boundary `validateGeneratedAcquisition` distinguishes a recorded reproducibility claim and seed from the fixed digest of the adopted bytes without claiming provider reruns are deterministic.
 * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-fixed-output `validateGeneratedAcquisition` binds the adopted generation record to its output digest and rejects a different current byte digest.
 * @evidence requirements/external-inputs/refresh-version-pinning-and-offline.md#external-provider-tool-version-pinning `validateGeneratedAcquisition` requires the generator provider and model identities that this Engine record can pin, without inventing unavailable dataset or tool versions.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-reproducibility The validator enforces the seed-and-claim subset while keeping request replay distinct from fixed output identity.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-adoption-output The current-byte digest comparison implements the fixed adopted-output subset without claiming selection or publication authority.
 * @evidence specifications/interchange-and-adoption/revision-refresh-and-offline-cache.md#interchange-external-version-snapshot The generated acquisition retains its explicit provider and model snapshot and leaves version dimensions absent from the record unclaimed.
 */
export const validateGeneratedAcquisition = (props: {
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
