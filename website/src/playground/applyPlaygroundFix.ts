import type { IPlaygroundComposition } from "./structures/IPlaygroundComposition";
import type { IPlaygroundRefusal } from "./structures/IPlaygroundRefusal";

/**
 * Apply one accepted value of a refusal to the composition it refused.
 *
 * The refusal names a performer, an action, which occurrence of it and an
 * axis. The value replaces the action's name when the axis is `act`, and
 * otherwise the action's parameter of the axis's name. An axis that is not a
 * parameter (`cut`, `channel`, `base`, `sync`, `over`) names a change of
 * structure, which the author makes in the editor.
 *
 * @param composition The refused composition.
 * @param refusal The refusal.
 * @param value One of the refusal's alternatives.
 * @returns The changed composition, or null when the refusal names no place or no parameter to change.
 */
export function applyPlaygroundFix(
  composition: IPlaygroundComposition,
  refusal: IPlaygroundRefusal,
  value: string,
): IPlaygroundComposition | null {
  if (refusal.performer === "" || refusal.act === "" || refusal.instance < 1)
    return null;
  if (STRUCTURAL.includes(refusal.axis)) return null;

  let seen: number = 0;
  let changed: boolean = false;
  const visit = (
    action: IPlaygroundComposition.IAction,
  ): IPlaygroundComposition.IAction => {
    let next: IPlaygroundComposition.IAction = action;
    if (
      !changed &&
      action.name === refusal.act &&
      ++seen === refusal.instance
    ) {
      changed = true;
      next =
        refusal.axis === "act"
          ? { ...action, name: value }
          : { ...action, params: { ...action.params, [refusal.axis]: value } };
    }
    return next.over === undefined
      ? next
      : { ...next, over: next.over.map(visit) };
  };

  const performers: IPlaygroundComposition.IPerformer[] =
    composition.performers.map(
      (
        performer: IPlaygroundComposition.IPerformer,
      ): IPlaygroundComposition.IPerformer =>
        performer.subject === refusal.performer
          ? { ...performer, actions: performer.actions.map(visit) }
          : performer,
    );
  return changed ? { ...composition, performers } : null;
}

/** The axes a refusal names that are not parameters of the action. */
const STRUCTURAL: readonly string[] = [
  "cut",
  "channel",
  "base",
  "sync",
  "over",
  "layers",
  "laws",
  "rules",
  "performers",
];
