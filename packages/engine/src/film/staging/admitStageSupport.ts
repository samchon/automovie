import type {
  IAutoMoviePreparedSurface,
  IAutoMovieSpace,
  IAutoMovieStageActor,
  IAutoMovieStageSupportWindow,
  IAutoMovieStagedSet,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { prepareSurface } from "../../space/prepareSurface";
import { preparedSurfaceContains } from "../../space/preparedSurfaceContains";

/**
 * Admit actors' optional support windows against the prepared walkable set.
 * Check the opening footprint before preserving the placement. Performance
 * checks the windows against its own duration and the sampled actor path.
 */
export function admitStageSupport(
  actors: readonly IAutoMovieStageActor[],
  space: IAutoMovieSpace | undefined,
  out: IAutoMovieViolationCollector,
): NonNullable<IAutoMovieStagedSet.ISuccess["supports"]> {
  const admitted: Array<{
    node: string;
    windows: readonly IAutoMovieStageSupportWindow[];
  }> = [];
  if (
    !actors.some(
      (actor: IAutoMovieStageActor): boolean => actor.support !== undefined,
    )
  )
    return admitted;

  const walkable: Set<string> = new Set(space?.walkable);
  const surfaces: Map<string, IAutoMoviePreparedSurface> = new Map(
    space?.surfaces
      .filter((surface): boolean => walkable.has(surface.id))
      .map((surface): [string, IAutoMoviePreparedSurface] => [
        surface.id,
        prepareSurface(surface),
      ]),
  );
  actors.forEach((actor: IAutoMovieStageActor, i: number): void => {
    const windows: readonly IAutoMovieStageSupportWindow[] | undefined =
      actor.support;
    if (windows === undefined) return;
    const path: string = `$input.actors[${i}].support`;
    if (windows.length === 0) {
      out.push(
        "type",
        path,
        "actor support must contain a window beginning at zero",
        windows,
      );
      return;
    }

    const before: number = out.items.length;
    let previous: number = -Infinity;
    for (const [j, window] of windows.entries()) {
      const entry: string = `${path}[${j}]`;
      const from: number = window.from;
      if (j === 0 ? from !== 0 : from <= previous)
        out.push(
          "range",
          `${entry}.from`,
          "support must begin at zero and strictly increase in shot-local seconds",
          from,
        );
      else previous = from;

      const seen: Set<string> = new Set();
      for (const [k, surface] of window.surfaces.entries()) {
        const field: string = `${entry}.surfaces[${k}]`;
        if (!surfaces.has(surface))
          out.push(
            "type",
            field,
            "support must name a walkable surface in the stage space",
            surface,
          );
        else if (seen.has(surface))
          out.push(
            "type",
            field,
            "support surface must appear once in a window",
            surface,
          );
        else {
          seen.add(surface);
          const available: number | undefined =
            surfaces.get(surface)!.surface.availableFrom;
          if (available !== undefined && available < 0)
            out.push(
              "range",
              field,
              "a scoped surface's availableFrom must be finite and nonnegative",
              available,
            );
        }
      }
    }
    if (out.items.length !== before) return;
    const opening: readonly string[] = windows[0]!.surfaces;
    if (
      opening.length !== 0 &&
      !opening.some((id: string): boolean => {
        const entry: IAutoMoviePreparedSurface = surfaces.get(id)!;
        return (
          (entry.surface.availableFrom ?? 0) === 0 &&
          preparedSurfaceContains(entry, actor.position.x, actor.position.z)
        );
      })
    ) {
      out.push(
        "range",
        `${path}[0].surfaces`,
        "actor opening position must lie on an eligible support footprint",
        actor.position,
      );
      return;
    }
    admitted.push({ node: actor.node, windows });
  });
  return admitted;
}
