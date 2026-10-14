import type { AutoMovieHumanFaceMeasurementReading } from "../structures/AutoMovieHumanFaceMeasurementReading";
import type { IAutoMovieHumanFaceBasisBuilderOptions } from "../structures/IAutoMovieHumanFaceBasisBuilderOptions";
import type { IAutoMovieHumanFaceConstruction } from "../structures/IAutoMovieHumanFaceConstruction";
import type { IAutoMovieHumanFaceContactSummary } from "../structures/IAutoMovieHumanFaceContactSummary";

/**
 * Publish this request's observations after the ordinary entry admits its model.
 * Receipt payloads are copied, but measurement readings are borrowed request
 * data. Observer exceptions stop later notifications and cannot undo effects
 * already performed by earlier observers.
 *
 * @evidence contracts/common.md#principled-implementation The accepted construction entry invokes observers in a fixed order. Summaries, hair/layout/material receipts, reference arrays and oral records are copied; measurement readings are passed directly and must be treated as borrowed request-owned data. This publisher performs no physical admission itself.
 * @evidence contracts/common.md#clear-and-simple-design One observer boundary centralizes receipt copying and ordering after the entry's checks, while pose and measurement owners retain their original computations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Undefined observers do nothing; callback failures propagate and stop later callbacks without rolling back effects of earlier observers. Publication is not an atomic transaction or cached acceptance.
 * @evidence contracts/common.md#meaningful-documentation Observer payloads distinguish copied receipts from the borrowed measurement array; null summary and undefined optional reference/oral data preserve their existing absence meaning.
 * @evidence contracts/performance.md#efficient-algorithms Copy cost follows the payloads of observers actually installed, including all reference coordinates; measurement publication itself is one call and does not recompute geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work Completed request readings and stage receipts are reused for observers, but notification effects occur for each successful request and cannot be skipped because geometry matches.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Copies transfer to subscribers, whose retention is external to this owner; the borrowed reading array remains request-owned. No subscriber registry, task or handle is retained by the publisher.
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
