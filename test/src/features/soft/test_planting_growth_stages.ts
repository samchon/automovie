import { growPlanting } from "@automovie/engine";
import type {
  IAutoMoviePlantingState,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose, vclose } from "../internal/predicates";
import { plantingRecipe } from "../internal/softFixtures";

/** The same recipe at one stage of growth. */
const at: (stage: number) => IAutoMoviePlantingState = (
  stage: number,
): IAutoMoviePlantingState =>
  growPlanting(plantingRecipe({ growth: { stage, onset: 0.25 } }));

/** Length of one derived branch. */
const span: (start: IAutoMovieVector3, end: IAutoMovieVector3) => number = (
  start: IAutoMovieVector3,
  end: IAutoMovieVector3,
): number =>
  Math.sqrt(
    (end.x - start.x) ** 2 + (end.y - start.y) ** 2 + (end.z - start.z) ** 2,
  );

/**
 * Growth is a deterministic **state**, and the extension of each level is the
 * hand-computable consequence of the stage, the onset and the level.
 *
 * The expectations come from the law, not from the derivation's output:
 *
 * ```text
 *   e(l) = clamp( (stage − onset·l) / (1 − onset·(levels − 1)), 0, 1 )
 * ```
 *
 * With `levels = 3` and `onset = 1/4` the span is `1 − 1/2 = 1/2`, so `e(0) =
 * 2·stage`, `e(1) = 2·stage − 1/2` and `e(2) = 2·stage − 1`, each clamped. That
 * fixes exactly when each order of branching appears and how long it is, and
 * every trunk figure below is a dyadic rational.
 *
 * A child grows along the frame whose `+y` is its parent's axis, so the
 * authored `(1, 1, 0)` becomes the world direction `(1, 1, 0)/√2` off a
 * vertical trunk, and the first-order branch that emerges at half the trunk's
 * height reaches `(0.5/√2, 0.5 + 0.5/√2, 0)` at full growth. Radii contract by
 * the declared ratio, and a child's base radius is exactly its parent's tip
 * radius, so the structure is continuous rather than stepped.
 *
 * @evidence contracts/testing.md#behavioral-verification Derives the recipe at dormant, quarter, half, full and eleven sampled stages plus a single-level boundary; counts, endpoints, radii and ancestry expose incorrect extension or branching.
 * @evidence contracts/testing.md#independent-expectations The documented clamped extension law and authored ratios yield expected coordinates independently; vclose/nclose compare geometric values, while Object.is retains exact dyadic radii and their continuity witness.
 * @evidence contracts/testing.md#distinguishing-cases Covers empty bounds, level-emergence boundaries, full depth, sampled monotonicity and zero-onset single-level growth; monotonicity is checked only at eleven samples, and foliage/pruning/seed behavior belongs to separate tests.
 * @evidence contracts/testing.md#execution-ownership The named discoverable export directly exercises portable growPlanting semantics and owns all six scenarios without a native consumer, browser, GPU or dynamic registration.
 *
 * Scenarios:
 *
 * 1. At `stage = 0` nothing has emerged: no branch, no leaf, and `null` bounds
 *    rather than a degenerate box around the origin.
 * 2. At `stage = 1/4` only the trunk exists, at exactly half its full length,
 *    because `e(0) = 1/2` and `e(1) = 0`.
 * 3. At `stage = 1/2` the trunk is complete and the first order has emerged at
 *    exactly half its own length; the second order has not.
 * 4. At `stage = 1` the complete seven-segment structure exists, the first-order
 *    branch reaches its hand-computed tip, and radii contract by the declared
 *    ratio with each child's base equal to its parent's tip.
 * 5. Growth is monotone: over eleven stages neither the branch count nor the
 *    trunk's length ever decreases.
 * 6. A recipe with a single level and no onset delay is the boundary case where
 *    the span is exactly one, so extension equals the stage itself.
 */
