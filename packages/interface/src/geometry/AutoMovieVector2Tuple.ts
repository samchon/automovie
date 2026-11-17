/**
 * Two ordered Cartesian components used by planar geometry and numerical curves.
 *
 * The containing field defines the chart axes, coordinate frame and units. A
 * point and a derivative can use the same representation without implying the
 * same units: recovery conic positions use millimetres, while derivatives use
 * millimetres per power of their source parameter. This is not an interval,
 * pair of indices or polynomial coefficient pair.
 *
 * The tuple is mutable; APIs accepting borrowed coordinates use `Readonly`.
 * Allocation, retention and mutation belong to the operation's contract. The
 * type fixes dimension only. Each numerical caller must admit finite values
 * and compatible frames; interface performs no validation or conversion.
 *
 * @evidence contracts/development/design.md#principled-representation A fixed ordered pair represents Cartesian coordinates without inventing a universal chart or unit; owning fields preserve those physical meanings.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Shared planar geometry and recovery evaluators use one tuple representation with readonly views for borrowed inputs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Index pairs, parameter intervals and coefficient pairs remain separate despite having two numbers.
 * @evidence contracts/development/common.md#meaningful-documentation States coordinate ordering, field-owned units and frames, mutation ownership and caller admission obligations.
 */
export type AutoMovieVector2Tuple = [x: number, y: number];
