import { createGate } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * A tripod turnstile and a swing speed gate stand at Boon Edam's sizes, their lane the maker's passage.
 *
 * Scenarios:
 * 1. A turnstile's lane is 457 to 559 mm wide, centred on the origin beside its cabinet's face, its cabinet 965 mm high, and its arm at 838 mm reaching 416 mm into the lane from the cabinet's face.
 * 2. A speed gate's lane is 615 to 915 mm between its two cabinets' faces, the cabinets 1035 mm high, the wings 940 mm high and meeting at the lane's middle.
 * 3. On both, `passage` is the lane's width and the cabinets' height, and `top` lies on the `-X` cabinet's top.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the produced colliders and contacts over the seeds; a lane, arm or wing off the maker's figures is caught with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations Every figure is Boon Edam's restated here.
 * @evidence contracts/development/testing.md#distinguishing-cases One cabinet with an arm against two cabinets with wings.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the three scenarios and what each pins.
 */
export function test_archetype_gates(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };

  // 1. and 2. The lanes.
  findings.push(
    ...archetypeBandSweep([
      {
        name: "turnstile passage",
        measure: (seed: number): number =>
          createGate({ kind: "turnstile" }, seed).affordance("passage").width!,
        minimum: 0.457,
        maximum: 0.559,
        source: "Boon Edam Trilock 60",
      },
      {
        name: "speed gate passage",
        measure: (seed: number): number => {
          const gate: ReturnType<typeof createGate> = createGate(
            { kind: "speedGate" },
            seed,
          );
          return (
            archetypeExtent(gate, "x", ["cabinet-left"]).low -
            archetypeExtent(gate, "x", ["cabinet-right"]).high
          );
        },
        minimum: 0.615,
        maximum: 0.915,
        source: "Boon Edam Speedlane Swing",
      },
    ]),
  );
  for (const seed of [0, 11]) {
    const turnstile: ReturnType<typeof createGate> = createGate(
      { kind: "turnstile" },
      seed,
    );
    const face: number = archetypeExtent(turnstile, "x", ["cabinet-right"]).high;
    near(
      `turnstile ${seed}: the lane's half`,
      -face,
      turnstile.affordance("passage").width! / 2,
    );
    near(`turnstile ${seed}: the cabinet`, archetypeExtent(turnstile, "y").high, 0.965);
    const arm: { low: number; high: number } = archetypeExtent(
      turnstile,
      "y",
      ["arm"],
    );
    near(`turnstile ${seed}: the arm's height`, (arm.low + arm.high) / 2, 0.838);
    near(
      `turnstile ${seed}: the arm's reach`,
      archetypeExtent(turnstile, "x", ["arm"]).high - face,
      0.416,
    );

    const gate: ReturnType<typeof createGate> = createGate(
      { kind: "speedGate" },
      seed,
    );
    near(`speed gate ${seed}: the cabinets`, archetypeExtent(gate, "y").high, 1.035);
    near(
      `speed gate ${seed}: the wings`,
      archetypeExtent(gate, "y", ["wing-left", "wing-right"]).high,
      0.94,
    );
    near(
      `speed gate ${seed}: the wings meet`,
      archetypeExtent(gate, "x", ["wing-left"]).low,
      archetypeExtent(gate, "x", ["wing-right"]).high,
    );

    // 3. The contacts.
    for (const [name, model, cabinet] of [
      ["turnstile", turnstile, 0.965],
      ["speed gate", gate, 1.035],
    ] as const) {
      near(
        `${name} ${seed}: the passage's height`,
        model.affordance("passage").height!,
        cabinet,
      );
      const top: { low: number; high: number } = archetypeExtent(model, "x", [
        "cabinet-right",
      ]);
      near(
        `${name} ${seed}: the top over the -X cabinet`,
        model.affordance("top").frame.translation.x,
        (top.low + top.high) / 2,
      );
    }
  }
  TestValidator.equals(
    "turnstiles and speed gates stand at the maker's sizes",
    findings,
    [],
  );
}
