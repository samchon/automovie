import { AutoMovieChain, AutoMovieComposition } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionName,
  IAutoMovieComposition,
  IAutoMovieIntent,
  IAutoMovieMotionHumanChainCore,
} from "@automovie/interface";

import { HumanHitTrack } from "../perform/internal/HumanHitTrack";

/**
 * The part of a person's chain that knows no action: whose chain it is, how an
 * action is appended by name with that action's own parameter type, and how the
 * last action is cut.
 *
 * `HumanChain` is this class with one vocabulary method per action, added by
 * the family classes between them. Each of those methods is `act` under the
 * action's name, so `chain.touch(params)` and `chain.act("touch", params)`
 * append the same intent and are checked against the same parameter type.
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
  public constructor(subject: string, node: IAutoMovieComposition) {
    super(node);
    this.subject = subject;
  }

  /**
   * Append an action by name. The parameters are the named action's own, so a
   * misspelt name, a parameter the action does not take and a wrong value are
   * refused by the type checker; an action whose parameters are all optional
   * may be appended without any.
   *
   * @param name The action.
   * @param args Its parameters, then an optional anchor: a stable id another
   *   chain can align to or cut on.
   * @returns The chain.
   */
  public act<Name extends AutoMovieMotionHumanActionName>(
    name: Name,
    ...args: IAutoMovieMotionHumanChainCore.Arguments<Name>
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
   * `HumanChain.extend` gives the same action a typed method, which is the way
   * to call it from code that knows the law.
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
   * Cut the last appended action: at a share, at one of its events, at another
   * action's event, or when a region comes near a target.
   *
   * @param until The tagged cut: `share`, `event`, `anchor-event` or
   *   `proximity`.
   * @returns The chain.
   * @throws {Error} When the chain ends in no action, or in one already synced
   *   (cut it before syncing it).
   */
  public until(until: IAutoMovieIntent.IUntil): this {
    const parts: readonly IAutoMovieComposition[] =
      this.node.type === "sequence" ? this.node.parts : [this.node];
    const last: IAutoMovieComposition | undefined = parts.at(-1);
    if (last?.type === "at")
      throw new Error(
        "until cuts an action before it is synced; cut it first, then sync it",
      );
    if (last === undefined || last.type !== "intent")
      throw new Error("until cuts an action; append one first");
    return this.derive({
      type: "sequence",
      parts: [
        ...parts.slice(0, -1),
        { type: "intent", intent: { ...last.intent, until } },
      ],
    });
  }

  /**
   * Time the last appended action to an instant of another action or of a cue
   * track, as BML's synchronisation constraints do: one of its own instants
   * (`align`, its start when absent) falls on the instant named (`of` and
   * `event`), `offset` seconds later.
   *
   * The action starts as early as that needs. Where its performer's previous
   * action still runs then, that action is cut there, which its cancel table
   * must allow; an action that would have to start before its performer's
   * previous one, or before the film, is refused with the earliest instant it
   * can meet. What follows in the chain starts when the synced action ends.
   * `schedule.entries[i].end` is an action's uncut end; `segments()` holds the
   * cut one that plays. Cut the action (`until`) and put overlays on it
   * (`over`) before syncing it.
   *
   * ```ts
   * a.stand().gesture({ kind: "beat" }).sync({
   *   of: "dialogue",
   *   event: "accent",
   *   index: 2,
   *   align: "strokeEnd",
   * });
   * b.stand().flinch().sync({ of: "strike" });
   * ```
   *
   * @param sync The instant to meet and which instant of the action meets it.
   * @returns The chain.
   * @throws {Error} When the chain ends in no action, or in one already synced
   *   (an action meets one instant).
   */
  public sync(sync: IAutoMovieMotionHumanChainCore.ISync): this {
    const parts: readonly IAutoMovieComposition[] =
      this.node.type === "sequence" ? this.node.parts : [this.node];
    const last: IAutoMovieComposition | undefined = parts.at(-1);
    if (last?.type === "at")
      throw new Error(
        `sync times an action once, and the last one is already synced to ${last.anchor}`,
      );
    if (last === undefined || last.type === "sequence")
      throw new Error("sync times an action; append one first");

    // A drawn latency rides on the synced action's own parameters, as `over`
    // does, and the action is aligned by its start when it names no instant,
    // so the performance's alignment hook places it and adds the draw.
    const latency = (node: IAutoMovieComposition): IAutoMovieComposition =>
      node.type === "intent"
        ? {
            type: "intent",
            intent: {
              ...node.intent,
              parameters: { ...node.intent.parameters, latency: sync.latency },
            },
          }
        : node.type === "parallel"
          ? {
              type: "parallel",
              parts: [latency(node.parts[0]!), ...node.parts.slice(1)],
            }
          : node;
    const align: string | undefined =
      sync.align ?? (sync.latency === undefined ? undefined : "start");

    // A hit is an instant of the struck subject's hit track.
    const of: string | undefined =
      sync.hit === undefined ? sync.of : HumanHitTrack.name(sync.hit);
    if (of === undefined)
      throw new Error("sync names an instant: give `of` or `hit`");
    const event: string | undefined =
      sync.hit === undefined ? sync.event : HumanHitTrack.EVENT;
    const index: number | undefined =
      sync.hit === undefined ? sync.index : (sync.hit.index ?? 0);
    return this.derive({
      type: "sequence",
      parts: [
        ...parts.slice(0, -1),
        AutoMovieComposition.at(
          of,
          sync.latency === undefined ? last : latency(last),
          sync.offset ?? 0,
          {
            ...(event === undefined ? {} : { event }),
            ...(index === undefined ? {} : { index }),
            ...(align === undefined ? {} : { align }),
          },
        ),
      ],
    });
  }

  /**
   * Perform other actions over the last appended one, at the same time and on
   * other parts of the body: a wave or a phone during a walk.
   *
   * The last action carries the body (its root, its legs and whatever it does
   * not yield); the actions `build` appends to the empty chain it is given
   * start with it, follow one another, and each takes only the channels it
   * claims. The performance refuses an action that cannot ride a carrier, a
   * carrier that does not yield the channels asked, and two overlays that claim
   * one channel at one time, naming both claims.
   *
   * ```ts
   * a.walk({ to }).over((u) => u.handToFace({ kind: "phone" }));
   * ```
   *
   * @param build Appends the overlaid actions to an empty chain of this person.
   * @returns The chain.
   * @throws {Error} When the chain ends in no action, or in one already synced
   *   (put the overlays on it before syncing it).
   */
  public over(build: (overlay: this) => IAutoMovieMotionHumanChainCore): this {
    const parts: readonly IAutoMovieComposition[] =
      this.node.type === "sequence" ? this.node.parts : [this.node];
    const last: IAutoMovieComposition | undefined = parts.at(-1);
    const carried: boolean =
      last !== undefined &&
      last.type === "parallel" &&
      last.parts[0]?.type === "intent" &&
      last.parts[0].intent.subject === this.subject;
    if (last?.type === "at")
      throw new Error(
        "over rides an action before it is synced; put the overlays on it first, then sync it",
      );
    if (last === undefined || !(last.type === "intent" || carried))
      throw new Error("over rides an action; append one first");

    // Every intent of the overlaid chain is marked, so the performance plans
    // it on the carrier instead of after it.
    const mark = (node: IAutoMovieComposition): IAutoMovieComposition => {
      switch (node.type) {
        case "intent":
          return {
            type: "intent",
            intent: {
              ...node.intent,
              parameters: { ...node.intent.parameters, over: true },
            },
          };
        case "sequence":
        case "parallel":
          return { type: node.type, parts: node.parts.map(mark) };
        case "at":
          return { ...node, part: mark(node.part) };
      }
    };
    const overlay: IAutoMovieComposition = mark(
      build(this.derive({ type: "sequence", parts: [] })).node,
    );
    return this.derive({
      type: "sequence",
      parts: [
        ...parts.slice(0, -1),
        {
          type: "parallel",
          parts:
            last.type === "parallel"
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
  protected override derive(node: IAutoMovieComposition): this {
    const make: new (subject: string, node: IAutoMovieComposition) => this =
      this.constructor as new (
        subject: string,
        node: IAutoMovieComposition,
      ) => this;
    return new make(this.subject, node);
  }
}
