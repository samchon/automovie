import {
  createHighJump,
  createLandingMat,
  createVaultingPole,
  createVaultingTable,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";
import { archetypePlaced } from "../internal/archetypePlaced";

/**
 * The jump apparatus is placed in a scene where it was put, and its act-read sizes stay inside their sources for every seed, measured on the produced thing.
 *
 * Scenarios:
 * 1. The vaulting pole standing on its tip, the high jump, both landing mats and both vaulting tables, placed on a line through the public chain, each turned a different way: each rests at its placement on the floor, its lowest point on the floor within a millimetre, and every contact it declares is a named point of the prop at its own place.
 * 2. Over 200 seeds: the pole 3.05 to 5.18 m from its tip to its top (the commercial range, the rules leaving the length free); the high jump's crossbar 3.98 to 4.02 m long and its top 1 to 2.45 m high; the high jump mat's top 0.7 to 0.75 m and the pole vault mat's 0.8 to 0.85 m high (the rules' least heights); the men's vaulting table's top 1.34 to 1.36 m and the women's 1.24 to 1.26 m high (the norms' heights to a centimetre).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places every jump archetype through the public chain and reads the displayed prop frames, and measures colliders and contacts on the produced things; an archetype that floats, sinks, drops a contact or leaves its source's band fails with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The bands are written here from their sources: World Athletics' columns of the 2025 rules comparison sheets, the FIG norms as Wikipedia gives them, the makers' pole lengths.
 * @evidence contracts/development/testing.md#distinguishing-cases Every producer and kind for placement; one act-read size per thing for the bands.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man for the placing performance and in-memory models; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the two scenarios and what each pins.
 */
export function test_archetype_jump_placed(): void {
  const findings: string[] = archetypePlaced([
    { name: "vaultingPole", archetype: createVaultingPole() },
    { name: "highJump", archetype: createHighJump(), yaw: 90 },
    ...createLandingMat.KINDS.map((kind: createLandingMat.Kind): archetypePlaced.IRow => ({
      name: `landingMat-${kind}`,
      archetype: createLandingMat({ kind }),
      yaw: 45,
    })),
    ...createVaultingTable.KINDS.map((kind: createVaultingTable.Kind): archetypePlaced.IRow => ({
      name: `vaultingTable-${kind}`,
      archetype: createVaultingTable({ kind }),
      yaw: 180,
    })),
  ]);
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({
    name,
    minimum,
    maximum,
    source,
    measure,
    tolerance: 1e-9,
  });
  findings.push(
    ...archetypeBandSweep([
      row(
        "vaulting pole length",
        3.05,
        5.18,
        "makers' 10 to 17 ft poles",
        (seed: number): number =>
          archetypeExtent(createVaultingPole({}, seed), "y").size,
      ),
      row(
        "crossbar length",
        3.98,
        4.02,
        "World Athletics, crossbar 3.98 to 4.02 m",
        (seed: number): number =>
          archetypeExtent(createHighJump({}, seed), "x", ["crossbar"]).size,
      ),
      row(
        "crossbar height",
        1,
        2.45,
        "a beginner's 1 m to the 2.45 m record",
        (seed: number): number =>
          archetypeExtent(createHighJump({}, seed), "y", ["crossbar"]).high,
      ),
      row(
        "high jump mat height",
        0.7,
        0.75,
        "World Athletics, landing surface 0.7 m high at least",
        (seed: number): number =>
          archetypeExtent(createLandingMat({ kind: "highJump" }, seed), "y")
            .high,
      ),
      row(
        "pole vault mat height",
        0.8,
        0.85,
        "World Athletics, landing area 0.8 m high at least",
        (seed: number): number =>
          archetypeExtent(createLandingMat({ kind: "poleVault" }, seed), "y")
            .high,
      ),
      row(
        "men's vaulting table height",
        1.34,
        1.36,
        "FIG norms, 135 cm to 1 cm",
        (seed: number): number =>
          archetypeExtent(createVaultingTable({ kind: "men" }, seed), "y")
            .high,
      ),
      row(
        "women's vaulting table height",
        1.24,
        1.26,
        "FIG norms, 125 cm to 1 cm",
        (seed: number): number =>
          archetypeExtent(createVaultingTable({ kind: "women" }, seed), "y")
            .high,
      ),
    ]),
  );
  TestValidator.equals("the jump apparatus is placed and sized", findings, []);
}
