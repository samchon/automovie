/**
 * Read one admitted accessor element/component as its decoded numeric value.
 *
 * @evidence contracts/development/design.md#principled-representation The function type fixes numeric indices and output while the creating owner supplies admitted view and format premises.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One reader contract is shared by skin coverage and FLOAT motion copying.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The callable type does not imply arbitrary component formats or sparse support; the owning factory admits those.
 * @evidence contracts/development/common.md#meaningful-documentation Parameter prose names element/component order and states factory-owned payload/stride constraints.
 */
export type IExternalModelAccessorReader = (
  element: number,
  component: number,
) => number;
