/**
 * A section family defined by cubic offsets of fixed oriented support planes.
 * At physical Y, the XZ section is the intersection of nx X + nz Z <= h(Y).
 * Offsets and stations use metres; plane normals are dimensionless unit vectors.
 * The intersection describes convex sections, independently of whether the
 * physical source was convex. Empty, unbounded and numerically unresolved
 * sections are outside the generation contract. Ends remain open.
 *
 * @evidence contracts/common.md#principled-implementation Fixed oriented inequalities and complete cubic Bernstein offset profiles define a continuous section family without row samples or a source mesh. Plane intersections determine its boundary curves and their changes in incidence.
 * @evidence contracts/common.md#clear-and-simple-design One plane registry and ordered offset spans own both generated surfaces and construction; generation budgets and observation uncertainty belong to their respective callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source positions, triangle indices, normals, per-row polygon table or hidden cap supplies the section field. A convex intersection does not identify a hidden concavity or certify an enclosure of unknown true geometry.
 * @evidence contracts/common.md#meaningful-documentation States metre units, outward unit normals, inequality sign, Bernstein ordering, shared endpoints, convex-section interpretation and open/unsupported regions.
 * @author Samchon
 */
export interface IAutoMovieConvexSupportLoft {
  /** Unique plane identities with outward [nx,nz] unit normals in XZ. */
  planes: { id: string; normal: [number, number] }[];

  /** Increasing exactly adjacent physical Y intervals and their offset fields. */
  spans: {
    /** Lower and upper physical Y, in metres. */
    interval: [number, number];

    /** Four Bernstein offsets per plane, in registry order; neighbours share endpoint values exactly. */
    offsets: [number, number, number, number][];
  }[];
}
