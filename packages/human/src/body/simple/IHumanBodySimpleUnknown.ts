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
  read: (
    reader: ReturnType<typeof createHumanBodyMeasurementReader>,
    shape: Record<string, number>,
  ) => number | null;
}
