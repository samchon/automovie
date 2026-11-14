import { PlaygroundAddress } from "../playground/PlaygroundAddress";
import type { IPlaygroundComposition } from "../playground/structures/IPlaygroundComposition";
import { SCENES } from "../scenes/SCENES";
import { SceneStatus } from "../scenes/package/SceneStatus";
import type { IScene } from "../scenes/structures/IScene";
import type { IMotionReference } from "./structures/IMotionReference";

/**
 * Where the site's scenes use each action or row: the reverse index the
 * reference pages show beside every name, and the first use, which a "Try
 * it" link starts from.
 */
export namespace MotionUsage {
  /** The uses of one name. */
  export interface IUse {
    /** The scenes that compose it, in the gallery's order. */
    scenes: { id: string; title: string }[];

    /** Its first use, in the first of `scenes`; null when no scene uses it. */
    first: IFirst | null;
  }

  /** The first use of a name. */
  export interface IFirst {
    /** The scene's id, the first of `IUse.scenes`. */
    scene: string;

    /** The parameters of the scene's first performer action of that name; null when the scene names it only as a mutual action, which no one performs alone. */
    params: Record<string, unknown> | null;
  }

  /**
   * The uses of a name.
   *
   * @param name The action's or row's name.
   * @returns Its uses.
   */
  export function of(name: string): IUse {
    const scenes: { id: string; title: string }[] = [];
    let first: IFirst | null = null;
    for (const scene of SCENES) {
      if (scene.hidden === true || scene.composition === null) continue;

      // The scene's first performer action of the name, overlays included,
      // in the order the chains are written.
      let params: Record<string, unknown> | null = null;
      const visit: (action: IPlaygroundComposition.IAction) => void = (
        action: IPlaygroundComposition.IAction,
      ): void => {
        if (action.name === name) params ??= action.params;
        action.over?.forEach(visit);
      };
      for (const performer of scene.composition.performers)
        performer.actions.forEach(visit);
      const mutual: boolean = scene.composition.mutuals.some(
        (m: IPlaygroundComposition.IMutual): boolean => m.name === name,
      );
      if (params === null && !mutual) continue;
      scenes.push({ id: scene.id, title: scene.title });
      first ??= { scene: scene.id, params };
    }
    return { scenes, first };
  }

  /** What a "Try it" link opens, and what it says. */
  export interface ITrial {
    /** The link's text. */
    label: string;

    /** The playground composition it opens. */
    composition: IPlaygroundComposition;
  }

  /**
   * What a "Try it" link opens. The name is tried alone, one person
   * performing it with the parameters of its first use, only when that use
   * is a performer's action, its parameters name no one and nothing of its
   * scene, and they hold every parameter the schema requires; a name no
   * scene uses is tried alone with no parameters when its schema requires
   * none. Otherwise the first scene using it that plays on the installed
   * packages is opened, since a mutual action needs its partners, a named
   * person or object needs them, and a missing required parameter would be
   * refused; a refused scene is never opened, and with no scene that plays
   * there is no trial.
   *
   * @param name The action's or row's name.
   * @param parameters Its parameters from its schema; null when the release ships no schema, when nothing is known to be required.
   * @returns The link's text and composition, or null when no trial would play.
   */
  export function trial(
    name: string,
    parameters: IMotionReference.IParameter[] | null,
  ): ITrial | null {
    const use: IUse = of(name);
    const params: Record<string, unknown> | null =
      use.first === null ? {} : use.first.params;
    const scene: IScene | undefined = SCENES.find(
      (s: IScene): boolean => s.id === use.first?.scene,
    );
    if (
      params !== null &&
      (scene === undefined ||
        scene.composition === null ||
        !names(scene.composition, params)) &&
      (parameters ?? []).every(
        (p: IMotionReference.IParameter): boolean =>
          !p.required || Object.hasOwn(params, p.name),
      )
    )
      return {
        label: "Try it alone",
        composition: {
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
                { name, params },
              ],
            },
          ],
          mutuals: [],
        },
      };

    // The first scene that plays on the installed packages and uses the
    // name; none, and the name is offered nowhere it would be refused.
    const playing: IScene | undefined = SCENES.find(
      (s: IScene): boolean =>
        use.scenes.some((u: { id: string }): boolean => u.id === s.id) &&
        SceneStatus.of(s).kind === "plays",
    );
    if (playing === undefined || playing.composition === null) return null;
    return {
      label: `Try it in ${playing.title}`,
      composition: {
        ...playing.composition,
        version: PlaygroundAddress.VERSION,
      },
    };
  }

  /** Whether parameters name a person, an object or an anchor of a composition, or a seat. */
  function names(
    composition: IPlaygroundComposition,
    params: Record<string, unknown>,
  ): boolean {
    const known: Set<string> = new Set<string>([
      ...composition.performers.map(
        (p: IPlaygroundComposition.IPerformer): string => p.subject,
      ),
      ...(composition.objects ?? []).map(
        (o: IPlaygroundComposition.IObject): string => o.subject,
      ),
    ]);
    const anchor: (action: IPlaygroundComposition.IAction) => void = (
      action: IPlaygroundComposition.IAction,
    ): void => {
      if (action.anchor !== undefined) known.add(action.anchor);
      action.over?.forEach(anchor);
    };
    for (const performer of composition.performers)
      performer.actions.forEach(anchor);
    const visit: (value: unknown) => boolean = (value: unknown): boolean =>
      typeof value === "string"
        ? known.has(value)
        : Array.isArray(value)
          ? value.some(visit)
          : typeof value === "object" && value !== null
            ? "$seat" in value || Object.values(value).some(visit)
            : false;
    return visit(params);
  }
}
