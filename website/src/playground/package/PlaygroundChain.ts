import { AutoMovieEngineScheduleCut } from "@automovie/engine";
import type {
  AutoMovieHumanSex,
  IAutoMovieComposition,
} from "@automovie/interface";
import * as motions from "@automovie/motions";
import { HUMAN_ACTIONS, HumanChain } from "@automovie/motions";
import * as internal from "@automovie/motions/internal";

import { PLAYGROUND_BODIES } from "../data/PLAYGROUND_BODIES";
import { playgroundActionParams } from "../data/playgroundActionParams";
import type { IPlaygroundComposition } from "../structures/IPlaygroundComposition";
import { PlaygroundObjects } from "./PlaygroundObjects";

/**
 * Turns the playground's composition data into the composition
 * `HumanPerformance` takes, through `HumanChain`.
 *
 * The data names actions by text, so the chain is driven through the
 * untyped shape below rather than its typed methods. What the installed
 * package's chain lacks is found by looking at the chain itself, so an
 * operator a later release adds (`over`, `sync`, registered rows, mutual
 * joins) is built as soon as the dependency carries it, with no change here.
 */
export namespace PlaygroundChain {
  /** The chain as this module drives it: each member present only when the installed package has it. */
  interface ILoose {
    /** The composition the chain holds. */
    node: IAutoMovieComposition;

    /** Append a vocabulary action. */
    act(name: string, params: object, anchor?: string): ILoose;

    /** Append a registered row or law by name. */
    registered?(name: string, params: object, anchor?: string): ILoose;

    /** Cut the last action. */
    until(until: IPlaygroundComposition.IAction["until"]): ILoose;

    /** Time the last action to an instant. */
    sync?(sync: object): ILoose;

    /** Perform other actions over the last one. */
    over?(build: (overlay: ILoose) => ILoose): ILoose;

    /** Run other parts at the same instant. */
    with(...parts: (ILoose | IAutoMovieComposition)[]): ILoose;

    /** Follow with other parts. */
    next(...parts: (ILoose | IAutoMovieComposition)[]): ILoose;
  }

  /** A law record of the lexicon: anything with a name and a plan. */
  interface ILaw {
    /** The name the law is registered under. */
    name: string;
  }

  /** A mutual action record. */
  interface IMutual {
    /** Its name. */
    name: string;

    /** The roles it casts. */
    roles: readonly string[];

    /** The action one role performs, for the shared parameters and the cast. */
    act(
      role: string,
      params: object,
      cast: Readonly<Record<string, string>>,
    ): { name: string };
  }

  /** The package's exports by name, for the tables only some releases have. */
  const EXPORTS: Readonly<Record<string, unknown>> = {
    ...(motions as Readonly<Record<string, unknown>>),
    ...(internal as Readonly<Record<string, unknown>>),
  };

  /** A chain's prototype, which shows the operators the installed package has. */
  const PROTOTYPE: Record<string, unknown> =
    HumanChain.prototype as unknown as Record<string, unknown>;

  /** What a built composition needs beside its node. */
  export interface IBuilt {
    /** The composition. */
    composition: IAutoMovieComposition;

    /** The lexicon laws it names, which the performance must be given. */
    laws: unknown[];
  }

  /**
   * Whether the installed chain has an operator.
   *
   * @param name The chain method's name.
   * @returns Whether it exists.
   */
  export function has(name: "over" | "sync" | "registered"): boolean {
    return typeof PROTOTYPE[name] === "function";
  }

  /**
   * The lexicon's families, from the package's `HUMAN_LEXICON`.
   *
   * @returns Each family's law records by family name; empty when the package has no such table.
   */
  export function lexicon(): Record<string, ILaw[]> {
    const table: unknown = EXPORTS["HUMAN_LEXICON"];
    if (typeof table !== "object" || table === null) return {};
    return table as Record<string, ILaw[]>;
  }

  /**
   * The laws the package exports by name at its top level, beside the
   * lexicon's rows: a registered law no family lists.
   *
   * @returns Each law by its name.
   */
  export function exported(): Map<string, ILaw> {
    const found: Map<string, ILaw> = new Map();
    for (const value of Object.values(EXPORTS))
      if (
        typeof value === "object" &&
        value !== null &&
        typeof (value as ILaw).name === "string" &&
        typeof (value as { plan?: unknown }).plan === "function"
      )
        found.set((value as ILaw).name, value as ILaw);
    return found;
  }

