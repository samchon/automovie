import type { IAutoMovieChain } from "../composition/IAutoMovieChain";
import type { IAutoMovieMotionHumanChainCore } from "./chain/IAutoMovieMotionHumanChainCore";
import type { IAutoMovieMotionHumanChainSport } from "./chain/IAutoMovieMotionHumanChainSport";
import type { IAutoMovieMotionHumanHandoverAction } from "./handling/IAutoMovieMotionHumanHandoverAction";
import type { IAutoMovieMotionHumanHandshake } from "./handling/IAutoMovieMotionHumanHandshake";
import type { IAutoMovieMotionHumanActionContext } from "./law/IAutoMovieMotionHumanActionContext";
import type { IAutoMovieMotionHumanActionLaw } from "./law/IAutoMovieMotionHumanActionLaw";
import type { IAutoMovieMotionHumanActionPlan } from "./law/IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanMutual } from "./law/IAutoMovieMotionHumanMutual";

/**
 * The fluent authoring surface of one person's actions: one typed method per
 * action of the vocabulary, `act` for the same action by its name,
 * `registered` for a production's own law by its name, `until` to cut the
 * last one, `sync` to time it to another action or a cue, `over` to perform
 * other actions on it at once (`HumanChainCore`), and `next` and `with`
 * (from `AutoMovieChain`) to sequence and parallel whole chains, people with
 * people. Its statics start a chain (`subject`), give registered laws typed
 * methods (`extend`) and join people in a mutual action (`mutual`, and
 * `pair` for a handshake and a handover).
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
 * @evidence contracts/development/common.md#meaningful-documentation States the surface with its operators and statics, its immutability, what the performance owns and where the vocabulary methods are declared. handshake: Begin a handshake with the chain's current partner; omitted options use the handshake law's defaults.
 * @evidence contracts/development/design.md#principled-representation The engine's immutable chain of one subject with the whole vocabulary as typed methods; a mutual action joins several subjects' chains. handshake: Begin a handshake with the chain's current partner; omitted options use the handshake law's defaults.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four statics (`subject`, `extend`, `mutual`, `pair`); the vocabulary and the core operators (`act`, `registered`, `until`, `sync`, `over`) are inherited. Runtime boundary references: ensemble/HumanEnsemble.ts (HumanEnsemble.chains, build); executable/cases/affectionCases.ts (pair, a); executable/cases/affectionCases.ts (pair, b); executable/cases/everydayCaseKit.ts (everydayCaseKit.one, chain); executable/cases/everydayCaseKit.ts (everydayCaseKit.perform, chain); executable/cases/everydayCases.ts (everydayCases.one, chain).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No action is reachable only through an untyped call. Shares the canonical IAutoMovieMotionHumanActionLaw, IAutoMovieMotionHumanMutual identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export interface IAutoMovieMotionHumanChain extends IAutoMovieMotionHumanChainSport {}

/**
 * The fluent authoring surface of one person's actions: one typed method per
 * action of the vocabulary, `act` for the same action by its name,
 * `registered` for a production's own law by its name, `until` to cut the
 * last one, `sync` to time it to another action or a cue, `over` to perform
 * other actions on it at once (`HumanChainCore`), and `next` and `with`
 * (from `AutoMovieChain`) to sequence and parallel whole chains, people with
 * people. Its statics start a chain (`subject`), give registered laws typed
 * methods (`extend`) and join people in a mutual action (`mutual`, and
 * `pair` for a handshake and a handover).
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
 */
export namespace IAutoMovieMotionHumanChain {
  /**
   * The callable constructor and static factories.
   *
   * @evidence contracts/development/common.md#meaningful-documentation handshake: Begin a handshake with the chain's current partner; omitted options use the handshake law's defaults.
   * @evidence contracts/development/design.md#principled-representation handshake: Begin a handshake with the chain's current partner; omitted options use the handshake law's defaults.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Used by the enclosing IAutoMovieMotionHumanChain contract's parameter and result relationships.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanChain, IAutoMovieMotionHumanActionLaw, IAutoMovieMotionHumanChain.IExtension identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IConstructor {
    /**
     * An empty chain of a person: no action until one is appended.
     *
     * @param subject The person.
     * @returns The chain.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChain.IConstructor.subject: An empty chain of a person: no action until one is appended.
     */
    subject(subject: string): IAutoMovieMotionHumanChain;

    /**
     * The chain with a typed method for each law a production registers: the
     * production's own actions are appended exactly like the vocabulary's.
     *
     * ```ts
     * const Chain = HumanChain.extend({ salute });
     * Chain.subject("a").walk({ to }).salute({ hold: 1.5 }).stand();
     * new HumanPerformance({ seed, performers, laws: [salute], composition });
     * ```
     *
     * @param laws The registered laws, each under the name it carries.
     * @returns What starts a chain of the extended kind.
     * @throws {Error} When a key differs from its law's name, or names something the chain already has.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChain.IConstructor.extend: The chain with a typed method for each law a production registers: the production's own actions are appended exactly like the vocabulary's. ```ts const Chain = HumanChain.extend({ salute }); Chain.subject("a").walk({ to }).salute({ hold: 1.5 }).stand(); new HumanPerformance({ seed, performers, laws: [salute], composition }); ```
     */
    extend<
      Laws extends Readonly<
        Record<string, IAutoMovieMotionHumanActionLaw<never>>
      >,
    >(
      laws: Laws,
    ): IAutoMovieMotionHumanChain.IExtension<Laws>;

