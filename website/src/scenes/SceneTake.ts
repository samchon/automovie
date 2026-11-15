import type { IPlaygroundComposition } from "../playground/structures/IPlaygroundComposition";
import type { IScene } from "./structures/IScene";

/**
 * Applies a take to a scene's composition: the composition with the take's
 * seed, bodies and skill in place of the scene's own.
 */
export namespace SceneTake {
  /**
   * The composition a take performs.
   *
   * @param composition The scene's composition.
   * @param take The take.
   * @returns A new composition; the scene's is left as it was.
   */
  export function apply(
    composition: IPlaygroundComposition,
    take: IScene.ITake,
  ): IPlaygroundComposition {
    const next: IPlaygroundComposition = structuredClone(composition);
    if (take.seed !== undefined) next.seed = take.seed;
    for (const performer of next.performers) {
      const body: string | undefined = take.bodies?.[performer.subject];
      if (body !== undefined) performer.body = body;
      const level: IPlaygroundComposition.Proficiency | undefined =
        take.proficiency?.[performer.subject];
      if (level !== undefined) performer.proficiency = level;
    }
    return next;
  }
}
