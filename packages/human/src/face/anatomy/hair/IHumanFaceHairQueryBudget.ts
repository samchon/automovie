/**
 * The shared, mutable count of geometry queries one hair lock may still spend.
 *
 * The builder creates one per seated root and passes the same object to the
 * integrator, the steering and transport steps and contact retraction. Each
 * consumer checks for exhaustion and decrements `remaining` before every skin
 * query, so the walk, its refinements and retraction share one bound instead
 * of each resetting its own.
 *
 * @evidence contracts/common.md#principled-implementation One shared counter bounds every query of a lock, so no stage can extend the walk by restarting a private budget.
 * @evidence contracts/common.md#clear-and-simple-design A single named field replaces repeated anonymous budget objects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Consumers refuse on exhaustion; none resets or widens the count.
 * @evidence contracts/common.md#meaningful-documentation States the producer, the sharing, the mutation and the refusal rule.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Counts queries; carries no spatial quantity.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The contact owner defines the skin boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical state only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Bounds computation, not an anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal state, not a personal control.
 * @author Samchon
 */
export interface IHumanFaceHairQueryBudget {
  /** Non-negative safe integer of queries left; consumers decrement it in place. */
  remaining: number;
}
