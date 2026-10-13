import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * A candidate closed metre surface with deferred geometric admission.
 * The factory owns copied mesh buffers; keep the supplied source topology unchanged while this object is used and treat the exposed mesh as read-only, because volume and methods describe that construction snapshot.
 *
 * @evidence contracts/common.md#principled-implementation The contract separates constructed volume from explicit geometry and topology admission, and expresses interior and overlap queries on the same oriented solid.
 * @evidence contracts/common.md#clear-and-simple-design One candidate object groups its resident mesh and numerical readings without introducing another source of surface geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No physiological validity is implied by closed topology or positive volume; callers must choose the explicit assertions before treating the candidate as admitted.
 * @evidence contracts/common.md#meaningful-documentation Members state cubic-metre units, signed winding, deferred failure and snapshot ownership; methods describe their numerical and admission limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface defines the candidate contract; humanBodyCappedSurface owns the algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This interface owns no cache; the factory and returned object own candidate-specific reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Runtime buffer lifetime belongs to the implementing factory and its returned object, not this erased type.
 * @author Samchon
 */
export interface IHumanBodyCappedSurface {
  /** Copied source plus centroid caps; treat all mesh arrays as read-only. */
  closed: IAutoMovieMesh;

  /** Absolute tetrahedron sum in cubic metres, before deferred admission. */
  volume: number;

  /** Oriented cubic-metre sum; its sign follows the source winding. */
  signedVolume: number;

  /**
   * Check cap geometry, closed manifold topology, source edge connectivity and an interior witness; throws at the first refusal and leaves the candidate unchanged.
   *
   * @evidence contracts/common.md#principled-implementation Admission combines the candidate's cap assertion, engine closed-manifold validation, a source-edge graph walk and solid-angle interior witness.
   * @evidence contracts/common.md#clear-and-simple-design This full assertion composes the narrower geometry operation with topology and interior checks in one declared sequence.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A positive volume alone is insufficient; each failed premise throws instead of returning a partially admitted surface.
   * @evidence contracts/common.md#meaningful-documentation The comment names the covered checks, first-error behavior and unchanged candidate.
   * @evidence contracts/performance.md#efficient-algorithms Geometry and topology scans dominate; finding an interior witness can try O(F) triangle centres with O(F) solid-angle scans each, an O(F squared) worst case.
   * @evidence contracts/performance.md#reuse-equivalent-work The existing mesh and volume are reused, while every call reruns admission because no independent validation stamp is owned.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary topology maps and witness arrays are call-local; no validation state, handles or tasks are retained after return or throw.
   */
  assertValid(): void;

  /**
   * Require finite positive volume, nonzero cap faces and no cap/source or cap/cap crossing; source topology and source/source crossings are outside this assertion.
   *
   * @evidence contracts/common.md#principled-implementation Compact exact-coordinate cap meshes and an AABB broad phase restrict engine crossing checks without changing their triangle predicates.
   * @evidence contracts/common.md#clear-and-simple-design This narrower assertion serves repeated mass trials; full topology and connectivity belong to assertValid.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero volume and degenerate or crossing caps throw; there is no success claim about unchecked source/source intersections.
   * @evidence contracts/common.md#meaningful-documentation The comment distinguishes covered cap geometry from deferred source topology and intersections; failure leaves resident arrays unchanged.
   * @evidence contracts/performance.md#efficient-algorithms Cap triangles and source AABBs are scanned, and only nearby source faces reach crossing tests; worst-case dense candidate pairs remain the engine predicate's cost.
   * @evidence contracts/performance.md#reuse-equivalent-work Resident volume and cap indices are reused; compact meshes and source candidates are rebuilt per assertion with the same construction snapshot.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Compact positions, remap tables and crossing witnesses live only for this synchronous assertion, bounded by selected triangles and vertices.
   */
  assertGeometry(): void;

  /**
   * Test shared interior with another admitted solid, ignoring boundary-only contact within the factory's diagonal-scaled numerical margins; may throw if an interior witness cannot be found.
   *
   * @evidence contracts/common.md#principled-implementation Reject disjoint AABBs, classify transverse and clipped coplanar crossings, then test interior witnesses for containment when no crossing proves overlap.
   * @evidence contracts/common.md#clear-and-simple-design Separation reads both existing candidate meshes and winding signs; triangle clipping and solid-angle containment remain numerical helpers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The same scale-relative contact margins apply to every pair; admitted closed solids are required and contact does not become a shared-volume claim.
   * @evidence contracts/common.md#meaningful-documentation The comment states the admitted-solid premise, numerical boundary policy, boolean meaning and witness failure.
   * @evidence contracts/performance.md#efficient-algorithms Bounds scan both meshes before engine crossing work; containment and witness searches add full-face scans, with quadratic witness-search worst cases on each mesh.
   * @evidence contracts/performance.md#reuse-equivalent-work Both resident meshes and signed volumes are borrowed; pair-specific crossings and witnesses are computed per call without an overlap cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Pairwise witnesses and temporary polygon arrays are synchronous call-local values, released on completion or failure without retaining the other solid.
   */
  overlaps(other: IHumanBodyCappedSurface): boolean;

  /**
   * Find a fresh XYZ metre point just inside a triangle centre, offset by 1e-7 of the model diagonal; throws if all finite candidate probes fail containment.
   *
   * @evidence contracts/common.md#principled-implementation Probe both normal directions at each nondegenerate face centre and require a solid-angle containment result; the fixed diagonal fraction is a numerical witness policy, not a guaranteed interior depth.
   * @evidence contracts/common.md#clear-and-simple-design The witness search uses only the resident capped mesh and the same containment helper used by contains.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No remembered body landmark substitutes for a witness; failure after all faces throws and extremely thin interiors remain a numerical limitation.
   * @evidence contracts/common.md#meaningful-documentation The comment gives coordinate units, fresh ownership, offset scale and failure, without promising a central or maximally distant point.
   * @evidence contracts/performance.md#efficient-algorithms At most two O(F) containment scans are tried for each of F faces, giving O(F squared) worst-case work and constant-size probe arrays per attempt.
   * @evidence contracts/performance.md#reuse-equivalent-work The mesh is reused but witnesses are not cached; each call searches the construction snapshot afresh.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary corner and normal arrays are released per search; only the successful three-coordinate point transfers to the caller, with no handles or tasks.
   */
  interiorPoint(): number[];

  /**
   * Test a metre point by the absolute oriented solid-angle sum exceeding 2*pi; requires an admitted closed surface and gives no exact boundary classification.
   *
   * @evidence contracts/common.md#principled-implementation Sum triangle solid angles using atan2 of the scalar triple product and dot-product denominator, then compare absolute winding against 2*pi.
   * @evidence contracts/common.md#clear-and-simple-design This point query reads the same resident mesh used for volume and overlap, without constructing a second surface.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No body-specific inside rule or coordinate threshold replaces the winding test; exact boundary points remain outside its classification guarantee.
   * @evidence contracts/common.md#meaningful-documentation The comment states metre coordinates, closed-surface premise, threshold and boundary limitation; the input point is borrowed and unchanged.
   * @evidence contracts/performance.md#efficient-algorithms One O(F) scan accumulates angles with constant-size temporary vectors per face and no persistent spatial index.
   * @evidence contracts/performance.md#reuse-equivalent-work The construction mesh is reused for every point; point-dependent angles are recomputed rather than cached across queries.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only scalar accumulation and temporary vectors are owned by the synchronous call; no point references, handles or tasks survive return.
   */
  contains(point: number[]): boolean;
}
