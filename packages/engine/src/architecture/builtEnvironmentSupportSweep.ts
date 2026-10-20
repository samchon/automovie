import {
  AutoMovieBuiltPlacementBodyLocator,
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltFloatingBody,
  IAutoMovieBuiltPopulation,
  IAutoMovieBuiltSupportSweepReport,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import { IAutoMovieBuiltPlacementBody } from "./IAutoMovieBuiltPlacementBody";
import { builtEnvironmentPartBoxes } from "./builtEnvironmentPartBoxes";
import { builtFootprintsOverlap } from "./builtFootprintsOverlap";
import { AUTOMOVIE_SUPPORT_TOLERANCE } from "./constants/AUTOMOVIE_SUPPORT_TOLERANCE";
import { resolveBuiltPlacementBody } from "./resolveBuiltPlacementBody";

/**
 * One resolved body of the building, with the locator that names it.
 */
interface IResolvedBody {
  /** Declared identity retained in the report. */
  locator: AutoMovieBuiltPlacementBodyLocator;

  /** Resolved CPU bounds and part-box proxies. */
  body: IAutoMovieBuiltPlacementBody;
}

/**
 * One solid a body fills, with the body that owns it.
 */
interface ICandidateSolid {
  /** Axis-aligned part box whose top is considered for support. */
  solid: IAutoMovieSubjectBox;

  /** Body excluded when the subject would otherwise support itself. */
  owner: IResolvedBody;
}

/**
 * Find every placed body in a building with clear air under it.
 *
 * The requirement this answers asks for two capabilities in one sentence: express what supports what, and find the floating or disconnected elements. {@link builtEnvironmentSupportStatus} is the first and cannot be the second, because it judges a relation the author already named, and an oriel window nobody suspected is a query nobody wrote. This sweeps the record instead and needs no declaration at all.
 *
 * Reports a measurement rather than an authored support relation. For each non-grounded body it chooses the highest candidate part-box top no higher than underside plus tolerance with an overlapping footprint, then reports signed clearance and owner. This identifies the nearest admitted proxy, not a proven physical support.
 *
 * Candidate part boxes avoid treating a multi-part support's entire union as material: a shelf board can support a subject below the shelf back's highest point. The subject still uses its union box, so a notch or gap in its footprint remains outside this approximation's ability to distinguish.
 *
 * Every element and population is a body. An underside at or below `groundY + tolerance` is grounded, including bodies below the ground plane. Candidate tops may reach tolerance above the underside; the first footprint overlap yields a signed clearance, and clearance no greater than tolerance is borne. Other bodies are floating. The subject's union footprint can bridge notches, and candidate part boxes can include empty space, so these are proxy classifications rather than mesh-contact certificates. `groundY` defaults to zero, and the point basis accompanies degenerate bounds.
 *
 * Throws a `RangeError` when the tolerance is negative or non-finite, or `groundY` is not finite. `measured` counts resolved bodies, `compared` the candidate parts examined, and `unresolved` lists the bodies that occupy no place.
 *
 * @param props.environment Building record to sweep.
 * @param props.groundY World height a body may rest on directly, in metres.
 * @param props.tolerance Contact slack in metres; `AUTOMOVIE_SUPPORT_TOLERANCE` when omitted.
 * @returns The counts, the floating bodies and the unresolved bodies.
 *
 * @evidence contracts/common.md#principled-implementation Descending candidate top heights and a binary-searched ceiling of underside plus tolerance choose the highest footprint-overlapping part box within that ceiling. Signed clearance may be negative; subject union footprints and candidate boxes are the stated proxies, not proof of physical contact.
 * @evidence contracts/common.md#clear-and-simple-design Body resolution is the shared `resolveBuiltPlacementBody` over one `builtEnvironmentPartBoxes` table, the footprint test is `builtFootprintsOverlap`, and the default slack is the constant shared with the status query, so this function owns only the sweep and its classification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no element, population or part; the ground plane is an input with a stated default rather than an exemption for particular bodies, and an invalid tolerance or ground height is refused rather than defaulted.
 * @evidence contracts/common.md#meaningful-documentation States what is measured and what is not claimed, why parts replace boxes, the grounded, borne and floating classes, the `groundY` default and why it exists, how a point body reads, each refusal, and what every count means.
 * @evidence contracts/performance.md#efficient-algorithms Pays one batch part-table measurement, each body's union or population placement fold and O(R²) worst-case population lookups for R populations. With B resolved bodies and P part boxes, sorting is O(P log P), binary searches O(B log P), and scans O(BP) worst case. `compared` excludes self candidates and does not count resolution, sorting or search work.
 * @evidence contracts/performance.md#reuse-equivalent-work Within one sweep the single staging and part table are shared by every body's resolution instead of restaging the building per body; across calls nothing is cached because the record is the caller's mutable data.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The part table, resolved bodies and sorted candidates live only for the call and grow linearly with the element, population and part counts; the caller owns the returned report.
 */
export const builtEnvironmentSupportSweep: (props: {
  environment: IAutoMovieBuiltEnvironment;
  groundY?: number;
  tolerance?: number;
}) => IAutoMovieBuiltSupportSweepReport = (props: {
  environment: IAutoMovieBuiltEnvironment;
  /** World height a body may rest on directly, in metres. Defaults to `0`. */
  groundY?: number;

  /** Contact slack in metres. Defaults to `AUTOMOVIE_SUPPORT_TOLERANCE`. */
  tolerance?: number;
}): IAutoMovieBuiltSupportSweepReport => {
  const tolerance: number = props.tolerance ?? AUTOMOVIE_SUPPORT_TOLERANCE;
  if (!Number.isFinite(tolerance) || tolerance < 0)
    throw new RangeError(
      `building support tolerance must be finite and non-negative, but was ${String(tolerance)}`,
    );
  const groundY: number = props.groundY ?? 0;
  if (!Number.isFinite(groundY))
    throw new RangeError(
      `building ground height must be finite, but was ${String(groundY)}`,
    );

  const {
    resolved,
    unresolved,
  }: {
    resolved: IResolvedBody[];
    unresolved: AutoMovieBuiltPlacementBodyLocator[];
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
};

/**
 * Every element and population of one building, resolved once.
 *
 * The building is staged once for every element's parts, and each body is then resolved from that table. Resolving an element means tessellating its model and walking its transform chain, so repeating it per body is the cost that would make a whole-building sweep unusable.
 */
const resolveBodies: (environment: IAutoMovieBuiltEnvironment) => {
  resolved: IResolvedBody[];
  unresolved: AutoMovieBuiltPlacementBodyLocator[];
} = (
  environment: IAutoMovieBuiltEnvironment,
): {
  resolved: IResolvedBody[];
  unresolved: AutoMovieBuiltPlacementBodyLocator[];
} => {
  const parts: Map<string, IAutoMovieSubjectBox[]> =
    builtEnvironmentPartBoxes(environment);
  const locators: AutoMovieBuiltPlacementBodyLocator[] = [
    ...environment.elements.map(
      (
        element: IAutoMovieBuiltElement,
      ): AutoMovieBuiltPlacementBodyLocator => ({
        kind: "element",
        id: element.id,
      }),
    ),
    ...(environment.populations ?? []).map(
      (
        population: IAutoMovieBuiltPopulation,
      ): AutoMovieBuiltPlacementBodyLocator => ({
        kind: "population",
        id: population.set.id,
      }),
    ),
  ];
  const resolved: IResolvedBody[] = [];
  const unresolved: AutoMovieBuiltPlacementBodyLocator[] = [];
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

/**
 * The first index of a top-height-descending list at or below one height.
 *
 * A binary search rather than a scan, because the bodies above a subject are the many in a tall building and reading past them is the cost this ordering exists to avoid.
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
