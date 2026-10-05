import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";

/**
 * One simple parameter as an input: label, unit, display scale and step.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Describes one identity or tape parameter the user enters directly.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Fixes the unit and display scale in which the parameter enters the expansion.
 * @author Samchon
 */
export interface IBodySimpleField {
  /** The simple parameter. */
  key: keyof IAutoMovieHumanBodySimpleShape;

  /** Row label. */
  label: string;

  /** Display unit; empty for a dimensionless value. */
  unit: string;

  /** Display units per metre or per unit of the parameter (cm shown for metres). */
  scale: number;

  /** Input step in display units. */
  step: number;

  /** Whether the value may be left blank. */
  optional: boolean;

  /** Whether the value is read on the whole person rather than the body alone. */
  whole: boolean;
}
