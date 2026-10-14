import { growPlanting, plantingStateDigest } from "@automovie/engine";
import type { IAutoMoviePlantingDomain, IAutoMoviePlantingState } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, throwsError } from "../internal/predicates";
import { plantingRecipe } from "../internal/softFixtures";

/** A jittered recipe, where every seeded decision is live. */
const jittered: (seed: number) => IAutoMoviePlantingDomain = (seed: number): IAutoMoviePlantingDomain =>
  plantingRecipe({
    seed,
    structure: {
      ...plantingRecipe().structure,
      directionJitter: 0.5,
      lengthJitter: 0.5,
      gravitropism: 0.25,
    },
    foliage: {
      density: 6,
      minLevel: 0,
      size: { x: 0.05, y: 0.125, z: 0.05 },
      scaleJitter: 0.5,
      rollJitter: 1,
    },
  });

/**
 * Repeated derivations of the same jittered recipe preserve selected numeric
 * fields bit for bit, while the selected alternate seed changes its digest.
 *
 * Determinism here is not incidental: a seeded value is drawn from the recipe
 * seed folded with the **path** of child indices that produced the branch,
 * never from a sequential stream, so a branch's jitter does not depend on how
 * many branches happened to be emitted before it. These local calls exercise
 * repeatability, not derivation on another machine or render chunk.
 *
 * The digest summarizes an ordered numeric stream and can collide; the direct
 * Object.is comparisons independently check the selected endpoints, rotations
 * and scales, including signed zero. They do not compare every state field.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls growPlanting with repeated, alternate-seed, rebuilt and cap-limited recipes; selected numeric identity, length variation and named errors expose unstable derivation or ignored caps.
 * @evidence contracts/testing.md#independent-expectations Repeat calls and a JSON-rebuilt recipe must agree without embedding a produced snapshot; Object.is preserves exact selected fields, while the 32-bit digest can collide and twelve-decimal length grouping is approximate.
 * @evidence contracts/testing.md#distinguishing-cases Exercises jitter on/off, seed change, structural reconstruction, branch/leaf caps and enormous leaf density; other planting tests own hand-computed geometry and pruning, and this test measures neither allocations nor cross-host identity.
 * @evidence contracts/testing.md#execution-ownership The discoverable exported test is a portable engine unit test with no dynamic registrations, native build, viewer, browser or GPU.
 *
 * Scenarios:
 *
 * 1. Two derivations have identical counts, branch endpoints, leaf rotations and
 *    leaf scales, and their selected-geometry digests agree.
 * 2. A different seed is a different plant, so the digest is measuring the seeded
 *    content and not a constant.
 * 3. A recipe rebuilt from scratch — a different object with the same values —
 *    digests identically, so nothing is keyed on object identity.
 * 4. Removing the jitter removes the variation: every first-order branch of an
 *    unjittered recipe has one length rounded to twelve decimals, while the
 *    jittered one spreads those rounded lengths.
 * 5. The declared caps are enforced rather than decorative: a branch cap below
 *    what the law grows, and a leaf cap below what the foliage bears, each
 *    throw with the recipe named. A density of a trillion leaves per metre also
 *    throws the declared sixteen-leaf cap error; no allocation count is observed.
 */
