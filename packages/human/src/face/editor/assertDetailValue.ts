import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";

/**
 * Refuse a detail value outside its channel's declared range: not finite,
 * below `minimum`, above `maximum`, or fractional for a `count` channel.
 * `undefined`, which clears the field, is always admitted. Shared by
 * `setHumanFaceDetail` and `setHumanFaceHairLayerDetail`.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Connects numerical sliders to actual detailed shape settings.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Provides field meaning, applied-value inspection and anatomical attachment context.
 * @author Samchon
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
