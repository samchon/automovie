import { AutoMovieChain, AutoMovieComposition, type IAutoMovieIntent } from "@automovie/engine";

import type { HumanActionName } from "./HumanActionName";
import type { stand } from "./actions/stand";

/**
 * The fluent authoring surface of one person's actions: each vocabulary
 * method appends an action, `until` cuts the last one, and `next` and `with`
 * (from `AutoMovieChain`) sequence and parallel whole chains, people with
 * people.
 *
 * ```ts
 * const a = HumanChain.subject("a").stand({ seconds: 1 }).until({ share: 0.5 }).stand();
 * new HumanPerformance({ seed: "film", performers, composition: a.node });
 * ```
 *
 * A chain is immutable; every method returns a new chain. The chain only
 * names actions and their parameters: bodies, places and skill belong to the
 * performance, which plans every action and refuses an undeclared cut with
 * the legal windows.
 */
export class HumanChain extends AutoMovieChain {
  /** The person whose actions this chain appends. */
  public readonly subject: string;

  /**
   * A chain of a person's actions.
   *
   * @param subject The person.
   * @param node The composition.
   */
  public constructor(subject: string, node: AutoMovieComposition) {
    super(node);
    this.subject = subject;
  }

  /**
   * An empty chain of a person: no action until one is appended.
   *
   * @param subject The person.
   * @returns The chain.
   */
  public static subject(subject: string): HumanChain {
    return new HumanChain(subject, { kind: "sequence", parts: [] });
  }

  /**
   * Append an action by name.
   *
   * @param name The action.
   * @param params Its parameters.
   * @param anchor A stable id another chain can align to or cut on.
   * @returns The chain.
   */
  public act(name: HumanActionName, params: object = {}, anchor?: string): this {
    const intent: IAutoMovieIntent = {
      subject: this.subject,
      capability: name,
      parameters: { params },
      ...(anchor === undefined ? {} : { anchor }),
    };
    return this.next(intent);
  }

  /**
   * Stand quietly.
   *
   * @param params How long.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public stand(params: stand.IParams = {}, anchor?: string): this {
    return this.act("stand", params, anchor);
  }

  /**
   * Cut the last appended action: at a share, at one of its events, at
   * another action's event, or when a region comes near a target.
   *
   * @param until The cut.
   * @returns The chain.
   * @throws {Error} When the chain ends in no action.
   */
  public until(until: NonNullable<IAutoMovieIntent["until"]>): this {
    const parts: readonly AutoMovieComposition[] = this.node.kind === "sequence" ? this.node.parts : [this.node];
    const last: AutoMovieComposition | undefined = parts.at(-1);
    if (last === undefined || last.kind !== "intent") throw new Error("until cuts an action; append one first");
    return this.derive({
      kind: "sequence",
      parts: [...parts.slice(0, -1), { kind: "intent", intent: { ...last.intent, until } }],
    });
  }

  /**
   * A new chain of the same person holding another node.
   *
   * @param node The node.
   * @returns The chain.
   */
  protected override derive(node: AutoMovieComposition): this {
    return new HumanChain(this.subject, node) as this;
  }
}

