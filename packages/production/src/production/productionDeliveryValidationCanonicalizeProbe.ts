import { IAutoMovieProductionMediaProbe } from "@automovie/interface";
import { canonicalAutoMovieJsonBytes } from "./contentIdentity";

/**
 * Encode a structured media probe as canonical JSON text for exact receipt comparison; encoding errors propagate to the enclosing validation boundary.
 *
 * @evidence contracts/common.md#principled-implementation The existing canonical JSON byte encoder defines object-key order and supported structured values; Buffer UTF-8 decoding supplies a comparable string from those same bytes.
 * @evidence contracts/common.md#clear-and-simple-design A single shared representation is used for both receipt and newly observed probes, keeping canonical byte rules with contentIdentity rather than duplicating JSON normalization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts All encoded probe fields participate in equality, rather than comparing only selected convenient measurements. Canonical text equality establishes structured fact identity and does not remeasure the media.
 * @evidence contracts/common.md#meaningful-documentation The comment states canonical receipt comparison and encoding failure propagation; the actual media probe remains owned by its caller.
 * @evidence contracts/performance.md#efficient-algorithms Canonical traversal, UTF-8 bytes, Buffer wrapping, and string creation scale with the entire encoded probe size. Full encoding is required by the exact structured equality contract.
 * @evidence contracts/performance.md#reuse-equivalent-work Each supplied current or stored probe is encoded for this comparison, with no cross-call memo because mutable nested facts would require a stronger immutable ownership contract.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The encoding and text are temporary call results without a size cap. No native handle or persistent cache is acquired, and the caller owns the resulting comparison string.
 */
export const productionDeliveryValidationCanonicalizeProbe: (probe: IAutoMovieProductionMediaProbe) => string = (probe: IAutoMovieProductionMediaProbe): string =>
  Buffer.from(canonicalAutoMovieJsonBytes(probe)).toString("utf8");
