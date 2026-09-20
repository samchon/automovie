import { AutoMovieBuiltPlacementBodyLocator, IAutoMovieBuiltEnvironment, IAutoMovieBuiltPlacementBounds, IAutoMovieBuiltPlacementOverlapPair, IAutoMovieBuiltPlacementOverlapReport, IAutoMovieVector3 } from "@automovie/interface";
import { propBoundsOverlap } from "../film/propBoundsOverlap";
import { builtEnvironmentPartBoxes } from "./builtEnvironmentPartBoxes";
import { builtEnvironmentPlacementBounds } from "./builtEnvironmentPlacementBounds";

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

const boxVolume = (box: IWorldBox): number =>
  Math.max(0, box.max.x - box.min.x) *
  Math.max(0, box.max.y - box.min.y) *
  Math.max(0, box.max.z - box.min.z);

/** How much solid a body's parts hold, which is not the volume of its box. */
const solidVolume = (parts: readonly IWorldBox[]): number =>
  parts.reduce((total, part) => total + boxVolume(part), 0);

const sharedVolume = (left: IWorldBox, right: IWorldBox): number =>
  Math.max(
    0,
    Math.min(left.max.x, right.max.x) - Math.max(left.min.x, right.min.x),
  ) *
  Math.max(
    0,
    Math.min(left.max.y, right.max.y) - Math.max(left.min.y, right.min.y),
  ) *
  Math.max(
    0,
    Math.min(left.max.z, right.max.z) - Math.max(left.min.z, right.min.z),
  );

/**
 * Find every pair of placed bodies in a building whose volumes intersect.
 *
 * Sorting by the lower x corner and sweeping an active list is what keeps this
 * usable on a building rather than on a room. A naive pass over one measured
 * production's 3,474 placings is six million pair tests; pruning on one axis
 * leaves the comparisons the geometry actually forces, and `compared` states how
 * many that was, so the cost of the check is part of its answer instead of a
 * number somebody measures once and writes in a document.
 *
 * Exact face contact is excluded by {@link propBoundsOverlap} itself, so a slab
 * bearing on a wall head and a tenon meeting its mortise produce nothing here.
 * What is reported is interpenetration, graded by the share of the smaller body
 * inside the larger and deepest first, because a quoin toothed a centimetre into
 * its wall and a column standing wholly inside one are not one finding.
 *
 * @evidence requirements/building-exterior/structure-and-envelope.md#building-structural-support Answers the neighbour-overlap question across a whole building rather than one named pair at a time.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-structural-support-input-output Reports each intersecting pair's shared volume, its share of the smaller body, both bases, and the comparisons performed.
 * @author Samchon
 */
export const builtEnvironmentPlacementOverlapSweep = (props: {
  environment: IAutoMovieBuiltEnvironment;
}): IAutoMovieBuiltPlacementOverlapReport => {
  const { resolved, unresolved } = builtEnvironmentBodies(props.environment);
  const order = resolved
    .map((entry, index) => ({ ...entry, index }))
    .sort((left, right) =>
      left.bounds.min.x === right.bounds.min.x
        ? left.index - right.index
        : left.bounds.min.x - right.bounds.min.x,
    );
  const pairs: IAutoMovieBuiltPlacementOverlapPair[] = [];
  const active: typeof order = [];
  let compared = 0;
  // One pass over the record for every body's parts. Resolving them one body at
  // a time re-walks the element tree per body, which on the three-thousand-body
  // production this sweep is sized for is the whole cost of the check again.
  const boxes = builtEnvironmentPartBoxes(props.environment);
  const partsById = (id: string) => boxes.get(id);
  for (const subject of order) {
    // Anything whose right edge is behind this body's left edge can meet neither
    // it nor anything after it, because the sweep only ever moves right.
    for (let index = active.length - 1; index >= 0; --index)
      if (active[index]!.bounds.max.x <= subject.bounds.min.x)
        active.splice(index, 1);
    for (const candidate of active) {
      ++compared;
      if (propBoundsOverlap(candidate.bounds, subject.bounds) === false)
        continue;
      const first = candidate.index < subject.index ? candidate : subject;
      const second = candidate.index < subject.index ? subject : candidate;
      // The union boxes met; the bodies may not have. A shelf's union swallows
      // everything standing on it, so the pair is confirmed part against part
      // and withdrawn when nothing solid actually met. The union stays the
      // prune, because it contains every part and can only over-admit.
      const firstParts = solidBoxes(first.body, first.bounds, partsById);
      const secondParts = solidBoxes(second.body, second.bounds, partsById);
      let volume = 0;
      for (const left of firstParts)
        for (const right of secondParts) volume += sharedVolume(left, right);
      if (volume <= 0) continue;
      // Measured against the solid the parts occupy rather than the union, so a
      // column standing inside a mostly-air body is not graded as a sliver of
      // the air. Clamped because two parts of one body may themselves meet, and
      // a share of more than the whole is a number nobody can read.
      const smaller = Math.min(
        solidVolume(firstParts),
        solidVolume(secondParts),
      );
      pairs.push({
        left: first.body,
        right: second.body,
        leftBasis: first.bounds.basis,
        rightBasis: second.bounds.basis,
        volume,
        fraction: smaller === 0 ? 0 : Math.min(1, volume / smaller),
      });
    }
    active.push(subject);
  }
  return {
    measured: resolved.length,
    compared,
    pairs: pairs.sort((left, right) =>
      right.fraction === left.fraction
        ? right.volume - left.volume
        : right.fraction - left.fraction,
    ),
    unresolved,
  };
};
