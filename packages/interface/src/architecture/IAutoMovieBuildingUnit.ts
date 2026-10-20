/**
 * One building unit and the roots of its visible and logical hierarchies.
 *
 * The element root places its visible descendant hierarchy. Logical cells/shells, boundary face frames, connector routes, support surfaces and population anchors are separately authored in world space and are not transformed by this root; relocating a coherent unit requires updating those records too. Each root belongs to one unit and every element/logical space must descend from a declared unit root.
 *
 * @evidence contracts/common.md#principled-implementation Two root ids name a unit's visible and logical trees; `validateBuiltEnvironment` requires each root to resolve with a null parent, refuses a root claimed by two units, and reports any element or space whose topmost ancestor is no unit root.
 * @evidence contracts/common.md#clear-and-simple-design An identity and two root ids express visible/logical ownership without duplicating either hierarchy. Only the element tree inherits its root transform; the logical root is ownership, not a coordinate transform over world-space geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No unit is implied: a work with zero units is refused, and an unattributed element or space is reported rather than assigned to a default unit.
 * @evidence contracts/common.md#meaningful-documentation States that the element root is the coordinate root, the exclusive ownership of roots, the total coverage of the work, and the no-parent rule on each root.
 */
export interface IAutoMovieBuildingUnit {
  /** Stable building identity within the work. */
  id: string;

  /** Root visible element. It must have no element parent. */
  element: string;

  /** Root logical space. It must have no logical-space parent. */
  space: string;
}
