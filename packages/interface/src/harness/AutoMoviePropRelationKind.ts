/**
 * The closed set of contact semantics a prop placement can assert.
 *
 * {@link IAutoMoviePropRelation} states which target each kind accepts and
 * which kinds are measured rather than only resolved. A prop may assert at most
 * one `in-space` and at most one `fill-opening` relation.
 *
 * @author Samchon
 */
export type AutoMoviePropRelationKind =
  | "in-space"
  | "on-support"
  | "against-boundary"
  | "fill-opening"
  | "attached"
  | "suspended";
