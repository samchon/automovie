import { createMachine, createValve } from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";
import { archetypeModelSweep } from "../internal/archetypeModelSweep";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * A vending machine stands at Crane's sizes, a pay station at Flowbird's StradaPAL's, and a gate valve is NIBCO's 4 in or 6 in, whole.
 *
 * Scenarios:
 * 1. A vending machine is 1830 mm high and 813 mm deep, over 200 seeds exactly the Merchant 4's 895 mm or the Merchant 6's 1180 mm wide, each drawn, its `front` on its `+Z` face.
 * 2. A pay station's body is the StradaPAL's 290 x 1488 x 328 mm under its 90 mm spacer and its 475 x 226 x 379 mm head, 1804 mm in all.
 * 3. An ATM's No. 5 key, card reader, cash slot and receipt slot stand at NCR's heights and depths from the shelf's front, across from the key by the remaining leg of the elevation distance after the height difference, to the clock position's side, the key on the centre line.
 * 4. The 4 in valve has a 10 in handwheel 24 in above its pipe's axis, the 6 in a 12 in handwheel 31.06 in above it; its handwheel states no turns; over 200 seeds every valve drawn is one of the two exactly, and both are drawn.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the produced colliders and contacts; a cabinet or a handwheel off the maker's figures is caught with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations Every figure is Crane's or NIBCO's restated here.
 * @evidence contracts/development/testing.md#distinguishing-cases Both Merchant widths over seeds; both valves given, then the seeds' draws.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the four scenarios and what each pins.
 */
export function test_archetype_machine_valve(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };

  // 1. The vending machine.
  findings.push(
    ...archetypeModelSweep([
      {
        name: "vending machine width",
        measure: (seed: number): readonly number[] => [
          archetypeExtent(createMachine({ kind: "vendingMachine" }, seed), "x")
            .size,
        ],
        models: [[0.895], [1.18]],
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

  // 2. The pay station.
  const station: ReturnType<typeof createMachine> = createMachine(
    { kind: "payStation" },
    5,
  );
  near(
    "the pay station's body width",
    archetypeExtent(station, "x", ["cabinet"]).size,
    0.29,
  );
  near(
    "the pay station's body depth",
    archetypeExtent(station, "z", ["cabinet"]).size,
    0.328,
  );
  near(
    "the pay station's head width",
    archetypeExtent(station, "x", ["head"]).size,
    0.475,
  );
  near(
    "the pay station's height",
    archetypeExtent(station, "y").high,
    1.488 + 0.09 + 0.226,
  );
  // 3. The ATM.
  const atm: ReturnType<typeof createMachine> = createMachine(
    { kind: "atm" },
    5,
  );
  const shelf: number = archetypeExtent(atm, "z", ["shelf"]).high;
  for (const [id, height, depth, across] of [
    ["key5", 0.786, 0.089, 0],
    ["cardReader", 1.039, 0.152, Math.sqrt(0.388 ** 2 - (1.039 - 0.786) ** 2)],
    ["cash", 0.822, 0.152, -Math.sqrt(0.152 ** 2 - (0.822 - 0.786) ** 2)],
    ["receipt", 1.154, 0.17, Math.sqrt(0.472 ** 2 - (1.154 - 0.786) ** 2)],
  ] as const) {
    const at: IAutoMovieAffordance = atm.affordance(id);
    near(`the ATM's ${id} height`, at.frame.translation.y, height);
    near(`the ATM's ${id} depth`, shelf - at.frame.translation.z, depth);
    near(`the ATM's ${id} across`, at.frame.translation.x, across);
  }
  near("the ATM's shelf", archetypeExtent(atm, "y", ["shelf"]).high, 0.763);
  near("the ATM's fascia", archetypeExtent(atm, "x", ["cabinet"]).size, 0.77);
  // 4. The valve.
  const read: Readonly<Record<createValve.Model, readonly [number, number]>> = {
    "4in": [0.254, 0.61],
    "6in": [0.305, 0.789],
  };
  const valves: createValve.Model[] = Object.keys(read) as createValve.Model[];
  for (const size of valves) {
    const [wheel, height]: readonly [number, number] = read[size];
    const valve: ReturnType<typeof createValve> = createValve({ model: size });
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
    if (pipe.low < -1e-9)
      findings.push(`valve ${size}: the pipe is below the floor`);
    if (hand.travel !== undefined)
      findings.push(
        `valve ${size}: the handwheel states turns no source gives`,
      );
  }
  const drawn: Set<string> = new Set();
  for (let seed: number = 0; seed < 200; seed++) {
    const diameter: number =
      2 * createValve({}, seed).affordance("wheel").radius!;
    const match: createValve.Model | undefined = valves.find(
      (model: createValve.Model): boolean =>
        Math.abs(read[model][0] - diameter) <= 1e-9,
    );
    if (match === undefined)
      findings.push(
        `valve ${seed}: a ${diameter} m handwheel is no read valve`,
      );
    else drawn.add(match);
  }
  if (drawn.size !== valves.length)
    findings.push(`200 seeds drew only ${[...drawn].join(", ")}`);
  TestValidator.equals(
    "a vending machine and a gate valve stand at the makers' sizes",
    findings,
    [],
  );
}
