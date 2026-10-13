/**
 * One building unit and the roots of its visible and logical hierarchies.
 *
 * The element root is also the unit's coordinate root, so one unit is moved,
 * turned, or tilted as a whole by its own root transform without touching the
 * others. A root belongs to exactly one unit, and every element and logical
 * space of the work must descend from some unit's root.
 */
export interface IAutoMovieBuildingUnit {
  /** Stable building identity within the work. */
  id: string;

  /** Root visible element. It must have no element parent. */
  element: string;

  /** Root logical space. It must have no logical-space parent. */
  space: string;
}
