import { IAutoMovieRepaintRuntimeIdentity } from "@automovie/interface";
import { canonicalizeAutoMovieJson } from "./contentIdentity";
import { productionRepaintIdentityHasExactKeys } from "./productionRepaintIdentityHasExactKeys";
import { productionRepaintIdentityIsNonBlank } from "./productionRepaintIdentityIsNonBlank";

/**
 * Validate and canonicalize one host repaint/model identity.
 *
 * Exact enumerable keys, protocol v1, trimmed nonempty provider/model/version and the supported execution vocabulary precede engine canonical JSON. The returned string identifies descriptive metadata; it neither contacts the host nor verifies model availability or credential safety inside arbitrary identity text.
 *
 * @evidence contracts/common.md#principled-implementation Exact object-key admission and the declared protocol/execution union precede canonical JSON, so accepted key insertion order does not change identity.
 * @evidence contracts/common.md#clear-and-simple-design Runtime metadata admission stays separate from provenance, request composition and actual provider dispatch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported execution or extra enumerable keys refuse; descriptive identity text supplies no actual host availability, model-byte or credential certification.
 * @evidence contracts/common.md#meaningful-documentation Prose gives admitted text/key vocabulary, canonical string ownership and the boundary between metadata identity and host execution.
 * @evidence contracts/performance.md#efficient-algorithms Key enumeration scales with supplied keys and text checks with identifier lengths; canonicalization adds tree traversal and key sorting before one returned string.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each supplied metadata value is re-admitted and canonicalized; this scalar validator coordinates no repeated provider request or retained identity cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary key arrays and canonical encoding state expire at return or throw; only the identity string escapes and no host handle or provider task starts.
 */
export const canonicalAutoMovieRepaintRuntimeIdentity: (identity: IAutoMovieRepaintRuntimeIdentity) => string = (
  identity: IAutoMovieRepaintRuntimeIdentity,
): string => {
  if (
    productionRepaintIdentityHasExactKeys(identity, [
      "protocolVersion",
      "provider",
      "model",
      "version",
      "execution",
    ]) === false ||
    identity.protocolVersion !== "automovie.repaint-runtime.v1" ||
    productionRepaintIdentityIsNonBlank(identity.provider) === false ||
    productionRepaintIdentityIsNonBlank(identity.model) === false ||
    productionRepaintIdentityIsNonBlank(identity.version) === false ||
    (identity.execution !== "local" &&
      identity.execution !== "api" &&
      identity.execution !== "other")
  )
    throw new Error(
      "Repaint runtime identity requires protocol v1 plus non-blank provider, model, version, and a supported execution boundary.",
    );
  return canonicalizeAutoMovieJson(identity);
};
