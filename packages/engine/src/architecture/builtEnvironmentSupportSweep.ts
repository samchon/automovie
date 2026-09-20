import { AutoMovieBuiltPlacementBodyLocator, IAutoMovieBuiltEnvironment, IAutoMovieBuiltFloatingBody, IAutoMovieBuiltPlacementBounds, IAutoMovieBuiltSupportSweepReport, IAutoMovieVector3 } from "@automovie/interface";
import { builtEnvironmentPartBoxes } from "./builtEnvironmentPartBoxes";
import { builtEnvironmentPlacementBounds } from "./builtEnvironmentPlacementBounds";

/**
 * Contact slack used when project source does not choose one, in metres. This
 * is the placement epsilon the prop kernel judges its own contact with, so an
 * unqualified building relation and an unqualified prop relation call the same
 * distance "touching".
 */
const DEFAULT_SUPPORT_TOLERANCE = 1e-9;

/**
 * The boxes a locator's body actually fills, one per drawn part where it has
 * them and the reported box otherwise.
 *
 * An element resolves to its parts, because a multi-part body's union box is
 * mostly air and a test written against it answers about the box rather than
 * the body. Every other locator has no part structure to consult and keeps the
 * one box it reports, and so does an element that draws nothing.
 *
 * The parts arrive through `lookup` rather than from a fixed source, because
 * one caller asks about a single pair and another has already resolved the whole
 * building. The rule about what to do with the answer is the same either way,
 * and writing it twice is how the two stop agreeing.
 */
const solidBoxes = (
  locator: AutoMovieBuiltPlacementBodyLocator,
  reported: IAutoMovieBuiltPlacementBounds,
  lookup: (id: string) => readonly IWorldBox[] | null | undefined,
): readonly IWorldBox[] => {
  if (locator.kind !== "element") return [reported];
  const parts = lookup(locator.id);
  return parts === null || parts === undefined || parts.length === 0
    ? [reported]
    : parts;
};

/**
 * Every body of one building, resolved once with its own extent.
 *
 * A sweep resolves each body exactly once and then works on boxes. That order is
 * what makes a whole-building check affordable: resolving an element means
 * tessellating its model and walking its transform chain, and comparing two boxes
 * is arithmetic, so the resolutions are the cost and repeating them per pair is
 * how a sweep becomes unusable.
 */
const builtEnvironmentBodies = (
  environment: IAutoMovieBuiltEnvironment,
): {
  resolved: {
    body: AutoMovieBuiltPlacementBodyLocator;
    bounds: IAutoMovieBuiltPlacementBounds;
  }[];
  unresolved: AutoMovieBuiltPlacementBodyLocator[];
} => {
  const resolved: {
    body: AutoMovieBuiltPlacementBodyLocator;
    bounds: IAutoMovieBuiltPlacementBounds;
  }[] = [];
  const unresolved: AutoMovieBuiltPlacementBodyLocator[] = [];
  const locators: AutoMovieBuiltPlacementBodyLocator[] = [
    ...environment.elements.map(
      (element): AutoMovieBuiltPlacementBodyLocator => ({
        kind: "element",
        id: element.id,
      }),
    ),
    ...(environment.populations ?? []).map(
      (population): AutoMovieBuiltPlacementBodyLocator => ({
        kind: "population",
        id: population.set.id,
      }),
    ),
  ];
  for (const body of locators) {
    const bounds = builtEnvironmentPlacementBounds({
      environment,
      target: body,
    });
    if (bounds === null) unresolved.push(body);
    else resolved.push({ body, bounds });
  }
  return { resolved, unresolved };
};

/** Whether two boxes share footprint area, exact contact excluded. */
/**
 * A world-space box, whichever resolution produced it.
 *
 * The measuring helpers read six numbers and nothing else, so a part box is
 * admissible wherever a body's reported bounds are. Keeping them typed as the
 * reported bounds would have forced a fabricated `basis` onto every part, which
 * is a claim about how the part was resolved that nobody made.
 */
type IWorldBox = { min: IAutoMovieVector3; max: IAutoMovieVector3 };

const footprintOverlaps = (left: IWorldBox, right: IWorldBox): boolean =>
  left.min.x < right.max.x &&
  left.max.x > right.min.x &&
  left.min.z < right.max.z &&
  left.max.z > right.min.z;

