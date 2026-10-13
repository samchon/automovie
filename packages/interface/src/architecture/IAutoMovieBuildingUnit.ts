/**
 * One building unit and the roots of its visible and logical hierarchies.
 *
 * The element root is also the unit's coordinate root, so one unit is moved,
 * turned, or tilted as a whole by its own root transform without touching the
 * others. A root belongs to exactly one unit, and every element and logical
 * space of the work must descend from some unit's root.
 *
 * @evidence contracts/common.md#principled-implementation Two root ids name a unit's visible and logical trees; `validateBuiltEnvironment` requires each to resolve with a null parent, refuses a root claimed by two units, and walks every element and space up to a declared root.
 * @evidence contracts/common.md#clear-and-simple-design A unit holds only an identity and two root ids while hierarchy lives in the elements and spaces, so placing a unit is one edit to its root element's transform.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No unit is implied: a work with zero units is refused, and an element or space whose topmost ancestor is no unit root is reported rather than attributed to a default unit.
 * @evidence contracts/common.md#meaningful-documentation States the root parent rule, that the element root is the coordinate root, and that roots are owned exclusively and cover the whole work.
 */
export interface IAutoMovieBuildingUnit {
  /** Stable building identity within the work. */
  id: string;

  /** Root visible element. It must have no element parent. */
  element: string;

  /** Root logical space. It must have no logical-space parent. */
  space: string;
}
