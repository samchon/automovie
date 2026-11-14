import type { AutoMovieComposition } from "@automovie/engine";
import { type HumanActionName, HumanChain } from "@automovie/motions";

/**
 * A chain whose named append takes parameters read at run time.
 *
 * The law sweep stages every row of the ledger, and a row is text
 * (`side=left`, `kind=wave`) that the stage writes into the action's
 * parameters. No static type can check a value that is only known when the
 * ledger is read, so the sweep's stages append through this chain, whose
 * `act` accepts any parameter object for a vocabulary name. The typed chain
 * is pinned by `test_human_motion_chain_vocabulary`; a row whose value the law
 * does not accept is refused by the law when the sweep performs it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States why the sweep needs run-time parameters and what still checks them.
 * @evidence contracts/development/design.md#principled-representation The vocabulary chain with only its named append widened to run-time parameters.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One constructor and one widened method.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Appends through the chain's own intent path, so the composition is what a typed call builds.
 */
export class MotionHumanSweepChain extends HumanChain {
  /**
   * An empty sweep chain of a person.
   *
   * @param subject The person.
   * @returns The chain.
   */
  public static override subject(subject: string): MotionHumanSweepChain {
    return new MotionHumanSweepChain(subject, { kind: "sequence", parts: [] });
  }

  /**
   * Append an action by name with parameters known only at run time.
   *
   * @param name The action.
   * @param params Its parameters, as the row sets them.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public override act(
    name: HumanActionName,
    params: object = {},
    anchor?: string,
  ): this {
    const node: AutoMovieComposition = {
      kind: "intent",
      intent: {
        subject: this.subject,
        capability: name,
        parameters: { params },
        ...(anchor === undefined ? {} : { anchor }),
      },
    };
    return this.next(node);
  }
}
