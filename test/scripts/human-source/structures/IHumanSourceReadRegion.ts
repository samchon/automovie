/**
 * A skin region bounded by a loop read from rendered frames: the loop of
 * base-mesh vertices in closed order, a vertex inside the region, and a
 * vertex certainly outside it, which proves the loop separates the two.
 *
 * @author Samchon
 */
export interface IHumanSourceReadRegion {
  /** Base-mesh vertices of the bounding loop, in closed order. */
  loop: number[];

  /** A base-mesh vertex inside the region. */
  seed: number;

  /** A base-mesh vertex outside the region. */
  outside: number;

  /** Local frames the reading was made on (never published). */
  frames: string;
}
