import type { IPlaygroundComposition } from "../playground/structures/IPlaygroundComposition";
import { SCENES } from "../scenes/SCENES";
import type { IScene } from "../scenes/structures/IScene";

/**
 * Where the site's scenes use each action or row: the reverse index the
 * reference pages show beside every name, and the parameters of a first use,
 * which a "Try it" link starts from.
 */
export namespace MotionUsage {
  /** The uses of one name. */
  export interface IUse {
    /** The scenes that compose it, in the gallery's order. */
    scenes: { id: string; title: string }[];

    /** The parameters of its first use; empty when no scene uses it. */
    params: Record<string, unknown>;
  }

  /**
   * The uses of a name.
   *
   * @param name The action's or row's name.
   * @returns Its uses.
   */
  export function of(name: string): IUse {
    const scenes: { id: string; title: string }[] = [];
    let params: Record<string, unknown> | null = null;
    const visit: (
      scene: IScene,
      found: { hit: boolean },
    ) => (action: IPlaygroundComposition.IAction) => void =
      (
        scene: IScene,
        found: { hit: boolean },
      ): ((action: IPlaygroundComposition.IAction) => void) =>
      (action: IPlaygroundComposition.IAction): void => {
        if (action.name === name) {
          found.hit = true;
          params ??= action.params;
        }
        action.over?.forEach(visit(scene, found));
      };
    for (const scene of SCENES) {
      if (scene.hidden === true || scene.composition === null) continue;
      const found: { hit: boolean } = { hit: false };
      for (const performer of scene.composition.performers)
        performer.actions.forEach(visit(scene, found));
      if (
        scene.composition.mutuals.some(
          (m: IPlaygroundComposition.IMutual): boolean => m.name === name,
        )
      )
        found.hit = true;
      if (found.hit) scenes.push({ id: scene.id, title: scene.title });
    }
    return { scenes, params: params ?? {} };
  }

  /**
   * The playground composition a "Try it" link opens: one person performing
   * the name with the parameters of its first use.
   *
   * @param name The action's or row's name.
   * @returns The composition.
   */
  export function trial(name: string): IPlaygroundComposition {
    return {
      version: 1,
      seed: "try",
      performers: [
        {
          subject: "a",
          body: "m1",
          x: 0,
          z: 0,
          yaw: 0,
          proficiency: "trained",
          actions: [
            { name: "stand", params: { seconds: 0.5 } },
            { name, params: of(name).params },
          ],
        },
      ],
      mutuals: [],
    };
  }
}
