
/**
 * One archetype parameter's accepted value kind and inclusive bounds.
 *
 * The design gate compares `kind` with the value's `typeof`, refuses any
 * non-finite number, and applies the bounds only to a `number` parameter, in
 * the unit the archetype documents (the shipped catalogue measures in meters).
 *
 * @evidence contracts/common.md#principled-implementation The kind reuses the three `typeof` names of the scalar union a recipe parameter can hold, so the gate judges a value with one `typeof` comparison and needs no second type vocabulary; the bounds are inclusive and mean nothing to a string or boolean kind, which the gate never compares against them.
 * @evidence contracts/common.md#clear-and-simple-design A kind and two optional numeric limits are all the gate reads from a rule; the unit stays in the owning archetype's documentation rather than a unit field no consumer would read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The kind union is closed to the recipe's own scalar kinds, a contract-defined discriminant, and the type special-cases no parameter name or archetype.
 * @evidence contracts/common.md#meaningful-documentation The prose says how the gate applies kind, finiteness and bounds and where the unit comes from, and each optional limit says that its absence leaves that side unbounded.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A parameter rule is a three-field record that selects no algorithm; the lookup and comparisons the gate performs with it are costed on the gate.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Rules are static schema literals read in place by the gate, so no work is coordinated across requests that sharing could save.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A rule lives inside its archetype's module-level schema object and holds no handle, buffer or task that could need release.
 * @author Samchon
 */
export interface IAutoMovieArchetypeParameter {
  /** JavaScript `typeof` name the value must have. */
  kind: "number" | "string" | "boolean";

  /** Inclusive minimum of a `number` parameter; absent leaves no lower bound. */
  minimum?: number;

  /** Inclusive maximum of a `number` parameter; absent leaves no upper bound. */
  maximum?: number;
}
