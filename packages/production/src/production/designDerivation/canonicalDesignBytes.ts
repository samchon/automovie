import { canonicalAutoMovieJsonBytes } from "../contentIdentity";
import { AutoMovieDesignDerivationError } from "./AutoMovieDesignDerivationError";
import { errorMessage } from "./errorMessage";

/**
 * Canonicalize one evaluated value or retain its target-specific JSON refusal.
 *
 * @evidence contracts/common.md#principled-implementation Delegates canonical JSON serialization and converts its thrown cause into design-derivation-output-malformed with the logical target.
 * @evidence contracts/common.md#clear-and-simple-design JSON rules remain with canonicalAutoMovieJsonBytes while this owner adds derivation context.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not replace an unsupported value, catch a store refusal or prove evaluator purity; errors retain actual canonicalization cause text.
 * @evidence contracts/common.md#meaningful-documentation Documents target-specific refusal before this owner invokes publication and canonical byte output on success.
 * @evidence contracts/performance.md#efficient-algorithms Serialization/sorting cost follows the value's complete JSON population and output bytes; error formatting follows target and cause text.
 * @evidence contracts/performance.md#reuse-equivalent-work No byte cache is retained; mutable input values are serialized at each actual evaluation/resident comparison.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Successful bytes transfer to the candidate/caller; failures retain only target/cause strings in their Error and open no resource.
 */
export function canonicalDesignBytes(target: string, value: unknown): Uint8Array {
  try {
    return canonicalAutoMovieJsonBytes(value);
  } catch (error) {
    throw new AutoMovieDesignDerivationError(
      "design-derivation-output-malformed",
      `Design target "${target}" evaluated to a value that has no canonical JSON form (${errorMessage(error)}). No design record was published.`,
    );
  }
}
