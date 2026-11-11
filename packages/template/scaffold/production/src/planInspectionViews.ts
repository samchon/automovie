import {
  type IAutoMovieViewerViewpoint,
  autoMovieViewerNamedViewpoints,
} from "@automovie/render";

import type { InspectionView } from "./InspectionView";

/**
 * Read a view request, the text of the Viewer's `view` parameter and of the capture command's `--view` option, into the cameras it asks for.
 *
 * An absent request is the film camera alone. Text holding a colon is one fixed camera, `x,y,z:tx,ty,tz` in world metres. Any other text is a comma-separated list of names, each resolved in this order:
 *
 * 1. a key of the production's `IFilmProduction.views`, given in `presets`;
 * 2. `film`, the film camera;
 * 3. a named viewpoint of the viewer: `front`, `back`, `right`, `left`, `top`, `bottom`, `three-quarter` or `three-quarter-back`.
 *
 * It throws for coordinates that are not two finite triples or that coincide, for a name that is none of the three, and for a name given twice. The error for an unknown name lists every name the production accepts.
 *
 * ```ts
 * planInspectionViews("front,right,film", Object.keys(production.views ?? {}));
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two callers, the three text forms, the resolution order, every refusal and what the unknown-name error lists.
 * @evidence contracts/development/implementation.md#principled-implementation One reader serves the page and the command, so the same text selects the same cameras in both; a production's own view wins a name because the production knows its subject.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The absent case, the coordinate case and the name list are three consecutive branches of one pure function; placing a camera belongs to `placeInspectionView`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Named viewpoints come from the viewer's own list instead of a copy of its ids, and unreadable text throws instead of falling back to the film camera.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the request's length.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The viewer's viewpoint records are returned unchanged for the framing owner.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns plain records and keeps nothing.
 */
export function planInspectionViews(
  text: string | null | undefined,
  presets: readonly string[],
): InspectionView[] {
  if (text === null || text === undefined)
    return [{ kind: "film", id: "film" }];

  // A colon marks coordinates: one fixed camera.
  if (text.includes(":")) {
    const points: number[][] = text
      .split(":")
      .map((part: string): number[] =>
        part
          .split(",")
          .map((value: string): number =>
            value.trim() === "" ? Number.NaN : Number(value),
          ),
      );
    if (
      points.length !== 2 ||
      points.some(
        (point: number[]): boolean =>
          point.length !== 3 || !point.every(Number.isFinite),
      )
    )
      throw new Error(`View "${text}" is not x,y,z:tx,ty,tz in metres`);
    const [position, target] = points as [number[], number[]];
    if (
      position.every(
        (value: number, axis: number): boolean => value === target[axis],
      )
    )
      throw new Error(`View "${text}" looks from its own target`);
    return [
      {
        kind: "fixed",
        id: "inspection",
        position: [position[0]!, position[1]!, position[2]!],
        target: [target[0]!, target[1]!, target[2]!],
      },
    ];
  }

  // Names: the production's own views first, then the film camera, then the viewer's named viewpoints.
  const named: Map<string, IAutoMovieViewerViewpoint> = new Map(
    autoMovieViewerNamedViewpoints().map(
      (
        viewpoint: IAutoMovieViewerViewpoint,
      ): [string, IAutoMovieViewerViewpoint] => [viewpoint.id, viewpoint],
    ),
  );
  const names: string[] = text
    .split(",")
    .map((name: string): string => name.trim());
  const views: InspectionView[] = names.map((name: string): InspectionView => {
    if (presets.includes(name)) return { kind: "preset", id: name };
    if (name === "film") return { kind: "film", id: "film" };
    const viewpoint: IAutoMovieViewerViewpoint | undefined = named.get(name);
    if (viewpoint === undefined)
      throw new Error(
        `View "${name}" is not one of ${[...new Set([...presets, "film", ...named.keys()])].join(", ")}, nor x,y,z:tx,ty,tz in metres`,
      );
    return { kind: "named", id: name, viewpoint };
  });
  if (new Set(names).size !== names.length)
    throw new Error(`View request "${text}" names a view twice`);
  return views;
}
