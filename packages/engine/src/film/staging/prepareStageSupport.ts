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
 * Prepare each cited footprint once for actor-scoped staging and performance queries.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States world metre/shot-second queries, the ordered authored windows, and distinct unsupported and suspended answers.
 * @evidence contracts/development/implementation.md#principled-implementation Finds the last window whose inclusive start is at or before the time by binary search. Checks surface availability and footprint, evaluates canonical height and chooses minimum absolute offset from world Y, preserving id order on ties.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds an actor-indexed table and uses canonical footprint and height helpers for geometry.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing footprint or nonfinite height cannot satisfy a nonempty window. No query can escape its named eligible set to use the scene-wide rule.
 * @evidence contracts/development/implementation.md#efficient-algorithms Prepares each referenced footprint once. Each lookup takes logarithmic window selection plus containment and height work for its listed surfaces.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares prepared rings among actors and windows within this admitted stage. The preparation borrows the same stage geometry for the lifetime of the lookup.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned table owns window indices and synchronous query closures and retains shared preparation while the caller keeps it. It allocates no host resources.
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
