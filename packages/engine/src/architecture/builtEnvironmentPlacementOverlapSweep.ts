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
 * Find positive-volume intersections of placed bodies' axis-aligned part-box proxies.
 *
 * Resolves each body from one building-wide part table, sorts lower x corners, then sweeps an active list. The broad phase avoids narrow-phase work for disjoint union boxes; compared counts active candidate comparisons and is not a full operation or timing measurement.
 *
 * Exact box-face contact is excluded by {@link propBoundsOverlap}. Positive overlap is a bounds finding, not proof of mesh interpenetration: part boxes include empty space, and a population envelope includes gaps between members. Volume and fraction grade these proxies, not occupied material.
 *
 * Every element and population is a body, elements first in declaration order. A pair whose union boxes meet is confirmed part against part and reported, left being the earlier body, with its summed shared part volume in cubic metres and that volume's share of the smaller body's summed part volume, clamped to `1` because two parts of one body may themselves meet. Pairs are sorted by share and then by volume, both descending. `measured` counts resolved bodies and `unresolved` lists the rest in body order. A population with an `along-route` layout makes the placement fold throw.
 *
 * @evidence contracts/common.md#principled-implementation A sort-and-sweep broad phase on union boxes followed by part-box interval intersections. Summed pairwise intersection volumes can double-count overlapping parts; the reported fraction divides by the smaller summed part-box volume and clamps to one. Ties in x keep declaration order.
 * @evidence contracts/common.md#clear-and-simple-design Shares body resolution with the single-body and pairwise queries through `resolveBuiltPlacementBody`, fed from `builtEnvironmentPartBoxes`, so this query owns only the sweep, the narrow phase and the grading.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no production or body; contact is excluded by the shared box kernel, and the clamp is a stated proxy-volume rule for self-overlapping parts rather than a fixture adjustment.
 * @evidence contracts/common.md#meaningful-documentation States the body set and order, the broad and narrow phases, the contact rule, the units of `volume`, how `fraction` is computed and why it is clamped, the pair sort, what `measured`, `compared` and `unresolved` mean, and the `along-route` throw.
 * @evidence contracts/performance.md#efficient-algorithms Pays one batch part-table measurement, each body's union or population placement fold, and O(R²) worst-case population lookup work for R populations. For B resolved bodies, sorting costs O(B log B); active-list scanning and splice shifts cost O(B²) worst case, in addition to admitted part-count products and O(Q log Q) sorting of Q findings. `compared` counts candidate comparisons, not all this work.
 * @evidence contracts/performance.md#reuse-equivalent-work The part table is built once per call and every body's reported box and solids are read from it, so no element is staged or measured twice; nothing is reused across calls because the record is the caller's and may change.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The part table, body list and active list live for one call; the active list holds at most the resolved body count, and the caller owns the returned report, bounded by the admitted pair count.
 */
export const builtEnvironmentPlacementOverlapSweep: (props: {
  environment: IAutoMovieBuiltEnvironment;
}) => IAutoMovieBuiltPlacementOverlapReport = (props: {
  environment: IAutoMovieBuiltEnvironment;
}): IAutoMovieBuiltPlacementOverlapReport => {
  const boxes: Map<string, IAutoMovieSubjectBox[]> = builtEnvironmentPartBoxes(
    props.environment,
  );
  const locators: AutoMovieBuiltPlacementBodyLocator[] = [
    ...props.environment.elements.map(
      (
        element: IAutoMovieBuiltElement,
      ): AutoMovieBuiltPlacementBodyLocator => ({
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

/**
 * One resolved body with its locator and its position in body order.
 */
interface ISweptBody extends IAutoMovieBuiltPlacementBody {
  /** The locator the body was resolved from. */
  locator: AutoMovieBuiltPlacementBodyLocator;

  /** Position among resolved bodies, which breaks ties and orders each pair. */
  index: number;
}

/** The volume of one box, zero when any extent is flat. */
const boxVolume: (box: IAutoMovieSubjectBox) => number = (
  box: IAutoMovieSubjectBox,
): number =>
  Math.max(0, box.max.x - box.min.x) *
  Math.max(0, box.max.y - box.min.y) *
  Math.max(0, box.max.z - box.min.z);

/** How much solid a body's parts hold, which is not the volume of its box. */
const solidVolume: (parts: readonly IAutoMovieSubjectBox[]) => number = (
  parts: readonly IAutoMovieSubjectBox[],
): number =>
  parts.reduce(
    (total: number, part: IAutoMovieSubjectBox): number =>
      total + boxVolume(part),
    0,
  );

/** The volume two boxes share, zero when they only touch or miss. */
const sharedVolume: (
  left: IAutoMovieSubjectBox,
  right: IAutoMovieSubjectBox,
) => number = (
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
