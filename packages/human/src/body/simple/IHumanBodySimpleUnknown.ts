import type { createHumanBodyMeasurementReader } from "../measure/createHumanBodyMeasurementReader";
import type { humanBodySimpleShapeDirection } from "./humanBodySimpleShapeDirection";

/**
 * One requested simple measurement and its detailed-shape solve direction.
 * The expansion computes these records from its named metre/kilogram fields;
 * they are solver state rather than document controls for sculpting a surface.
 * Target and tolerance share the reading's unit. Positive target and finite
 * nonnegative tolerance are required before relative residuals are formed.
 * The callback reads the same trial body as every other row and is deterministic.
 *
 * @evidence contracts/common.md#principled-implementation A named target, matching-unit tolerance and bounded channel direction define one row of a simultaneous measurement solve.
 * @evidence contracts/common.md#clear-and-simple-design The callback reads the shared trial body while the record carries that row's acceptance and refusal identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Solver state remains separate from document controls and does not expose a vertex sculpt input.
 * @evidence contracts/common.md#meaningful-documentation Members state metre or kilogram units, positivity, tolerance and unavailable-reading meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The simple measurement solve row is a type declaration without executable processing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The simple measurement solve row coordinates no cross-call computation or caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The simple measurement solve row type itself acquires no retained runtime resources.
 *
 * @author Samchon
 */
export interface IHumanBodySimpleUnknown {
  /** The simple measurement's name, carried into a refusal. */
  name: string;

  /** Largest admitted absolute error, in the same unit as target. */
  tolerance: number;

  /** Basis-channel coefficients per scalar step and the scalar's envelope. */
  along: ReturnType<typeof humanBodySimpleShapeDirection.alone>;

  /** Positive requested reading, metres or kilograms as the callback defines. */
  target: number;

  /**
   * Reading on this shared trial body (its reader and its shape), or null when the surface cannot answer.
   *
   * @evidence contracts/common.md#principled-implementation The callback reads one target quantity on the shared trial body and returns null for an unanswered instrument.
   * @evidence contracts/common.md#clear-and-simple-design The same reader and shape let each solve row observe one consistent candidate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No row receives an independent body or substitutes a desired target as an observation.
   * @evidence contracts/common.md#meaningful-documentation The property identifies shared trial inputs and unavailable-reading behavior.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The shared trial measurement callback defines a signature rather than an executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shared trial measurement callback signature implements no cache or coordination policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The shared trial measurement callback declaration acquires no tasks, handles or retained buffers.
   */
  read: (
    reader: ReturnType<typeof createHumanBodyMeasurementReader>,
    shape: Record<string, number>,
  ) => number | null;
}
