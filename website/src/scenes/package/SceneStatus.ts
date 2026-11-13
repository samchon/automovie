import * as archetypes from "@automovie/archetypes";
import { HUMAN_ACTIONS } from "@automovie/motions";

import { PlaygroundChain } from "../../playground/package/PlaygroundChain";
import { PlaygroundObjects } from "../../playground/package/PlaygroundObjects";
import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";
import type { IScene } from "../structures/IScene";

/**
 * Whether a scene plays on the installed packages, read from their own
 * data: the vocabulary, the lexicon, the chain's operators, the mutual
 * records and the archetype producers. Nothing here names a scene, so a
 * scene written for pieces a later release brings plays once that release
 * is installed.
 */
export namespace SceneStatus {
  /** A scene's status. */
  export type Status =
    | { kind: "plays" }
    | {
        /** The scene has a composition the installed packages cannot build. */
        kind: "waits";

        /** The pieces they lack. */
        missing: string[];
      }
    | { kind: "planned" };

  /**
   * The status of a scene.
   *
   * @param scene The scene.
   * @returns Whether it plays, what it waits for, or that it is planned.
   */
  export function of(scene: IScene): Status {
    if (scene.composition === null) return { kind: "planned" };
    const missing: string[] = lacks(scene.composition);
    return missing.length === 0
      ? { kind: "plays" }
      : { kind: "waits", missing };
  }

  /**
   * What the installed packages lack of a composition.
   *
   * @param composition The composition.
   * @returns One line per missing piece; empty when it can be built.
   */
  export function lacks(composition: IPlaygroundComposition): string[] {
    const rows: Set<string> = new Set(
      Object.values(PlaygroundChain.lexicon())
        .flat()
        .map((law: { name: string }): string => law.name),
    );
    const mutuals: Set<string> = new Set(
      Object.keys(PlaygroundChain.mutuals()),
    );
    const exported: Readonly<Record<string, unknown>> = archetypes as Readonly<
      Record<string, unknown>
    >;
    const missing: Set<string> = new Set();

    const visit: (action: IPlaygroundComposition.IAction) => void = (
      action: IPlaygroundComposition.IAction,
    ): void => {
      if (!(action.name in HUMAN_ACTIONS) && !rows.has(action.name))
        missing.add(`the action ${action.name}`);
      if (action.over !== undefined && action.over.length !== 0) {
        if (!PlaygroundChain.has("over")) missing.add("HumanChain.over");
        action.over.forEach(visit);
      }
      if (action.sync !== undefined && !PlaygroundChain.has("sync"))
        missing.add("HumanChain.sync");
    };
    for (const performer of composition.performers)
      performer.actions.forEach(visit);
    for (const mutual of composition.mutuals)
      if (!mutuals.has(mutual.name)) missing.add(`the mutual ${mutual.name}`);

    const objects: readonly IPlaygroundComposition.IObject[] =
      composition.objects ?? [];
    if (objects.length !== 0 && !PlaygroundObjects.available())
      missing.add("HumanObject");
    for (const object of objects)
      if (typeof exported[object.producer] !== "function")
        missing.add(`the archetype ${object.producer}`);
    return [...missing];
  }
}
