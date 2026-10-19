import type { IAutoMovieConvexSupportLoft } from "@automovie/interface";

/**
 * Call-local algebraic plan for a convex support section family.
 * Curves retain complete cubic XZ coefficients in metres and registry plane-pair
 * identities, with their fixed normal determinant. Event incidence joins their
 * physical endpoints; no coordinate
 * welding or sampled source data supplies that relationship.
 *
 * @evidence contracts/common.md#principled-implementation Plane-pair cubic coefficients, feasible triple-plane events and open-interval incidence describe the same admitted support field before tessellation.
 * @evidence contracts/common.md#clear-and-simple-design One internal plan transfers numerical construction between the event planner and mesh emitter; the public saved contract remains the support profiles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source mesh, original normals, per-row contour table or approximate coordinate identity enters the plan.
 * @evidence contracts/common.md#meaningful-documentation States metre coefficients, local event phases, plane incidence and temporary ownership separate from the serialized recipe.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased plan type performs no numerical operation; its producer documents event and pair costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type defines no cross-request cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One synchronous generation owns the arrays/maps until the emitter returns; no file or runtime worker is retained.
 */
export interface IAutoMovieSupportLoftPlan64 {
  /** Borrowed immutable-for-call support normals in registry order. */
  normals: readonly (readonly [number, number])[];

  /** Ordered polynomial fields and their actual algebraic event partitions. */
  spans: {
    field: IAutoMovieConvexSupportLoft["spans"][number];
    curves: Map<
      string,
      { pair: [number, number]; determinant: number; x: number[]; z: number[] }
    >;
    stations: { phase: number; triples: [number, number, number][] }[];
    continuities: [number, number, number][];
    intervals: {
      before: number;
      after: number;
      pairs: string[];
      faces: number[];
      segments: number;
    }[];
  }[];

  /** Feasible interior event stations, independently of emitted mesh size. */
  events: number;

  /** Requested ruled-face interpolation bound in metres, conditional on the numerical event partition. */
  tolerance: number;
}
