/**
 * One resident object's actual bounding box and stable population ordinal.
 * The box encloses its geometry in the query's shared coordinate frame; its
 * centre chooses median partitions and never substitutes for that geometry.
 *
 * @author Samchon
 */
export interface IAutoMovieSpatialQueryEntry {
  /** Ordinal in the owner's original resident population. */
  ordinal: number;

  /** Componentwise minimum of the actual enclosing box. */
  low: number[];

  /** Componentwise maximum of the actual enclosing box. */
  high: number[];

  /** Finite partition centre; does not alter the box or geometry. */
  centre: number[];
}
