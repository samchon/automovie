/** Buffers for one discrete self-contact projection pass over an ordered cord. */
export namespace IAutoMovieProjectSoftCordSelfContact {
  /**
   * Caller-owned positions for projecting detected overlaps between nonadjacent
   * cord segments, with positional Coulomb friction. Only predicted is changed;
   * no buffer is retained and no validation is performed by this helper. One
   * pass does not guarantee all segments end separated.
   *
   * A cord is a one-wide lattice, its particles in index order along it and
   * segment s joining particles s and s + 1. Each segment is a capsule of the
   * domain's `thickness` (its radius). For two segments, the closest points p =
   * a0 + s (a1 - a0) and q = b0 + t (b1 - b0) come from the clamped
   * segment-segment solution of Ericson ("Real-Time Collision Detection", 2005,
   * section 5.1.9). The non-penetration constraint C = |p - q| - 2r (r the
   * radius) has gradients (1 - s) n and s n on a0 and a1 and -(1 - t) n and -t
   * n on b0 and b1, n the unit direction from q to p; an active one (C < 0) is
   * projected as a position-based constraint with those gradients and the
   * particles' inverse masses (Müller, Heidelberger, Hennix and Ratcliff 2007,
   * "Position based dynamics", section 3.3).
   *
   * Friction is the position-based Coulomb model of Macklin, Müller, Chentanez
   * and Kim 2014 ("Unified particle physics for real-time applications", ACM
   * TOG 33(4):153, section 6.1), with one coefficient for sticking and sliding:
   * the relative tangential displacement of the two closest points over the
   * step is removed entirely while it is under mu times the penetration depth,
   * and shortened by mu times the depth above it, distributed over the four
   * particles as the normal correction is.
   *
   * Candidate pairs come from a uniform grid whose cell is the longest segment
   * plus two radii, so two segments within two radii of each other have
   * midpoints in neighbouring cells; segments are visited in index order and
   * each one's candidates in ascending order. The grid is built before pair
   * projections and is not updated after they move particles. Coincident
   * closest points are skipped because there is no normal; pairs with zero
   * effective inverse mass are counted but not moved. Fewer than four particles
   * have no eligible pair.
   *
   * Domain admission compares dt * referenceSpeed to thickness, but
   * referenceSpeed is a declared design value, not a runtime velocity bound.
   * This discrete pass is not continuous collision detection and does not
   * guarantee absence of tunnelling. Its return counts detected pairs,
   * including immovable overlaps, not unique contacts across sweeps.
   */
  export type IProps = {
    /**
     * Integer particle count along the cord; segment s joins s and s + 1.
     * Counts below four return zero.
     */
    count: number;

    /**
     * Borrowed 3 * count packed world-metre positions before the step, used
     * only to measure relative tangential displacement.
     */
    position: Float64Array<ArrayBufferLike>;

    /**
     * Distinct writable 3 * count packed world-metre predicted positions;
     * normal and friction corrections mutate these in pair order.
     */
    predicted: Float64Array<ArrayBufferLike>;

    /**
     * Count nonnegative inverse masses in kg^-1; zero prevents that particle
     * from moving. Read without modification.
     */
    inverseMass: Float64Array<ArrayBufferLike>;

    /**
     * Finite positive capsule radius in metres, supplied from
     * contact.thickness; overlap distance is twice this value.
     */
    radius: number;

    /**
     * Finite nonnegative dimensionless sticking/sliding coefficient; zero
     * disables tangential correction while preserving normal projection.
     */
    friction: number;
  };
}
