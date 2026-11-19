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
import { isRecord } from "../../validation/isRecord";
import { isFiniteStageVector3 } from "./isFiniteStageVector3";

/**
 * Admit actors' optional support windows against the prepared walkable set.
 * Check the opening footprint before preserving the placement. Performance
 * checks the windows against its own duration and the sampled actor path.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents the staged walkable input, initial time and footprint, later performance checks and output ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Checks a zero start, finite strictly increasing later starts and unique string references to prepared walkable surfaces. A nonempty initial scope must cover the actor's finite staged XZ in world metres with a surface available at shot second zero.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Static shape and reference admission lives at staging. The shot clock and sampled motion belong to performance.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Invalid windows are reported at their stage paths, without assigning a replacement floor or moving the actor. Empty scopes explicitly suspend grounding.
 * @evidence contracts/development/implementation.md#efficient-algorithms Checks each actor and referenced id once with per-window sets and scans opening footprints only for the initial position.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the staged surface preparation across actors and original admitted window records in the staging result.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local validation sets are synchronous. The returned ordered actor entries retain their borrowed windows until staging is discarded.
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
    if (!Array.isArray(windows) || windows.length === 0) {
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
      if (!isRecord(window)) {
        out.push("type", entry, "support window must be a record", window);
        continue;
      }
      const from: unknown = window.from;
      if (
        typeof from !== "number" ||
        !Number.isFinite(from) ||
        (j === 0 ? from !== 0 : from <= previous)
      )
        out.push(
          "range",
          `${entry}.from`,
          "support must begin at zero and strictly increase in finite shot-local seconds",
          from,
        );
      else previous = from;
      if (!Array.isArray(window.surfaces)) {
        out.push(
          "type",
          `${entry}.surfaces`,
          "support surfaces must be an array of ids",
          window.surfaces,
        );
        continue;
      }

      const seen: Set<string> = new Set();
      for (const [k, surface] of window.surfaces.entries()) {
        const field: string = `${entry}.surfaces[${k}]`;
        if (typeof surface !== "string" || !surfaces.has(surface))
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
          if (
            available !== undefined &&
            (!Number.isFinite(available) || available < 0)
          )
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
      isFiniteStageVector3(actor.position) &&
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
