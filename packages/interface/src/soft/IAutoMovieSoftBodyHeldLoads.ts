/** Completed-step XPBD data used to recover loads on held particles. */
export namespace IAutoMovieSoftBodyHeldLoads {
  /**
   * The force each held particle (an anchor, of zero inverse mass) bears from
   * the compliant constraints that tie it to the rest of the lattice, at the
   * end of a step: the pull a hand holding a cord's end feels.
   *
   * In XPBD a constraint's force is its gradient times its multiplier over the
   * step squared (Macklin, Müller and Chentanez 2016, MIG 2016, equation 9's
   * relation f = grad C^T lambda / dt^2). For an edge from particle i to k with
   * unit direction n from k to i, the force on k is -lambda n / dt^2; a
   * stretched edge has a negative multiplier, so the force points from the held
   * particle into the body that hangs from it. The direction is read at the
   * supplied final positions after the core's contact projection and step
   * commit.
   *
   * The multipliers come from the constraint sweeps, so this reports constraint
   * loads rather than collider reaction forces. All inputs are read without
   * modification or retention. The fresh map is read-only through its declared
   * type, but its vector values are ordinary mutable caller-owned objects. A
   * held particle with a visited edge may appear with a zero vector; absent
   * entries are not a list of all anchors.
   *
   * Each undirected edge is read only from its lower-index endpoint's
   * twelve-slot row. Edges with negative rest slots, collapsed current length
   * or equal held/free status are skipped. No dimensions, buffer sizes, dt or
   * finite results are validated here.
   */
  export type IProps = {
    /**
     * Positive integer row-major lattice width, shared with the solve that
     * produced lambda.
     */
    columns: number;

    /**
     * Positive integer lattice height; P = columns * rows determines all buffer
     * layouts.
     */
    rows: number;

    /**
     * Borrowed 3P packed final world positions in metres, used to read each
     * edge's current force direction.
     */
    position: Float64Array<ArrayBufferLike>;

    /**
     * P inverse masses in kg^-1; exactly zero denotes a held particle, and only
     * held/free edges contribute.
     */
    inverseMass: Float64Array<ArrayBufferLike>;

    /**
     * 12P rest-distance slots in AutoMovieEngineSoftBodyNeighbours order; only the negative
     * missing-neighbour sentinel is read here.
     */
    restLength: Float64Array<ArrayBufferLike>;

    /**
     * 12P accumulated XPBD multipliers in kg*m from this step; only each edge's
     * lower-index endpoint slot contributes. Read without mutation.
     */
    lambda: Float64Array<ArrayBufferLike>;

    /**
     * Finite positive step duration in seconds used by the solve; forces scale
     * by 1 / dt squared, without a local representability check.
     */
    dt: number;
  };
}
