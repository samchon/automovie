import {
  AutoMovieChain,
  AutoMovieComposition,
  type IAutoMovieIntent,
} from "@automovie/engine";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanActionParams } from "../IHumanActionParams";

/**
 * The part of a person's chain that knows no action: whose chain it is, how
 * an action is appended by name with that action's own parameter type, and
 * how the last action is cut.
 *
 * `HumanChain` is this class with one vocabulary method per action, added by
 * the family classes between them. Each of those methods is `act` under the
 * action's name, so `chain.touch(params)` and `chain.act("touch", params)`
 * append the same intent and are checked against the same parameter type.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the class owns and how the vocabulary methods relate to `act`; each operator states its own rule.
 * @evidence contracts/development/design.md#principled-representation An immutable chain of one subject over the engine's composition, with the action name indexing its parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The subject, the typed append (`act`), the registered append (`registered`), the cut (`until`), the timing (`sync`), the overlay (`over`) and the derive hook.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No parameter is typed `object`: a name selects its law's parameter type.
 */
export class HumanChainCore extends AutoMovieChain {
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
   * Append an action by name. The parameters are the named action's own, so
   * a misspelt name, a parameter the action does not take and a wrong value
   * are refused by the type checker; an action whose parameters are all
   * optional may be appended without any.
   *
   * @param name The action.
   * @param args Its parameters, then an optional anchor: a stable id another chain can align to or cut on.
   * @returns The chain.
   */
  public act<Name extends HumanActionName>(
    name: Name,
    ...args: HumanChainCore.Arguments<Name>
  ): this {
    // Both shapes of the argument tuple hold the parameters first and the
    // anchor second, each possibly absent.
    const [params, anchor]: readonly [object?, string?] = args;
    return this.registered(name, params ?? {}, anchor);
  }

  /**
   * Append an action a production registered with the performance
   * (`HumanPerformance.IInput.laws`), by the name its law carries. The
   * parameters are the registered law's own and are not checked here;
   * `HumanChain.extend` gives the same action a typed method, which is the
   * way to call it from code that knows the law.
   *
   * @param name The registered law's name.
   * @param params Its parameters.
   * @param anchor A stable id another chain can align to or cut on.
   * @returns The chain.
   */
  public registered(name: string, params: object = {}, anchor?: string): this {
    const intent: IAutoMovieIntent = {
      subject: this.subject,
      capability: name,
      parameters: { params },
      ...(anchor === undefined ? {} : { anchor }),
    };
    return this.next(intent);
  }

  /**
   * Cut the last appended action: at a share, at one of its events, at
   * another action's event, or when a region comes near a target.
   *
   * @param until The cut.
   * @returns The chain.
   * @throws {Error} When the chain ends in no action, or in one already synced (cut it before syncing it).
   */
  public until(until: NonNullable<IAutoMovieIntent["until"]>): this {
    const parts: readonly AutoMovieComposition[] =
      this.node.kind === "sequence" ? this.node.parts : [this.node];
    const last: AutoMovieComposition | undefined = parts.at(-1);
    if (last?.kind === "at")
      throw new Error(
        "until cuts an action before it is synced; cut it first, then sync it",
      );
    if (last === undefined || last.kind !== "intent")
      throw new Error("until cuts an action; append one first");
    return this.derive({
      kind: "sequence",
      parts: [
        ...parts.slice(0, -1),
        { kind: "intent", intent: { ...last.intent, until } },
      ],
    });
  }

  /**
   * Time the last appended action to an instant of another action or of a
   * cue track, as BML's synchronisation constraints do: one of its own
   * instants (`align`, its start when absent) falls on the instant named
   * (`of` and `event`), `offset` seconds later.
   *
   * The action starts as early as that needs. Where its performer's previous
   * action still runs then, that action is cut there, which its cancel table
   * must allow; an action that would have to start before its performer's
   * previous one, or before the film, is refused with the earliest instant
   * it can meet. What follows in the chain starts when the synced action
   * ends. Cut the action (`until`) and put overlays on it (`over`) before
   * syncing it.
   *
   * ```ts
   * a.stand().gesture({ kind: "beat" }).sync({ of: "dialogue", event: "accent", index: 2, align: "strokeEnd" });
   * b.stand().flinch().sync({ of: "strike", event: "contact" });
   * ```
   *
   * @param sync The instant to meet and which instant of the action meets it.
   * @returns The chain.
   * @throws {Error} When the chain ends in no action, or in one already synced (an action meets one instant).
   */
  public sync(sync: HumanChainCore.ISync): this {
    const parts: readonly AutoMovieComposition[] =
      this.node.kind === "sequence" ? this.node.parts : [this.node];
    const last: AutoMovieComposition | undefined = parts.at(-1);
    if (last?.kind === "at")
      throw new Error(
        `sync times an action once, and the last one is already synced to ${last.anchor}`,
      );
    if (last === undefined || last.kind === "sequence")
      throw new Error("sync times an action; append one first");
    return this.derive({
      kind: "sequence",
      parts: [
        ...parts.slice(0, -1),
        AutoMovieComposition.at(sync.of, last, sync.offset ?? 0, {
          ...(sync.event === undefined ? {} : { event: sync.event }),
          ...(sync.index === undefined ? {} : { index: sync.index }),
          ...(sync.align === undefined ? {} : { align: sync.align }),
        }),
      ],
    });
  }

