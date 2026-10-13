import { canonicalAutoMovieJsonBytes, digestAutoMovieBytes } from "../contentIdentity";
import type { IAutoMovieDesignDerivationBasis } from "./IAutoMovieDesignDerivationBasis";
import { canonicalBasis } from "./canonicalBasis";

/**
 * Canonical SHA-256 identity of one validated producer basis.
 *
 * @evidence contracts/common.md#principled-implementation Validates and path-sorts the supplied basis before canonical JSON hashing; source authority and completeness remain the supplying reader's premises.
 * @evidence contracts/common.md#clear-and-simple-design Shares canonicalBasis with capture and lineage inspection, so hashing does not introduce another dependency ordering rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A digest identifies declared metadata, not authenticated provenance, a sandboxed evaluator or an impossible-collision proof.
 * @evidence contracts/common.md#meaningful-documentation Defines canonical metadata identity and the difference between recorded dependencies and actual executed source.
 * @evidence contracts/performance.md#efficient-algorithms Dependency sorting costs O(d log d) comparisons plus path text, validation and canonical JSON serialization/hash costs over the resulting basis.
 * @evidence contracts/performance.md#reuse-equivalent-work Stateless hashing retains no cross-call result; callers must establish the same complete basis before reusing its identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary copied basis/serialized bytes live through hashing, and only the digest escapes; no file or process is acquired.
 */
export function autoMovieDesignDerivationBasisDigest(
  basis: IAutoMovieDesignDerivationBasis,
): string { return digestAutoMovieBytes(canonicalAutoMovieJsonBytes(canonicalBasis(basis))); }
