import {
  validatePlantingCluster,
  validatePlantingDomain,
} from "@automovie/engine";
import {
  AutoMovieViolationKind,
  IAutoMoviePlantingCluster,
  IAutoMoviePlantingDomain,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { assertPlantingValidationLimits } from "../internal/assertPlantingValidationLimits";
import { hasViolation, namedFacts } from "../internal/predicates";
import { plantingCluster, plantingRecipe } from "../internal/softFixtures";

/** Whether the changed recipe reports the requested kind/path; other findings may coexist. */
const refuses: Parameters<typeof assertPlantingValidationLimits>[0] = (
  overrides: Partial<IAutoMoviePlantingDomain>,
  kind: AutoMovieViolationKind,
  path: string,
): boolean =>
  hasViolation(
    validatePlantingDomain({ domain: plantingRecipe(overrides) }),
    kind,
    path,
  );

/** One property away from a sound cluster. */
const refusesCluster: Parameters<typeof assertPlantingValidationLimits>[1] = (
  overrides: Partial<IAutoMoviePlantingCluster>,
  kind: AutoMovieViolationKind,
  path: string,
): boolean =>
  hasViolation(
    validatePlantingCluster({ cluster: plantingCluster(overrides) }),
    kind,
    path,
  );

/** A structure patch that keeps the rest of the branching law intact. */
const structure: (
  patch: Partial<IAutoMoviePlantingDomain["structure"]>,
) => Partial<IAutoMoviePlantingDomain> = (
  patch: Partial<IAutoMoviePlantingDomain["structure"]>,
): Partial<IAutoMoviePlantingDomain> => ({
  structure: { ...plantingRecipe().structure, ...patch },
});

/**
 * The selected planting authoring mistakes report the kind and path of the
 * offending field, beside admitted complete recipes and clusters.
 *
 * A validator that only ever fires is as useless as one that never does, so the
 * complete recipe and the complete cluster are asserted successful first and
 * selected refusal inputs change authored fields. The pass is what lets the
 * derivation grow without second-guessing its input: a ratio above one, a
 * growth span that leaves the deepest level unreachable, a zero
 * direction vector, or a branching law larger than the cap the recipe set for
 * itself are all refused rather than quietly clamped.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs recipe/cluster admission on selected header, structure, growth, envelope, foliage and budget defects plus a real over-cap grow call; requested kind/path and cap-error assertions expose ignored authoring constraints.
 * @evidence contracts/testing.md#independent-expectations Authored ranges, reference paths and the complete binary tree/density counts provide expectations independently of validator output; hasViolation checks presence rather than exactly one finding, and success does not assert absence of warnings.
 * @evidence contracts/testing.md#distinguishing-cases Preserves all seven groups, including zero/nonfinite vectors, duplicate children, unreachable versus .49 reachable onset, exact eight-leaf budget, enormous depth, fractional cap without secondary range findings, and cluster attempt/count/scale boundaries; the suite does not enumerate every possible invalid record or measure iteration counts.
 * @evidence contracts/testing.md#execution-ownership The named discoverable portable unit runs early cases directly and delegates the original later groups to assertPlantingValidationLimits with its same refusal callbacks, without dynamic registration, native artifacts or a browser/GPU.
 *
 * Scenarios:
 *
 * 1. The complete recipe and cluster validate clean.
 * 2. Identity and schema: a blank id, a wrong version, wrong units and a
 *    fractional seed.
 * 3. The branching law: a level count outside its range, a zero trunk axis, a
 *    non-positive length or radius, ratios outside `(0, 1]`, jitters outside
 *    their ranges, a gravitropism outside `[−1, 1]`, an empty and an oversized
 *    child list, a duplicated and a blank child id, a zero child direction and
 *    an offset outside `[0, 1]`.
 * 4. Growth: a stage outside `[0, 1]`, an onset outside `[0, 1]`, and an onset
 *    that would leave the deepest level unable to emerge.
 * 5. Pruning and foliage: an inverted box, a non-positive sphere radius, a
 *    non-positive density, a negative minimum level, a non-positive leaf size
 *    and jitters outside their ranges.
 * 6. Budget: caps outside their ranges, a branching law whose complete tree
 *    exceeds the cap the recipe declared for itself, and a foliage rule that
 *    bears more blades than its own leaf cap allows — with the guard measured
 *    only when the level count is itself in range, so a nonsensical depth is
 *    refused before anything tries to walk it. The leaf cap is what
 *    `growPlanting` enforces by throwing, so a recipe that survived this pass
 *    and then threw inside a binding's own validation would be a crash where a
 *    violation was asked for; a recipe with no foliage rule bears nothing and
 *    is left to the cap's own range check.
 * 7. The cluster: a blank id, an uncited recipe, a member count outside its range,
 *    a non-finite anchor, a negative extent, a fractional seed, a negative
 *    spacing, an attempt count outside its range, a non-positive minimum scale,
 *    and a maximum below its minimum. Yaw-jitter admission is not asserted here.
 */
export function test_planting_validation(): void {
  TestValidator.equals(
    "the complete recipe and cluster validate clean",
    namedFacts([
      [
        "recipe",
        () =>
          validatePlantingDomain({ domain: plantingRecipe() }).success === true,
      ],
      [
        "cluster",
        () =>
          validatePlantingCluster({ cluster: plantingCluster() }).success ===
          true,
      ],
    ]),
    { recipe: true, cluster: true },
  );

  TestValidator.equals(
    "identity and schema are named",
    namedFacts([
      ["blankId", () => refuses({ id: " " }, "type", "$input.id")],
      [
        "version",
        () => refuses({ version: 0 as unknown as 1 }, "type", "$input.version"),
      ],
      [
        "units",
        () =>
          refuses(
            { units: "cm" as unknown as "meter" },
            "type",
            "$input.units",
          ),
      ],
      ["seed", () => refuses({ seed: 1.5 }, "type", "$input.seed")],
    ]),
    { blankId: true, version: true, units: true, seed: true },
  );

  TestValidator.equals(
    "the branching law is named",
    namedFacts([
      [
        "levels",
        () => refuses(structure({ levels: 0 }), "type", "structure.levels"),
      ],
      [
        "deepLevels",
        () => refuses(structure({ levels: 13 }), "type", "structure.levels"),
      ],
      [
        "axis",
        () =>
          refuses(
            structure({ axis: { x: 0, y: 0, z: 0 } }),
            "type",
            "structure.axis",
          ),
      ],
      [
        "axisValue",
        () =>
          refuses(
            structure({ axis: { x: Number.NaN, y: 1, z: 0 } }),
            "range",
            "structure.axis.x",
          ),
      ],
      [
        "length",
        () => refuses(structure({ length: 0 }), "range", "structure.length"),
      ],
      [
        "radius",
        () => refuses(structure({ radius: -1 }), "range", "structure.radius"),
      ],
      [
        "lengthRatio",
        () =>
          refuses(
            structure({ lengthRatio: 1.5 }),
            "range",
            "structure.lengthRatio",
          ),
      ],
      [
        "radiusRatio",
        () =>
          refuses(
            structure({ radiusRatio: 0 }),
            "range",
            "structure.radiusRatio",
          ),
      ],
      [
        "directionJitter",
        () =>
          refuses(
            structure({ directionJitter: 2 }),
            "range",
            "structure.directionJitter",
          ),
      ],
      [
        "lengthJitter",
        () =>
          refuses(
            structure({ lengthJitter: -1 }),
            "range",
            "structure.lengthJitter",
          ),
      ],
      [
        "gravitropism",
        () =>
          refuses(
            structure({ gravitropism: -2 }),
            "range",
            "structure.gravitropism",
          ),
      ],
      [
        "noChildren",
        () =>
          refuses(structure({ children: [] }), "type", "structure.children"),
      ],
      [
        "tooManyChildren",
        () =>
          refuses(
            structure({
              children: Array.from(
                { length: 17 },
                (
                  _: unknown,
                  index: number,
                ): IAutoMoviePlantingDomain["structure"]["children"][number] => ({
                  id: `c${index}`,
                  direction: { x: 1, y: 1, z: 0 },
                  offset: 0.5,
                }),
              ),
            }),
            "range",
            "structure.children",
          ),
      ],
      [
        "duplicateChild",
        () =>
          refuses(
            structure({
              children: [
                { id: "a", direction: { x: 1, y: 1, z: 0 }, offset: 0.5 },
                { id: "a", direction: { x: -1, y: 1, z: 0 }, offset: 1 },
              ],
            }),
            "type",
            "structure.children[1].id",
          ),
      ],
      [
        "blankChild",
        () =>
          refuses(
            structure({
              children: [
                { id: "", direction: { x: 1, y: 1, z: 0 }, offset: 0.5 },
              ],
            }),
            "type",
            "structure.children[0].id",
          ),
      ],
      [
        "childDirection",
        () =>
          refuses(
            structure({
              children: [
                { id: "a", direction: { x: 0, y: 0, z: 0 }, offset: 0.5 },
              ],
            }),
            "type",
            "structure.children[0].direction",
          ),
      ],
      [
        "childOffset",
        () =>
          refuses(
            structure({
              children: [
                { id: "a", direction: { x: 1, y: 1, z: 0 }, offset: 2 },
              ],
            }),
            "range",
            "structure.children[0].offset",
          ),
      ],
    ]),
    {
      levels: true,
      deepLevels: true,
      axis: true,
      axisValue: true,
      length: true,
      radius: true,
      lengthRatio: true,
      radiusRatio: true,
      directionJitter: true,
      lengthJitter: true,
      gravitropism: true,
      noChildren: true,
      tooManyChildren: true,
      duplicateChild: true,
      blankChild: true,
      childDirection: true,
      childOffset: true,
    },
  );

  TestValidator.equals(
    "the growth state is named",
    namedFacts([
      [
        "stage",
        () =>
          refuses(
            { growth: { stage: 1.5, onset: 0.25 } },
            "range",
            "growth.stage",
          ),
      ],
      [
        "onset",
        () =>
          refuses(
            { growth: { stage: 1, onset: -0.5 } },
            "range",
            "growth.onset",
          ),
      ],
      [
        "unreachable",
        () =>
          refuses(
            { growth: { stage: 1, onset: 0.5 } },
            "range",
            "growth.onset",
          ),
      ],
      [
        "reachable",
        () =>
          validatePlantingDomain({
            domain: plantingRecipe({ growth: { stage: 1, onset: 0.49 } }),
          }).success === true,
      ],
    ]),
    { stage: true, onset: true, unreachable: true, reachable: true },
  );

  assertPlantingValidationLimits(refuses, refusesCluster);
}
