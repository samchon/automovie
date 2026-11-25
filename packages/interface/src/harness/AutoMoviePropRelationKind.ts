/**
 * The closed set of contact semantics a prop placement can assert.
 *
 * {@link IAutoMoviePropRelation} states which target each kind accepts and which
 * kinds are measured rather than only resolved. `validatePropPlacements`
 * refuses a kind paired with a target its table does not admit, a second
 * `in-space` or `fill-opening` relation on one prop, and the same kind and
 * target declared twice.
 */
export type AutoMoviePropRelationKind =
  | "in-space"
  | "on-support"
  | "against-boundary"
  | "fill-opening"
  | "attached"
  | "suspended";
