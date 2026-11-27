/** Prepared lattice and mutable XPBD buffers for one ordered constraint sweep. */
export namespace IAutoMovieSolveSoftBodyCompliantSweep {
  /**
   * Caller-owned data for one sweep of compliant distance constraints over a
   * lattice, in place: every edge of the lattice, its row and column
   * neighbours, its diagonals and its second neighbours, projected one after
   * another with its Lagrange multiplier, the extended position-based dynamics
   * of Macklin, Müller and Chentanez 2016 ("XPBD: position-based simulation of
   * compliant constrained dynamics", MIG 2016, pp. 49-54, equations 18 and
   * 17).
   *
   * For an edge between particles i and k with rest length l, the constraint is
   * C = |x_i - x_k| - l, its gradient the unit direction n from k to i, and the
   * time-scaled compliance alpha~ = alpha / dt^2 with alpha the family's
   * compliance in metres per newton. The multiplier's increment is dlambda =
   * (-C - alpha~ lambda) / (w_i + w_k + alpha~), and the particles move by w_i
   * dlambda n and -w_k dlambda n, w the inverse masses. Compliance is a
   * material parameter rather than a per-sweep relaxation weight; finite sweep
   * counts and timestep choices can still change the numerical result. Zero
   * compliance requests a hard distance constraint without guaranteeing zero
   * residual after one sweep. On a cord, a one-wide lattice, the second
   * neighbours are its bending constraint in distance form: the distance
   * between the ends of two consecutive segments, which is regular at a
   * straight rest where the angle between the segments is not differentiable.
   *
   * Edges are visited in a fixed order (row-major particles, each with the
   * neighbours that follow it in `AutoMovieEngineSoftBodyNeighbours`), so a solve is
   * deterministic. `lambda` holds one multiplier per particle and neighbour
   * slot and is reset by the caller at the start of each step.
   *
   * Only predicted and lambda are mutated, with separate storage required for
   * the working and preparation arrays. Each undirected edge updates only its
   * lower-index endpoint's multiplier slot. Negative rest slots, zero effective
   * denominators and collapsed current edges are skipped. This helper validates
   * no buffers or numerical inputs and retains none; simulateSoftBodyCore
   * supplies domain-admitted preparation and chooses the number of sweeps.
   */
  export type IProps = {
    /**
     * Positive integer lattice width; particles are indexed by row * columns +
     * column.
     */
    columns: number;

    /**
     * Positive integer lattice height; P = columns * rows must agree with every
     * buffer.
     */
    rows: number;

    /**
     * Writable 3P packed world-metre positions, updated immediately after each
     * edge so later edges see earlier corrections.
     */
    predicted: Float64Array<ArrayBufferLike>;

    /**
     * Borrowed P inverse masses in kg^-1; zero holds that particle at its
     * supplied predicted position.
     */
    inverseMass: Float64Array<ArrayBufferLike>;

    /**
     * Borrowed 12P rest distances in metres in AutoMovieEngineSoftBodyNeighbours order; a
     * negative slot marks a missing neighbour.
     */
    restLength: Float64Array<ArrayBufferLike>;

    /**
     * Finite nonnegative structural, shear and bend compliance at indices 0, 1
     * and 2, in metres per newton.
     */
    compliance: readonly number[];

    /**
     * Writable 12P XPBD multipliers in kg*m; zero before the first sweep of
     * each step and accumulate across that step's sweeps. Reverse-edge slots
     * are unused.
     */
    lambda: Float64Array<ArrayBufferLike>;

    /**
     * Finite positive duration of this step in seconds; compliance is divided
     * by dt squared, with no local overflow/underflow check.
     */
    dt: number;
  };
}
