import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";

/**
 * Shared by setHumanFaceDetail, setHumanFaceHairLayerDetail, which were one file until each public identity took its own.
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