  /**
   * The laws available by the name a composition supplies. A lexicon row
   * takes precedence if the released package also exposes that name directly.
   *
   * @returns Laws that can be appended by HumanChain.registered.
   */
  export function registeredLaws(): ReadonlyMap<string, ILaw> {
    const laws: Map<string, ILaw> = exported();
    for (const family of Object.values(lexicon()))
      for (const law of family) laws.set(law.name, law);
    return laws;
  }

  /**
   * The named mutual actions the installed chain can join.
   *
   * @returns Each record by its name; empty when the package has none or its chain cannot join them.
   */
  export function mutuals(): Record<string, IMutual> {
    return Object.fromEntries(
      Object.entries(mutualExports()).map(
        ([name, { record }]): [string, IMutual] => [name, record],
      ),
    );
  }

  /** A mutual action and the expression that refers to it in authored code. */
  interface IMutualExport {
    /** The exported action record. */
    record: IMutual;

    /** Its named export or namespace member. */
    expression: string;
  }

  /**
   * Find named mutual actions exported directly or in a namespace. The
   * playground and a scene's displayed program use the same export.
   *
   * @returns The action and its public expression for each name.
   */
  export function mutualExports(): Record<string, IMutualExport> {
    const join: unknown = (HumanChain as unknown as Record<string, unknown>)[
      "mutual"
    ];
    if (typeof join !== "function") return {};
    const found: Record<string, IMutualExport> = {};
    const register = (value: unknown, expression: string): void => {
      if (
        typeof value === "object" &&
        value !== null &&
        typeof (value as IMutual).name === "string" &&
        Array.isArray((value as IMutual).roles) &&
        typeof (value as IMutual).act === "function"
      ) {
        const record: IMutual = value as IMutual;
        found[record.name] = { record, expression };
      }
    };
    for (const [key, space] of Object.entries(EXPORTS)) {
      if (typeof space !== "object" || space === null) continue;
      register(space, key);
      for (const [member, value] of Object.entries(space)) {
        register(value, `${key}.${member}`);
        // A family namespace holds a law that carries its mutual action, as
        // `AutoMovieMotionHumanCarryPerson.HumanAssistedTransfer.mutual`.
        if (typeof value !== "object" || value === null) continue;
        for (const [inner, nested] of Object.entries(value))
          register(nested, `${key}.${member}.${inner}`);
      }
    }
    return found;
  }

