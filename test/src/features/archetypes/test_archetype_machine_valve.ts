import { createMachine, createValve } from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * A vending machine stands at Crane's sizes, a pay station at Flowbird's StradaPAL's, and a gate valve is NIBCO's 4 in at one end of its size and 6 in at the other.
 *
 * Scenarios:
 * 1. A vending machine is 1830 mm high, 813 mm deep and 895 to 1180 mm wide, its `front` on its `+Z` face.
 * 3. A pay station's body is the StradaPAL's 290 x 1488 x 328 mm under its 90 mm spacer and its 475 x 226 x 379 mm head, 1804 mm in all.
 * 2. A valve at size 0 has a 10 in handwheel 24 in above its pipe's axis, at size 1 a 12 in handwheel 31.06 in above it; its handwheel states no turns.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the produced colliders and contacts; a cabinet or a handwheel off the maker's figures is caught with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations Every figure is Crane's or NIBCO's restated here.
 * @evidence contracts/development/testing.md#distinguishing-cases A ranging width over seeds; both ends of the valve's size.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the three scenarios and what each pins.
 */
export function test_archetype_machine_valve(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };

  // 1. The vending machine.
  findings.push(
    ...archetypeBandSweep([
      {
        name: "vending machine width",
        measure: (seed: number): number =>
          archetypeExtent(createMachine({ kind: "vendingMachine" }, seed), "x")
            .size,
        minimum: 0.895,
        maximum: 1.18,
        source: "Crane Merchant 4 and 6",
      },
    ]),
  );
  const machine: ReturnType<typeof createMachine> = createMachine(
    { kind: "vendingMachine" },
    5,
  );
  near("the machine's height", archetypeExtent(machine, "y").size, 1.83);
  near("the machine's depth", archetypeExtent(machine, "z").size, 0.813);
  near(
    "the machine's front",
    machine.affordance("front").frame.translation.z,
    archetypeExtent(machine, "z").high,
  );

  // 3. The pay station.
  const station: ReturnType<typeof createMachine> = createMachine(
    { kind: "payStation" },
    5,
  );
  near("the pay station's body width", archetypeExtent(station, "x", ["cabinet"]).size, 0.29);
  near("the pay station's body depth", archetypeExtent(station, "z", ["cabinet"]).size, 0.328);
  near("the pay station's head width", archetypeExtent(station, "x", ["head"]).size, 0.475);
  near("the pay station's height", archetypeExtent(station, "y").high, 1.488 + 0.09 + 0.226);
  // 2. The valve.
  for (const [size, wheel, height] of [
    [0, 0.254, 0.61],
    [1, 0.305, 0.789],
  ] as const) {
    const valve: ReturnType<typeof createValve> = createValve({ size });
    const hand: IAutoMovieAffordance = valve.affordance("wheel");
    const pipe: { low: number; high: number } = archetypeExtent(valve, "y", [
      "pipe",
    ]);
    near(`valve ${size}: the handwheel`, 2 * hand.radius!, wheel);
    near(
      `valve ${size}: the handwheel over the pipe`,
      hand.frame.translation.y - (pipe.low + pipe.high) / 2,
      height,
    );
    if (pipe.low < -1e-9) findings.push(`valve ${size}: the pipe is below the floor`);
    if (hand.travel !== undefined)
      findings.push(`valve ${size}: the handwheel states turns no source gives`);
  }
  TestValidator.equals(
    "a vending machine and a gate valve stand at the makers' sizes",
    findings,
    [],
  );
}
