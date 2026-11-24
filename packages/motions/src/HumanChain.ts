import { AutoMovieChain } from "@automovie/engine";
import type {
  IAutoMovieChain,
  IAutoMovieComposition,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanHandoverAction,
  IAutoMovieMotionHumanHandshake,
  IAutoMovieMotionHumanMutual,
} from "@automovie/interface";

import { HumanMutual } from "./actions/HumanMutual";
import { HumanChainSport } from "./chain/HumanChainSport";

/** The record of `IPairResult`'s site. */
type IPairResult = {
  handshake(
    params?: Omit<IAutoMovieMotionHumanHandshake.IParams, "partner">,
  ): IAutoMovieChain;
  handOver(
    params: Omit<IAutoMovieMotionHumanHandoverAction.IParams, "to">,
  ): IAutoMovieChain;
};

/**
 * The fluent authoring surface of one person's actions: one typed method per
 * action of the vocabulary, `act` for the same action by its name, `registered`
 * for a production's own law by its name, `until` to cut the last one, `sync`
 * to time it to another action or a cue, `over` to perform other actions on it
 * at once (`HumanChainCore`), and `next` and `with` (from `AutoMovieChain`) to
 * sequence and parallel whole chains, people with people. Its statics start a
 * chain (`subject`), give registered laws typed methods (`extend`) and join
 * people in a mutual action (`mutual`, and `pair` for a handshake and a
 * handover).
 *
 * ```ts
 * const a = HumanChain.subject("a")
 *   .stand({ hold: 1 })
 *   .until({ share: 0.5 })
 *   .stand();
 * new HumanPerformance({ seed: "film", performers, composition: a.node });
 * ```
 *
 * A chain is immutable; every method returns a new chain. The chain only names
 * actions and their parameters: bodies, places and skill belong to the
 * performance, which plans every action and refuses an undeclared cut with the
 * legal windows.
 *
 * The vocabulary methods are inherited in families (travel, posture, the hands,
 * striking, partners and objects, sport), each family a class of this one's
 * ancestry, so every action of `AutoMovieMotionHumanActionName` is a method
 * here and each takes its law's own parameter type.
 */
export class HumanChain extends HumanChainSport {
  /**
   * An empty chain of a person: no action until one is appended.
   *
   * @param subject The person.
   * @returns The chain.
   */
  public static subject(subject: string): IAutoMovieMotionHumanChain {
    return new HumanChain(subject, { kind: "sequence", parts: [] });
  }

  /**
   * The chain with a typed method for each law a production registers: the
   * production's own actions are appended exactly like the vocabulary's.
   *
   * ```ts
   * const Chain = HumanChain.extend({ salute });
   * Chain.subject("a").walk({ to }).salute({ hold: 1.5 }).stand();
   * new HumanPerformance({
   *   seed,
   *   performers,
   *   laws: [salute],
   *   composition,
   * });
   * ```
   *
   * @param laws The registered laws, each under the name it carries.
   * @returns What starts a chain of the extended kind.
   * @throws {Error} When a key differs from its law's name, or names something
   *   the chain already has.
   */
  public static extend<
    Laws extends Readonly<
      Record<string, IAutoMovieMotionHumanActionLaw<never>>
    >,
  >(laws: Laws): IAutoMovieMotionHumanChain.IExtension<Laws> {
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
        (
          this: IAutoMovieMotionHumanChain,
          params?: object,
          anchor?: string,
        ) => IAutoMovieMotionHumanChain
      > = {
        [key](
          this: IAutoMovieMotionHumanChain,
          params: object = {},
          anchor?: string,
        ): IAutoMovieMotionHumanChain {
          return this.registered(law.name, params, anchor);
        },
      };
      Object.defineProperty(Extended.prototype, key, {
        value: methods[key],
        writable: false,
      });
    }
    return {
      subject: (subject: string): IAutoMovieMotionHumanChain.Extended<Laws> =>
        new Extended(subject, {
          kind: "sequence",
          parts: [],
        }) as IAutoMovieMotionHumanChain.Extended<Laws>,
    };
  }

  /**
   * Join people's chains in a mutual action: one thing they do together, such
   * as a handshake, a handover or a lift.
   *
   * Every chain of the cast plays first, side by side, and then every role
   * performs its part of the mutual action at once, so each person's earlier
   * actions are placed before any role plans the meeting. `HumanMutual` holds
   * the vocabulary's mutual actions; a production states its own as an
   * `IHumanMutual` over its registered laws.
   *
   * ```ts
   * HumanChain.mutual(
   *   HumanMutual.handOver,
   *   { giver: a, receiver: b },
   *   { prop: "cup", handle: "body" },
   * );
   * ```
   *
   * @param mutual The mutual action.
   * @param cast Each role's chain.
   * @param args The shared parameters, then an optional anchor: each role's
   *   action is anchored `anchor.role`.
   * @returns The joined composition.
   * @throws {Error} When one person is cast in two roles.
   */
  public static mutual<Params extends object, Role extends string>(
    mutual: IAutoMovieMotionHumanMutual<Params, Role>,
    cast: Readonly<Record<Role, IAutoMovieMotionHumanChainCore>>,
    ...args: {} extends Params
      ? [params?: Params, anchor?: string]
      : [params: Params, anchor?: string]
  ): IAutoMovieChain {
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
            (role: Role): IAutoMovieComposition => cast[role].node,
          ),
        },
        {
          kind: "parallel",
          parts: mutual.roles.map((role: Role): IAutoMovieComposition => {
            const act: IAutoMovieMotionHumanMutual.IAct = mutual.act(
              role,
              params ?? ({} as Params),
              subjects,
              anchor,
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
   * Two people's chains joined for a mutual action: `mutual` for the two that
   * every film has, a handshake and a handover.
   *
   * @param a One person's chain; the giver of a handover.
   * @param b The other's; the receiver.
   * @returns The mutual actions, each returning the joined composition.
   */
  public static pair(
    a: IAutoMovieMotionHumanChain,
    b: IAutoMovieMotionHumanChain,
  ): IPairResult {
    return {
      handOver: (
        params: Omit<IAutoMovieMotionHumanHandoverAction.IParams, "to">,
      ): IAutoMovieChain =>
        HumanChain.mutual(
          HumanMutual.handOver,
          { giver: a, receiver: b },
          params,
        ),
      handshake: (
        params: Omit<IAutoMovieMotionHumanHandshake.IParams, "partner"> = {},
      ): IAutoMovieChain =>
        HumanChain.mutual(HumanMutual.handshake, { one: a, other: b }, params),
    };
  }
}