  /**
   * Build the composition of the playground's data.
   *
   * @param data The composition data.
   * @returns The composition and the lexicon laws it names.
   * @throws {Error} When the data asks for an operator the installed package lacks, names no action at all, or leaves a role of a mutual action without a performer.
   */
  export function build(data: IPlaygroundComposition): IBuilt {
    const rows: ReadonlyMap<string, ILaw> = registeredLaws();
    const laws: Map<string, ILaw> = new Map();
    const objects: readonly IPlaygroundComposition.IObject[] =
      data.objects ?? [];

    const append = (
      chain: ILoose,
      action: IPlaygroundComposition.IAction,
      sex: AutoMovieHumanSex | undefined,
    ): ILoose => {
      const bound: Record<string, unknown> = playgroundActionParams(
        action,
        sex,
      );
      // A seat named by its object becomes that object's seat.
      const params: Record<string, unknown> =
        objects.length === 0
          ? bound
          : PlaygroundObjects.resolve(bound, objects);
      // A released row or standalone law is registered with the performance
      // and appended by name. Other names go to act for normal SDK admission.
      const row: ILaw | undefined =
        action.name in HUMAN_ACTIONS ? undefined : rows.get(action.name);
      let next: ILoose;
      if (row !== undefined && chain.registered !== undefined) {
        laws.set(row.name, row);
        next = chain.registered(action.name, params, action.anchor);
      } else next = chain.act(action.name, params, action.anchor);

      if (action.until !== undefined)
        next = next.until(AutoMovieEngineScheduleCut.normalize(action.until));

      if (action.over !== undefined && action.over.length !== 0) {
        if (next.over === undefined)
          throw new Error(
            "The installed @automovie/motions has no HumanChain.over, so one action cannot be performed over another yet",
          );
        const overlaid: IPlaygroundComposition.IAction[] = action.over;
        next = next.over(
          (overlay: ILoose): ILoose =>
            overlaid.reduce(
              (part: ILoose, action: IPlaygroundComposition.IAction): ILoose =>
                append(part, action, sex),
              overlay,
            ),
        );
      }

      if (action.sync !== undefined) {
        if (next.sync === undefined)
          throw new Error(
            "The installed @automovie/motions has no HumanChain.sync, so an action cannot be timed to another instant yet",
          );
        next = next.sync(action.sync);
      }
      return next;
    };

    const empty = (subject: string): ILoose =>
      HumanChain.subject(subject) as unknown as ILoose;
    const chains: ILoose[] = data.performers
      .filter(
        (performer: IPlaygroundComposition.IPerformer): boolean =>
          performer.actions.length !== 0,
      )
      .map((performer: IPlaygroundComposition.IPerformer): ILoose => {
        const sex: AutoMovieHumanSex | undefined =
          PLAYGROUND_BODIES[performer.body]?.parameters?.body.anatomy.sex;
        return performer.actions.reduce(
          (part: ILoose, action: IPlaygroundComposition.IAction): ILoose =>
            append(part, action, sex),
          empty(performer.subject),
        );
      });
    if (chains.length === 0 && data.mutuals.length === 0)
      throw new Error("The composition has no action; add one to a performer");

    // Every person's chain runs at once; each mutual action follows them all.
    const known: Record<string, IMutual> = mutuals();
    const join = (HumanChain as unknown as Record<string, unknown>)[
      "mutual"
    ] as
      | ((
          mutual: IMutual,
          cast: Record<string, ILoose>,
          params: object,
        ) => ILoose)
      | undefined;
    const joined: ILoose[] = data.mutuals.map(
      (mutual: IPlaygroundComposition.IMutual): ILoose => {
        const record: IMutual | undefined = known[mutual.name];
        if (record === undefined || join === undefined)
          throw new Error(
            `The installed @automovie/motions has no mutual action named ${mutual.name}; it has ${Object.keys(known).join(", ") || "none"}`,
          );
        const uncast: string[] = record.roles.filter(
          (role: string): boolean => (mutual.cast[role] ?? "") === "",
        );
        if (uncast.length !== 0)
          throw new Error(
            `The mutual action ${mutual.name} has no performer cast as ${uncast.join(", ")}; choose one for each role`,
          );

        // A seat or an opening named by its object becomes that object's,
        // as in a person's own action.
        const params: Record<string, unknown> =
          objects.length === 0
            ? mutual.params
            : PlaygroundObjects.resolve(mutual.params, objects);

        // Each role's action is a vocabulary name, a lexicon row or a law
        // the package exports; a row or a law is registered with the
        // performance, as the mutual's own documentation asks.
        for (const role of record.roles) {
          const name: string = record.act(role, params, mutual.cast).name;
          if (name in HUMAN_ACTIONS) continue;
          const law: ILaw | undefined = rows.get(name);
          if (law !== undefined) laws.set(law.name, law);
        }
        return join(
          record,
          Object.fromEntries(
            record.roles.map((role: string): [string, ILoose] => [
              role,
              empty(mutual.cast[role]!),
            ]),
          ),
          params,
        );
      },
    );

    // The people's chains run at once and each mutual action follows them,
    // joined with the chain's own `with` and `next`, as an agent's code
    // joins them.
    const people: ILoose | undefined =
      chains.length <= 1 ? chains[0] : chains[0]!.with(...chains.slice(1));
    const head: ILoose | undefined = people ?? joined[0];
    const rest: ILoose[] = people === undefined ? joined.slice(1) : joined;
    if (head === undefined)
      throw new Error("The composition has no action; add one to a performer");
    const scene: IAutoMovieComposition = (
      rest.length === 0 ? head : head.next(...rest)
    ).node;
    return {
      composition: scene,
      laws: [...laws.values()],
    };
  }
}
