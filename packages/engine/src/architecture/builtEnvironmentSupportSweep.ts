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

/** One resolved body of the building, with the locator that names it. */
interface IResolvedBody {
  locator: AutoMovieBuiltPlacementBodyLocator;
  body: IAutoMovieBuiltPlacementBody;
}

/** One solid a body fills, with the body that owns it. */
interface ICandidateSolid {
  solid: IAutoMovieSubjectBox;
  owner: IResolvedBody;
}

/**
 * Find every placed body in a building with clear air under it.
 *
 * The requirement this answers asks for two capabilities in one sentence: express
 * what supports what, and find the floating or disconnected elements.
 * {@link builtEnvironmentSupportStatus} is the first and cannot be the second,
 * because it judges a relation the author already named, and an oriel window
 * nobody suspected is a query nobody wrote. This sweeps the record instead and
 * needs no declaration at all.
 *
 * It reports a measurement rather than a relation. For each body it takes the
 * highest drawn part whose footprint overlaps this one and whose top is at or
 * below this one's underside, then reports the clearance to it and names the
 * body that part belongs to. Nothing here claims that body is the support: a
 * lintel measured under a sill is simply the nearest thing beneath it. What the
 * answer does support is the reading that matters, which is that nothing is
 * under this body at all, or that the nearest thing is a metre down.
 *
 * Parts rather than boxes, because a body's box is not its body. A shelf that is
 * a back panel and two boards has a box spanning the floor to head height, and
 * everything standing on a board is under its top and over its bottom without
 * touching anything. Eight scroll cases seated exactly on such a shelf were
 * reported as floating by the height of a panel they were nowhere near. The
 * subject keeps its union box, because a body's underside is the lowest point
 * it has.
 *
 * Every element and population is a body. A body whose underside is within
 * the tolerance of `groundY` is grounded, one whose nearest part below is
 * within the tolerance is borne, and every other resolved body is listed as
 * floating with that nearest part's owner and clearance, or null when nothing
 * is under it. `groundY` defaults to the world origin's height; without it
 * every ground-borne element would report as floating, which is a sweep nobody
 * can read. A body the record carries no vertices for is judged as the stated
 * point it is, and its `element-origin-point` basis travels with the finding,
 * which is how a caller reads "floating" as a claim about a point.
 *
 * Throws a `RangeError` when the tolerance is negative or non-finite, or
 * `groundY` is not finite. `measured` counts resolved bodies, `compared` the
 * candidate parts examined, and `unresolved` lists the bodies that occupy no
 * place.
 *
 * @param props.environment Building record to sweep.
 * @param props.groundY World height a body may rest on directly, in metres.
 * @param props.tolerance Contact slack in metres; `AUTOMOVIE_SUPPORT_TOLERANCE` when omitted.
 * @returns The counts, the floating bodies and the unresolved bodies.
 *
 * @evidence contracts/common.md#principled-implementation Candidate parts are sorted by descending top height, so the first footprint-overlapping part at or below a subject's underside, found from a binary-searched start, is the highest part beneath it; the premise is axis-aligned part boxes from the same staging the single-relation query reads.
 * @evidence contracts/common.md#clear-and-simple-design Body resolution is the shared `resolveBuiltPlacementBody` over one `builtEnvironmentPartBoxes` table, the footprint test is `builtFootprintsOverlap`, and the default slack is the constant shared with the status query, so this function owns only the sweep and its classification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no element, population or part; the ground plane is an input with a stated default rather than an exemption for particular bodies, and an invalid tolerance or ground height is refused rather than defaulted.
 * @evidence contracts/common.md#meaningful-documentation States what is measured and what is not claimed, why parts replace boxes, the grounded, borne and floating classes, the `groundY` default and why it exists, how a point body reads, each refusal, and what every count means.
 * @evidence contracts/performance.md#efficient-algorithms The building is staged once for every element's parts, then the B bodies' P solids are sorted in O(P log P); each subject binary-searches past the solids above it and stops at the first overlap below, so the scan is O(B log P) plus the non-overlapping solids passed over, which `compared` reports, and O(B·P) in the worst case where no solid below a subject overlaps it.
 * @evidence contracts/performance.md#reuse-equivalent-work Within one sweep the single staging and part table are shared by every body's resolution instead of restaging the building per body; across calls nothing is cached because the record is the caller's mutable data.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The part table, resolved bodies and sorted candidates live only for the call and grow linearly with the element, population and part counts; the caller owns the returned report.
 * @author Samchon
 */
export const builtEnvironmentSupportSweep = (props: {
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

  const { resolved, unresolved } = resolveBodies(props.environment);
  // Descending by top height, so the first footprint hit at or below a subject's
  // underside is the nearest part under it and the walk can stop there.
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
 * The building is staged once for every element's parts, and each body is
 * then resolved from that table. Resolving an element means tessellating its
 * model and walking its transform chain, so repeating it per body is the cost
 * that would make a whole-building sweep unusable.
 */
const resolveBodies = (
  environment: IAutoMovieBuiltEnvironment,
): {
  resolved: IResolvedBody[];
  unresolved: AutoMovieBuiltPlacementBodyLocator[];
} => {
  const parts: Map<string, IAutoMovieSubjectBox[]> =
    builtEnvironmentPartBoxes(environment);
  const locators: AutoMovieBuiltPlacementBodyLocator[] = [
    ...environment.elements.map(
      (element: IAutoMovieBuiltElement): AutoMovieBuiltPlacementBodyLocator => ({
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
    const body: IAutoMovieBuiltPlacementBody | null = resolveBuiltPlacementBody({
      environment,
      target: locator,
      parts: (elementId: string): IAutoMovieSubjectBox[] | undefined =>
        parts.get(elementId),
    });
    if (body === null) unresolved.push(locator);
    else resolved.push({ locator, body });
  }
  return { resolved, unresolved };
};

/**
 * The first index of a top-height-descending list at or below one height.
 *
 * A binary search rather than a scan, because the bodies above a subject are the
 * many in a tall building and reading past them is the cost this ordering exists
 * to avoid.
 */
const firstAtOrBelow = (
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
