import type { AutoMovieHumanFaceMeasurementReading } from "../structures/AutoMovieHumanFaceMeasurementReading";
import type { IAutoMovieHumanFaceBasisBuilderOptions } from "../structures/IAutoMovieHumanFaceBasisBuilderOptions";
import type { IAutoMovieHumanFaceConstruction } from "../structures/IAutoMovieHumanFaceConstruction";
import type { IAutoMovieHumanFaceContactSummary } from "../structures/IAutoMovieHumanFaceContactSummary";

/** Publish the existing copied observations only after the ordinary builder admits this exact model.
 *
 * @evidence contracts/common.md#principled-implementation The admitted model supplies the same copied contact, hair and source observations as before.
 * @evidence contracts/common.md#clear-and-simple-design One owner preserves successful observation publication after admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No failed construction is published as a successful observation.
 * @evidence contracts/common.md#meaningful-documentation States publication timing and copied source ownership.
 */
export function publishHumanFaceConstruction(
  options: IAutoMovieHumanFaceBasisBuilderOptions | undefined,
  value: Omit<IAutoMovieHumanFaceConstruction, "admission">,
  summary: IAutoMovieHumanFaceContactSummary | null,
  readings: AutoMovieHumanFaceMeasurementReading[],
): void {
  options?.observe?.(summary === null ? null : structuredClone(summary));
  options?.observeHairParts?.([...value.hairPartIds]);
  options?.observeHairContactLayouts?.(structuredClone(value.hairContactLayouts));
  options?.observeMaterialAttachments?.(structuredClone(value.materialAttachments));
  options?.observeMeasurements?.(readings);
  options?.observeReference?.(
    value.reference === undefined
      ? undefined
      : structuredClone(value.reference),
  );
  options?.observeOralMeasurements?.(
    value.oral === undefined ? undefined : structuredClone(value.oral),
  );
}
