import { AutoMovieContourLoftCurves64 as C } from "./AutoMovieContourLoftCurves64";
import { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";
import type { IAutoMovieContourLoft64 as L } from "./IAutoMovieContourLoft64";
import { refineAutoMovieContourInteractions64 } from "./refineAutoMovieContourInteractions64";

interface Ring {
  id: string;
  points: M.V[];
  winding: number;
  unsupported?: string;
}
interface Group {
  a: number[];
  b: number[];
  unsupported?: string;
}

/**
 * Reach one shared-boundary refinement state before choosing and freezing any branch slit.
 * A later interaction can refine a course shared with an earlier group, so all groups are
 * revisited until no source restriction changes. Every incident slab then uses the same ring
 * objects and inherited phase identities; separate coordinates are never welded.
 * Unresolved geometric qualification remains diagnostic while finite geometry stays admissible.
 * Per-pass timings are opt-in observations and never influence refinement or publication.
 *
 * @evidence contracts/common.md#principled-implementation Retained Bernstein restrictions drive interaction refinement to a common preparation state, followed by shared slit preparation. Actual per-pass group observations preserve work and source-interval witnesses.
 * @evidence contracts/common.md#clear-and-simple-design Source registration and slit ownership remain callbacks supplied by the loft; this owner controls their ordering and local diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source mesh, geometric budget, minimum density, positional merge or emission-time boundary mutation supplies correspondence.
 * @evidence contracts/common.md#meaningful-documentation States the fixed-point requirement, shared identity, finite publication and the difference between geometric qualification and source representability.
 * @evidence contracts/performance.md#efficient-algorithms For P preparation passes, work is the sum of the interaction owner's visited chord pairs and source refinements plus group traversal. Each source restriction retains its original thirty-level numeric bound; the finite refinement tree may still be large and no small-input complexity claim hides it.
 * @evidence contracts/performance.md#reuse-equivalent-work Initial unsupported-source admission is recorded once. All adjacent intervals share each registered source knot, and final slit preparation occurs once after refinement stops.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Group maps and per-pass observations transfer to the loft invocation and expire with its result; no cross-call state or background worker is retained.
 */
export function prepareAutoMovieContourBoundaries64<
  R extends Ring,
  G extends Group,
>(
  plans: { k: number; groups: G[] }[],
  rings: R[][],
  coordinates: readonly number[],
  leaf: (point: M.V) => C.Leaf | undefined,
  register: (ring: R, knot: C.Knot) => void,
  prepareSlit: (rings: R[], selection: number[]) => void,
  toleranceMm: number,
  observeWork: boolean,
): {
  interactions: Map<G, { qualified: boolean; diagnostics: string[] }>;
  observations: NonNullable<L.IResult["interactionObservations"]>;
} {
  const interactions: Map<G, { qualified: boolean; diagnostics: string[] }> =
    new Map();
  const observations: NonNullable<L.IResult["interactionObservations"]> = [];
  for (const plan of plans)
    for (const group of plan.groups) {
      const invalid: R | undefined = [
        ...group.a.map((i: number): R => rings[plan.k - 1][i]),
        ...group.b.map((i: number): R => rings[plan.k][i]),
      ].find((ring: R): boolean => ring.unsupported !== undefined);
      if (invalid !== undefined && group.unsupported === undefined)
        group.unsupported = invalid.unsupported;
    }
  let refining: boolean,
    pass: number = 0;
  do {
    refining = false;
    pass++;
    for (const plan of plans)
      for (const [groupIndex, group] of plan.groups.entries()) {
        if (group.unsupported !== undefined) continue;
        try {
          const before: ReturnType<
            typeof refineAutoMovieContourInteractions64<R>
          > = refineAutoMovieContourInteractions64(
            rings[plan.k - 1],
            group.a,
            leaf,
            register,
            toleranceMm,
            observeWork,
          );
          const after: ReturnType<
            typeof refineAutoMovieContourInteractions64<R>
          > = refineAutoMovieContourInteractions64(
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
  return { interactions, observations };
}
