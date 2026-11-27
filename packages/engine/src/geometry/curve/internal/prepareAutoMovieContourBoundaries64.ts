import type {
  AutoMovieVector3Tuple,
  IAutoMovieContourLoft64,
  IAutoMovieContourLoftCurves64,
  IAutoMoviePrepareContourBoundaries64,
  IAutoMoviePrepareContourBoundaries64Group,
  IAutoMoviePrepareContourBoundaries64Ring,
  IAutoMovieRefineContourInteractions64,
} from "@automovie/interface";

import { refineAutoMovieContourInteractions64 } from "./refineAutoMovieContourInteractions64";

/*
 * Reach one shared-boundary refinement state before choosing and freezing any
 * branch slit. A later interaction can refine a course shared with an earlier
 * group, so all groups are revisited until no source restriction changes.
 * Source-authoritative slit insertion can change chords again, so its final
 * rings pass through the same refinement fixed point. Slit phases remain fixed
 * while cached walks expand through these shared refinements. Every incident
 * slab then uses the same ring objects and inherited phase identities; separate
 * coordinates are never welded. Unresolved geometric qualification remains
 * diagnostic while finite geometry stays admissible. Per-pass timings are
 * opt-in observations and never influence refinement or publication.
 */
export function prepareAutoMovieContourBoundaries64<
  R extends IAutoMoviePrepareContourBoundaries64Ring,
  G extends IAutoMoviePrepareContourBoundaries64Group,
>(
  plans: IAutoMoviePrepareContourBoundaries64.IPlans<G>,
  rings: R[][],
  coordinates: readonly number[],
  leaf: (
    point: AutoMovieVector3Tuple,
  ) => IAutoMovieContourLoftCurves64.Leaf | undefined,
  register: (ring: R, knot: IAutoMovieContourLoftCurves64.Knot) => void,
  prepareSlit: (rings: R[], selection: number[]) => void,
  toleranceMm: number,
  observeWork: boolean,
): IAutoMoviePrepareContourBoundaries64.IResult<G> {
  const interactions: Map<G, { qualified: boolean; diagnostics: string[] }> =
    new Map();
  const observations: NonNullable<
    IAutoMovieContourLoft64.IResult["interactionObservations"]
  > = [];
  for (const plan of plans)
    for (const group of plan.groups) {
      const invalid: R | undefined = [
        ...group.a.map((i: number): R => rings[plan.k - 1][i]),
        ...group.b.map((i: number): R => rings[plan.k][i]),
      ].find((ring: R): boolean => ring.unsupported !== undefined);
      if (invalid !== undefined && group.unsupported === undefined)
        group.unsupported = invalid.unsupported;
    }
  let pass: number = 0;
  const refine: () => void = (): void => {
    let refining: boolean;
    do {
      refining = false;
      pass++;
      for (const plan of plans)
        for (const [groupIndex, group] of plan.groups.entries()) {
          if (group.unsupported !== undefined) continue;
          try {
            const before: IAutoMovieRefineContourInteractions64.IResult =
              refineAutoMovieContourInteractions64(
                rings[plan.k - 1],
                group.a,
                leaf,
                register,
                toleranceMm,
                observeWork,
              );
            const after: IAutoMovieRefineContourInteractions64.IResult =
              refineAutoMovieContourInteractions64(
                rings[plan.k],
                group.b,
                leaf,
                register,
                toleranceMm,
                observeWork,
              );
            if (group.a.length > 1)
              observations.push({
                beforeMm: coordinates[plan.k - 1],
                afterMm: coordinates[plan.k],
                group: groupIndex,
                pass,
                side: "before",
                ...before,
              });
            if (group.b.length > 1)
              observations.push({
                beforeMm: coordinates[plan.k - 1],
                afterMm: coordinates[plan.k],
                group: groupIndex,
                pass,
                side: "after",
                ...after,
              });
            interactions.set(group, {
              qualified: before.qualified && after.qualified,
              diagnostics: [
                ...new Set([
                  ...(interactions.get(group)?.diagnostics ?? []),
                  ...[...before.diagnostics, ...after.diagnostics].map(
                    (message: string): string =>
                      `Interaction pass ${pass}: ${message}`,
                  ),
                ]),
              ],
            });
            refining ||= before.refinements + after.refinements > 0;
          } catch (failure: unknown) {
            interactions.set(group, {
              qualified: false,
              diagnostics: [
                `Source interaction arithmetic unresolved: ${failure instanceof Error ? failure.message : String(failure)}; finite geometry retained; work observation incomplete`,
              ],
            });
          }
        }
    } while (refining);
  };
  refine();
  const knotCount: () => number = (): number =>
    rings.reduce(
      (total: number, section: R[]): number =>
        total +
        section.reduce(
          (count: number, ring: R): number => count + ring.points.length,
          0,
        ),
      0,
    );
  const beforeSlits: number = knotCount();
  for (const plan of plans)
    for (const group of plan.groups) {
      if (group.unsupported !== undefined) continue;
      try {
        if (group.a.length > 1) prepareSlit(rings[plan.k - 1], group.a);
        if (group.b.length > 1) prepareSlit(rings[plan.k], group.b);
      } catch (failure: unknown) {
        group.unsupported = `Contour slit preparation unresolved: ${failure instanceof Error ? failure.message : String(failure)}`;
      }
    }
  if (knotCount() !== beforeSlits) refine();
  return { interactions, observations };
}
