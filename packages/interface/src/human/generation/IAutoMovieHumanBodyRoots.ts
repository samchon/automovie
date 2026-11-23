/**
 * Type contracts exchanged by AutoMovieHumanBodyRoots; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanBodyRoots {
  /**
   * Result of AutoMovieHumanBodyRoots.point. Chart point and derivative of a
   * root loop at loop parameter u; with a winding, the phase turns once with u
   * round the base's cap pole.
   */
  export type PointResult = [number, number, number, number];

  /**
   * Result of AutoMovieHumanBodyRoots.polygon. The loop sampled at n uniform
   * parameters, `[s, t]` per sample.
   */
  export type PolygonResult = [number, number][];

  /**
   * The loop argument of AutoMovieHumanBodyRoots.beyond. Whether a chart point
   * lies beyond a loop winding round the cap pole, toward the pole (`toward` +1
   * for a top pole, -1 for a bottom one): its station past the loop's station
   * at its phase, interpolated between the loop's samples ordered by phase.
   */
  export type BeyondLoop = readonly [number, number][];

  /**
   * The loop argument of AutoMovieHumanBodyRoots.station. A winding loop's
   * station at a phase, between its samples ordered by phase.
   */
  export type StationLoop = readonly [number, number][];

  /**
   * The loop argument of AutoMovieHumanBodyRoots.inside. Whether a chart point
   * lies inside a loop polygon. The point's phase is taken on the branch
   * nearest the loop's mean phase.
   */
  export type InsideLoop = readonly [number, number][];

  /**
   * The holeCharts argument of AutoMovieHumanBodyRoots.join. Join an appendage
   * to its base: the strip from the appendage's end ring to the root loop, and
   * the zipper from the loop to the base's hole.
   *
   * @param mesh Mesh buffers to grow.
   * @param coordinates Loft coordinates to grow, `[chain, station, phase]` per
   *   new vertex.
   * @param base Base chain.
   * @param baseIndex Index of the base chain in the calibration.
   * @param appendage Appendage chain.
   * @param root Root description.
   * @param ring The appendage's end ring vertices, in phase order.
   * @param phases Phase of each end ring vertex.
   * @param hole The base's hole edge, a closed vertex loop of grid vertices.
   * @param holeCharts Chart point `[s, t]` of each hole vertex.
   */
  export type JoinHoleCharts = readonly [number, number][];

  /**
   * The heights argument of AutoMovieHumanBodyRoots.trim. Chart points of a
   * chain whose surface points project along an opening's forward axis onto
   * each point of its projected outline: the opening's trim loop on that chain.
   * Each point solves the 2 by 2 system of the projection by Newton's method
   * from its neighbour's solution; the first starts from the nearest
   * forward-facing sample of the chain within the margin's height range.
   *
   * @param chain Base chain.
   * @param outline Projected outline of the opening.
   * @param heights World height range of the opening's margin, mm.
   * @returns `[station, phase]` per outline point.
   */
  export type TrimHeights = [number, number];

  /**
   * Result of AutoMovieHumanBodyRoots.trim. Chart points of a chain whose
   * surface points project along an opening's forward axis onto each point of
   * its projected outline: the opening's trim loop on that chain. Each point
   * solves the 2 by 2 system of the projection by Newton's method from its
   * neighbour's solution; the first starts from the nearest forward-facing
   * sample of the chain within the margin's height range.
   *
   * @param chain Base chain.
   * @param outline Projected outline of the opening.
   * @param heights World height range of the opening's margin, mm.
   * @returns `[station, phase]` per outline point.
   */
  export type TrimResult = [number, number][];
}
