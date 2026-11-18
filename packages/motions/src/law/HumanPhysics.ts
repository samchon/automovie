import type {
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanPhysics,
} from "@automovie/interface";

/**
 * The one reader of the physics option (`IAutoMovieMotionHumanPhysics`):
 * whether an action computes balance, and whether the audit judges the
 * body's balance over it. Off by default: an action whose params do not ask
 * for balance, and whose law stages no physical outcome
 * (`IAutoMovieMotionHumanActionLaw.physical`), is posed and planted, and
 * neither computes a centre of mass nor is checked against gravity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two questions, the default and what each reads.
 * @evidence contracts/development/design.md#principled-representation One owner of the option's reading, so every law and the audit read it alike.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `balanced` for the laws' balance sites, `judged` for the audit.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Absent is off; no law infers physical work from anything else.
 */
export namespace HumanPhysics {
  /**
   * Whether an action's params ask for balance.
   *
   * @param params The action's params.
   * @returns Whether `physics.balance` is true.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the one field read.
   * @evidence contracts/development/implementation.md#principled-implementation The option's own field; absent is false.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One comparison.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only a literal true turns it on.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function balanced(params: { physics?: IAutoMovieMotionHumanPhysics } | object | undefined): boolean {
    return (params as { physics?: IAutoMovieMotionHumanPhysics } | undefined)?.physics?.balance === true;
  }

  /**
   * Whether the audit judges the body's balance over an action: the span
   * says so (`IAutoMovieMotionHumanAuditMotion.ISpan.physical`), or, for a
   * placed action read as a span, its law stages a physical outcome or its
   * params ask for balance.
   *
   * @param span The action as the audit reads it.
   * @returns Whether its balance is judged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three sources and their order.
   * @evidence contracts/development/implementation.md#principled-implementation A span's own flag first; a placed action carries its law and params, read by the same option.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One flag, one law field, one params field.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing else turns the check on; a planted, posed action is not judged.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function judged(
    span: IAutoMovieMotionHumanAuditMotion.ISpan & { law?: { physical?: true }; params?: object },
  ): boolean {
    if (span.physical !== undefined) return span.physical;
    return span.law?.physical === true || balanced(span.params);
  }
}
