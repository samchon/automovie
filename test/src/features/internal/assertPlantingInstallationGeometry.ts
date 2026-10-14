import { lowerPlantingInstallation } from "@automovie/engine";
import type { IAutoMovieFluidDomain, IAutoMoviePlantingCluster, IAutoMoviePlantingDomain, IAutoMoviePlantingInstallation, IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { hasViolation, namedFacts } from "./predicates";
import { plantingCluster, plantingInstallation, plantingRecipe } from "./softFixtures";

/** Run the original aquatic, canopy, lowering and unique-placement cases for test_planting_installation_binding, in their original order. The supplied callbacks preserve the original room/pond constructors; this helper owns no separately registered test or host. */
export function assertPlantingInstallationGeometry(
  check: (props: {
    installations?: IAutoMoviePlantingInstallation[];
    clusters?: IAutoMoviePlantingCluster[];
    domains?: IAutoMoviePlantingDomain[];
    fluidDomains?: IAutoMovieFluidDomain[];
    semantic?: boolean;
    ceiling?: number;
  }) => IAutoMovieValidation,
  pond: (overrides?: Partial<IAutoMovieFluidDomain>) => IAutoMovieFluidDomain,
): void {
  const aquatic: (anchor: { x: number; y: number; z: number }) => Parameters<typeof check>[0] = (anchor: { x: number; y: number; z: number }): Parameters<typeof check>[0] => ({
    installations: [
      plantingInstallation({
        kind: "aquatic" as const,
        irrigation: {
          port: "stand-pipe",
          demandLitresPerDay: 4,
          medium: "pond" as const,
          fluidDomain: "atrium-pond",
        },
      }),
    ],
    clusters: [
      plantingCluster({ count: 3, anchor, extent: { x: 0.5, z: 0.5 } }),
    ],
    fluidDomains: [pond()],
  });
  TestValidator.equals(
    "aquatic planting is checked against the water it stands in",
    namedFacts([
      [
        "submerged",
        () => check(aquatic({ x: 0, y: 0, z: 0 })).success === true,
      ],
      [
        "aboveSurface",
        () =>
          hasViolation(
            check(aquatic({ x: 0, y: 1, z: 0 })),
            "range",
            "installations[0].irrigation.fluidDomain",
          ),
      ],
      [
        "outsideColumn",
        () =>
          hasViolation(
            check(aquatic({ x: 5, y: 0, z: 0 })),
            "type",
            "installations[0].irrigation.fluidDomain",
          ),
      ],
      [
        "outsideRow",
        () =>
          hasViolation(
            check(aquatic({ x: 0, y: 0, z: 5 })),
            "type",
            "installations[0].irrigation.fluidDomain",
          ),
      ],
      [
        "unstatedSurface",
        () =>
          hasViolation(
            check({
              ...aquatic({ x: 0, y: 0, z: 0 }),
              fluidDomains: [pond({ depth: [] })],
            }),
            "type",
            "installations[0].irrigation.fluidDomain",
          ),
      ],
    ]),
    {
      submerged: true,
      aboveSurface: true,
      outsideColumn: true,
      outsideRow: true,
      unstatedSurface: true,
    },
  );

  // One member, no jitter and unit scale, so the canopy in the room is exactly
  // the recipe's own derived bounds; only the one/four-metre ceiling witnesses
  // below are asserted, not an exact canopy height.
  const upright: Parameters<typeof check>[0] = {
    clusters: [
      plantingCluster({
        count: 1,
        extent: { x: 0, z: 0 },
        yawJitter: 0,
        scale: { min: { x: 1, y: 1, z: 1 }, max: { x: 1, y: 1, z: 1 } },
      }),
    ],
  };
  TestValidator.equals(
    "the canopy is checked, not only the point the plant is rooted at",
    namedFacts([
      ["rooted", () => check({ ...upright, ceiling: 4 }).success === true],
      [
        "crownThroughCeiling",
        () =>
          hasViolation(
            check({ ...upright, ceiling: 1 }),
            "type",
            "installations[0].cluster",
          ),
      ],
      [
        "dormantHasNoCanopy",
        () =>
          check({
            ...upright,
            ceiling: 1,
            domains: [plantingRecipe({ growth: { stage: 0, onset: 0.25 } })],
          }).success === true,
      ],
    ]),
    {
      rooted: true,
      crownThroughCeiling: true,
      dormantHasNoCanopy: true,
    },
  );

  TestValidator.equals(
    "containment is checked only where the space has a volume",
    namedFacts([
      [
        "outside",
        () =>
          hasViolation(
            check({
              clusters: [
                plantingCluster({ anchor: { x: 40, y: 0, z: 0 }, count: 2 }),
              ],
            }),
            "type",
            "installations[0].cluster",
          ),
      ],
      [
        "semantic",
        () =>
          check({
            clusters: [
              plantingCluster({ anchor: { x: 40, y: 0, z: 0 }, count: 2 }),
            ],
            semantic: true,
          }).success === true,
      ],
    ]),
    { outside: true, semantic: true },
  );

  const brokenRecipe: IAutoMoviePlantingDomain = plantingRecipe({
    structure: { ...plantingRecipe().structure, length: 0 },
  });
  // A recipe whose density bears more blades than its own cap allows is the one
  // shape that used to reach `growPlanting` from inside this pass and throw:
  // the binding derives the canopy of every recipe that validated, so a cap the
  // recipe validator did not check was a crash waiting on an authored number.
  const overleafed: IAutoMoviePlantingDomain = plantingRecipe({
    foliage: {
      density: 4,
      minLevel: 1,
      size: { x: 0.05, y: 0.1, z: 0.05 },
      scaleJitter: 0,
      rollJitter: 0,
    },
    budget: { maxBranches: 64, maxLeaves: 2 },
  });
  const brokenCluster: IAutoMoviePlantingCluster = plantingCluster({ count: 0 });
  const derived: ReturnType<typeof lowerPlantingInstallation> = lowerPlantingInstallation({
    installation: plantingInstallation(),
    cluster: plantingCluster(),
    domain: plantingRecipe(),
  });
  TestValidator.equals(
    "a nested refusal is re-pathed, and the lowering reports what it derived",
    namedFacts([
      [
        "recipeRepathed",
        () =>
          hasViolation(
            check({ domains: [brokenRecipe] }),
            "range",
            "domains[0].structure.length",
          ),
      ],
      [
        "clusterRepathed",
        () =>
          hasViolation(
            check({ clusters: [brokenCluster] }),
            "type",
            "clusters[0].count",
          ),
      ],
      [
        "overleafedIsReportedNotThrown",
        () =>
          hasViolation(
            check({ domains: [overleafed] }),
            "range",
            "domains[0].budget.maxLeaves",
          ),
      ],
      [
        "overleafedLowersToNotRun",
        () =>
          lowerPlantingInstallation({
            installation: plantingInstallation(),
            cluster: plantingCluster(),
            domain: overleafed,
          }).analysis.status === "not-run",
      ],
      [
        "notRunRecipe",
        () => {
          const frame: ReturnType<typeof lowerPlantingInstallation> = lowerPlantingInstallation({
            installation: plantingInstallation(),
            cluster: plantingCluster(),
            domain: brokenRecipe,
          });
          return (
            frame.analysis.status === "not-run" &&
            frame.plant === null &&
            frame.arrangement === null &&
            frame.analysis.reason !== null
          );
        },
      ],
      [
        "notRunCluster",
        () => {
          const frame: ReturnType<typeof lowerPlantingInstallation> = lowerPlantingInstallation({
            installation: plantingInstallation(),
            cluster: brokenCluster,
            domain: plantingRecipe(),
          });
          return frame.analysis.status === "not-run" && frame.plant === null;
        },
      ],
      [
        "notRunMismatch",
        () => {
          const frame: ReturnType<typeof lowerPlantingInstallation> = lowerPlantingInstallation({
            installation: plantingInstallation(),
            cluster: plantingCluster({ domain: "ivy" }),
            domain: plantingRecipe(),
          });
          return (
            frame.analysis.status === "not-run" &&
            frame.plant === null &&
            frame.arrangement === null &&
            (frame.analysis.reason ?? "").includes('grows recipe "ivy"')
          );
        },
      ],
      [
        "notRunUnplaced",
        () => {
          const frame: ReturnType<typeof lowerPlantingInstallation> = lowerPlantingInstallation({
            installation: plantingInstallation({ cluster: "roof-bed" }),
            cluster: plantingCluster(),
            domain: plantingRecipe(),
          });
          return (
            frame.analysis.status === "not-run" &&
            frame.plant === null &&
            frame.arrangement === null &&
            (frame.analysis.reason ?? "").includes('places cluster "roof-bed"')
          );
        },
      ],
      [
        "derived",
        () =>
          derived.analysis.status === "derived" &&
          derived.analysis.kind === "planting" &&
          derived.analysis.reason === null &&
          derived.plant?.branches.length === 7 &&
          derived.arrangement?.placements.length === 6,
      ],
      ["installation", () => derived.installation === "lobby-planting"],
    ]),
    {
      recipeRepathed: true,
      clusterRepathed: true,
      overleafedIsReportedNotThrown: true,
      overleafedLowersToNotRun: true,
      notRunRecipe: true,
      notRunCluster: true,
      notRunMismatch: true,
      notRunUnplaced: true,
      derived: true,
      installation: true,
    },
  );

  TestValidator.equals(
    "one cluster is placed by one installation",
    namedFacts([
      [
        "second",
        () =>
          hasViolation(
            check({
              installations: [
                plantingInstallation(),
                plantingInstallation({ id: "roof-planting" }),
              ],
            }),
            "type",
            "installations[1].cluster",
          ),
      ],
      [
        "distinctClustersPass",
        () =>
          check({
            installations: [
              plantingInstallation(),
              plantingInstallation({
                id: "roof-planting",
                cluster: "roof-bed",
              }),
            ],
            clusters: [plantingCluster(), plantingCluster({ id: "roof-bed" })],
          }).success === true,
      ],
    ]),
    { second: true, distinctClustersPass: true },
  );
}
