import type { IAutoMovieMark } from "../../index.js";
import type { IAutoMovieInspectionRequest } from "./IAutoMovieInspectionRequest.js";

/**
 * Mark-kind defaults, occupied colors and ordered recoloring rules. resolveAutoMovieInspectionColors rejects conflicting label/default-color declarations for one kind and rejects final color collisions with another kind or reserved use. Later matching recolor entries win; returned styles are fresh mutable records.
 *
 * @evidence contracts/development/design.md#principled-representation Later matching recolor entries win; returned styles are fresh mutable records.
 * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieInspectionColors exchanges marks, reserved, recolor; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Later matching recolor entries win; returned styles are fresh mutable records.
 * @evidence contracts/development/common.md#meaningful-documentation Mark-kind defaults, occupied colors and ordered recoloring rules. resolveAutoMovieInspectionColors rejects conflicting label/default-color declarations for one kind and rejects final color collisions with another kind or reserved use. The prose and members document how resolveAutoMovieInspectionColors interprets and admits these values.
 */
export interface IAutoMovieResolveInspectionColorsProps {
  /** Every mark drawn in the picture. */
  marks: readonly IAutoMovieMark[];

  /** Colours the picture uses for something other than a kind, each with what uses it. */
  reserved: readonly { 
/** Human-readable identity owning this reserved picture color. */
use: string; 
/** Packed sRGB RGB integer assigned to the reservation or matching mark kind. */
color: number }[];

  /** Colours the request gives kinds for this picture, later entries winning. */
  recolor: readonly IAutoMovieInspectionRequest.IColor[];
}
