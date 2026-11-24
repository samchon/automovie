/**
 * How one staged set piece of a composed environment is supported.
 *
 * `environmentSupportReport` in `engine` measures every set piece and reports
 * findings without refusing anything, because a hanging lamp or a flying prop
 * can be intended.
 */
export interface IAutoMovieSetPieceSupport {
  /** The piece's staged node, unique across the stage. */
  node: string;

  /**
   * The verdict:
   *
   * - `resting`: the piece's underside is within the tolerance of a walkable
   *   surface or another piece's box top under its footprint;
   * - `wall-borne`: it does not rest, but its back box face is within the
   *   tolerance of the wall a furnishing `wall` relation placed it on;
   * - `floating`: the nearest support under it is more than the tolerance below
   *   its underside, or nothing lies under or over it;
   * - `sunk`: nothing is under it, and the lowest support over its underside is
   *   more than the tolerance above it;
   * - `unresolved`: its model has no measurable rest extent;
   * - `declared`: it is a prop with a declared placement, which prop placement
   *   validation judges instead.
   *
   * A piece of a composed building carries the verdict the building's own
   * support sweep gives it: `resting` for a grounded or borne body.
   */
  status:
    | "resting"
    | "wall-borne"
    | "floating"
    | "sunk"
    | "unresolved"
    | "declared";

  /**
   * Signed gap in metres: the underside's height above the chosen support,
   * negative when sunk into it; for `wall-borne`, the back face's distance out
   * from the wall. Null for `declared` and `unresolved`, for a `floating` piece
   * with nothing under or over it, and for a building body the sweep reports
   * without a gap.
   */
  gap: number | null;

  /**
   * The chosen support: a walkable surface id, a staged node, a wall id for
   * `wall-borne` or a building body's element id; null when there is none.
   */
  support: string | null;
}