    /**
     * Join people's chains in a mutual action: one thing they do together,
     * such as a handshake, a handover or a lift.
     *
     * Every chain of the cast plays first, side by side, and then every role
     * performs its part of the mutual action at once, so each person's earlier
     * actions are placed before any role plans the meeting. `HumanMutual`
     * holds the vocabulary's mutual actions; a production states its own as an
     * `IAutoMovieMotionHumanMutual` over its registered laws.
     *
     * ```ts
     * HumanChain.mutual(HumanMutual.handOver, { giver: a, receiver: b }, { prop: "cup", handle: "body" });
     * ```
     *
     * @param mutual The mutual action.
     * @param cast Each role's chain.
     * @param args The shared parameters, then an optional anchor: each role's action is anchored `anchor.role`.
     * @returns The joined composition.
     * @throws {Error} When one person is cast in two roles.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChain.IConstructor.mutual: Join people's chains in a mutual action: one thing they do together, such as a handshake, a handover or a lift. Every chain of the cast plays first, side by side, and then every role performs its part of the mutual action at once, so each person's earlier actions are placed before any role plans the meeting. `HumanMutual` holds the vocabulary's mutual actions; a production states its own as an `IAutoMovieMotionHumanMutual` over its registered laws. ```ts HumanChain.mutual(HumanMutual.handOver, { giver: a, receiver: b }, { prop: "cup", handle: "body" }); ```
     */
    mutual<Params extends object, Role extends string>(
      mutual: IAutoMovieMotionHumanMutual<Params, Role>,
      cast: Readonly<Record<Role, IAutoMovieMotionHumanChainCore>>,
      ...args: {} extends Params
        ? [params?: Params, anchor?: string]
        : [params: Params, anchor?: string]
    ): IAutoMovieChain;

    /**
     * Two people's chains joined for a mutual action: `mutual` for the two
     * that every film has, a handshake and a handover.
     *
     * @param a One person's chain; the giver of a handover.
     * @param b The other's; the receiver.
     * @returns The mutual actions, each returning the joined composition.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChain.IConstructor.pair: Two people's chains joined for a mutual action: `mutual` for the two that every film has, a handshake and a handover.
     */
    pair(
      a: IAutoMovieMotionHumanChain,
      b: IAutoMovieMotionHumanChain,
    ): {
      /** Begin a handshake with the chain's current partner; omitted options use the handshake law's defaults. */
      handshake(
        params?: Omit<IAutoMovieMotionHumanHandshake.IParams, "partner">,
      ): IAutoMovieChain;
      /** Transfer the named held prop to the chain's current partner using the handover law's options. */
      handOver(
        params: Omit<IAutoMovieMotionHumanHandoverAction.IParams, "to">,
      ): IAutoMovieChain;
    };
  }

  /**
   * The parameters a law plans from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation plan: Planning capability whose action-context parameter is extracted by this conditional type; it is not invoked by the type utility.
   * @evidence contracts/development/design.md#principled-representation plan: Planning capability whose action-context parameter is extracted by this conditional type; it is not invoked by the type utility.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Public boundary formerly declared in HumanChain.ts; canonical declarations reference this identity directly.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanActionPlan identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type Parameters<Law> = Law extends {
    /** Planning capability whose action-context parameter is extracted by this conditional type; it is not invoked by the type utility. */
    plan(
      context: IAutoMovieMotionHumanActionContext<infer P>,
    ): IAutoMovieMotionHumanActionPlan;
  }
    ? P
    : never;

  /**
   * A chain with a typed method for each registered law.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A chain with a typed method for each registered law.
   * @evidence contracts/development/design.md#principled-representation Mapped law keys add chain methods whose parameter tuples follow each law's canonical plan context, retaining the base chain and requiring arguments only where the law requires them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: HumanChain.ts (HumanChain.extend, return); HumanChain.ts (HumanChain.extend).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanChain, IAutoMovieMotionHumanChain.Parameters identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type Extended<Laws> = IAutoMovieMotionHumanChain & {
    [Key in keyof Laws]: (
      ...args: {} extends IAutoMovieMotionHumanChain.Parameters<Laws[Key]>
        ? [
            params?: IAutoMovieMotionHumanChain.Parameters<Laws[Key]>,
            anchor?: string,
          ]
        : [
            params: IAutoMovieMotionHumanChain.Parameters<Laws[Key]>,
            anchor?: string,
          ]
    ) => IAutoMovieMotionHumanChain.Extended<Laws>;
  };

  /**
   * What starts a chain of an extended kind.
   *
   * @evidence contracts/development/common.md#meaningful-documentation subject: An empty chain of a person.
   * @evidence contracts/development/design.md#principled-representation subject: An empty chain of a person.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: HumanChain.ts (HumanChain.extend, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanChain.Extended identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IExtension<Laws> {
    /**
     * An empty chain of a person.
     *
     * @param subject The person.
     * @returns The chain.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChain.IExtension.subject: An empty chain of a person.
     */
    subject(subject: string): IAutoMovieMotionHumanChain.Extended<Laws>;
  }
}
