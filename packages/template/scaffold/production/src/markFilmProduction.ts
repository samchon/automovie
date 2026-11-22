import {
  markAutoMovieContacts,
  markAutoMovieSkeleton,
  markAutoMovieSupportWrenches,
} from "@automovie/engine";
import type { IAutoMovieMark } from "@automovie/interface";

import type { IFilmProduction } from "./IFilmProduction";

/**
 * Every mark a mounted film supplies at an exact second: its own `marks`, then, when it supplies a physical performance, the skeleton of its displayed bodies (`joint`, `bone`), the contact forces of that second (`contact`) and, when the performance supplies its support wrenches, the allocated support force and any shortfall (`support/allocated`, `support/shortfall`), as the engine's producers draw them.
 *
 * The Viewer page and the draw-only page both hand these to the inspection, so `marks=joint` or `marks=contact` draws the same thing in every host. Call it after the film's `seek` to the same second.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is gathered, from which producers and kinds, who calls it and when.
 * @evidence contracts/development/implementation.md#principled-implementation The skeleton, contacts and support wrenches are the engine's mark producers fed from the performance the film displays, so the picture shows the state the film was placed in, not a second model.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Concatenation of the film's marks and the three producers; drawing them is the inspection's.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No body, bone or contact is named here; the scale of every force arrow is the film's own `metresPerNewton`, and the support step is the performance's own cache interval.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the film's marks, the displayed bodies' joints, the contact receipts' steps and the support wrench records.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure gathering of one second.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh marks and keeps nothing.
 */
export function markFilmProduction(
  production: Pick<IFilmProduction, "marks" | "performance">,
  seconds: number,
): IAutoMovieMark[] {
  const performance: IFilmProduction["performance"] = production.performance;
  if (performance === undefined)
    return [...(production.marks?.(seconds) ?? [])];
  const supports:
    | ReturnType<NonNullable<typeof performance.supports>>
    | undefined = performance.supports?.();
  return [
    ...(production.marks?.(seconds) ?? []),
    ...markAutoMovieSkeleton({
      bodies: performance.bodies,
      frame: performance.frame(),
    }),
    ...markAutoMovieContacts({
      receipts: performance.contacts(),
      seconds,
      metresPerNewton: performance.metresPerNewton,
      ...(performance.maximumArrowLength === undefined
        ? {}
        : { maximumLength: performance.maximumArrowLength }),
      ...(performance.ownership === undefined
        ? {}
        : { ownership: performance.ownership() }),
    }),
    ...(supports === undefined
      ? []
      : markAutoMovieSupportWrenches({
          wrenches: supports.wrenches,
          interval: supports.interval,
          seconds,
          metresPerNewton: performance.metresPerNewton,
        })),
  ];
}
