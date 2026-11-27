import type { IAutoMovieViewerInspectorAction } from "../IAutoMovieViewerInspectorAction";
import type { AutoMovieViewerInspector } from "../AutoMovieViewerInspector";

/*
 * Turn a finding into the location edit that names its closest drawn owners.
 *
 * A path can name a drawn object or one of its parts, such as a formation slot
 * (`/slot/<n>`), a cord segment (`/segment/<n>`), a batch instance (`#<n>`) or
 * a transform field (`.children[<n>].matrixWorld`). Unowned paths are omitted.
 * Parameter request: Witness and paths drawn by the mounted subject.
 * Returns: A locate action for the inspector reducer.
 */
export function locateInspectorFinding(
  request: AutoMovieViewerInspector.IFindingLocationRequest,
): IAutoMovieViewerInspectorAction.ILocate {
  const { observation, paths: drawn }: AutoMovieViewerInspector.IFindingLocationRequest = request;
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