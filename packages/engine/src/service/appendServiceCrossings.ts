import {
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMovieServiceNetwork,
  IAutoMovieServicePenetration,
  IAutoMovieServiceSegment,
  IAutoMovieVector3,
} from "@automovie/interface";

import { builtEnvironmentContainsPoint } from "../architecture/builtEnvironmentContainsPoint";
import { ViolationCollector } from "../validation/ViolationCollector";

/**
 * Report a run that leaves the logical space it was in without a sleeve.
 *
 * The crossing is read off the logical space cells rather than off a wall face.
 * A boundary may now carry one, but it need not, and a run that leaves a room
 * has left it whether or not the separation it went through was ever modelled;
 * reading the rooms therefore finds crossings a face-intersection would miss
 * entirely. Losing or gaining a space between two consecutive route points is
 * exactly the moment a run left one region for another, and the run is expected
 * to name a sleeve on a boundary of one of them. Where the sleeve's boundary
 * does carry a face, that sleeve is separately held on it. Where no space in
 * the environment locates a volume at all, nothing can be said and nothing is:
 * a purely semantic partition is a name, not a wall to drill.
 *
 * Only the first uncovered crossing of a run is reported. A riser that left its
 * chase undeclared crosses every floor it passes, and one located finding is
 * what the author fixes.
 *
 * @evidence contracts/common.md#principled-implementation Changed logical-space membership at consecutive route vertices requires a sleeve on a boundary of a changed region; this samples endpoints rather than continuously detecting intervening crossings.
 * @evidence contracts/common.md#clear-and-simple-design The gate delegates architectural membership to builtEnvironmentContainsPoint and keeps crossing-report policy here, while sleeve face fit remains a separate phase.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the first uncovered transition is reported; a purely semantic building supplies no measurable membership, and cited sleeve boundaries can cover a changed space without local crossing proof.
 * @evidence contracts/common.md#meaningful-documentation States vertex-based crossing detection, first-fault reporting, missing-volume limitation and the distinction from sleeve-on-face validation.
 * @evidence contracts/performance.md#efficient-algorithms Sleeve and boundary resolutions scan their populations, then each route vertex tests all located spaces; worst-case work follows route points times spatial containment cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Covered-space ids are constructed once per run and reused across its transitions, with no prior-run or previous-building cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Located-space aliases, coverage and membership sets are temporary; the collector owns only the first uncovered transition's finding values.
 */
export const appendServiceCrossings: (
  network: IAutoMovieServiceNetwork,
  environment: IAutoMovieBuiltEnvironment,
  segment: IAutoMovieServiceSegment,
  path: string,
  out: ViolationCollector,
) => void = (
  network: IAutoMovieServiceNetwork,
  environment: IAutoMovieBuiltEnvironment,
  segment: IAutoMovieServiceSegment,
  path: string,
  out: ViolationCollector,
): void => {
  const located: IAutoMovieBuiltSpace[] = environment.spaces.filter(
    (space: IAutoMovieBuiltSpace): boolean => space.cells.length > 0,
  );
  if (located.length === 0) return;
  const covered: Set<string> = new Set<string>();
  for (const id of segment.penetrations) {
    const sleeve: IAutoMovieServicePenetration | undefined =
      network.penetrations.find(
        (candidate: IAutoMovieServicePenetration): boolean =>
          candidate.id === id,
      );
    if (sleeve === undefined) continue;
    const boundary: IAutoMovieBuiltBoundary | undefined =
      environment.boundaries.find(
        (candidate: IAutoMovieBuiltBoundary): boolean =>
          candidate.id === sleeve.boundary,
      );
    if (boundary === undefined) continue;
    for (const space of boundary.spaces) covered.add(space);
  }
  const at: (point: IAutoMovieVector3) => Set<string> = (
    point: IAutoMovieVector3,
  ): Set<string> =>
    new Set(
      located
        .filter((space: IAutoMovieBuiltSpace): boolean =>
          builtEnvironmentContainsPoint(environment, space.id, point),
        )
        .map((space: IAutoMovieBuiltSpace): string => space.id),
    );
  for (let index: number = 0; index + 1 < segment.route.length; ++index) {
    const before: Set<string> = at(segment.route[index]!);
    const after: Set<string> = at(segment.route[index + 1]!);
    const changed: string[] = [
      ...[...before].filter((id: string): boolean => !after.has(id)),
      ...[...after].filter((id: string): boolean => !before.has(id)),
    ];
    if (changed.length === 0) continue;
    if (changed.some((id: string): boolean => covered.has(id))) continue;
    out.push(
      "type",
      `${path}.penetrations`,
      `a run crossing between logical spaces ${changed.join(
        ", ",
      )} at route point ${index + 1} must cite a penetration on a boundary of one of them`,
      changed,
    );
    return;
  }
};
