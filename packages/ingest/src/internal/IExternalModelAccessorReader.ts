/**
 * Read one admitted accessor element/component as its decoded numeric value.
 *
 * @evidence contracts/common.md#principled-implementation The function type fixes numeric indices and output while the creating owner supplies admitted view and format premises.
 * @evidence contracts/common.md#clear-and-simple-design One reader contract is shared by skin coverage and FLOAT motion copying.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The callable type does not imply arbitrary component formats or sparse support; the owning factory admits those.
 * @evidence contracts/common.md#meaningful-documentation Parameter prose names element/component order and states factory-owned payload/stride constraints.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The reader type executes no byte lookup or accessor traversal by itself.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type retains no decoded values or equivalence cache for multiple reads.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A function signature acquires no payload bytes or handles; its factory owns closure lifetime.
 */
export type IExternalModelAccessorReader = (
  element: number,
  component: number,
) => number;
