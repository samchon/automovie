import * as archetypes from "@automovie/archetypes";
import * as motions from "@automovie/motions";
import { HUMAN_ACTIONS } from "@automovie/motions";

import { PlaygroundChain } from "../../playground/package/PlaygroundChain";
import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";
import type { ISceneChainNames } from "../structures/ISceneChainNames";

/**
 * The exported names the code of a scene's page refers to, read from the
 * installed packages at build time, so `formatSceneChain` writes code that
 * imports what it uses without loading the packages in the browser.
 */
export namespace SceneChainNames {
  /** The packages' exports by name. */
  const MOTIONS: Readonly<Record<string, unknown>> = motions as Readonly<
    Record<string, unknown>
  >;

  /**
   * The names a scene's code needs: every row, law, mutual and frame
   * producer the packages export, and the laws its performance registers.
   *
   * @param composition The scene's composition.
   * @returns The names; no laws when the installed packages cannot build it.
   */
  export function read(composition: IPlaygroundComposition): ISceneChainNames {
    const rows: Record<string, string> = {};
    const mutuals: Record<string, string> = {};
    for (const [key, value] of Object.entries(MOTIONS)) {
      if (typeof value !== "object" || value === null) continue;

      // A law exported on its own, such as `armWrestle`.
      if (
        typeof (value as { plan?: unknown }).plan === "function" &&
        typeof (value as { name?: unknown }).name === "string"
      ) {
        rows[(value as { name: string }).name] ??= key;
        continue;
      }

      // A namespace of rows or mutual records, such as `HumanSocial`.
      for (const [member, inner] of Object.entries(
        value as Record<string, unknown>,
      )) {
        if (typeof inner !== "object" || inner === null) continue;
        const name: unknown = (inner as { name?: unknown }).name;
        if (typeof name !== "string") continue;
        if (typeof (inner as { plan?: unknown }).plan === "function")
          rows[name] ??= `${key}.${member}`;
        else if (typeof (inner as { act?: unknown }).act === "function")
          mutuals[name] ??= `${key}.${member}`;
      }
    }
    const frames: string[] = Object.entries(
      archetypes as Readonly<Record<string, unknown>>,
    )
      .filter(
        ([, producer]: [string, unknown]): boolean =>
          typeof producer === "function" &&
          Array.isArray((producer as { FRAMES?: unknown }).FRAMES),
      )
      .map(([key]: [string, unknown]): string => key);
    let laws: string[] = [];
    try {
      laws = PlaygroundChain.build(composition).laws.map(
        (law: unknown): string =>
          rows[(law as { name: string }).name] ?? (law as { name: string }).name,
      );
    } catch {
      laws = [];
    }

    // Only the names this scene uses go to its page; a vocabulary action is
    // appended with `act`, so it is never a row.
    const used: Set<string> = new Set<string>(
      composition.mutuals.map(
        (m: IPlaygroundComposition.IMutual): string => m.name,
      ),
    );
    const visit: (action: IPlaygroundComposition.IAction) => void = (
      action: IPlaygroundComposition.IAction,
    ): void => {
      used.add(action.name);
      action.over?.forEach(visit);
    };
    for (const performer of composition.performers)
      performer.actions.forEach(visit);
    const pick: (all: Record<string, string>) => Record<string, string> = (
      all: Record<string, string>,
    ): Record<string, string> =>
      Object.fromEntries(
        Object.entries(all).filter(
          ([name]: [string, string]): boolean =>
            used.has(name) && !(name in HUMAN_ACTIONS),
        ),
      );
    return { rows: pick(rows), mutuals: pick(mutuals), frames, laws };
  }
}
