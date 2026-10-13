import { arrangePlantingCluster } from "../../../../packages/engine/src/soft/arrangePlantingCluster";
import { growPlanting } from "../../../../packages/engine/src/soft/growPlanting";
import { plantingBudget } from "../../../../packages/engine/src/soft/plantingBudget";
import { TestValidator } from "@nestia/e2e";
import { hasPlantingSpacingOracle } from "../internal/hasPlantingSpacingOracle";
import { namedFacts, qunit } from "../internal/predicates";
import { plantingCluster, plantingRecipe } from "../internal/softFixtures";
import { IAutoMoviePlantingCluster, IAutoMoviePlantingArrangement, IAutoMoviePlantingPlacement, IAutoMoviePlantingDomain } from "@automovie/interface";
/** Smallest horizontal distance between any two accepted members. */
const closestPair: (placements: readonly { translation: { x: number; z: number; }; }[]) => number = (
  placements: ReadonlyArray<{ translation: { x: number; z: number } }>,
): number => {
  let closest: number = Infinity;
  for (let a: number = 0; a < placements.length; ++a)
    for (let b: number = a + 1; b < placements.length; ++b) {
      const dx: number = placements[a].translation.x - placements[b].translation.x;
      const dz: number = placements[a].translation.z - placements[b].translation.z;
      closest = Math.min(closest, Math.sqrt(dx * dx + dz * dz));
    }
  return closest;
};

/** Verify seeded cluster placement, counted spacing refusal, full transforms and declared tree/leaf budgets, preserving the 4,000-member witness.
 *
 * Scenarios:
 *
 * 1. An ordinary cluster places every member it asked for, inside the declared
 *    rectangle, with nothing rejected.
 * 2. The spacing rule is honoured: no two accepted members are closer than
 *    `minSpacing`, and the same rule made impossible by a wide spacing rejects
 *    the slots it cannot honour and reports exactly how many. A cluster that
 *    declares no spacing at all refuses nothing, even when every member is
 *    drawn onto the same point.
 * 3. Every member's transform is lossless: a unit quaternion, a pure turn about
 *    `+y`, and three independently drawn scale axes inside the declared range.
 * 4. Two calls reproduce each ordinary member's X position, rotation W and
 *    scale Y exactly; a different seed changes X, and slot ids and indices are stable.
 * 5. Boundaries: a single member with zero extent lands exactly on the anchor; a
 *    cluster with zero yaw jitter hands out the exact identity rotation; and a
 *    cluster whose extent is zero but whose spacing is positive rejects every
 *    slot after the first.
 * 6. A four-thousand-member meadow places, accounts for and spaces every slot, and
 *    reproduces every X position and the rejection count exactly. Production
 *    admission uses a uniform grid of side minSpacing; this test verifies its
 *    spacing independently through an X-sorted pair sweep.
 * 7. The cost of the whole bed is derived from the recipe and the cluster alone,
 *    with no branch grown: the complete `k`-ary tree times the member count, so
 *    a production can be refused before anything is derived. Foliage is counted
 *    the same way and not read off the declared cap — a bare winter branch
 *    costs no leaves at all, and a leafed recipe costs exactly the eight blades
 *    the derivation goes on to emit.

 *
 * @evidence contracts/testing.md#behavioral-verification Real arrangement and growth/budget outputs catch lost spacing, slots, seed influence, per-axis scale, yaw normalization or count accounting. The independent large-population spacing oracle remains intact.
 * @evidence contracts/testing.md#independent-expectations Authored rectangle/spacing/scale bounds, quaternion unit law, exhaustive small-population distances and the independent x-sorted large-population sweep supply expectations. Complete binary depth-three counts give 7 branches, 42 requested instances and 8 density-derived leaves; repeated output checks are metamorphic replay witnesses.
 * @evidence contracts/testing.md#distinguishing-cases Preserve ordinary/tight/no-spacing populations, seed changes, singleton/zero extents, identity yaw/fixed scale, impossible positive spacing, all 4,000 meadow slots and bare/leafed/jitter budget cases without reducing population or weakening checks.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit discovered as test_planting_cluster_arrangement; the exported test owns authored cases and delegates only its independent large-spacing predicate, without starting a GPU instancing host.
 */
