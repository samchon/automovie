import {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  type IAutoMovieBuiltEnvironmentSupportSweep,
  IAutoMovieBuiltFloatingBody,
  type IAutoMovieBuiltPlacementBody,
  type IAutoMovieBuiltPlacementBodyLocator,
  IAutoMovieBuiltPopulation,
  IAutoMovieBuiltSupportSweepReport,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import { builtEnvironmentPartBoxes } from "./builtEnvironmentPartBoxes";
import { builtFootprintsOverlap } from "./builtFootprintsOverlap";
import { AUTOMOVIE_SUPPORT_TOLERANCE } from "../AUTOMOVIE_SUPPORT_TOLERANCE";
import { resolveBuiltPlacementBody } from "./resolveBuiltPlacementBody";

/*
 * Find every placed body in a building with clear air under it.
 *
 * The requirement this answers asks for two capabilities in one sentence:
 * express what supports what, and find the floating or disconnected elements.
 * builtEnvironmentSupportStatus is the first and cannot be the second,
 * because it judges a relation the author already named, and an oriel window
 * nobody suspected is a query nobody wrote. This sweeps the record instead and
 * needs no declaration at all.
 *
 * Reports a measurement rather than an authored support relation. For each
 * non-grounded body it chooses the highest candidate part-box top no higher
 * than underside plus tolerance with an overlapping footprint, then reports
 * signed clearance and owner. This identifies the nearest admitted proxy, not a
 * proven physical support.
 *
 * Candidate part boxes avoid treating a multi-part support's entire union as
 * material: a shelf board can support a subject below the shelf back's highest
 * point. The subject still uses its union box, so a notch or gap in its
 * footprint remains outside this approximation's ability to distinguish.
 *
 * Every element and population is a body. An underside at or below `groundY +
 * tolerance` is grounded, including bodies below the ground plane. Candidate
 * tops may reach tolerance above the underside; the first footprint overlap
 * yields a signed clearance, and clearance no greater than tolerance is borne.
 * Other bodies are floating. The subject's union footprint can bridge notches,
 * and candidate part boxes can include empty space, so these are proxy
 * classifications rather than mesh-contact certificates. `groundY` defaults to
 * zero, and the point basis accompanies degenerate bounds.
 *
 * Throws a `RangeError` when the tolerance is negative or non-finite, or
 * `groundY` is not finite. `measured` counts resolved bodies, `compared` the
 * candidate parts examined, and `unresolved` lists the bodies that occupy no
 * place.
 * Parameter props.environment: Building record to sweep.
 * Parameter props.groundY: World height a body may rest on directly, in metres.
 * Parameter props.tolerance: Contact slack in metres; `AUTOMOVIE_SUPPORT_TOLERANCE`
 * when omitted.
 * Returns: The counts, the floating bodies and the unresolved bodies.
 */
export function builtEnvironmentSupportSweep(
  props: IAutoMovieBuiltEnvironmentSupportSweep.IProps,
): IAutoMovieBuiltSupportSweepReport {
  const tolerance: number = props.tolerance ?? AUTOMOVIE_SUPPORT_TOLERANCE;
  if (tolerance < 0)
    throw new RangeError(
      `building support tolerance must be finite and non-negative, but was ${String(tolerance)}`,
    );
  const groundY: number = props.groundY ?? 0;

  const {
    resolved,
    unresolved,
  }: {
    resolved: IResolvedBody[];
    unresolved: IAutoMovieBuiltPlacementBodyLocator[];
  } = resolveBodies(props.environment);
  // Descending top heights make the first footprint hit below the slack-adjusted
  // ceiling the nearest admitted candidate.
  const descending: ICandidateSolid[] = resolved
    .flatMap((owner: IResolvedBody): ICandidateSolid[] =>
      owner.body.solids.map(
        (solid: IAutoMovieSubjectBox): ICandidateSolid => ({ solid, owner }),
      ),
    )
    .sort(
      (left: ICandidateSolid, right: ICandidateSolid): number =>
        right.solid.max.y - left.solid.max.y,
    );
  const floating: IAutoMovieBuiltFloatingBody[] = [];
  let grounded: number = 0;
  let borne: number = 0;
  let compared: number = 0;
  for (const subject of resolved) {
    const bounds: IAutoMovieSubjectBox = subject.body.bounds;
    if (bounds.min.y <= groundY + tolerance) {
      ++grounded;
      continue;
    }
    let nearest: IAutoMovieBuiltFloatingBody["below"] = null;
    for (
      let index: number = firstAtOrBelow(descending, bounds.min.y + tolerance);
      index < descending.length;
      ++index
    ) {
      const candidate: ICandidateSolid = descending[index]!;
      if (candidate.owner === subject) continue;
      ++compared;
      if (builtFootprintsOverlap(bounds, candidate.solid) === false) continue;
      nearest = {
        body: candidate.owner.locator,
        clearance: bounds.min.y - candidate.solid.max.y,
      };
      break;
    }
    if (nearest !== null && nearest.clearance <= tolerance) {
      ++borne;
      continue;
    }
    floating.push({
      body: subject.locator,
      basis: subject.body.bounds.basis,
      below: nearest,
    });
  }
  return {
    measured: resolved.length,
    compared,
    grounded,
    borne,
    floating,
    unresolved,
  };
}

/*
 * One resolved body of the building, with the locator that names it.
 */
interface IResolvedBody {
  /*
   * Declared identity retained in the report.
   */
  locator: IAutoMovieBuiltPlacementBodyLocator;

  /*
   * Resolved CPU bounds and part-box proxies.
   */
  body: IAutoMovieBuiltPlacementBody;
}

/*
 * One solid a body fills, with the body that owns it.
 */
interface ICandidateSolid {
  /*
   * Axis-aligned part box whose top is considered for support.
   */
  solid: IAutoMovieSubjectBox;

  /*
   * Body excluded when the subject would otherwise support itself.
   */
  owner: IResolvedBody;
}

/*
 * Every element and population of one building, resolved once.
 *
 * The building is staged once for every element's parts, and each body is then
 * resolved from that table. Resolving an element means tessellating its model
 * and walking its transform chain, so repeating it per body is the cost that
 * would make a whole-building sweep unusable.
 */
const resolveBodies: (environment: IAutoMovieBuiltEnvironment) => {
  resolved: IResolvedBody[];
  unresolved: IAutoMovieBuiltPlacementBodyLocator[];
} = (
  environment: IAutoMovieBuiltEnvironment,
): {
  resolved: IResolvedBody[];
  unresolved: IAutoMovieBuiltPlacementBodyLocator[];
} => {
  const parts: Map<string, IAutoMovieSubjectBox[]> =
    builtEnvironmentPartBoxes(environment);
  const locators: IAutoMovieBuiltPlacementBodyLocator[] = [
    ...environment.elements.map(
      (
        element: IAutoMovieBuiltElement,
      ): IAutoMovieBuiltPlacementBodyLocator => ({
        kind: "element",
        id: element.id,
      }),
    ),
    ...(environment.populations ?? []).map(
      (
        population: IAutoMovieBuiltPopulation,
      ): IAutoMovieBuiltPlacementBodyLocator => ({
        kind: "population",
        id: population.set.id,
      }),
    ),
  ];
  const resolved: IResolvedBody[] = [];
  const unresolved: IAutoMovieBuiltPlacementBodyLocator[] = [];
  for (const locator of locators) {
    const body: IAutoMovieBuiltPlacementBody | null = resolveBuiltPlacementBody(
      {
        environment,
        target: locator,
        parts: (elementId: string): IAutoMovieSubjectBox[] | undefined =>
          parts.get(elementId),
      },
    );
    if (body === null) unresolved.push(locator);
    else resolved.push({ locator, body });
  }
  return { resolved, unresolved };
};

/*
 * The first index of a top-height-descending list at or below one height.
 *
 * A binary search rather than a scan, because the bodies above a subject are
 * the many in a tall building and reading past them is the cost this ordering
 * exists to avoid.
 */
const firstAtOrBelow: (
  descending: readonly ICandidateSolid[],
  ceiling: number,
) => number = (
  descending: readonly ICandidateSolid[],
  ceiling: number,
): number => {
  let low: number = 0;
  let high: number = descending.length;
  while (low < high) {
    const middle: number = (low + high) >>> 1;
    if (descending[middle]!.solid.max.y > ceiling) low = middle + 1;
    else high = middle;
  }
  return low;
};
