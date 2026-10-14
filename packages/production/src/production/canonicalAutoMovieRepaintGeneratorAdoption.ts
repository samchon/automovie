import { IAutoMovieRepaintGeneratorAdoption } from "@automovie/interface";
import { canonicalizeAutoMovieJson } from "./contentIdentity";
import { productionRepaintIdentityHasExactKeys } from "./productionRepaintIdentityHasExactKeys";
import { canonicalAutoMovieRepaintRuntimeIdentity } from "./canonicalAutoMovieRepaintRuntimeIdentity";
import { canonicalAutoMovieRepaintGeneratorProvenance } from "./canonicalAutoMovieRepaintGeneratorProvenance";

/**
 * Canonicalize an exact runtime-identity/provenance pair after both admission paths complete.
 *
 * Inputs remain unchanged and failures propagate in runtime-then-provenance order. This descriptive adoption does not install a provider or establish an authoring-app caller.
 *
 * @evidence contracts/common.md#principled-implementation The pair admits exactly its two enumerable fields and delegates their existing runtime/provenance policies before canonicalizing the complete adoption.
 * @evidence contracts/common.md#clear-and-simple-design Composition preserves one policy owner for each member without another host or generator representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither partial adoption nor extra fields pass, and accepted descriptive records do not imply provider installation or a production app consumer.
 * @evidence contracts/common.md#meaningful-documentation Prose states unchanged operands, member failure order and metadata-only adoption semantics.
 * @evidence contracts/performance.md#efficient-algorithms Both member validators canonicalize their records before the complete pair is canonicalized again; cost includes these actual repeated traversals and text allocations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous admission composes current member checks and owns no equivalent-work coordinator; discarded member strings do not constitute a retained cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Member strings and key arrays are temporary and only the final canonical pair escapes; no provider session or background task is retained.
 */
export const canonicalAutoMovieRepaintGeneratorAdoption: (adoption: IAutoMovieRepaintGeneratorAdoption) => string = (
  adoption: IAutoMovieRepaintGeneratorAdoption,
): string => {
  if (
    productionRepaintIdentityHasExactKeys(adoption, ["runtimeIdentity", "generatorProvenance"]) === false
  )
    throw new Error(
      "Repaint generator adoption must contain exactly runtimeIdentity and generatorProvenance.",
    );
  canonicalAutoMovieRepaintRuntimeIdentity(adoption.runtimeIdentity);
  canonicalAutoMovieRepaintGeneratorProvenance(adoption.generatorProvenance);
  return canonicalizeAutoMovieJson(adoption);
};