export function test_planting_growth_stages(): void {
  const dormant: IAutoMoviePlantingState = at(0);
  TestValidator.equals(
    "nothing has emerged at growth state zero",
    namedFacts([
      ["branches", () => dormant.branches.length === 0],
      ["leaves", () => dormant.leaves.length === 0],
      ["bounds", () => dormant.bounds === null],
      ["stage", () => nclose(dormant.stage, 0, 0)],
      ["domain", () => dormant.domain === "fern"],
    ]),
    { branches: true, leaves: true, bounds: true, stage: true, domain: true },
  );

  const young: IAutoMoviePlantingState = at(0.25);
  TestValidator.equals(
    "a quarter grown is a half-length trunk and nothing else",
    namedFacts([
      ["count", () => young.branches.length === 1],
      ["end", () => vclose(young.branches[0].end, { x: 0, y: 0.5, z: 0 })],
      ["start", () => vclose(young.branches[0].start, { x: 0, y: 0, z: 0 })],
      ["level", () => young.branches[0].level === 0],
      ["parent", () => young.branches[0].parent === null],
      ["unpruned", () => young.branches[0].pruned === false],
      ["id", () => young.branches[0].id === "trunk"],
    ]),
    {
      count: true,
      end: true,
      start: true,
      level: true,
      parent: true,
      unpruned: true,
      id: true,
    },
  );

  const half: IAutoMoviePlantingState = at(0.5);
  const root: number = 0.5 / Math.SQRT2;
  TestValidator.equals(
    "half grown completes the trunk and half-extends the first order",
    namedFacts([
      ["count", () => half.branches.length === 3],
      ["trunk", () => vclose(half.branches[0].end, { x: 0, y: 1, z: 0 })],
      [
        "child",
        () =>
          vclose(half.branches[1].end, {
            x: root / 2,
            y: 0.5 + root / 2,
            z: 0,
          }),
      ],
      [
        "childBase",
        () => vclose(half.branches[1].start, { x: 0, y: 0.5, z: 0 }),
      ],
      [
        "noSecondOrder",
        () =>
          half.branches.every(
            (branch: IAutoMoviePlantingState["branches"][number]): boolean =>
              branch.level < 2,
          ),
      ],
    ]),
    {
      count: true,
      trunk: true,
      child: true,
      childBase: true,
      noSecondOrder: true,
    },
  );

  const grown: IAutoMoviePlantingState = at(1);
  TestValidator.equals(
    "full growth is the complete seven-segment structure",
    namedFacts([
      ["count", () => grown.branches.length === 7],
      [
        "child",
        () => vclose(grown.branches[1].end, { x: root, y: 0.5 + root, z: 0 }),
      ],
      ["trunkRadius", () => Object.is(grown.branches[0].radiusStart, 0.0625)],
      ["trunkTip", () => Object.is(grown.branches[0].radiusEnd, 0.03125)],
      [
        "continuous",
        () =>
          Object.is(grown.branches[1].radiusStart, grown.branches[0].radiusEnd),
      ],
      ["parentage", () => grown.branches[1].parent === "trunk"],
      ["identity", () => grown.branches[1].id === "trunk/a"],
      [
        "depth",
        () =>
          grown.branches.filter(
            (branch: IAutoMoviePlantingState["branches"][number]): boolean =>
              branch.level === 2,
          ).length === 4,
      ],
    ]),
    {
      count: true,
      child: true,
      trunkRadius: true,
      trunkTip: true,
      continuous: true,
      parentage: true,
      identity: true,
      depth: true,
    },
  );

  const stages: IAutoMoviePlantingState[] = Array.from(
    { length: 11 },
    (_: unknown, index: number): IAutoMoviePlantingState => at(index / 10),
  );
  TestValidator.equals(
    "growth never runs backwards",
    namedFacts([
      [
        "count",
        () =>
          stages.every(
            (state: IAutoMoviePlantingState, index: number): boolean =>
              index === 0 ||
              state.branches.length >= stages[index - 1].branches.length,
          ),
      ],
      [
        "trunkLength",
        () =>
          stages.every(
            (state: IAutoMoviePlantingState, index: number): boolean => {
              if (index === 0 || state.branches.length === 0) return true;
              const previous:
                | IAutoMoviePlantingState["branches"][number]
                | undefined = stages[index - 1].branches[0];
              const length: number = span(
                state.branches[0].start,
                state.branches[0].end,
              );
              return (
                previous === undefined ||
                length >= span(previous.start, previous.end)
              );
            },
          ),
      ],
      ["reachesSeven", () => stages[10].branches.length === 7],
    ]),
    { count: true, trunkLength: true, reachesSeven: true },
  );

  const single: IAutoMoviePlantingState = growPlanting(
    plantingRecipe({
      structure: { ...plantingRecipe().structure, levels: 1 },
      growth: { stage: 0.375, onset: 0 },
      budget: { maxBranches: 4, maxLeaves: 0 },
    }),
  );
  TestValidator.equals(
    "a single-level recipe extends exactly by its stage",
    namedFacts([
      ["count", () => single.branches.length === 1],
      [
        "length",
        () =>
          nclose(span(single.branches[0].start, single.branches[0].end), 0.375),
      ],
    ]),
    { count: true, length: true },
  );
}
