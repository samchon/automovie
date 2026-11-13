import type { IPlaygroundComposition } from "../playground/structures/IPlaygroundComposition";
import type { IScene } from "./structures/IScene";

/**
 * What a card and a page say about a scene, read from its record: who and
 * what is in it, and which actions it composes.
 */
export namespace SceneFacts {
  /**
   * Every distinct action name a scene composes, overlays and mutual
   * actions included, in the order they first appear.
   *
   * @param scene The scene.
   * @returns The names; empty for a planned scene.
   */
  export function actions(scene: IScene): string[] {
    const names: Set<string> = new Set();
    const visit = (action: IPlaygroundComposition.IAction): void => {
      names.add(action.name);
      action.over?.forEach(visit);
    };
    for (const performer of scene.composition?.performers ?? [])
      performer.actions.forEach(visit);
    for (const mutual of scene.composition?.mutuals ?? [])
      names.add(mutual.name);
    return [...names];
  }

  /**
   * The line a card shows under its title.
   *
   * @param scene The scene.
   * @returns Such as "3 people, 2 objects, 9 actions".
   */
  export function counts(scene: IScene): string {
    const plural = (n: number, one: string, many: string): string =>
      `${n} ${n === 1 ? one : many}`;
    if (scene.composition === null) return scene.planned?.cast ?? "";
    const parts: string[] = [
      plural(scene.cast.length, "person", "people"),
    ];
    const objects: number = scene.composition.objects?.length ?? 0;
    if (objects !== 0) parts.push(plural(objects, "object", "objects"));
    parts.push(plural(actions(scene).length, "action", "actions"));
    return parts.join(", ");
  }

  /**
   * Whether a scene matches a search: every word is in its title, its
   * summary, its roles or its actions.
   *
   * @param scene The scene.
   * @param query The words typed.
   * @returns Whether it matches; every scene matches an empty query.
   */
  export function matches(scene: IScene, query: string): boolean {
    const haystack: string = [
      scene.title,
      scene.summary,
      ...scene.cast.map((c: IScene.ICast): string => c.role),
      ...actions(scene),
      scene.planned?.pieces ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter((word: string): boolean => word !== "")
      .every((word: string): boolean => haystack.includes(word));
  }
}
