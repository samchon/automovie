import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";

import type { IAutoMovieInspectorAction } from "./IAutoMovieInspectorAction.js";

/**
 * The edit that shows one observation: the picture at its witness second, with
 * its entities labelled.
 *
 * A finding's paths name drawn objects, or parts a checker addresses below them
 * such as a formation slot (`/slot/<n>`), a cord segment (`/segment/<n>`), a
 * batch instance (`#<n>`) or a transform field (`.children[<n>].matrixWorld`).
 * Each path is labelled by the nearest drawn path that equals it or contains
 * it, so the label lands on the object the part belongs to; a path with no
 * drawn owner is left unlabelled, because the scene refuses a label pattern
 * that matches nothing.
 *
 * @param observation The witness to show.
 * @param drawn The identity paths the scene draws, as the mount lists them.
 * @returns A `locate` action for the inspector's reducer.
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
        owner.lastIndexOf("."),
      );
      owner = cut <= 0 ? undefined : owner.slice(0, cut);
    }
    if (owner !== undefined && !label.includes(owner)) label.push(owner);
  }
  return { type: "locate", seconds: observation.time.filmSeconds, label };
}
