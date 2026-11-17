import type { IAutoMoviePropRelation } from "../harness/IAutoMoviePropRelation";
import type { IAutoMoviePropRelationTarget } from "../harness/IAutoMoviePropRelationTarget";
import type { IAutoMoviePropSpec } from "../harness/IAutoMoviePropSpec";

/**
 * Registry evidence and diagnostic location for a prop-affordance relation.
 */
export namespace IAutoMovieValidatePropAffordanceTarget {
  /**
   * Gate one relation that cites another prop's declared contact point.
   *
   * The cited prop must differ from the citing one and be declared exactly once,
   * its model must declare the cited affordance, and that affordance must have
   * the kind the relation needs: `stack-top` to rest on (`on-support`), `socket`
   * to attach, `hook` to hang (`suspended`). The first failing rule is reported
   * under `<path>.target.prop` or `<path>.target.affordance` and the rest are
   * not judged, because each depends on the one before.
   *
   * @evidence contracts/development/design.md#principled-representation The relation and target identify a typed contact rather than a numeric pose. Admission requires another uniquely declared prop and an affordance kind selected by relation kind.
   * @evidence contracts/development/design.md#minimal-and-owned-surface validatePropAffordanceTarget consumes registry matches assembled by placement validation and appends the first dependency-ordered refusal to its separate collector.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts matches preserves zero and multiple candidates so unresolved and ambiguous references remain distinct; choosing the first candidate would conceal a registry contradiction.
   * @evidence contracts/development/common.md#meaningful-documentation Registry evidence and diagnostic location for a prop-affordance relation. The relation and target identify a typed contact rather than a numeric pose. Admission requires another uniquely declared prop and an affordance kind selected by relation kind.
   */
  export type IProps = {
      /**
     * Borrowed citing relation; attached requires socket, suspended requires hook, and the support branch requires stack-top. The caller pairs this with its prop-affordance target.
     */
    relation: IAutoMoviePropRelation;
      /**
     * Borrowed prop-affordance target to admit. Self-reference is refused before registry or affordance lookup.
     */
    target: IAutoMoviePropRelationTarget.IPropAffordance;
      /**
     * Diagnostic path to the relation; failures append .target.prop or .target.affordance.
     */
    path: string;
      /**
     * Node id of the citing prop, used to reject targeting itself.
     */
    node: string;
      /**
     * All registry entries whose node equals target.prop, including duplicates. Exactly one is required; the validator does not rebuild or filter this caller-supplied match set.
     */
    matches: readonly { 
    /**
     * Borrowed matched prop specification whose model affordances are searched by id; the wrapper preserves the caller's registry-match representation.
     */
    value: IAutoMoviePropSpec }[];
    };
}
