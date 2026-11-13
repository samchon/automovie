import { AutoMovieChain, AutoMovieComposition } from "@automovie/engine";

import { HumanMutual } from "./actions/HumanMutual";
import type { HumanChainCore } from "./chain/HumanChainCore";
import { HumanChainSport } from "./chain/HumanChainSport";
import type { handOver } from "./handling/handOver";
import type { handshake } from "./handling/handshake";
import type { IHumanActionContext } from "./law/IHumanActionContext";
import type { IHumanActionLaw } from "./law/IHumanActionLaw";
import type { IHumanActionPlan } from "./law/IHumanActionPlan";
import type { IHumanMutual } from "./law/IHumanMutual";

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
 * @evidence contracts/development/common.md#meaningful-documentation States the surface with its operators and statics, its immutability, what the performance owns and where the vocabulary methods are declared.
 * @evidence contracts/development/design.md#principled-representation The engine's immutable chain of one subject with the whole vocabulary as typed methods; a mutual action joins several subjects' chains.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four statics (`subject`, `extend`, `mutual`, `pair`); the vocabulary and the core operators (`act`, `registered`, `until`, `sync`, `over`) are inherited.
egistered, until, sync, over) are inherited.
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
   */
  public static extend<
    Laws extends Readonly<Record<string, IHumanActionLaw<never>>>,
  >(laws: Laws): HumanChain.IExtension<Laws> {
    class Extended extends HumanChain {}
    for (const [key, law] of Object.entries(laws)) {
      if (key !== law.name)
        throw new Error(
          `The law named ${law.name} is registered as ${key}; register it under its own name`,
        );
      if (key in Extended.prototype)
        throw new Error(
          `The chain already has ${key}; register the law under a name of its own`,
        );

      // A method of an object literal, so it reads the chain it is called on.
      const methods: Record<
        string,
        (this: HumanChain, params?: object, anchor?: string) => HumanChain
      > = {
        [key](
          this: HumanChain,
          params: object = {},
          anchor?: string,
        ): HumanChain {
          return this.registered(law.name, params, anchor);
        },
      };
      Object.defineProperty(Extended.prototype, key, {
        value: methods[key],
        writable: false,
      });
    }
    return {
      subject: (subject: string): HumanChain.Extended<Laws> =>
        new Extended(subject, {
          kind: "sequence",
          parts: [],
        }) as HumanChain.Extended<Laws>,
    };
  }

  /**
   * Join people's chains in a mutual action: one thing they do together,
   * such as a handshake, a handover or a lift.
   *
   * Every chain of the cast plays first, side by side, and then every role
   * performs its part of the mutual action at once, so each person's earlier
   * actions are placed before any role plans the meeting. `HumanMutual`
   * holds the vocabulary's mutual actions; a production states its own as an
   * `IHumanMutual` over its registered laws.
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
   */
  public static mutual<Params extends object, Role extends string>(
    mutual: IHumanMutual<Params, Role>,
    cast: Readonly<Record<Role, HumanChainCore>>,
    ...args: {} extends Params
      ? [params?: Params, anchor?: string]
      : [params: Params, anchor?: string]
  ): AutoMovieChain {
    const [params, anchor]: readonly [Params?, string?] = args;
    const subjects: Record<Role, string> = Object.fromEntries(
      mutual.roles.map((role: Role): [Role, string] => [
        role,
        cast[role].subject,
      ]),
    ) as Record<Role, string>;
    if (new Set(Object.values(subjects)).size !== mutual.roles.length)
      throw new Error(
        `${mutual.name} casts one person in two roles: ${mutual.roles.map((role: Role): string => `${role} is ${subjects[role]}`).join(", ")}`,
      );
    return new AutoMovieChain({
      kind: "sequence",
      parts: [
        {
          kind: "parallel",
          parts: mutual.roles.map(
            (role: Role): AutoMovieComposition => cast[role].node,
          ),
        },
        {
          kind: "parallel",
          parts: mutual.roles.map((role: Role): AutoMovieComposition => {
            const act: IHumanMutual.IAct = mutual.act(
              role,
              params ?? ({} as Params),
              subjects,
            );
            return HumanChain.subject(subjects[role]).registered(
              act.name,
              act.params,
              anchor === undefined ? undefined : `${anchor}.${role}`,
            ).node;
          }),
        },
      ],
    });
  }

  /**
   * Two people's chains joined for a mutual action: `mutual` for the two
   * that every film has, a handshake and a handover.
   *
   * @param a One person's chain; the giver of a handover.
   * @param b The other's; the receiver.
   * @returns The mutual actions, each returning the joined composition.
   */
  public static pair(
    a: HumanChain,
    b: HumanChain,
  ): {
    handshake(params?: Omit<handshake.IParams, "partner">): AutoMovieChain;
    handOver(params: Omit<handOver.IParams, "to">): AutoMovieChain;
  } {
    return {
      handOver: (params: Omit<handOver.IParams, "to">): AutoMovieChain =>
        HumanChain.mutual(
          HumanMutual.handOver,
          { giver: a, receiver: b },
          params,
        ),
      handshake: (
        params: Omit<handshake.IParams, "partner"> = {},
      ): AutoMovieChain =>
        HumanChain.mutual(HumanMutual.handshake, { one: a, other: b }, params),
    };
  }
}

/**
 * Companion types of {@link HumanChain}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member.
 * @evidence contracts/development/design.md#principled-representation The chain intersected with one method per registered law, each typed by that law's own parameters.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `extend` returns and the types it is built from.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The parameter type is read from the law's plan, not restated.
 */
export namespace HumanChain {
  /** The parameters a law plans from. */
  export type Parameters<Law> = Law extends {
    plan(context: IHumanActionContext<infer P>): IHumanActionPlan;
  }
    ? P
    : never;

  /** A chain with a typed method for each registered law. */
  export type Extended<Laws> = HumanChain & {
    [Key in keyof Laws]: (
      ...args: {} extends Parameters<Laws[Key]>
        ? [params?: Parameters<Laws[Key]>, anchor?: string]
        : [params: Parameters<Laws[Key]>, anchor?: string]
    ) => Extended<Laws>;
  };

  /** What starts a chain of an extended kind. */
  export interface IExtension<Laws> {
    /**
     * An empty chain of a person.
     *
     * @param subject The person.
     * @returns The chain.
     */
    subject(subject: string): Extended<Laws>;
  }
}
