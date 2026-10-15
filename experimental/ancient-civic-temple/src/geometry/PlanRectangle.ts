
/** Axis-aligned plan rectangle in world metres; north is the smaller z. */
export interface PlanRectangle {
  /** Smallest world x. */
  west: number;

  /** Largest world x. */
  east: number;

  /** Smallest world z. */
  north: number;

  /** Largest world z. */
  south: number;
}
