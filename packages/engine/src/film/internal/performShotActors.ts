import { IAutoMovieActionCall } from "@automovie/interface";

/*
 * The actor ids one action names, as a list.
 *
 * A single id becomes a one-element list and an id list is returned as given;
 * any other value, which the action gate refuses, yields an empty list so the
 * later checks have nothing to iterate. The ids are not validated here.
 * Parameter action: The action as authored.
 * Returns: The actor ids, the action's own array when it named a list.
 */
export function performShotActors(action: IAutoMovieActionCall): string[] {
  return typeof action.actor === "string"
    ? [action.actor]
    : Array.isArray(action.actor)
      ? action.actor
      : [];
}
