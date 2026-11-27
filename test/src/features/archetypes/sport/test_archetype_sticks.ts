import { AutoMovieArchetypeStick } from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * Ice hockey sticks, field hockey sticks and cricket bats stand at their rules' limits, gripped along their shafts and striking with their faces.
 *
 * Scenarios:
 * 1. An ice hockey stick is the IIHF's 1.63 m from the heel to the shaft's end, its blade 32 cm long and 5.0 to 7.6 cm high.
 * 2. A field hockey stick is the FIH's 105 cm and passes the 51 mm ring.
 * 3. A cricket bat is the MCC's 96.52 cm, its blade 10.8 cm wide and 6.7 cm deep, its handle 52% of its length.
 * 4. Each `grip` spans the shaft or handle above the striking end, and each `blade` faces `+Z` on the striking end.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the produced colliders and contacts over the seeds; a stick off its rule's limits or a contact off its part is caught with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations Every figure is the IIHF's, FIH's or MCC's restated here.
 * @evidence contracts/development/testing.md#distinguishing-cases A blade on the floor, a head under the shaft and a blade under a handle.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the four scenarios and what each pins.
 */
export function test_archetype_sticks(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };

  // 1. The ice hockey stick.
  findings.push(
    ...archetypeBandSweep([
      {
        name: "ice hockey blade height",
        measure: (seed: number): number =>
          archetypeExtent(AutoMovieArchetypeStick.create({ kind: "iceHockey" }, seed), "y", [
            "blade",
          ]).size,
        minimum: 0.05,
        maximum: 0.076,
        source: "IIHF Rule 10.1",
      },
    ]),
  );
  const hockey: ReturnType<typeof AutoMovieArchetypeStick.create> = AutoMovieArchetypeStick.create(
    { kind: "iceHockey" },
    3,
  );
  near("the ice hockey stick's length", archetypeExtent(hockey, "y").high, 1.63);
  near("the ice hockey blade's length", archetypeExtent(hockey, "x", ["blade"]).size, 0.32);

  // 2. The field hockey stick.
  const field: ReturnType<typeof AutoMovieArchetypeStick.create> = AutoMovieArchetypeStick.create(
    { kind: "fieldHockey" },
    3,
  );
  near("the field hockey stick's length", archetypeExtent(field, "y").high, 1.05);
  for (const axis of ["x", "z"] as const)
    if (!(archetypeExtent(field, axis, ["shaft"]).size <= 0.051 + 1e-9))
      findings.push(`the field hockey shaft does not pass the 51 mm ring along ${axis}`);

  // 3. The cricket bat.
  const bat: ReturnType<typeof AutoMovieArchetypeStick.create> = AutoMovieArchetypeStick.create(
    { kind: "cricketBat" },
    3,
  );
  near("the bat's length", archetypeExtent(bat, "y").high, 0.9652);
  near("the bat's width", archetypeExtent(bat, "x", ["blade"]).size, 0.108);
  near("the bat's depth", archetypeExtent(bat, "z", ["blade"]).size, 0.067);
  near(
    "the bat's handle",
    archetypeExtent(bat, "y", ["handle"]).size,
    0.52 * 0.9652,
  );

  // 4. The contacts.
  for (const [name, stick, shaft, end] of [
    ["ice hockey", hockey, "shaft", "blade"],
    ["field hockey", field, "shaft", "head"],
    ["cricket", bat, "handle", "blade"],
  ] as const) {
    const grip: IAutoMovieAffordance = stick.affordance("grip");
    const y: { low: number; high: number; size: number } = archetypeExtent(
      stick,
      "y",
      [shaft],
    );
    near(`the ${name} grip's middle`, grip.frame.translation.y, (y.low + y.high) / 2);
    near(`the ${name} grip's length`, grip.length!, y.size);
    const blade: IAutoMovieAffordance = stick.affordance("blade");
    near(
      `the ${name} face`,
      blade.frame.translation.z,
      archetypeExtent(stick, "z", [end]).high,
    );
  }
  TestValidator.equals("sticks and bats stand at their rules", findings, []);
}
