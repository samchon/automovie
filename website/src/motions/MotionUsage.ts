import { PlaygroundAddress } from "../playground/PlaygroundAddress";
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

  /** What a "Try it" link opens, and what it says. */
  export interface ITrial {
    /** The link's text. */
    label: string;

    /** The playground composition it opens. */
    composition: IPlaygroundComposition;
  }

  /**
   * What a "Try it" link opens. A first use that names no one and nothing
   * else is tried alone: one person performing the name with its parameters.
   * A first use that names another person, an object or an anchor needs them,
   * so its whole scene is opened instead, where those exist.
   *
   * @param name The action's or row's name.
   * @returns The link's text and composition.
   */
  export function trial(name: string): ITrial {
    const use: IUse = of(name);
    const scene: IScene | undefined = SCENES.find(
      (s: IScene): boolean => s.id === use.scenes[0]?.id,
    );
    if (
      scene !== undefined &&
      scene.composition !== null &&
      names(scene.composition, use.params)
    )
      return {
        label: `Try it in ${scene.title}`,
        composition: {
          ...scene.composition,
          version: PlaygroundAddress.VERSION,
        },
      };
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
              { name, params: use.params },
            ],
          },
        ],
        mutuals: [],
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
