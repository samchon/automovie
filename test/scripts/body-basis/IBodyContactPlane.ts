/**
 * The separating planes of two skin segments in a pose, for the body contact
 * solver.
 *
 * Two planes are offered for a pair and the caller keeps the one that asks the
 * crossing patches for the least movement: the fold plane of a parent and its
 * child, through the child's joint and bisecting the two rays that leave it
 * (the crease of a hinge), and the contact plane of any two bones,
 * perpendicular to the shortest line between the two bone segments through its
 * midpoint (two limbs pressed together). Positions are metres in the body's
 * Y-up, Z-forward frame; a bone's own axis is its rotation's local Y column,
 * and its segment runs from its head `length` metres along that axis.
 */

/** A plane in the body frame. */
export interface IBodyContactPlane {
  /** A point on the plane. */
  point: number[];

  /** Unit normal pointing to the side segment `part` belongs on. */
  normal: number[];
}
