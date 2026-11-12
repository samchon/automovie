import { AutoMovieChain, AutoMovieComposition } from "@automovie/engine";

import { HumanChainSport } from "./chain/HumanChainSport";
import type { handOver } from "./handling/handOver";
import type { handshake } from "./handling/handshake";

/**
 * The fluent authoring surface of one person's actions: one typed method per
 * action of the vocabulary, `act` for the same action by its name, `until`
 * to cut the last one, and `next` and `with` (from `AutoMovieChain`) to
 * sequence and parallel whole chains, people with people.
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
 *
 * The vocabulary methods are inherited in families (travel, posture, the
 * hands, striking, partners and objects, sport), each family a class of this
 * one's ancestry, so every action of `HumanActionName` is a method here and
 * each takes its law's own parameter type.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the surface, its immutability, what the performance owns and where the vocabulary methods are declared.
 * @evidence contracts/development/design.md#principled-representation The engine's immutable chain of one subject with the whole vocabulary as typed methods.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two constructors of a chain; the vocabulary is inherited.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No action is reachable only through an untyped call.
 */
export class HumanChain extends HumanChainSport {
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
      handOver: (params: Omit<handOver.IParams, "to">): AutoMovieChain =>
        together(
          HumanChain.subject(a.subject).handOver({ ...params, to: b.subject })
            .node,
          HumanChain.subject(b.subject).receive({
            prop: params.prop,
            handle: params.handle,
            from: a.subject,
            ...(params.mass === undefined ? {} : { mass: params.mass }),
            ...(params.outcome === undefined
              ? {}
              : { outcome: params.outcome }),
            ...(params.receiverHand === undefined
              ? {}
              : { hand: params.receiverHand }),
            ...(params.hand === undefined ? {} : { giverHand: params.hand }),
          }).node,
        ),
      handshake: (
        params: Omit<handshake.IParams, "partner"> = {},
      ): AutoMovieChain =>
        together(
          HumanChain.subject(a.subject).handshake({
            ...params,
            partner: b.subject,
          }).node,
          HumanChain.subject(b.subject).handshake({
            ...params,
            partner: a.subject,
          }).node,
        ),
    };
  }
}
