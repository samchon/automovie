import { createKerb, createTap } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";
import { archetypePlaced } from "../internal/archetypePlaced";

/**
 * The kerb, the step and the tap are placed in a scene where they were put, and their act-read sizes stay inside their sources for every seed, measured on the produced thing.
 *
 * Scenarios:
 * 1. The kerb and the step on the floor and the tap on a 0.9 m counter's height, placed on a line through the public chain, each turned a different way: each rests at its placement, its lowest point on its support within a millimetre, and every contact it declares is a named point of the prop at its own place.
 * 2. Over 200 seeds: the kerb's upstand 0.10 to 0.15 m (Wheels for Wellbeing's kerb profiles), the step's riser 0.196 m and its tread 0.254 m (the IRC's limits); the tap's spout reaching 0.106 to 0.109 m out from its body's axis (GROHE's).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places every archetype of the family through the public chain and reads the displayed prop frames, and measures colliders and contacts on the produced things; one that floats, sinks, drops a contact or leaves its source's band fails with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The bands are written here from the sources each producer cites.
 * @evidence contracts/development/testing.md#distinguishing-cases Every kind for placement, one on a raised support; one act-read size per producer for the bands.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man for the placing performance and in-memory models; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the two scenarios and what each pins.
 */
export function test_archetype_kerb_placed(): void {
  const findings: string[] = archetypePlaced([
    { name: "kerb-kerb", archetype: createKerb({ kind: "kerb" }), yaw: 0 },
    { name: "kerb-step", archetype: createKerb({ kind: "step" }), yaw: 90 },
    { name: "tap", archetype: createTap(), yaw: 180, on: 0.9 },
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
        "kerb upstand",
        0.1,
        0.15,
        "road kerbs of 100 to 150 mm",
        (seed: number): number =>
          archetypeExtent(createKerb({ kind: "kerb" }, seed), "y").high,
      ),
      row(
        "step riser",
        0.196,
        0.196,
        "IRC R311.7.5.1, 7 3/4 in at most",
        (seed: number): number =>
          archetypeExtent(createKerb({ kind: "step" }, seed), "y").high,
      ),
      row(
        "step tread",
        0.254,
        0.254,
        "IRC R311.7.5.2, 10 in at least",
        (seed: number): number =>
          archetypeExtent(createKerb({ kind: "step" }, seed), "z").size,
      ),
      row(
        "tap reach",
        0.106,
        0.109,
        "GROHE Eurosmart S-size, 106 to 109 mm",
        (seed: number): number =>
          archetypeExtent(createTap({}, seed), "z", ["spout"]).high,
      ),
    ]),
  );
  TestValidator.equals(
    "the kerb, the step and the tap are placed and sized",
    findings,
    [],
  );
}
