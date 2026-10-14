import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";

/**
 * Refuse a detail value outside its channel's declared range: not finite,
 * below `minimum`, above `maximum`, or fractional for a `count` channel.
 * `undefined`, which clears the field, is always admitted. Shared by
 * `setHumanFaceDetail` and `setHumanFaceHairLayerDetail`.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Registered channel metadata determines finite inclusive numeric bounds and integer-only count values; undefined is the supported field-clearing operation. Current scalar and hair-layer editors share this check, while component geometry owns coupled validity.
 * @evidence contracts/common.md#clear-and-simple-design One predicate shares scalar admission across two writers, keeping catalogue lookup and profile construction with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No out-of-range clamp or guessed neutral replaces invalid input; undefined clears rather than writes a value. Supplied catalogue bounds are premises, not independently validated clinical envelopes.
 * @evidence contracts/common.md#meaningful-documentation Prose specifies finite/inclusive/count checks, undefined clearing and both callers; void success guarantees only this declared scalar domain.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of scalar comparisons/integer checks uses constant work with no geometry/catalogue traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Both editors share this exact predicate over their already-resolved channel; changed values are checked afresh and no result cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Metadata/value are borrowed and only void/error transfers; no state, byte buffer, task or handle is retained.
 */
export function assertDetailValue(
  definition: IAutoMovieHumanFaceDetailChannel,
  value: number | undefined,
): void {
  if (
    value !== undefined &&
    (!Number.isFinite(value) ||
      value < definition.minimum ||
      value > definition.maximum ||
      (definition.unit === "count" && !Number.isInteger(value)))
  )
    throw new Error(`Invalid numerical detail: ${definition.id}.`);
}
