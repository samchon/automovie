import { AutoMovieArchetypeRefusal, createGoal } from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";
import { archetypeModelSweep } from "../internal/archetypeModelSweep";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * Goals and nets stand at their rule books' sizes, with their bars, openings and tops where the rules put them.
 *
 * Scenarios:
 * 1. A football goal's mouth is IFAB's 7.32 by 2.44 m between the posts' inner faces and under the crossbar, its posts and crossbar 12 cm square.
 * 2. A basketball ring's top is FIBA's 3,050 mm up, its inside 450 to 459 mm across with its nearest point 151 mm from the backboard's face, and the backboard's bottom edge 150 mm below the ring's top.
 * 3. Over 200 seeds a volleyball net's top lies exactly at FIVB's 2.43 m for men or 2.24 m for women, both drawn, and a net height an author fixes is refused on height, since it is the class's own figure; its posts 2.55 m high and 0.50 to 1.00 m outside side lines 9 m apart.
 * 4. A tennis net's cord runs from ITF's 1.07 m at the posts to 0.914 m at the centre, its posts' centres 0.914 m outside a 10.97 m doubles court.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the produced colliders and contacts over the seeds; a goal, ring or net off its rule's figures is caught with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations Every figure is the IFAB's, FIBA's, FIVB's or ITF's restated here.
 * @evidence contracts/development/testing.md#distinguishing-cases Four kinds with different contacts: an opening under a bar, a ring before a board, a long net top, a sagging cord.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the four scenarios and what each pins.
 */
export function test_archetype_goals(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };

  // 1. The football goal.
  const goal: ReturnType<typeof createGoal> = createGoal(
    { kind: "footballGoal" },
    2,
  );
  near(
    "the goal's mouth",
    archetypeExtent(goal, "x", ["post-left"]).low -
      archetypeExtent(goal, "x", ["post-right"]).high,
    7.32,
  );
  near(
    "the crossbar's lower edge",
    archetypeExtent(goal, "y", ["crossbar"]).low,
    2.44,
  );
  near(
    "the crossbar's depth",
    archetypeExtent(goal, "z", ["crossbar"]).size,
    0.12,
  );
  const mouth: IAutoMovieAffordance = goal.affordance("mouth");
  near("the mouth's width", mouth.width!, 7.32);
  near("the mouth's height", mouth.height!, 2.44);

  // 2. The basketball hoop.
  findings.push(
    ...archetypeBandSweep([
      {
        name: "basketball ring inside diameter",
        measure: (seed: number): number => {
          const hoop: ReturnType<typeof createGoal> = createGoal(
            { kind: "basketballHoop" },
            seed,
          );
          const ring: { low: number; high: number } = archetypeExtent(
            hoop,
            "z",
            ["ring-1", "ring-9"],
          );
          return ring.high - ring.low - 2 * hoop.dimensions.bar!;
        },
        minimum: 0.45,
        maximum: 0.459,
        source: "FIBA Basketball Equipment 1.2.1",
      },
    ]),
  );
  for (const seed of [0, 7]) {
    const hoop: ReturnType<typeof createGoal> = createGoal(
      { kind: "basketballHoop" },
      seed,
    );
    const metal: number = hoop.dimensions.bar!;
    near(
      `hoop ${seed}: the ring's top`,
      archetypeExtent(hoop, "y", ["ring-1"]).high,
      3.05,
    );
    near(
      `hoop ${seed}: the ring's nearest inside point from the board`,
      archetypeExtent(hoop, "z", ["ring-9"]).low + metal,
      0.151,
    );
    near(
      `hoop ${seed}: the board's bottom edge`,
      archetypeExtent(hoop, "y", ["backboard"]).low,
      3.05 - 0.15,
    );
  }

  // 3. The volleyball net.
  findings.push(
    ...archetypeModelSweep([
      {
        name: "volleyball net top",
        measure: (seed: number): readonly number[] => [
          createGoal({ kind: "volleyballNet" }, seed).affordance("top").frame
            .translation.y,
        ],
        models: [[2.43], [2.24]],
        source: "FIVB 2.1.1",
      },
    ]),
    ...archetypeBandSweep([
      {
        name: "volleyball post outside the side line",
        measure: (seed: number): number =>
          createGoal({ kind: "volleyballNet" }, seed).affordance("leftPost")
            .frame.translation.x - 4.5,
        minimum: 0.5,
        maximum: 1,
        source: "FIVB 2.5.1",
      },
    ]),
  );
  try {
    createGoal({ kind: "volleyballNet", height: 2.3 }, 2);
    findings.push("a fixed volleyball net height was accepted");
  } catch (error) {
    if (
      !(error instanceof AutoMovieArchetypeRefusal) ||
      error.kind !== "parameter" ||
      error.axis !== "height"
    )
      findings.push("a fixed volleyball net height was not refused on height");
  }
  const volley: ReturnType<typeof createGoal> = createGoal(
    { kind: "volleyballNet" },
    2,
  );
  near(
    "the volleyball posts",
    archetypeExtent(volley, "y", ["post-left"]).high,
    2.55,
  );

  // 4. The tennis net.
  const tennis: ReturnType<typeof createGoal> = createGoal(
    { kind: "tennisNet" },
    2,
  );
  const post: number = 10.97 / 2 + 0.914;
  near(
    "the tennis post's centre",
    tennis.affordance("leftPost").frame.translation.x,
    post,
  );
  near(
    "the net at the centre",
    tennis.affordance("top").frame.translation.y,
    0.914,
  );
  const cord: { low: number; high: number } = archetypeExtent(tennis, "y", [
    "cord-left",
  ]);
  near("the cord at the post", cord.high, 1.07 + 0.004);
  near("the cord at the centre", cord.low, 0.914 - 0.004);
  TestValidator.equals("goals and nets stand at their rules", findings, []);
}
