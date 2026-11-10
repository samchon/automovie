import {
  AutoMovieChain,
  AutoMovieComposition,
  type IAutoMovieIntent,
} from "@automovie/engine";

import type { HumanActionName } from "./HumanActionName";
import type { jump } from "./actions/jump";
import type { run } from "./actions/run";
import type { stand } from "./actions/stand";
import type { walk } from "./actions/walk";
import type { approach } from "./everyday/approach";
import type { bend } from "./everyday/bend";
import type { brace } from "./everyday/brace";
import type { gesture } from "./everyday/gesture";
import type { look } from "./everyday/look";
import type { rest } from "./everyday/rest";
import type { shift } from "./everyday/shift";
import type { sit } from "./everyday/sit";
import type { stepOver } from "./everyday/stepOver";
import type { typeText } from "./everyday/typeText";
import type { handOver } from "./handling/handOver";
import type { handshake } from "./handling/handshake";
import type { pickUp } from "./handling/pickUp";
import type { putDown } from "./handling/putDown";
import type { flinch } from "./reaction/flinch";
import type { knockdown } from "./reaction/knockdown";
import type { stagger } from "./reaction/stagger";
import type { defend } from "./striking/defend";
import type { guard } from "./striking/guard";
import type { kick } from "./striking/kick";
import type { punch } from "./striking/punch";
import type { step } from "./striking/step";

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
   * Two people's chains joined for a mutual action: both chains play
   * together, then both people perform the mutual action at once, so each
   * person's earlier actions are placed before either plans the meeting.
   *
   * @param a One person's chain.
   * @param b The other's.
   * @returns The mutual actions, each returning the joined composition.
   */
  public static pair(
    a: HumanChain,
    b: HumanChain,
  ): {
    handshake(params?: Omit<handshake.IParams, "partner">): AutoMovieChain;
    handOver(params: Omit<handOver.IParams, "to">): AutoMovieChain;
  } {
    const together = (
      first: AutoMovieComposition,
      second: AutoMovieComposition,
    ): AutoMovieChain =>
      new AutoMovieChain({
        kind: "sequence",
        parts: [
          { kind: "parallel", parts: [a.node, b.node] },
          { kind: "parallel", parts: [first, second] },
        ],
      });
    return {
      handOver: (params: Omit<handOver.IParams, "to">): AutoMovieChain => {
        const shared = {
          prop: params.prop,
          handle: params.handle,
          ...(params.mass === undefined ? {} : { mass: params.mass }),
          ...(params.outcome === undefined ? {} : { outcome: params.outcome }),
        };
        return together(
          HumanChain.subject(a.subject).act("handOver", {
            ...params,
            to: b.subject,
          }).node,
          HumanChain.subject(b.subject).act("receive", {
            ...shared,
            from: a.subject,
            ...(params.receiverHand === undefined
              ? {}
              : { hand: params.receiverHand }),
            ...(params.hand === undefined ? {} : { giverHand: params.hand }),
          }).node,
        );
      },
      handshake: (
        params: Omit<handshake.IParams, "partner"> = {},
      ): AutoMovieChain =>
        new AutoMovieChain({
          kind: "sequence",
          parts: [
            { kind: "parallel", parts: [a.node, b.node] },
            {
              kind: "parallel",
              parts: [
                HumanChain.subject(a.subject).handshake({
                  ...params,
                  partner: b.subject,
                }).node,
                HumanChain.subject(b.subject).handshake({
                  ...params,
                  partner: a.subject,
                }).node,
              ],
            },
          ],
        }),
    };
  }

  /**
   * Append an action by name.
   *
   * @param name The action.
   * @param params Its parameters.
   * @param anchor A stable id another chain can align to or cut on.
   * @returns The chain.
   */
  public act(
    name: HumanActionName,
    params: object = {},
    anchor?: string,
  ): this {
    const intent: IAutoMovieIntent = {
      subject: this.subject,
      capability: name,
      parameters: { params },
      ...(anchor === undefined ? {} : { anchor }),
    };
    return this.next(intent);
  }

  /**
   * Shake hands with a partner standing within reach; `HumanChain.pair`
   * appends both partners' handshakes together.
   *
   * @param params The partner, the hand and the pump count.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public handshake(params: handshake.IParams, anchor?: string): this {
    return this.act("handshake", params, anchor);
  }

  /**
   * Reach for a prop's grip affordance, grasp it and lift it.
   *
   * @param params The prop, its grip, the hand and the lift.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public pickUp(params: pickUp.IParams, anchor?: string): this {
    return this.act("pickUp", params, anchor);
  }

  /**
   * Set a held prop down at a place and let go.
   *
   * @param params The prop, where it goes and the hand.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public putDown(params: putDown.IParams, anchor?: string): this {
    return this.act("putDown", params, anchor);
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
   * Walk to a floor point.
   *
   * @param params Destination and pace.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public walk(params: walk.IParams, anchor?: string): this {
    return this.act("walk", params, anchor);
  }

  /**
   * Run to a floor point at a jog, a run or a sprint.
   *
   * @param params Destination, pace and path.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public run(params: run.IParams, anchor?: string): this {
    return this.act("run", params, anchor);
  }

  /**
   * Jump to a floor point: push off a planted foot, fly and land on both feet.
   *
   * @param params Where to land and the flight's apex.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public jump(params: jump.IParams, anchor?: string): this {
    return this.act("jump", params, anchor);
  }

  /**
   * Walk up to a person, prop or point and stop at an interpersonal gap.
   *
   * @param params Target, gap and pace.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public approach(params: approach.IParams, anchor?: string): this {
    return this.act("approach", params, anchor);
  }

  /**
   * Stand and look at a target, turning the eyes, head and trunk.
   *
   * @param params Target, recruitment, cue and time.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public look(params: look.IParams, anchor?: string): this {
    return this.act("look", params, anchor);
  }

  /**
   * Make a gesture while standing.
   *
   * @param params The gesture and its options.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public gesture(params: gesture.IParams, anchor?: string): this {
    return this.act("gesture", params, anchor);
  }

  /**
   * Stand with the hands at rest places.
   *
   * @param params Each hand's place and the time.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public rest(params: rest.IParams, anchor?: string): this {
    return this.act("rest", params, anchor);
  }

  /**
   * Sit down on a seat behind the performer.
   *
   * @param params The seat, the seated back and the time seated.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public sit(params: sit.IParams, anchor?: string): this {
    return this.act("sit", params, anchor);
  }

  /**
   * Stand up from the seat the performer sits on.
   *
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public rise(anchor?: string): this {
    return this.act("rise", {}, anchor);
  }

  /**
   * Edge sideways along the seat.
   *
   * @param params Distance and time seated after.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public shift(params: shift.IParams, anchor?: string): this {
    return this.act("shift", params, anchor);
  }

  /**
   * Bend down to bring a hand to a low point, feet planted.
   *
   * @param params Target, hand, strategy and hold.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public bend(params: bend.IParams, anchor?: string): this {
    return this.act("bend", params, anchor);
  }

  /**
   * Step over a low obstacle ahead, lead foot then trail foot.
   *
   * @param params The obstacle and the leading foot.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public stepOver(params: stepOver.IParams, anchor?: string): this {
    return this.act("stepOver", params, anchor);
  }

  /**
   * Brace for an expected impact, push or falling body.
   *
   * @param params Where the force comes from, what it is and how long.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public brace(params: brace.IParams = {}, anchor?: string): this {
    return this.act("brace", params, anchor);
  }

  /**
   * Type a text on a keyboard with the index fingertips, holding the current posture.
   *
   * @param params The keyboard and the text.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public typeText(params: typeText.IParams, anchor?: string): this {
    return this.act("typeText", params, anchor);
  }

  /**
   * Bring a straight, hook or uppercut onto a target, or feint one.
   *
   * @param params Hand, technique and target.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public punch(params: punch.IParams, anchor?: string): this {
    return this.act("punch", params, anchor);
  }

  /**
   * Bring a round or push kick onto a target.
   *
   * @param params Leg, technique and target.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public kick(params: kick.IParams, anchor?: string): this {
    return this.act("kick", params, anchor);
  }

  /**
   * Hold a fighting guard.
   *
   * @param params Stance and time held.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public guard(params: guard.IParams, anchor?: string): this {
    return this.act("guard", params, anchor);
  }

  /**
   * Step in a fighting stance.
   *
   * @param params Direction and distance.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public step(params: step.IParams, anchor?: string): this {
    return this.act("step", params, anchor);
  }

  /**
   * Defend against another action: block, parry, slip or retreat.
   *
   * @param params The attack answered and the defence.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public defend(params: defend.IParams, anchor?: string): this {
    return this.act("defend", params, anchor);
  }

  /**
   * Startle away from a threat or a blow.
   *
   * @param params The threat.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public flinch(params: flinch.IParams, anchor?: string): this {
    return this.act("flinch", params, anchor);
  }

  /**
   * Take one unplanned capture step after a push.
   *
   * @param params The push.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public stagger(params: stagger.IParams, anchor?: string): this {
    return this.act("stagger", params, anchor);
  }

  /**
   * Let the legs give way and go down to lie supine.
   *
   * @param params The cause and direction.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public knockdown(params: knockdown.IParams, anchor?: string): this {
    return this.act("knockdown", params, anchor);
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
    const parts: readonly AutoMovieComposition[] =
      this.node.kind === "sequence" ? this.node.parts : [this.node];
    const last: AutoMovieComposition | undefined = parts.at(-1);
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
   * A new chain of the same person holding another node.
   *
   * @param node The node.
   * @returns The chain.
   */
  protected override derive(node: AutoMovieComposition): this {
    return new HumanChain(this.subject, node) as this;
  }
}
