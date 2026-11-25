/**
 * One building unit and the roots of its visible and logical hierarchies.
 *
 * The element root places its visible descendant hierarchy. Logical
 * cells/shells, boundary face frames, connector routes, support surfaces and
 * population anchors are separately authored in world space and are not
 * transformed by this root; relocating a coherent unit requires updating those
 * records too. Each root belongs to one unit and every element/logical space
 * must descend from a declared unit root.
 */
export interface IAutoMovieBuildingUnit {
  /** Stable building identity within the work. */
  id: string;

  /** Root visible element. It must have no element parent. */
  element: string;

  /** Root logical space. It must have no logical-space parent. */
  space: string;
}
