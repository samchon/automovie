import {
  AutoMovieBuiltPlacementBodyLocator,
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltPlacementOverlapPair,
  IAutoMovieBuiltPlacementOverlapReport,
  IAutoMovieBuiltPopulation,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import { propBoundsOverlap } from "../film/propBoundsOverlap";
import { IAutoMovieBuiltPlacementBody } from "./IAutoMovieBuiltPlacementBody";
import { builtEnvironmentPartBoxes } from "./builtEnvironmentPartBoxes";
import { resolveBuiltPlacementBody } from "./resolveBuiltPlacementBody";

/**
 * Find every pair of placed bodies in a building whose volumes intersect.
 *
 * Every body is resolved once, from one building-wide part table, and the rest
 * of the check works on boxes. Sorting by the lower x corner and sweeping an
 * active list is what keeps this usable on a building rather than on a room. A
 * naive pass over one measured production's 3,474 placings is six million pair
 * tests; pruning on one axis leaves the comparisons the geometry actually
 * forces, and `compared` states how many that was, so the cost of the check is
 * part of its answer.
 *
 * Exact face contact is excluded by {@link propBoundsOverlap} itself, so a slab
 * bearing on a wall head and a tenon meeting its mortise produce nothing here.
 * What is reported is interpenetration, graded by the share of the smaller body
 * inside the larger and deepest first, because a quoin toothed a centimetre into
 * its wall and a column standing wholly inside one are not one finding.
 *
 * Every element and population is a body, elements first in declaration order.
 * A pair whose union boxes meet is confirmed part against part and reported,
 * left being the earlier body, with its summed shared part volume in cubic
 * metres and that volume's share of the smaller body's summed part volume,
 * clamped to `1` because two parts of one body may themselves meet. Pairs are
 * sorted by share and then by volume, both descending. `measured` counts
 * resolved bodies and `unresolved` lists the rest in body order. A population
 * with an `along-route` layout makes the placement fold throw.
 *
 * @evidence contracts/common.md#principled-implementation A sort-and-sweep broad phase on the x axis with union boxes, which over-admit because every part lies inside its union, followed by an exact part-against-part narrow phase whose shared volume is the product of per-axis interval overlaps; ties in x keep body order so the pair list is deterministic.
 * @evidence contracts/common.md#clear-and-simple-design Shares body resolution with the single-body and pairwise queries through `resolveBuiltPlacementBody`, fed from `builtEnvironmentPartBoxes`, so this query owns only the sweep, the narrow phase and the grading.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no production or body; the 3,474-placing figure motivates the design in documentation only, contact is excluded by the shared kernel, and the clamp is a stated rule for self-overlapping parts rather than a fix for a known case.
 * @evidence contracts/common.md#meaningful-documentation States the body set and order, the broad and narrow phases, the contact rule, the units of `volume`, how `fraction` is computed and why it is clamped, the pair sort, what `measured`, `compared` and `unresolved` mean, and the `along-route` throw.
 * @evidence contracts/performance.md#efficient-algorithms One staging pass and vertex fold for every drawn element, an n log n sort of the bodies, and a sweep whose cost is the reported `compared` count times the part products of admitted pairs; resolving bodies from one part table replaced a per-body restaging that was quadratic in the element count.
 * @evidence contracts/performance.md#reuse-equivalent-work The part table is built once per call and every body's reported box and solids are read from it, so no element is staged or measured twice; nothing is reused across calls because the record is the caller's and may change.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The part table, body list and active list live for one call; the active list holds at most the resolved body count, and the caller owns the returned report, bounded by the admitted pair count.
 * @author Samchon
 */
export const builtEnvironmentPlacementOverlapSweep = (props: {
  environment: IAutoMovieBuiltEnvironment;
}): IAutoMovieBuiltPlacementOverlapReport => {
  const boxes: Map<string, IAutoMovieSubjectBox[]> = builtEnvironmentPartBoxes(
    props.environment,
  );
  const locators: AutoMovieBuiltPlacementBodyLocator[] = [
    ...props.environment.elements.map(
      (element: IAutoMovieBuiltElement): AutoMovieBuiltPlacementBodyLocator => ({
        kind: "element",
        id: element.id,
      }),
    ),
    ...(props.environment.populations ?? []).map(
      (
        population: IAutoMovieBuiltPopulation,
      ): AutoMovieBuiltPlacementBodyLocator => ({
        kind: "population",
        id: population.set.id,
      }),
    ),
  ];
  const resolved: ISweptBody[] = [];
  const unresolved: AutoMovieBuiltPlacementBodyLocator[] = [];
  for (const locator of locators) {
    const body: IAutoMovieBuiltPlacementBody | null = resolveBuiltPlacementBody(
      {
        environment: props.environment,
        target: locator,
        parts: (elementId: string): IAutoMovieSubjectBox[] | undefined =>
          boxes.get(elementId),
      },
    );
    if (body === null) unresolved.push(locator);
    else resolved.push({ ...body, locator, index: resolved.length });
  }
  const order: ISweptBody[] = resolved
    .slice()
    .sort((left: ISweptBody, right: ISweptBody): number =>
      left.bounds.min.x === right.bounds.min.x
        ? left.index - right.index
        : left.bounds.min.x - right.bounds.min.x,
    );
  const pairs: IAutoMovieBuiltPlacementOverlapPair[] = [];
  const active: ISweptBody[] = [];
  let compared: number = 0;
  for (const subject of order) {
    // Anything whose right edge is behind this body's left edge can meet neither
    // it nor anything after it, because the sweep only ever moves right.
    for (let index: number = active.length - 1; index >= 0; --index)
      if (active[index]!.bounds.max.x <= subject.bounds.min.x)
        active.splice(index, 1);
    for (const candidate of active) {
      ++compared;
      if (propBoundsOverlap(candidate.bounds, subject.bounds) === false)
        continue;
      const first: ISweptBody =
        candidate.index < subject.index ? candidate : subject;
      const second: ISweptBody =
        candidate.index < subject.index ? subject : candidate;
      let volume: number = 0;
      for (const left of first.solids)
        for (const right of second.solids) volume += sharedVolume(left, right);
      if (volume <= 0) continue;
      const smaller: number = Math.min(
        solidVolume(first.solids),
        solidVolume(second.solids),
      );
      pairs.push({
        left: first.locator,
        right: second.locator,
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
    pairs: pairs.sort(
      (
        left: IAutoMovieBuiltPlacementOverlapPair,
        right: IAutoMovieBuiltPlacementOverlapPair,
      ): number =>
        right.fraction === left.fraction
          ? right.volume - left.volume
          : right.fraction - left.fraction,
    ),
    unresolved,
  };
};

/** One resolved body with its locator and its position in body order. */
interface ISweptBody extends IAutoMovieBuiltPlacementBody {
  /** The locator the body was resolved from. */
  locator: AutoMovieBuiltPlacementBodyLocator;

  /** Position among resolved bodies, which breaks ties and orders each pair. */
  index: number;
}

/** The volume of one box, zero when any extent is flat. */
const boxVolume = (box: IAutoMovieSubjectBox): number =>
  Math.max(0, box.max.x - box.min.x) *
  Math.max(0, box.max.y - box.min.y) *
  Math.max(0, box.max.z - box.min.z);

/** How much solid a body's parts hold, which is not the volume of its box. */
const solidVolume = (parts: readonly IAutoMovieSubjectBox[]): number =>
  parts.reduce(
    (total: number, part: IAutoMovieSubjectBox): number =>
      total + boxVolume(part),
    0,
  );

/** The volume two boxes share, zero when they only touch or miss. */
const sharedVolume = (
  left: IAutoMovieSubjectBox,
  right: IAutoMovieSubjectBox,
): number =>
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
