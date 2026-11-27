import type { IAutoMovieSupportSectionVertex } from "./IAutoMovieSupportSectionVertex";

/**
 * Prepared half-plane intersection queries with fixed section directions.
 *
 * The inequality is nx X + nz Z <= offset in a common XZ metre chart; tight
 * plane indices identify corners independently of coordinate proximity. Dense
 * finite unit normals, matching finite offsets, bounded directions and a finite
 * sine threshold in (0,1) are caller admission premises; the query checks
 * finite intersections, feasible weak pairs and positive area.
 */
export namespace IAutoMovieCreateSupportSectionQuery {
  /**
   * Fixed half-plane directions prepared for independent changing-offset
   * queries. Copy the admitted finite unit normals and compute every exact
   * nonparallel pair once. A successful polygon supplies only a cyclic
   * active-edge seed. Its next intersections must satisfy every current
   * inequality before that seed can be reused; otherwise full pair enumeration
   * replaces it. Bounded active normals and feasible cyclic corners prove the
   * seed polygon equals the intersection. Every tight nonparallel pair still
   * receives the weak-direction check. A conservative fixed-normal range
   * certificate admits lazy coordinates only when every pair is finite;
   * uncertified offsets retain full preflight. Offsets and output vertices are
   * never cached or shared between queries. Callers bound the plane population
   * and supply bounded section charts.
   *
   * These are admitted inputs, not a runtime validator: preparation copies
   * directions but does not check their unit length or boundedness.
   * AutoMovieEngineConvexSupportLoft.realize owns those checks on the loft
   * path; direct and recovery callers must establish equivalent premises.
   */
  export type IInput = {
    /**
     * Ordered finite unit [nx,nz] directions for nx X + nz Z <= h; copied on
     * preparation. The caller ensures bounded directions and limits their
     * count.
     */
    normals: readonly (readonly [number, number])[];

    /**
     * Finite dimensionless threshold in (0,1), admitted by the caller; any
     * feasible nonparallel tight pair with smaller absolute determinant causes
     * query refusal.
     */
    minimumDirectionSine: number;
  };

  /**
   * A caller-owned prepared section query for changing offsets over fixed
   * copied directions.
   *
   * The synchronous closure accepts one finite metre offset per prepared
   * normal, in the same order. It retains copied direction-pair data and only a
   * successful polygon's combinatorial seed until released. Each result owns
   * fresh arrays and tuples; offsets and previous outputs are not retained.
   * Numerical refusal throws synchronously without a partial polygon.
   */
  export type IResult = (
    offsets: readonly number[],
  ) => IAutoMovieSupportSectionVertex[];
}