export function test_planting_cluster_arrangement(): void {
  const cluster: IAutoMoviePlantingCluster = plantingCluster();
  const arrangement: IAutoMoviePlantingArrangement = arrangePlantingCluster(cluster);
  TestValidator.equals(
    "an ordinary cluster places every member inside its rectangle",
    namedFacts([
      ["count", (): boolean => arrangement.placements.length === 6],
      ["rejected", (): boolean => arrangement.rejected === 0],
      ["cluster", (): boolean => arrangement.cluster === "atrium-bed"],
      ["domain", (): boolean => arrangement.domain === "fern"],
      [
        "inside",
        (): boolean =>
          arrangement.placements.every(
            (placement: IAutoMoviePlantingPlacement): boolean =>
              Math.abs(placement.translation.x) <= 2 &&
              Math.abs(placement.translation.z) <= 2 &&
              placement.translation.y === 0,
          ),
      ],
      ["bounds", (): boolean => arrangement.bounds !== null],
    ]),
    {
      count: true,
      rejected: true,
      cluster: true,
      domain: true,
      inside: true,
      bounds: true,
    },
  );

  const tight: IAutoMoviePlantingArrangement = arrangePlantingCluster(
    plantingCluster({ count: 8, minSpacing: 3 }),
  );
  TestValidator.equals(
    "the spacing rule is honoured, and what it refuses is counted",
    namedFacts([
      ["spacing", (): boolean => closestPair(arrangement.placements) >= 0.5],
      ["tightSpacing", (): boolean => closestPair(tight.placements) >= 3],
      ["refused", (): boolean => tight.rejected === 8 - tight.placements.length],
      ["someRefused", (): boolean => tight.rejected > 0],
      [
        "noRuleRefusesNothing",
        (): boolean => {
          const packed: IAutoMoviePlantingArrangement = arrangePlantingCluster(
            plantingCluster({
              count: 12,
              minSpacing: 0,
              extent: { x: 0, z: 0 },
            }),
          );
          return (
            packed.placements.length === 12 &&
            packed.rejected === 0 &&
            closestPair(packed.placements) === 0
          );
        },
      ],
    ]),
    {
      spacing: true,
      tightSpacing: true,
      refused: true,
      someRefused: true,
      noRuleRefusesNothing: true,
    },
  );

  TestValidator.equals(
    "every member's transform is lossless",
    namedFacts([
      [
        "unit",
        (): boolean =>
          arrangement.placements.every((placement: IAutoMoviePlantingPlacement): boolean =>
            qunit(placement.rotation),
          ),
      ],
      [
        "yawOnly",
        (): boolean =>
          arrangement.placements.every(
            (placement: IAutoMoviePlantingPlacement): boolean =>
              placement.rotation.x === 0 && placement.rotation.z === 0,
          ),
      ],
      [
        "scaleRange",
        (): boolean =>
          arrangement.placements.every(
            (placement: IAutoMoviePlantingPlacement): boolean =>
              placement.scale.x >= 0.75 &&
              placement.scale.x <= 1.25 &&
              placement.scale.y >= 0.5 &&
              placement.scale.y <= 1.5 &&
              placement.scale.z >= 0.75 &&
              placement.scale.z <= 1.25,
          ),
      ],
      [
        "perAxis",
        (): boolean =>
          arrangement.placements.some(
            (placement: IAutoMoviePlantingPlacement): boolean =>
              placement.scale.x !== placement.scale.y &&
              placement.scale.y !== placement.scale.z,
          ),
      ],
      [
        "turned",
        (): boolean => new Set(arrangement.placements.map((p: IAutoMoviePlantingPlacement): number => p.rotation.y)).size > 1,
      ],
    ]),
    {
      unit: true,
      yawOnly: true,
      scaleRange: true,
      perAxis: true,
      turned: true,
    },
  );

  TestValidator.equals(
    "the arrangement is a pure function of the cluster",
    namedFacts([
      [
        "identical",
        (): boolean =>
          arrangePlantingCluster(plantingCluster()).placements.every(
            (placement: IAutoMoviePlantingPlacement, index: number): boolean =>
              Object.is(
                placement.translation.x,
                arrangement.placements[index].translation.x,
              ) &&
              Object.is(
                placement.rotation.w,
                arrangement.placements[index].rotation.w,
              ) &&
              Object.is(
                placement.scale.y,
                arrangement.placements[index].scale.y,
              ),
          ),
      ],
      [
        "reseeded",
        (): boolean =>
          arrangePlantingCluster(plantingCluster({ seed: 99 })).placements[0]
            .translation.x !== arrangement.placements[0].translation.x,
      ],
      [
        "identity",
        (): boolean =>
          arrangement.placements.every(
            (placement: IAutoMoviePlantingPlacement, index: number): boolean =>
              placement.slot === index &&
              placement.id === `atrium-bed#${index}`,
          ),
      ],
    ]),
    { identical: true, reseeded: true, identity: true },
  );

  const lone: IAutoMoviePlantingArrangement = arrangePlantingCluster(
    plantingCluster({
      count: 1,
      extent: { x: 0, z: 0 },
      anchor: { x: 3, y: 1, z: -2 },
      yawJitter: 0,
      scale: { min: { x: 1, y: 1, z: 1 }, max: { x: 1, y: 1, z: 1 } },
    }),
  );
  const crowded: IAutoMoviePlantingArrangement = arrangePlantingCluster(
    plantingCluster({ count: 4, extent: { x: 0, z: 0 }, minSpacing: 1 }),
  );
  TestValidator.equals(
    "the boundary cases behave",
    namedFacts([
      [
        "onAnchor",
        (): boolean =>
          lone.placements[0].translation.x === 3 &&
          lone.placements[0].translation.y === 1 &&
          lone.placements[0].translation.z === -2,
      ],
      [
        "identityRotation",
        (): boolean =>
          lone.placements[0].rotation.w === 1 &&
          lone.placements[0].rotation.y === 0,
      ],
      [
        "fixedScale",
        (): boolean =>
          lone.placements[0].scale.x === 1 && lone.placements[0].scale.z === 1,
      ],
      ["onlyOneFits", (): boolean => crowded.placements.length === 1],
      ["restRefused", (): boolean => crowded.rejected === 3],
      [
        "degenerateBounds",
        (): boolean =>
          crowded.bounds !== null &&
          crowded.bounds.min.x === crowded.bounds.max.x,
      ],
    ]),
    {
      onAnchor: true,
      identityRotation: true,
      fixedScale: true,
      onlyOneFits: true,
      restRefused: true,
      degenerateBounds: true,
    },
  );

  // Retain the full 4,000-member witness; an independent x-sorted sweep
  // replaces only its quadratic exhaustive spacing oracle. Small populations
  // above still use the original exhaustive closest-pair calculation.
  const crowd: IAutoMoviePlantingArrangement = arrangePlantingCluster(
    plantingCluster({
      id: "meadow",
      count: 4_000,
      extent: { x: 40, z: 40 },
      minSpacing: 1,
      attempts: 16,
    }),
  );
  TestValidator.equals(
    "the declared member budget is bounded work, not a quarter-trillion tests",
    namedFacts([
      ["placed", (): boolean => crowd.placements.length > 3_000],
      ["accounted", (): boolean => crowd.placements.length + crowd.rejected === 4_000],
      ["spacing", (): boolean => hasPlantingSpacingOracle(crowd.placements, 1)],
      [
        "reproducible",
        (): boolean => {
          const again: IAutoMoviePlantingArrangement = arrangePlantingCluster(
            plantingCluster({
              id: "meadow",
              count: 4_000,
              extent: { x: 40, z: 40 },
              minSpacing: 1,
              attempts: 16,
            }),
          );
          return (
            again.rejected === crowd.rejected &&
            again.placements.every((placement: IAutoMoviePlantingPlacement, index: number): boolean =>
              Object.is(
                placement.translation.x,
                crowd.placements[index].translation.x,
              ),
            )
          );
        },
      ],
    ]),
    { placed: true, accounted: true, spacing: true, reproducible: true },
  );

  TestValidator.equals(
    "a bare recipe's cost counts no leaf, however large its cap",
    plantingBudget({ domain: plantingRecipe(), cluster }),
    {
      domain: "fern",
      worstCaseBranches: 7,
      worstCaseLeaves: 0,
      maxBranches: 64,
      maxLeaves: 512,
      members: 6,
      worstCaseBranchInstances: 42,
      worstCaseLeafInstances: 0,
    },
  );

  const leafed: IAutoMoviePlantingDomain = plantingRecipe({
    foliage: {
      density: 4,
      minLevel: 1,
      size: { x: 0.05, y: 0.1, z: 0.05 },
      scaleJitter: 0,
      rollJitter: 0,
    },
  });
  TestValidator.equals(
    "a leafed recipe costs the blades its density rule actually bears",
    namedFacts([
      [
        "worstCase",
        (): boolean => plantingBudget({ domain: leafed }).worstCaseLeaves === 8,
      ],
      ["grown", (): boolean => growPlanting(leafed).leaves.length === 8],
      [
        "instances",
        (): boolean =>
          plantingBudget({ domain: leafed, cluster }).worstCaseLeafInstances ===
          48,
      ],
      [
        "jitterWidensTheBound",
        (): boolean =>
          plantingBudget({
            domain: plantingRecipe({
              structure: { ...leafed.structure, lengthJitter: 0.5 },
              foliage: leafed.foliage,
            }),
          }).worstCaseLeaves > 8,
      ],
    ]),
    {
      worstCase: true,
      grown: true,
      instances: true,
      jitterWidensTheBound: true,
    },
  );
}
