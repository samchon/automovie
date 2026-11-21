import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";

import type { IAutoMovieInspectorAction } from "./IAutoMovieInspectorAction.js";

/**
 * The edit that shows one observation: the picture at its witness second, with its entities labelled.
 *
 * A finding's paths name drawn objects, or parts a checker addresses below them
 * such as a formation slot (`/slot/<n>`), a cord segment (`/segment/<n>`) or a
 * batch instance (`#<n>`). Each path is labelled by the
 * nearest drawn path that equals it or contains it, so the label lands on the
 * object the part belongs to; a path with no drawn owner is left unlabelled,
 * because the scene refuses a label pattern that matches nothing.
 *
 * @param observation The witness to show.
 * @param drawn The identity paths the scene draws, as the mount lists them.
 * @returns A `locate` action for the inspector's reducer.
 * @evidence contracts/development/common.md#meaningful-documentation States the target second, how a part path finds its drawn owner and why an unowned path is dropped.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the witness's own clock and the scene's own path listing; part paths extend their owner's path with `/` or `#`, as the collision checker writes them.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup per finding path, then one action.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No path is invented or rewritten into a pattern; duplicates are labelled once.
 * @evidence contracts/development/implementation.md#efficient-algorithms One set and, per path, one probe per separator prefix.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of two small inputs.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new action and keeps nothing.
 */
export function locateAutoMovieInspectorFinding(
  observation: IAutoMovieInspectionDiagnostics.IObservation,
  drawn: readonly string[],
): IAutoMovieInspectorAction.ILocate {
  const known: Set<string> = new Set(drawn);
  const label: string[] = [];
  for (const path of observation.finding.paths) {
    let owner: string | undefined = path;
    while (owner !== undefined && !known.has(owner)) {
      const cut: number = Math.max(
        owner.lastIndexOf("/"),
        owner.lastIndexOf("#"),
      );
      owner = cut <= 0 ? undefined : owner.slice(0, cut);
    }
    if (owner !== undefined && !label.includes(owner)) label.push(owner);
  }
  return { type: "locate", seconds: observation.time.filmSeconds, label };
}
