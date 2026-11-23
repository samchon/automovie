import type {
  IAutoMoviePreparedSurface,
  IAutoMovieStageSupportWindow,
  IAutoMovieStagedSet,
  IAutoMovieSurface,
  IAutoMovieVector3,
} from "@automovie/interface";

import { prepareSurface } from "../../space/prepareSurface";
import { preparedSurfaceContains } from "../../space/preparedSurfaceContains";
import { surfaceHeightAt } from "../../space/surfaceHeightAt";
import type { IStageGround } from "./IStageGround";

/**
 * Prepare each cited footprint once for actor-scoped staging and performance
 * queries.
 */
export function prepareStageSupport(
  staged: IAutoMovieStagedSet.ISuccess,
): ReadonlyMap<string, IStageGround> {
  const support: ReadonlyMap<string, IStageGround> = new Map();
  if (staged.supports === undefined) return support;

  const source: Map<string, IAutoMovieSurface> = new Map(
    staged.scene.space?.surfaces.map(
      (surface: IAutoMovieSurface): [string, IAutoMovieSurface] => [
        surface.id,
        surface,
      ],
    ),
  );
  const prepared: Map<string, IAutoMoviePreparedSurface> = new Map();
  return new Map(
    staged.supports.map(({ node, windows }): [string, IStageGround] => {
      const scopes: IAutoMoviePreparedSurface[][] = windows.map(
        (window: IAutoMovieStageSupportWindow): IAutoMoviePreparedSurface[] =>
          window.surfaces.map((id: string): IAutoMoviePreparedSurface => {
            const existing: IAutoMoviePreparedSurface | undefined =
              prepared.get(id);
            if (existing !== undefined) return existing;
            const entry: IAutoMoviePreparedSurface = prepareSurface(
              source.get(id)!,
            );
            prepared.set(id, entry);
            return entry;
          }),
      );
      const windowStarts: number[] = windows.map(
        (window: IAutoMovieStageSupportWindow): number => window.from,
      );
      const indexAt = (time: number): number => windowAt(windowStarts, time);
      const boundaries: Set<number> = new Set(windowStarts);
      scopes.forEach((scope: IAutoMoviePreparedSurface[], i: number): void => {
        for (const entry of scope) {
          const time: number = entry.surface.availableFrom ?? 0;
          if (
            time > windowStarts[i]! &&
            time < (windowStarts[i + 1] ?? Infinity)
          )
            boundaries.add(time);
        }
      });
      return [
        node,
        {
          boundaries: [...boundaries].sort(
            (a: number, b: number): number => a - b,
          ),
          windowStarts,
          indexAt,
          at: (
            time: number,
            point: IAutoMovieVector3,
          ): number | null | undefined => {
            const scope: IAutoMoviePreparedSurface[] = scopes[indexAt(time)]!;
            if (scope.length === 0) return undefined;
            let height: number | null = null;
            let distance: number = Infinity;
            for (const entry of scope) {
              if (
                time < (entry.surface.availableFrom ?? 0) ||
                !preparedSurfaceContains(entry, point.x, point.z)
              )
                continue;
              const value: number = surfaceHeightAt(
                entry.surface,
                point.x,
                point.z,
              );
              const delta: number = Math.abs(value - point.y);
              if (delta < distance) {
                height = value;
                distance = delta;
              }
            }
            return height;
          },
        },
      ];
    }),
  );
}

/** Index of the last inclusive boundary on a nonempty, increasing clock. */
function windowAt(boundaries: readonly number[], time: number): number {
  let low: number = 0;
  let high: number = boundaries.length;
  while (high - low > 1) {
    const middle: number = Math.floor((low + high) / 2);
    if (boundaries[middle]! <= time) low = middle;
    else high = middle;
  }
  return low;
}
