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
    const visit: (action: IPlaygroundComposition.IAction) => void = (
      action: IPlaygroundComposition.IAction,
    ): void => {
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
   * The ways a scene composes its actions beyond one action after another,
   * as its page lists them: performed over another action, cut early,
   * timed to another person's instant, done together, seated, riding, and
   * holding or using a placed object.
   *
   * @param scene The scene.
   * @returns The features in that order, each a short phrase; empty for a planned scene or a plain sequence.
   */
  export function features(scene: IScene): string[] {
    const found: Set<string> = new Set();
    const objects: Set<string> = new Set(
      (scene.composition?.objects ?? []).map(
        (o: IPlaygroundComposition.IObject): string => o.subject,
      ),
    );
    // A parameter that names a placed object, as a prop, a seat or a point.
    const names: (value: unknown) => boolean = (value: unknown): boolean =>
      typeof value === "string"
        ? objects.has(value)
        : Array.isArray(value)
          ? value.some(names)
          : typeof value === "object" && value !== null
            ? Object.values(value).some(names)
            : false;
    const visit: (action: IPlaygroundComposition.IAction) => void = (
      action: IPlaygroundComposition.IAction,
    ): void => {
      if (action.over !== undefined && action.over.length !== 0)
        found.add("performed over another action");
      if (action.until !== undefined) found.add("cut early and redirected");
      if (action.sync !== undefined)
        found.add("timed to another person's instant");
      if (JSON.stringify(action.params).includes('"$seat"'))
        found.add("seated");
      if (action.name === "ride") found.add("riding");
      if (names(action.params)) found.add("with a placed object");
      action.over?.forEach(visit);
    };
    for (const performer of scene.composition?.performers ?? [])
      performer.actions.forEach(visit);
    if ((scene.composition?.mutuals.length ?? 0) !== 0)
      found.add("done together");
    const order: string[] = [
      "performed over another action",
      "cut early and redirected",
      "timed to another person's instant",
      "done together",
      "seated",
      "riding",
      "with a placed object",
    ];
    return order.filter((feature: string): boolean => found.has(feature));
  }

  /**
   * The line a card shows under its title.
   *
   * @param scene The scene.
   * @returns Such as "3 people, 2 objects, 9 actions".
   */
  export function counts(scene: IScene): string {
    const plural: (n: number, one: string, many: string) => string = (
      n: number,
      one: string,
      many: string,
    ): string => `${n} ${n === 1 ? one : many}`;
    if (scene.composition === null) return scene.planned?.cast ?? "";
    const parts: string[] = [plural(scene.cast.length, "person", "people")];
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
