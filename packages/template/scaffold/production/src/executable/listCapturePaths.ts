import {
  autoMovieInspectionPathOf,
  listAutoMovieInspectionPaths,
} from "@automovie/viewer";

import type { IFilmProduction } from "../IFilmProduction";

/**
 * List every inspection path of a mounted film, one line per path, for choosing what `--parts` and `--hide` select.
 *
 * A line is the path, a tab, and what stands at it: each kind of drawn object and each kind of construction curve with its count, such as `SkinnedMesh x1, section curve x12` after `hero/torso`. Object paths come first in scene order, then the paths only curves have. Drawn objects without any name share the empty path, which only the pattern `**` selects, and are listed as `(unnamed)`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the purpose, the line format with an example, the order and how the empty path is shown.
 * @evidence contracts/development/implementation.md#principled-implementation Paths are read through the viewer's own path functions, the ones a selection is matched against, so every listed path is one a pattern can name.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One tally keyed by path and kind, then one line per path.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Hidden objects are listed too, as the viewer lists them, and objects that share a path are counted instead of collapsed.
 * @evidence contracts/development/implementation.md#efficient-algorithms One traversal of the scene and one pass over the curves.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each form's object path is read once and shared by its curves.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns text and keeps nothing.
 */
export function listCapturePaths(
  production: Pick<IFilmProduction, "scene" | "constructions">,
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
  for (const construction of production.constructions ?? []) {
    const base: string = autoMovieInspectionPathOf(
      production.scene,
      construction.parent,
    );
    for (const curve of construction.curves)
      count(
        base === "" ? curve.part : `${base}/${curve.part}`,
        `${curve.kind} curve`,
      );
  }

  return [...tally].map(
    ([path, kinds]: [string, Map<string, number>]): string =>
      `${path === "" ? "(unnamed)" : path}\t${[...kinds]
        .map(([kind, n]: [string, number]): string => `${kind} x${n}`)
        .join(", ")}`,
  );
}