  /**
   * Perform other actions over the last appended one, at the same time and
   * on other parts of the body: a wave or a phone during a walk.
   *
   * The last action carries the body (its root, its legs and whatever it
   * does not yield); the actions `build` appends to the empty chain it is
   * given start with it, follow one another, and each takes only the
   * channels it claims. The performance refuses an action that cannot ride
   * a carrier, a carrier that does not yield the channels asked, and two
   * overlays that claim one channel at one time, naming both claims.
   *
   * ```ts
   * a.walk({ to }).over((u) => u.handToFace({ task: "phone" }));
   * ```
   *
   * @param build Appends the overlaid actions to an empty chain of this person.
   * @returns The chain.
   * @throws {Error} When the chain ends in no action, or in one already synced (put the overlays on it before syncing it).
   */
  public over(build: (overlay: this) => HumanChainCore): this {
    const parts: readonly AutoMovieComposition[] =
      this.node.kind === "sequence" ? this.node.parts : [this.node];
    const last: AutoMovieComposition | undefined = parts.at(-1);
    const carried: boolean =
      last !== undefined &&
      last.kind === "parallel" &&
      last.parts[0]?.kind === "intent" &&
      last.parts[0].intent.subject === this.subject;
    if (last?.kind === "at")
      throw new Error(
        "over rides an action before it is synced; put the overlays on it first, then sync it",
      );
    if (last === undefined || !(last.kind === "intent" || carried))
      throw new Error("over rides an action; append one first");

    // Every intent of the overlaid chain is marked, so the performance plans
    // it on the carrier instead of after it.
    const mark = (node: AutoMovieComposition): AutoMovieComposition => {
      switch (node.kind) {
        case "intent":
          return {
            kind: "intent",
            intent: {
              ...node.intent,
              parameters: { ...node.intent.parameters, over: true },
            },
          };
        case "sequence":
        case "parallel":
          return { kind: node.kind, parts: node.parts.map(mark) };
        case "at":
          return { ...node, part: mark(node.part) };
      }
    };
    const overlay: AutoMovieComposition = mark(
      build(this.derive({ kind: "sequence", parts: [] })).node,
    );
    return this.derive({
      kind: "sequence",
      parts: [
        ...parts.slice(0, -1),
        {
          kind: "parallel",
          parts:
            last.kind === "parallel"
              ? [...last.parts, overlay]
              : [last, overlay],
        },
      ],
    });
  }

  /**
   * A new chain of the same person and class holding another node.
   *
   * @param node The node.
   * @returns The chain.
   */
  protected override derive(node: AutoMovieComposition): this {
    const make: new (subject: string, node: AutoMovieComposition) => this = this
      .constructor as new (subject: string, node: AutoMovieComposition) => this;
    return new make(this.subject, node);
  }
}

/**
 * Companion types of {@link HumanChainCore}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member.
 * @evidence contracts/development/design.md#principled-representation The instant a synced action meets, as data, and the argument list of a named append as a tuple type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two types: `ISync`, read by `sync`, and `Arguments`, read by `act`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The arguments are derived from the parameter table, not restated per action.
 */
export namespace HumanChainCore {
  /** An instant to meet, and which instant of the synced action meets it. */
  export interface ISync {
    /** The anchor of an action placed earlier in the composition, or the name of a cue track. */
    of: string;

    /**
     * Which instant of it: one of its events, or `start` or `end`. Absent,
     * an action's decisive instant (its contact) or else its start; a cue
     * track always needs one.
     */
    event?: string;

    /** Which occurrence of that event, from 0, where it repeats, as a track's beats do; 0 when absent. */
    index?: number;

    /** The synced action's own instant that falls there: one of its events; its start when absent. */
    align?: string;

    /** Seconds after the instant named; negative is before. 0 when absent. */
    offset?: number;
  }

  /**
   * What follows the name in `act`: the action's parameters and an optional
   * anchor. The parameters may be left out only when every one of them is
   * optional.
   */
  export type Arguments<Name extends HumanActionName> =
    {} extends IHumanActionParams[Name]
      ? [params?: IHumanActionParams[Name], anchor?: string]
      : [params: IHumanActionParams[Name], anchor?: string];
}
