/**
 * One building unit and the roots of its visible and logical hierarchies.
 *
 * The element root is also the unit's coordinate root, so one unit is moved,
 * turned, or tilted as a whole by its own root transform without touching the
 * others. A root belongs to exactly one unit, and every element and logical
 * space of the work must descend from some unit's root.
 *
 * @evidence contracts/common.md#principled-implementation Two root ids name a unit's visible and logical trees; `validateBuiltEnvironment` requires each root to resolve with a null parent, refuses a root claimed by two units, and reports any element or space whose topmost ancestor is no unit root.
 * @evidence contracts/common.md#clear-and-simple-design An identity and two root ids, with the hierarchy itself kept in the element and space lists, so relocating a unit is one edit to its root element's transform.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No unit is implied: a work with zero units is refused, and an unattributed element or space is reported rather than assigned to a default unit.
 * @evidence contracts/common.md#meaningful-documentation States that the element root is the coordinate root, the exclusive ownership of roots, the total coverage of the work, and the no-parent rule on each root.
 * @author Samchon
 */
export interface IAutoMovieBuildingUnit {
  /** Stable building identity within the work. */
  id: string;

  /** Root visible element. It must have no element parent. */
  element: string;

  /** Root logical space. It must have no logical-space parent. */
  space: string;
}
