/**
 * Logical selection and material and binding references for original piece
 * charts. Supply any shorter active station interval in metres. Omission of
 * trim, or null, keeps the complete referenced charts within that interval. A
 * trim key selects the original membership predicate.
 */
export interface IAutoMovieConstructionProfileRegion {
  /** Region identity unique within the family. */
  id: string;

  /** Authored logical selection names attached to this region. */
  logicalParts: string[];

  /** IDs of the retained original charts this region can contain. */
  pieces: string[];

  /**
   * Optional active physical station interval in metres. Omission uses the
   * profile domain.
   */
  domain?: [number, number];

  /**
   * Optional original membership owner key. Omission or null keeps the
   * referenced piece charts within their active domain.
   */
  trim?: string | null;

  /** Reference to the material owner used by the region. */
  material: string;

  /** Reference to the region's binding owner. */
  binding: string;
}