/**
 * The first index of a top-height-descending list at or below one height.
 *
 * A binary search rather than a scan, because the bodies above a subject are the
 * many in a tall building and reading past them is the cost this ordering exists
 * to avoid.
 */
const firstAtOrBelow = (
  descending: readonly { bounds: IWorldBox }[],
  ceiling: number,
): number => {
  let low = 0;
  let high = descending.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (descending[middle]!.bounds.max.y > ceiling) low = middle + 1;
    else high = middle;
  }
  return low;
};

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
 * reported as floating by the height of a panel they were nowhere near.
 *
 * `groundY` is the plane a footing legitimately rests on, and it defaults to the
 * world origin's height. Without it every ground-borne element reports as
 * floating, which is a sweep nobody can read.
 *
 * A body the record carries no vertices for is judged as the stated point it is.
 * Its underside and its top are the same height, so it is classified like any
 * other body and its `element-origin-point` basis travels with the finding, which
 * is how a caller reads "floating" as a claim about a point.
 *
 * @evidence requirements/building-exterior/structure-and-envelope.md#building-structural-support Finds floating and disconnected placed bodies over a whole building without one named query per pair.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-structural-support-input-output Derives every clearance from the same placement bounds the named-pair query measures and reports each body's basis beside it.
 * @author Samchon
 */
export const builtEnvironmentSupportSweep = (props: {
  environment: IAutoMovieBuiltEnvironment;
  /** World height a body may rest on directly. Defaults to `0`. */
  groundY?: number;
  /** Contact slack in metres. Defaults to the engine's placement epsilon. */
  tolerance?: number;
}): IAutoMovieBuiltSupportSweepReport => {
  const tolerance = props.tolerance ?? DEFAULT_SUPPORT_TOLERANCE;
  if (!Number.isFinite(tolerance) || tolerance < 0)
    throw new RangeError(
      `building support tolerance must be finite and non-negative, but was ${String(tolerance)}`,
    );
  const groundY = props.groundY ?? 0;
  if (!Number.isFinite(groundY))
    throw new RangeError(
      `building ground height must be finite, but was ${String(groundY)}`,
    );

  const { resolved, unresolved } = builtEnvironmentBodies(props.environment);
  // What a body might rest on is a drawn part, not a union box. A shelf's union
  // spans the floor to the top of its back panel and is mostly air, so a case
  // standing on its lower board found nothing at or below its own underside and
  // was reported as floating over an empty room. The subject keeps its union,
  // because a body's underside is the lowest point it has.
  const boxes = builtEnvironmentPartBoxes(props.environment);
  const partsById = (id: string) => boxes.get(id);
  const candidates = resolved.flatMap((owner) =>
    solidBoxes(owner.body, owner.bounds, partsById).map((bounds) => ({
      bounds,
      owner,
    })),
  );
  // Descending by top height, so the first footprint hit at or below a subject's
  // underside is the nearest part under it and the walk can stop there. The
  // alternative is reading every body for every body, which is the shape that
  // makes a whole-building check something nobody runs twice.
  const descending = [...candidates].sort(
    (left, right) => right.bounds.max.y - left.bounds.max.y,
  );
  const floating: IAutoMovieBuiltFloatingBody[] = [];
  let grounded = 0;
  let borne = 0;
  let compared = 0;
  for (const subject of resolved) {
    if (subject.bounds.min.y <= groundY + tolerance) {
      ++grounded;
      continue;
    }
    const ceiling = subject.bounds.min.y + tolerance;
    let nearest: {
      body: AutoMovieBuiltPlacementBodyLocator;
      clearance: number;
    } | null = null;
    for (
      let index = firstAtOrBelow(descending, ceiling);
      index < descending.length;
      ++index
    ) {
      const candidate = descending[index]!;
      if (candidate.owner === subject) continue;
      ++compared;
      if (footprintOverlaps(subject.bounds, candidate.bounds) === false)
        continue;
      nearest = {
        body: candidate.owner.body,
        clearance: subject.bounds.min.y - candidate.bounds.max.y,
      };
      break;
    }
    if (nearest !== null && nearest.clearance <= tolerance) {
      ++borne;
      continue;
    }
    floating.push({
      body: subject.body,
      basis: subject.bounds.basis,
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
