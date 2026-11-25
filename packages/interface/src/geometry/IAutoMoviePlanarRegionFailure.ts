import type { IAutoMoviePlanarPoint } from "../architecture/IAutoMoviePlanarPoint";

/**
 * Borrowed rings checked for one unambiguous bounded planar region.
 *
 * Coordinates use local x/y metres; either ring winding is accepted and holes
 * are explicitly distinguished from the outer ring. The gate reports the first
 * ring, crossing or containment defect instead of repairing geometry; the label
 * changes diagnostics only.
 */
export namespace IAutoMoviePlanarRegionFailure {
  /**
   * Rings for deterministic planar-region hygiene checks. The checking function
   * returns `null` when they describe one unambiguous bounded region.
   *
   * The result is a message rather than repaired geometry. Drawing,
   * triangulation, and support decomposition need different outputs, but they
   * must agree on whether their shared input has an interior. A caller that can
   * report a gap may retain the message; a constructor can throw it verbatim.
   *
   * Each ring is checked in declaration order, outer ring first, for at least
   * three points, finite coordinates, no point repeated beside itself, a
   * nonzero area, no spike doubling back along its own edge, and no crossing
   * between non-neighbouring edges. Then every ring pair is checked for any
   * shared point, and finally every hole must lie inside the outer ring and
   * outside every other hole. Zero means within the absolute `PLANAR_EPSILON`
   * (1e-12) of square metres or metres. Messages name rings as `<label> outer
   * ring` and `<label> hole[i]`, with `label` defaulting to `polygon`.
   */
  export type IProps = {
    /**
     * Borrowed finite x/y metre outer ring with at least three points and
     * implicit closure; simple, nonzero-area and either winding.
     */
    outer: readonly IAutoMoviePlanarPoint[];

    /**
     * Borrowed simple rings strictly inside outer and outside one another, with
     * no touching or crossing; omitted or empty means no voids.
     */
    holes?: ReadonlyArray<readonly IAutoMoviePlanarPoint[]>;

    /**
     * Diagnostic region name; omitted defaults to polygon and an explicitly
     * empty string stays empty.
     */
    label?: string;
  };
}
