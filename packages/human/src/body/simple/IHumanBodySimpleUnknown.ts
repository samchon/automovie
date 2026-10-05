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
 * @evidence contracts/common.md#principled-implementation Each row couples one named target, its error budget, its detailed channel direction and the trial body's measurement; matching units makes both absolute admission and relative residual normalization meaningful.
 * @evidence contracts/common.md#clear-and-simple-design One record describes one solve row; its consumers are the coupled solver and the final measurement assertion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No record field identifies a person or photograph; solve directions come from the shared basis and expansion table.
 * @evidence contracts/common.md#meaningful-documentation States the producer, consumers, solver-state role, units, positivity and deterministic shared-body reading requirement.
 * @evidence contracts/modeling.md#spatial-conventions Target and tolerance use the same reading unit, metres or kilograms; the channel coefficients are basis scalars rather than spatial positions.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It describes a solve row and owns no part.
 * @evidence contracts/modeling.md#parameter-channels A row binds its scalar solve direction to existing named basis channels through signed coefficients. Zero offset leaves the current shape; the basis separately defines neutral weight zero, endpoint signs and explicit mirrored identities. A reading may depend on other rows' channels as well as its own direction, so the shared-body solver handles coupled readings. This binding establishes no new independent anatomical trait or physiological validity of the source channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part or joint.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The record contains no anatomical constant; the measurement rule and expansion own their definitions.
 * @evidenceExclude contracts/anatomy.md#permitted-range These are numerical solver premises; anatomical reach remains the basis's measured envelope.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is internal solve state derived from the named simple measurements, not an independently authored document field.
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

  /** Reading on this shared trial body (its reader and its shape), or null when the surface cannot answer. */
  read: (reader: ReturnType<typeof createHumanBodyMeasurementReader>, shape: Record<string, number>) => number | null;
}
