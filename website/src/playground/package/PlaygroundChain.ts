import type { AutoMovieComposition } from "@automovie/engine";
import * as motions from "@automovie/motions";
import { HUMAN_ACTIONS, HumanChain } from "@automovie/motions";

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
    node: AutoMovieComposition;

    /** Append a vocabulary action. */
    act(name: string, params: object, anchor?: string): ILoose;

    /** Append a registered row or law by name. */
    registered?(name: string, params: object, anchor?: string): ILoose;

    /** Cut the last action. */
    until(until: object): ILoose;

    /** Time the last action to an instant. */
    sync?(sync: object): ILoose;

    /** Perform other actions over the last one. */
    over?(build: (overlay: ILoose) => ILoose): ILoose;

    /** Run other parts at the same instant. */
    with(...parts: (ILoose | AutoMovieComposition)[]): ILoose;

    /** Follow with other parts. */
    next(...parts: (ILoose | AutoMovieComposition)[]): ILoose;
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
  const EXPORTS: Readonly<Record<string, unknown>> = motions as Readonly<
    Record<string, unknown>
  >;

  /** A chain's prototype, which shows the operators the installed package has. */
  const PROTOTYPE: Record<string, unknown> =
    HumanChain.prototype as unknown as Record<string, unknown>;

  /** What a built composition needs beside its node. */
  export interface IBuilt {
    /** The composition. */
    composition: AutoMovieComposition;

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
   * lexicon's rows: a law a mutual action names but no family lists.
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
   * The mutual actions: every record the package exports, in any namespace
   * (`HumanMutual`, and the lexicon's social and partner families), that
   * names itself and casts roles.
   *
   * @returns Each record by its name; empty when the package has none or its chain cannot join them.
   */
  export function mutuals(): Record<string, IMutual> {
    const join: unknown = (HumanChain as unknown as Record<string, unknown>)[
      "mutual"
    ];
    if (typeof join !== "function") return {};
    const found: Record<string, IMutual> = {};
    for (const space of Object.values(EXPORTS)) {
      if (typeof space !== "object" || space === null) continue;
      for (const value of Object.values(space as Record<string, unknown>))
        if (
          typeof value === "object" &&
          value !== null &&
          typeof (value as IMutual).name === "string" &&
          Array.isArray((value as IMutual).roles) &&
          typeof (value as IMutual).act === "function"
        )
          found[(value as IMutual).name] = value as IMutual;
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
    const rows: Map<string, ILaw> = new Map(
      Object.values(lexicon())
        .flat()
        .map((law: ILaw): [string, ILaw] => [law.name, law]),
    );
    const laws: Map<string, ILaw> = new Map();
    const objects: readonly IPlaygroundComposition.IObject[] =
      data.objects ?? [];

    const append = (
      chain: ILoose,
      written: IPlaygroundComposition.IAction,
    ): ILoose => {
      // A seat named by its object becomes that object's seat.
      const action: IPlaygroundComposition.IAction =
        objects.length === 0
          ? written
          : {
              ...written,
              params: PlaygroundObjects.resolve(written.params, objects),
            };
      // A lexicon row is registered with the performance and appended by its
      // name. Any other name goes to `act`, so a name the vocabulary lacks is
      // refused by the package in its own words.
      const row: ILaw | undefined =
        action.name in HUMAN_ACTIONS ? undefined : rows.get(action.name);
      let next: ILoose;
      if (row !== undefined && chain.registered !== undefined) {
        laws.set(row.name, row);
        next = chain.registered(action.name, action.params, action.anchor);
      } else next = chain.act(action.name, action.params, action.anchor);

      if (action.until !== undefined) next = next.until(action.until);

      if (action.over !== undefined && action.over.length !== 0) {
        if (next.over === undefined)
          throw new Error(
            "The installed @automovie/motions has no HumanChain.over, so one action cannot be performed over another yet",
          );
        const overlaid: IPlaygroundComposition.IAction[] = action.over;
        next = next.over(
          (overlay: ILoose): ILoose => overlaid.reduce(append, overlay),
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
      .map(
        (performer: IPlaygroundComposition.IPerformer): ILoose =>
          performer.actions.reduce(append, empty(performer.subject)),
      );
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
        // Each role's action is a vocabulary name, a lexicon row or a law
        // the package exports; a row or a law is registered with the
        // performance, as the mutual's own documentation asks.
        for (const role of record.roles) {
          const name: string = record.act(
            role,
            mutual.params,
            mutual.cast,
          ).name;
          if (name in HUMAN_ACTIONS) continue;
          const law: ILaw | undefined = rows.get(name) ?? exported().get(name);
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
          mutual.params,
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
    const scene: AutoMovieComposition = (
      rest.length === 0 ? head : head.next(...rest)
    ).node;
    return {
      composition: scene,
      laws: [...laws.values()],
    };
  }
}
