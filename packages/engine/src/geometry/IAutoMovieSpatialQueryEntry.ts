/**
 * One resident object's actual bounding box and stable population ordinal.
 * The box encloses its geometry in the query's shared coordinate frame; its
 * centre chooses median partitions and never substitutes for that geometry.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Lets resident geometry owners share a finite candidate partition without changing coordinates or identities.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Retains the original population ordinal and enclosing bounds for deterministic geometric queries.
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