export function test_planting_determinism(): void {
  const once: IAutoMoviePlantingState = growPlanting(jittered(20_260_810));
  const twice: IAutoMoviePlantingState = growPlanting(jittered(20_260_810));
  TestValidator.equals(
    "the same recipe derives the same plant, bit for bit",
    namedFacts([
      ["branchCount", () => once.branches.length === twice.branches.length],
      ["leafCount", () => once.leaves.length === twice.leaves.length],
      [
        "branches",
        () =>
          once.branches.every((branch: IAutoMoviePlantingState["branches"][number], index: number): boolean =>
            (["x", "y", "z"] as const).every(
              (axis: "x" | "y" | "z"): boolean =>
                Object.is(branch.end[axis], twice.branches[index].end[axis]) &&
                Object.is(
                  branch.start[axis],
                  twice.branches[index].start[axis],
                ),
            ),
          ),
      ],
      [
        "leaves",
        () =>
          once.leaves.every((leaf: IAutoMoviePlantingState["leaves"][number], index: number): boolean =>
            (["x", "y", "z", "w"] as const).every((axis: "x" | "y" | "z" | "w"): boolean =>
              Object.is(
                leaf.rotation[axis],
                twice.leaves[index].rotation[axis],
              ),
            ),
          ),
      ],
      [
        "scales",
        () =>
          once.leaves.every((leaf: IAutoMoviePlantingState["leaves"][number], index: number): boolean =>
            (["x", "y", "z"] as const).every((axis: "x" | "y" | "z"): boolean =>
              Object.is(leaf.scale[axis], twice.leaves[index].scale[axis]),
            ),
          ),
      ],
      [
        "digest",
        () => plantingStateDigest(once) === plantingStateDigest(twice),
      ],
    ]),
    {
      branchCount: true,
      leafCount: true,
      branches: true,
      leaves: true,
      scales: true,
      digest: true,
    },
  );

  TestValidator.equals(
    "the seed is what varies the plant",
    namedFacts([
      [
        "differs",
        () =>
          plantingStateDigest(growPlanting(jittered(7))) !==
          plantingStateDigest(once),
      ],
      [
        "rebuilt",
        () =>
          plantingStateDigest(
            growPlanting(JSON.parse(JSON.stringify(jittered(20_260_810)))),
          ) === plantingStateDigest(once),
      ],
    ]),
    { differs: true, rebuilt: true },
  );

  const plain: IAutoMoviePlantingState = growPlanting(plantingRecipe());
  const lengths: (state: IAutoMoviePlantingState, level: number) => number[] = (state: IAutoMoviePlantingState, level: number): number[] =>
    state.branches
      .filter((branch: IAutoMoviePlantingState["branches"][number]): boolean => branch.level === level)
      .map((branch: IAutoMoviePlantingState["branches"][number]): number =>
        Math.sqrt(
          (branch.end.x - branch.start.x) ** 2 +
            (branch.end.y - branch.start.y) ** 2 +
            (branch.end.z - branch.start.z) ** 2,
        ),
      );
  TestValidator.equals(
    "jitter is what spreads the branch lengths",
    namedFacts([
      [
        "uniform",
        () =>
          new Set(lengths(plain, 1).map((value: number): string => value.toFixed(12))).size ===
          1,
      ],
      [
        "spread",
        () =>
          new Set(lengths(once, 1).map((value: number): string => value.toFixed(12))).size > 1,
      ],
    ]),
    { uniform: true, spread: true },
  );

  TestValidator.equals(
    "the declared caps are enforced",
    namedFacts([
      [
        "branches",
        () =>
          throwsError(
            () =>
              growPlanting(
                plantingRecipe({ budget: { maxBranches: 3, maxLeaves: 512 } }),
              ),
            ['planting "fern" exceeded its declared cap of 3 branches'],
          ),
      ],
      [
        "leaves",
        () =>
          throwsError(
            () =>
              growPlanting(
                plantingRecipe({
                  foliage: {
                    density: 4,
                    minLevel: 1,
                    size: { x: 0.05, y: 0.1, z: 0.05 },
                    scaleJitter: 0,
                    rollJitter: 0,
                  },
                  budget: { maxBranches: 64, maxLeaves: 2 },
                }),
              ),
            ['planting "fern" exceeded its declared cap of 2 leaves'],
          ),
      ],
      [
        "leafCapIsReachedBeforeTheMachineIs",
        () =>
          throwsError(
            () =>
              growPlanting(
                plantingRecipe({
                  foliage: {
                    density: 1e12,
                    minLevel: 0,
                    size: { x: 0.05, y: 0.1, z: 0.05 },
                    scaleJitter: 0,
                    rollJitter: 0,
                  },
                  budget: { maxBranches: 64, maxLeaves: 16 },
                }),
              ),
            ['planting "fern" exceeded its declared cap of 16 leaves'],
          ),
      ],
    ]),
    {
      branches: true,
      leaves: true,
      leafCapIsReachedBeforeTheMachineIs: true,
    },
  );
}
