/**
 * The closed set of contact semantics a prop placement can assert.
 *
 * {@link IAutoMoviePropRelation} states which target each kind accepts and
 * which kinds are measured rather than only resolved. A prop may assert at most
 * one `in-space` and at most one `fill-opening` relation.
 *
 * @evidence contracts/common.md#principled-implementation A closed string-literal union that `validatePropPlacements` keys its `RELATION_TARGETS` table by, so a kind's admissible target kinds and required affordance are each one lookup.
 * @evidence contracts/common.md#clear-and-simple-design Six names for the six contact claims the architecture graph can answer; target restrictions live in the validator's table and the per-kind explanation on the relation record, not in this union.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No kind is special-cased beyond contract rules: one `in-space` and one `fill-opening` per prop, and a fixed affordance per kind (`stack-top`, `socket`, `hook`) when the target is another prop.
 * @evidence contracts/common.md#meaningful-documentation States that the set is closed, where the per-kind target and measurement rules are documented, and the two once-per-prop limits.
 * @author Samchon
 */
export type AutoMoviePropRelationKind =
  | "in-space"
  | "on-support"
  | "against-boundary"
  | "fill-opening"
  | "attached"
  | "suspended";
