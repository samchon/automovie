/**
 * Options of `measureHumanBodyBasisChannels`.
 *
 * @evidence contracts/common.md#principled-implementation An optional boolean filters channel reports by whether a measurement binding exists; omission admits all channels.
 * @evidence contracts/common.md#clear-and-simple-design The single option belongs to the channel measurement operation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Filtering names a supported editor requirement rather than a consumer identity.
 * @evidence contracts/common.md#meaningful-documentation The property documents the effect of both true and omission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The measurement filtering options declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The measurement filtering options schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The measurement filtering options type acquires no handles, tasks or retained storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyChannelScaleOptions {
  /** Report only channels with a measurement; omitted reports every channel. */
  measuredOnly?: boolean;
}
