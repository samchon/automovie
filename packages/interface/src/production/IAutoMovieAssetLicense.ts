/**
 * Descriptive licence metadata supplied with an asset. Recording it preserves provenance; compilation does not verify legal rights.
 *
 * @evidence contracts/common.md#principled-implementation Identifier, source URL and optional notice retain the supplied licensing description alongside the asset's separately verified byte provenance; the record is metadata rather than a computed rights verdict.
 * @evidence contracts/common.md#clear-and-simple-design Three descriptive fields avoid coupling asset identity to a licence taxonomy or embedding a legal evaluator into deterministic media compilation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A recorded identifier is not treated as verified permission to use an asset, and no provider name silently supplies omitted licence terms.
 * @evidence contracts/common.md#meaningful-documentation Identifies descriptive provenance ownership, terms location and optional supplied notice, and states that this record does not establish legal authorization.
 * @author Samchon
 */
export interface IAutoMovieAssetLicense {
  /** Descriptive license identifier. */
  identifier: string;

  /** Source page containing the applicable license terms. */
  url: string;

  /** Descriptive notice supplied with the asset. */
  notice?: string;
}
