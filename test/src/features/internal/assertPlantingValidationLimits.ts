import { growPlanting, validatePlantingDomain } from "@automovie/engine";
import type {
  AutoMovieViolationKind,
  IAutoMovieConstraintViolation,
  IAutoMoviePlantingCluster,
  IAutoMoviePlantingDomain,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, throwsError } from "./predicates";
import { plantingRecipe } from "./softFixtures";

/** Run the original pruning, foliage, budget and cluster admission cases for test_planting_validation in order, using its unchanged refusal callbacks. This helper creates no independently registered test or host. */
export function assertPlantingValidationLimits(
  refuses: (
    overrides: Partial<IAutoMoviePlantingDomain>,
    kind: AutoMovieViolationKind,
    path: string,
  ) => boolean,
  refusesCluster: (
    overrides: Partial<IAutoMoviePlantingCluster>,
    kind: AutoMovieViolationKind,
    path: string,
  ) => boolean,
): void {
  TestValidator.equals(
    "the pruning envelope and the foliage rule are named",
    namedFacts([
      [
        "box",
        () =>
          refuses(
            {
              pruning: {
                kind: "box",
                min: { x: 0, y: 0, z: 0 },
                max: { x: 0, y: 1, z: 1 },
              },
            },
            "range",
            "pruning.max.x",
          ),
      ],
      [
        "boxValue",
        () =>
          refuses(
            {
              pruning: {
                kind: "box",
                min: { x: Number.NaN, y: 0, z: 0 },
                max: { x: 1, y: 1, z: 1 },
              },
            },
            "range",
            "pruning.min.x",
          ),
      ],
      [
        "sphere",
        () =>
          refuses(
            {
              pruning: {
                kind: "sphere",
                center: { x: 0, y: 0, z: 0 },
                radius: 0,
              },
            },
            "range",
            "pruning.radius",
          ),
      ],
      [
        "density",
        () =>
          refuses(
            {
              foliage: {
                density: 0,
                minLevel: 0,
                size: { x: 1, y: 1, z: 1 },
                scaleJitter: 0,
                rollJitter: 0,
              },
            },
            "range",
            "foliage.density",
          ),
      ],
      [
        "minLevel",
        () =>
          refuses(
            {
              foliage: {
                density: 1,
                minLevel: -1,
                size: { x: 1, y: 1, z: 1 },
                scaleJitter: 0,
                rollJitter: 0,
              },
            },
            "type",
            "foliage.minLevel",
          ),
      ],
      [
        "size",
        () =>
          refuses(
            {
              foliage: {
                density: 1,
                minLevel: 0,
                size: { x: 1, y: 0, z: 1 },
                scaleJitter: 0,
                rollJitter: 0,
              },
            },
            "range",
            "foliage.size.y",
          ),
      ],
      [
        "scaleJitter",
        () =>
          refuses(
            {
              foliage: {
                density: 1,
                minLevel: 0,
                size: { x: 1, y: 1, z: 1 },
                scaleJitter: 2,
                rollJitter: 0,
              },
            },
            "range",
            "foliage.scaleJitter",
          ),
      ],
      [
        "rollJitter",
        () =>
          refuses(
            {
              foliage: {
                density: 1,
                minLevel: 0,
                size: { x: 1, y: 1, z: 1 },
                scaleJitter: 0,
                rollJitter: -1,
              },
            },
            "range",
            "foliage.rollJitter",
          ),
      ],
    ]),
    {
      box: true,
      boxValue: true,
      sphere: true,
      density: true,
      minLevel: true,
      size: true,
      scaleJitter: true,
      rollJitter: true,
    },
  );

  TestValidator.equals(
    "the declared budget is named",
    namedFacts([
      [
        "branchCap",
        () =>
          refuses(
            { budget: { maxBranches: 0, maxLeaves: 8 } },
            "type",
            "budget.maxBranches",
          ),
      ],
      [
        "leafCap",
        () =>
          refuses(
            { budget: { maxBranches: 8, maxLeaves: -1 } },
            "type",
            "budget.maxLeaves",
          ),
      ],
      [
        "outgrown",
        () =>
          refuses(
            { budget: { maxBranches: 3, maxLeaves: 8 } },
            "range",
            "budget.maxBranches",
          ),
      ],
      [
        "outleafed",
        () =>
          refuses(
            {
              foliage: {
                density: 4,
                minLevel: 1,
                size: { x: 0.05, y: 0.1, z: 0.05 },
                scaleJitter: 0,
                rollJitter: 0,
              },
              budget: { maxBranches: 64, maxLeaves: 2 },
            },
            "range",
            "budget.maxLeaves",
          ),
      ],
      [
        "outleafedIsWhatTheDerivationWouldThrow",
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
            "exceeded its declared cap of 2 leaves",
          ),
      ],
      [
        "leafedInsideItsCapIsAccepted",
        () =>
          validatePlantingDomain({
            domain: plantingRecipe({
              foliage: {
                density: 4,
                minLevel: 1,
                size: { x: 0.05, y: 0.1, z: 0.05 },
                scaleJitter: 0,
                rollJitter: 0,
              },
              budget: { maxBranches: 64, maxLeaves: 8 },
            }),
          }).success === true,
      ],
      [
        "notWalkedWhenDepthIsAbsurd",
        () =>
          validatePlantingDomain({
            domain: plantingRecipe({
              structure: {
                ...plantingRecipe().structure,
                levels: Number.MAX_SAFE_INTEGER,
              },
              budget: { maxBranches: 1, maxLeaves: 0 },
            }),
          }).success === false,
      ],
      [
        "fractionalBranchCapIsNotAlsoOutgrown",
        () => {
          const validation: IAutoMovieValidation = validatePlantingDomain({
            domain: plantingRecipe({
              budget: { maxBranches: 3.5, maxLeaves: 8 },
            }),
          });
          return (
            validation.success === false &&
            validation.violations.every(
              (item: IAutoMovieConstraintViolation): boolean =>
                item.kind !== "range",
            )
          );
        },
      ],
    ]),
    {
      branchCap: true,
      leafCap: true,
      outgrown: true,
      outleafed: true,
      outleafedIsWhatTheDerivationWouldThrow: true,
      leafedInsideItsCapIsAccepted: true,
      notWalkedWhenDepthIsAbsurd: true,
      fractionalBranchCapIsNotAlsoOutgrown: true,
    },
  );

  TestValidator.equals(
    "the cluster is named",
    namedFacts([
      ["blankId", () => refusesCluster({ id: " " }, "type", "$input.id")],
      ["domain", () => refusesCluster({ domain: "" }, "type", "$input.domain")],
      ["count", () => refusesCluster({ count: 0 }, "type", "$input.count")],
      [
        "tooMany",
        () => refusesCluster({ count: 10_001 }, "type", "$input.count"),
      ],
      [
        "anchor",
        () =>
          refusesCluster(
            { anchor: { x: Number.NaN, y: 0, z: 0 } },
            "range",
            "$input.anchor.x",
          ),
      ],
      [
        "extent",
        () =>
          refusesCluster(
            { extent: { x: -1, z: 2 } },
            "range",
            "$input.extent.x",
          ),
      ],
      [
        "extentZ",
        () =>
          refusesCluster(
            { extent: { x: 1, z: -2 } },
            "range",
            "$input.extent.z",
          ),
      ],
      ["seed", () => refusesCluster({ seed: 0.5 }, "type", "$input.seed")],
      [
        "spacing",
        () => refusesCluster({ minSpacing: -1 }, "range", "$input.minSpacing"),
      ],
      [
        "attempts",
        () => refusesCluster({ attempts: 0 }, "type", "$input.attempts"),
      ],
      [
        "attemptBudget",
        () => refusesCluster({ attempts: 65 }, "type", "$input.attempts"),
      ],
      [
        "minScale",
        () =>
          refusesCluster(
            {
              scale: {
                min: { x: 0, y: 1, z: 1 },
                max: { x: 1, y: 1, z: 1 },
              },
            },
            "range",
            "$input.scale.min.x",
          ),
      ],
      [
        "maxScale",
        () =>
          refusesCluster(
            {
              scale: {
                min: { x: 1, y: 1, z: 1 },
                max: { x: 0.5, y: 1, z: 1 },
              },
            },
            "range",
            "$input.scale.max.x",
          ),
      ],
      [
        "yawJitter",
        () => refusesCluster({ yawJitter: 2 }, "range", "$input.yawJitter"),
      ],
    ]),
    {
      blankId: true,
      domain: true,
      count: true,
      tooMany: true,
      anchor: true,
      extent: true,
      extentZ: true,
      seed: true,
      spacing: true,
      attempts: true,
      attemptBudget: true,
      minScale: true,
      maxScale: true,
      yawJitter: true,
    },
  );
}
