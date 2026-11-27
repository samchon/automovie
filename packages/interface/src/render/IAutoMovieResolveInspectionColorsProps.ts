import type { IAutoMovieMark } from "../index.js";
import type { IAutoMovieInspectionColorAssignment } from "./IAutoMovieInspectionColorAssignment";

/**
 * Mark-kind defaults, occupied colors and ordered recoloring rules.
 * resolveAutoMovieInspectionColors rejects conflicting label/default-color
 * declarations for one kind and rejects final color collisions with another
 * kind or reserved use. Later matching recolor entries win; returned styles are
 * fresh mutable records.
 */
export interface IAutoMovieResolveInspectionColorsProps {
  /** Every mark drawn in the picture. */
  marks: readonly IAutoMovieMark[];

  /**
   * Colours the picture uses for something other than a kind, each with what
   * uses it.
   */
  reserved: readonly {
    /** Human-readable identity owning this reserved picture color. */
    use: string;
    /**
     * Packed sRGB RGB integer assigned to the reservation or matching mark
     * kind.
     */
    color: number;
  }[];

  /** Colours the request gives kinds for this picture, later entries winning. */
  recolor: readonly IAutoMovieInspectionColorAssignment[];
}
