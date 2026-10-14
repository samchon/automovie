/**
 * An actual external channel's binding to its body endpoint gain.
 *
 * @evidence contracts/common.md#principled-implementation An actual external channel names the body endpoint gain and its own positive endpoint for exact composition coherence checks.
 * @evidence contracts/common.md#clear-and-simple-design The binding separates external channel identity from body endpoint authority and the channel's positive declaration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts HumanBodyExternalEndpointContributions validates actual recognized endpoint equality; a named driver cannot fabricate resident geometry.
 * @evidence contracts/common.md#meaningful-documentation All three members state their respective owners instead of treating channel and endpoint names as interchangeable.
 * @evidenceExclude contracts/performance.md#efficient-algorithms External channel-to-body binding shape is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work External channel-to-body binding shape specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources External channel-to-body binding shape acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
 *
 *
 * @author Samchon
 */
export interface IAutoMovieHumanEndpointSourceDriver {
  /** Actual external channel identity. */
  channel: string;

  /** Body-owned endpoint whose gain it consumes. */
  endpoint: string;

  /** Positive endpoint declared by that actual external channel. */
  positive: string;
}
