import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";

/**
 * One simple parameter as an input: label, unit, display scale and step. Multiplying the package value by `scale` produces the displayed value; `step` uses that display unit. The control renderer applies package limits and uses `optional` to distinguish blank preservation from a missing required reading.
 *
 * @evidence contracts/common.md#principled-implementation A closed parameter key binds display metadata to the numerical simple-shape contract, while scale converts package units to input units without changing the authored quantity.
 * @evidence contracts/common.md#clear-and-simple-design One row descriptor contains its label, conversion and blank-value policy; the renderer owns DOM creation and the Human package owns parameter bounds.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Row metadata describes supported simple parameters and their units; it includes no expected projection values, consumer-specific numerical answers or patched methods.
 * @evidence contracts/common.md#meaningful-documentation Property comments distinguish display units and steps, optional blank preservation, and measurements that require the whole person rather than the isolated body.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The descriptor contains scalar row metadata and performs no input traversal or numerical conversion itself.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This row schema caches no readings; parameter equivalence and refresh invalidation belong to the mounted control implementation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Labels and scalar settings acquire no DOM nodes or event listeners; the renderer owns the controls created from them.
 *
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
