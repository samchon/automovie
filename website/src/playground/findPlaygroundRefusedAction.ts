import type { IPlaygroundComposition } from "./structures/IPlaygroundComposition";
import type { IPlaygroundRefusal } from "./structures/IPlaygroundRefusal";

/**
 * The action of a composition that a refusal names, so the editor can show
 * the refusal beside what caused it.
 *
 * A refusal names a performer, an action and which occurrence of it. The
 * occurrences are counted through the performer's chain in order, each
 * action before the actions performed over it, which is the order
 * `applyPlaygroundFix` counts in.
 *
 * @param composition The refused composition.
 * @param refusal The refusal, or null when there is none.
 * @returns The action object inside `composition`, or null when the refusal names no place in it.
 */
export function findPlaygroundRefusedAction(
  composition: IPlaygroundComposition,
  refusal: IPlaygroundRefusal | null,
): IPlaygroundComposition.IAction | null {
  if (
    refusal === null ||
    refusal.performer === "" ||
    refusal.act === "" ||
    refusal.instance < 1
  )
    return null;

  let seen: number = 0;
  const visit = (
    actions: readonly IPlaygroundComposition.IAction[],
  ): IPlaygroundComposition.IAction | null => {
    for (const action of actions) {
      if (action.name === refusal.act && ++seen === refusal.instance)
        return action;
      const inner: IPlaygroundComposition.IAction | null = visit(
        action.over ?? [],
      );
      if (inner !== null) return inner;
    }
    return null;
  };
  const performer: IPlaygroundComposition.IPerformer | undefined =
    composition.performers.find(
      (p: IPlaygroundComposition.IPerformer): boolean =>
        p.subject === refusal.performer,
    );
  return performer === undefined ? null : visit(performer.actions);
}
