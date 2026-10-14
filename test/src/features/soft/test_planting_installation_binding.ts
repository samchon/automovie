import { validatePlantingInstallations } from "@automovie/engine";
import {
  IAutoMovieFluidDomain,
  IAutoMoviePlantingCluster,
  IAutoMoviePlantingDomain,
  IAutoMoviePlantingInstallation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { assertPlantingInstallationGeometry } from "../internal/assertPlantingInstallationGeometry";
import { hasViolation, namedFacts } from "../internal/predicates";
import {
  plantingCluster,
  plantingInstallation,
  plantingRecipe,
  roomEnvironment,
} from "../internal/softFixtures";

/** A pond with 1.5 metres of depth above a flat bed at world Y=-1. */
const pond: (overrides?: Partial<IAutoMovieFluidDomain>) => IAutoMovieFluidDomain = (
  overrides: Partial<IAutoMovieFluidDomain> = {},
): IAutoMovieFluidDomain => ({
  version: 1,
  id: "atrium-pond",
  units: "meter",
  grid: {
    columns: 4,
    rows: 4,
    cellX: 1,
    cellZ: 1,
    origin: { x: -2, y: -1, z: -2 },
  },
  solver: {
    fixedStepSeconds: 0.03125,
    gravity: 8,
    drag: 0,
    dryDepth: 0,
    referenceDepth: 2,
    maxSteps: 100,
  },
  boundaries: { xMin: "wall", xMax: "wall", zMin: "wall", zMax: "wall" },
  bed: new Array(16).fill(0),
  depth: new Array(16).fill(1.5),
  solid: new Array(16).fill(false),
  sources: [],
  drains: [],
  sprays: [],
  ...overrides,
});

const check: Parameters<typeof assertPlantingInstallationGeometry>[0] = (props: {
  installations?: IAutoMoviePlantingInstallation[];
  clusters?: IAutoMoviePlantingCluster[];
  domains?: IAutoMoviePlantingDomain[];
  fluidDomains?: IAutoMovieFluidDomain[];
  semantic?: boolean;
  ceiling?: number;
}): ReturnType<typeof validatePlantingInstallations> =>
  validatePlantingInstallations({
    environment: roomEnvironment({
      semantic: props.semantic,
      ceiling: props.ceiling,
    }),
    installations: props.installations ?? [plantingInstallation()],
    clusters: props.clusters ?? [plantingCluster()],
    domains: props.domains ?? [plantingRecipe()],
    fluidDomains: props.fluidDomains,
  });

/**
 * The binding between a building and a planting cluster resolves, its typed
 * rules hold, and what could not be derived is reported rather than drawn.
 *
 * This is the seam where three independent records meet — the building graph,
 * the branching recipe and the arrangement — and checks their agreement at
 * this join. The rules it enforces are the ones no single record
 * can: that a green wall is trained against something upright rather than
 * resting on a floor patch, that aquatic planting really stands in water and
 * that dry planting does not claim to, and that the members the arrangement
 * generated actually land inside the room they were bound to.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual installation validation and lowering for valid, missing-reference, malformed-rule, aquatic, canopy and mismatched-pairing records; named diagnostics and derived/not-run geometry expose incorrect joins or unsafe nested derivation.
 * @evidence contracts/testing.md#independent-expectations Authored ids and type/range paths define reference/rule expectations, the pond surface is -1+1.5=.5, and an upright plant is tested against one/four-metre ceilings. Success assertions permit warnings; aquatic overshoot and exact canopy height are not numerically asserted.
 * @evidence contracts/testing.md#distinguishing-cases Preserves all seven scenario groups including optional irrigation, each support kind, duplicate/blank ids, water-grid edges/missing depth, semantic rooms, dormant canopy, leaf-cap refusal and pair mismatches; corner-based containment does not prove every point in a nonconvex room union.
 * @evidence contracts/testing.md#execution-ownership The named discoverable portable unit owns early cases and calls assertPlantingInstallationGeometry for the original later cases in order; the helper registers no extra test, and no browser, GPU, fluid integration or physical load-bearing check runs.
 *
 * Scenarios:
 *
 * 1. A complete installation validates successfully, and so does one with no irrigation
 *    at all: a dry binding is a legitimate authoring state a services pass
 *    needs to see, not a silent failure.
 * 2. Every reference is checked: a wrong environment, an unknown space, an unknown
 *    support of each of the three kinds, an unknown irrigation port, an
 *    unsupplied cluster, an unsupplied recipe, and duplicated recipe, cluster
 *    and installation ids.
 * 3. The typed rules: an unknown kind, an unknown medium, a non-positive demand, a
 *    green wall carried by a floor patch, aquatic planting with no fluid
 *    domain, dry planting citing one, and a cited fluid domain nobody
 *    supplied.
 * 4. Aquatic geometry: a member rooted below the authored free surface is
 *    accepted, one rooted above it is refused at the range path, and
 *    one standing outside the lattice — past its last column, and separately
 *    past its last row — is named as such rather than read off the edge of an
 *    array. A pond whose depth array does not reach the cell is refused for the
 *    same reason: reading past the end and comparing against `NaN` would report
 *    every reed as properly planted, because a comparison with `NaN` is false.
 * 5. Containment reads the **canopy**, not only the point the plant is rooted at:
 *    a member standing well inside the room whose crown grows through the
 *    ceiling is refused, the same member under a taller ceiling is accepted,
 *    and a recipe that has not emerged has no canopy to check. Members landing
 *    outside the room are refused, while a purely semantic space with no convex
 *    cells is not geometrically checked at all.
 * 6. A recipe's or a cluster's own refusal is re-pathed onto the binding —
 *    including a foliage rule that outgrows its own leaf cap, which the binding
 *    used to discover by growing the canopy and throwing out of a validator —
 *    and lowering reports `not-run` with a null plant for either, with null
 *    arrangement and a reason also checked for the invalid recipe, for a
 *    cluster paired with a recipe it does not cite, and for an installation
 *    paired with a cluster it does not place, since the three records arrive
 *    separately and deriving one by another's identity would answer for nothing
 *    anybody authored. `derived` is reported otherwise: one structure grown and
 *    every member instancing it.
 * 7. Two installations citing one cluster report a type defect at the second
 *    binding; distinct cluster ids validate successfully. No duplicate draw or
 *    render-budget measurement is asserted here.
 */
export function test_planting_installation_binding(): void {
  TestValidator.equals(
    "a complete installation validates clean, with or without a supply",
    namedFacts([
      ["watered", () => check({}).success === true],
      [
        "dry",
        () =>
          check({
            installations: [plantingInstallation({ irrigation: null })],
          }).success === true,
      ],
    ]),
    { watered: true, dry: true },
  );

  TestValidator.equals(
    "every reference is checked",
    namedFacts([
      [
        "environment",
        () =>
          hasViolation(
            check({
              installations: [plantingInstallation({ environment: "other" })],
            }),
            "type",
            "installations[0].environment",
          ),
      ],
      [
        "space",
        () =>
          hasViolation(
            check({
              installations: [plantingInstallation({ space: "attic" })],
            }),
            "type",
            "installations[0].space",
          ),
      ],
      [
        "surface",
        () =>
          hasViolation(
            check({
              installations: [
                plantingInstallation({
                  support: { kind: "surface", surface: "terrace" },
                }),
              ],
            }),
            "type",
            "installations[0].support.surface",
          ),
      ],
      [
        "element",
        () =>
          hasViolation(
            check({
              installations: [
                plantingInstallation({
                  support: { kind: "element", element: "shelf" },
                }),
              ],
            }),
            "type",
            "installations[0].support.element",
          ),
      ],
      [
        "boundary",
        () =>
          hasViolation(
            check({
              installations: [
                plantingInstallation({
                  kind: "green-wall",
                  support: { kind: "boundary", boundary: "party-wall" },
                }),
              ],
            }),
            "type",
            "installations[0].support.boundary",
          ),
      ],
      [
        "port",
        () =>
          hasViolation(
            check({
              installations: [
                plantingInstallation({
                  irrigation: {
                    port: "hydrant",
                    demandLitresPerDay: 4,
                    medium: "potable",
                    fluidDomain: null,
                  },
                }),
              ],
            }),
            "type",
            "installations[0].irrigation.port",
          ),
      ],
      [
        "cluster",
        () =>
          hasViolation(
            check({
              installations: [plantingInstallation({ cluster: "absent" })],
            }),
            "type",
            "installations[0].cluster",
          ),
      ],
      [
        "recipe",
        () =>
          hasViolation(
            check({ clusters: [plantingCluster({ domain: "absent" })] }),
            "type",
            "clusters[0].domain",
          ),
      ],
      [
        "duplicateRecipe",
        () =>
          hasViolation(
            check({ domains: [plantingRecipe(), plantingRecipe()] }),
            "type",
            "domains[1].id",
          ),
      ],
      [
        "duplicateCluster",
        () =>
          hasViolation(
            check({ clusters: [plantingCluster(), plantingCluster()] }),
            "type",
            "clusters[1].id",
          ),
      ],
      [
        "duplicateInstallation",
        () =>
          hasViolation(
            check({
              installations: [plantingInstallation(), plantingInstallation()],
            }),
            "type",
            "installations[1].id",
          ),
      ],
      [
        "blankInstallation",
        () =>
          hasViolation(
            check({ installations: [plantingInstallation({ id: " " })] }),
            "type",
            "installations[0].id",
          ),
      ],
    ]),
    {
      environment: true,
      space: true,
      surface: true,
      element: true,
      boundary: true,
      port: true,
      cluster: true,
      recipe: true,
      duplicateRecipe: true,
      duplicateCluster: true,
      duplicateInstallation: true,
      blankInstallation: true,
    },
  );

  TestValidator.equals(
    "the typed rules hold",
    namedFacts([
      [
        "kind",
        () =>
          hasViolation(
            check({
              installations: [
                plantingInstallation({
                  kind: "hydroponic" as unknown as "potted",
                }),
              ],
            }),
            "type",
            "installations[0].kind",
          ),
      ],
      [
        "medium",
        () =>
          hasViolation(
            check({
              installations: [
                plantingInstallation({
                  irrigation: {
                    port: "stand-pipe",
                    demandLitresPerDay: 4,
                    medium: "brine" as unknown as "potable",
                    fluidDomain: null,
                  },
                }),
              ],
            }),
            "type",
            "installations[0].irrigation.medium",
          ),
      ],
      [
        "demand",
        () =>
          hasViolation(
            check({
              installations: [
                plantingInstallation({
                  irrigation: {
                    port: "stand-pipe",
                    demandLitresPerDay: 0,
                    medium: "potable",
                    fluidDomain: null,
                  },
                }),
              ],
            }),
            "range",
            "installations[0].irrigation.demandLitresPerDay",
          ),
      ],
      [
        "greenWallOnFloor",
        () =>
          hasViolation(
            check({
              installations: [plantingInstallation({ kind: "green-wall" })],
            }),
            "type",
            "installations[0].support",
          ),
      ],
      [
        "greenWallOnBoundary",
        () =>
          check({
            installations: [
              plantingInstallation({
                kind: "green-wall",
                support: { kind: "boundary", boundary: "window-wall" },
              }),
            ],
          }).success === true,
      ],
      [
        "aquaticWithoutWater",
        () =>
          hasViolation(
            check({
              installations: [plantingInstallation({ kind: "aquatic" })],
            }),
            "type",
            "installations[0].irrigation",
          ),
      ],
      [
        "dryWithWater",
        () =>
          hasViolation(
            check({
              installations: [
                plantingInstallation({
                  irrigation: {
                    port: "stand-pipe",
                    demandLitresPerDay: 4,
                    medium: "pond",
                    fluidDomain: "atrium-pond",
                  },
                }),
              ],
              fluidDomains: [pond()],
            }),
            "type",
            "installations[0].irrigation.fluidDomain",
          ),
      ],
      [
        "unsuppliedWater",
        () =>
          hasViolation(
            check({
              installations: [
                plantingInstallation({
                  kind: "aquatic",
                  irrigation: {
                    port: "stand-pipe",
                    demandLitresPerDay: 4,
                    medium: "pond",
                    fluidDomain: "atrium-pond",
                  },
                }),
              ],
            }),
            "type",
            "installations[0].irrigation.fluidDomain",
          ),
      ],
    ]),
    {
      kind: true,
      medium: true,
      demand: true,
      greenWallOnFloor: true,
      greenWallOnBoundary: true,
      aquaticWithoutWater: true,
      dryWithWater: true,
      unsuppliedWater: true,
    },
  );

  assertPlantingInstallationGeometry(check, pond);
}
