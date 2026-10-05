/**
 * The base-mesh side of a loop-bounded region: the faces reached from the
 * seed without crossing the loop, and the region's base vertices (their
 * corners less the loop).
 *
 * @author Samchon
 */
export interface IHumanSourceRegionFill {
  /** Base faces on the seed's side of the loop. */
  faces: Set<number>;

  /** Base vertices of those faces, loop vertices excluded. */
  vertices: number[];

  /** Loop edges as sorted "a,b" keys. */
  loopEdges: Set<string>;
}
