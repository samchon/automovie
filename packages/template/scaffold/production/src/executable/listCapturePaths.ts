import type { IAutoMovieMark } from "@automovie/engine";
import { listAutoMovieInspectionPaths } from "@automovie/render";

import type { IFilmProduction } from "../IFilmProduction";

/**
 * List every inspection path of a mounted film at one second, one line per path, for choosing what `--parts` and `--hide` select.
 *
 * A line is the path, a tab, and what stands at it: each kind of drawn object and each kind of supplied mark with its count, such as `SkinnedMesh x1, curve/section x12` after `hero/torso`. Object paths come first in scene order, then the paths only marks have. Drawn objects without any name share the empty path, which only the pattern `**` selects, and are listed as `(unnamed)`. The marks are the film's `IFilmProduction.marks` at `seconds`; the kinds the inspection measures itself exist only once measured and are not listed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the purpose, the line format with an example, the order, how the empty path is shown and which marks are listed.
 * @evidence contracts/development/implementation.md#principled-implementation Object paths are read through the renderer's own path function, the one a selection is matched against, and mark paths are the marks' own, so every listed path is one a pattern can name.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One tally keyed by path and kind, then one line per path.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Hidden objects are listed too, as the renderer lists them, and objects that share a path are counted instead of collapsed.
 * @evidence contracts/development/implementation.md#efficient-algorithms One traversal of the scene and one pass over the marks.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call reads the film as it is placed now.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns text and keeps nothing.
 */
export function listCapturePaths(
  production: Pick<IFilmProduction, "scene" | "marks">,
  seconds: number,
): string[] {
  const tally: Map<string, Map<string, number>> = new Map();
  const count: (path: string, kind: string) => void = (
    path: string,
    kind: string,
  ): void => {
    let kinds: Map<string, number> | undefined = tally.get(path);
    if (kinds === undefined) {
      kinds = new Map();
      tally.set(path, kinds);
    }
    kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
  };

  for (const { path, object } of listAutoMovieInspectionPaths(production.scene))
    count(path, object.type);
  const marks: readonly IAutoMovieMark[] = production.marks?.(seconds) ?? [];
  for (const mark of marks) count(mark.path, mark.kind);

  return [...tally].map(
    ([path, kinds]: [string, Map<string, number>]): string =>
      `${path === "" ? "(unnamed)" : path}\t${[...kinds]
        .map(([kind, n]: [string, number]): string => `${kind} x${n}`)
        .join(", ")}`,
  );
}
