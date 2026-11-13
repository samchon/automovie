import type { AutoMovieComposition } from "@automovie/engine";
import * as motions from "@automovie/motions";
import { HUMAN_ACTIONS, HumanChain } from "@automovie/motions";

import type { IPlaygroundComposition } from "../structures/IPlaygroundComposition";

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
   * The mutual actions, from the package's `HumanMutual`.
   *
   * @returns Each record by name; empty when the package has none or its chain cannot join them.
   */
  export function mutuals(): Record<string, IMutual> {
    const space: unknown = EXPORTS["HumanMutual"];
    const join: unknown = (HumanChain as unknown as Record<string, unknown>)[
      "mutual"
    ];
    if (typeof space !== "object" || space === null) return {};
    if (typeof join !== "function") return {};
    return Object.fromEntries(
      Object.entries(space as Record<string, unknown>).filter(
        ([, value]: [string, unknown]): boolean =>
          typeof value === "object" && value !== null && "roles" in value,
      ),
    ) as Record<string, IMutual>;
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

    const append = (
      chain: ILoose,
      action: IPlaygroundComposition.IAction,
    ): ILoose => {
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
        ) => { node: AutoMovieComposition })
      | undefined;
    const joined: AutoMovieComposition[] = data.mutuals.map(
      (mutual: IPlaygroundComposition.IMutual): AutoMovieComposition => {
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
        return join(
          record,
          Object.fromEntries(
            record.roles.map((role: string): [string, ILoose] => [
              role,
              empty(mutual.cast[role]!),
            ]),
          ),
          mutual.params,
        ).node;
      },
    );

    return {
      composition: {
        kind: "sequence",
        parts: [
          {
            kind: "parallel",
            parts: chains.map(
              (chain: ILoose): AutoMovieComposition => chain.node,
            ),
          },
          ...joined,
        ],
      },
      laws: [...laws.values()],
    };
  }
}
