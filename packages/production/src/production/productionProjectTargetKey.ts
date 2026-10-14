import { IAutoMovieDesignTarget } from "@automovie/interface";

/**
 * Encode an exact closed design target for diagnostics and consequence keys.
 *
 * @evidence contracts/common.md#principled-implementation Singleton production/world use their kind; keyed families combine kind and exact ID under the admitted design-address contract.
 * @evidence contracts/common.md#clear-and-simple-design One shared address projection keeps diagnostic attribution aligned with review keys.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No case folding or arbitrary-ID escaping changes the authored address.
 * @evidence contracts/common.md#meaningful-documentation This is a diagnostic/map key, not a validated filesystem path or cryptographic identity.
 * @evidence contracts/performance.md#efficient-algorithms Fixed dispatch and concatenation cost follows ID text; no graph scan occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work Callers reuse the string within their attempt; no mutable target cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned string; no resource is acquired.
 */
export function productionProjectTargetKey(target: IAutoMovieDesignTarget): string {
    return target.kind === "production" || target.kind === "world"
        ? target.kind
        : `${target.kind}:${target.id}`;
}
