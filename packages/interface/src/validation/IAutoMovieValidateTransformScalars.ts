import type { IAutoMovieViolationCollector } from "./IAutoMovieViolationCollector";

/**
 * Unchecked transform and reporting sink for shared TRS scalar admission.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Unchecked transform and reporting sink for shared TRS scalar admission. Nested contracts define the relevant units, ownership and failure states.
 * @evidence contracts/development/design.md#principled-representation Unknown ingress and a canonical mutable collector keep raw values separate from admitted TRS semantics.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Model, pose, affordance and artifact gates share the same transform scalar policy.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No normalized output or success brand conceals findings or collector exceptions.
 */
export namespace IAutoMovieValidateTransformScalars {
  /**
   * Inputs to validateTransformScalars, which checks a transform object and independently reports malformed translation, rotation and scale fields. All components must be finite, scale axes strictly positive and quaternion norm within 1e-6 of one. It neither normalizes values nor mutates the transform.
   *
   * Findings append through collector.items and collector methods; existing findings are preserved and offending values may be retained by reference. Collector or input-access exceptions propagate without rolling back prior findings. This operation returns no admitted transform or boolean.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines admission, independent nested paths, append-only effects, aliasing and exception propagation.
   * @evidence contracts/development/design.md#principled-representation unknown is the untrusted ingress value; admitted translation uses its owning transform frame/length unit, scale is dimensionless and rotation is a dimensionless unit quaternion.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Model, pose, affordance, architecture and artifact validators share this scalar gate and the canonical collector rather than separate TRS rules.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Positive scale excludes collapsed/reflected authored transforms; no normalization, replacement value or caller-specific quaternion tolerance repairs input.
   */
  export type IProps = {
    /** Unchecked TRS value with translation, rotation and scale fields; no caller assertion of its structure is required. */
    transform: unknown;

    /** Location prefix to which ".translation", ".rotation", ".scale" and component suffixes are appended literally. */
    path: string;

    /** Human-readable subject used in correction text; not an identifier lookup or validation rule. */
    label: string;

    /** Borrowed mutable finding sink; its items array and push/unitQuaternion methods receive synchronous appends, and thrown errors propagate. */
    collector: IAutoMovieViolationCollector;
  };
}
