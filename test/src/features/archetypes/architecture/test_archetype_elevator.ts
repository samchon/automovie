import { AutoMovieArchetypeElevator } from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../internal/archetypeExtent";
import { archetypeModelSweep } from "../../internal/archetypeModelSweep";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/** ADA Table 407.4.1, centred door: 42 in door less its 5/8 in tolerance, 80 in wide, 51 in to the front return, 54 in to the door. */
const ADA: Readonly<{
  door: readonly [number, number];
  width: number;
  returns: number;
  depth: number;
}> = { door: [1.049, 1.065], width: 2.03, returns: 1.295, depth: 1.37 };

/** KONE MonoSpace: car heights 2 100, 2 200, 2 300 and 2 400 mm; door heights 2 000, 2 100, 2 200 and 2 300 mm, a door below its car. */
const KONE: Readonly<{ car: readonly number[]; door: readonly number[] }> = {
  car: [2.1, 2.2, 2.3, 2.4],
  door: [2.0, 2.1, 2.2, 2.3],
};

/**
 * A lift car is the ADA's accessible centred-door car at the KONE guide's heights, and its two leaves clear the entrance by sliding apart.
 *
 * Scenarios:
 * 1. The inside is 80 in wide and 54 in from the back wall to the door, the front returns 51 in from it, the clear width inside the regulation's tolerance; over 200 seeds the inside height and the door's height are exactly one of KONE's car heights and one of its door heights below it, every such pair drawn.
 * 2. The entrance's width and height are the clear opening, below the roof.
 * 3. At rest the leaves fill the opening, meeting at the middle; at full travel each has slid out by half the clear width, leaving the opening free.
 * 4. The landing call button lies within ADA 308's 15 to 48 in reach, on the `+X` front return beside the opening, facing the landing.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the produced colliders and contacts and articulates the leaves; a car of the wrong size, a height between KONE's or a door at or above its car, an entrance off its opening or a leaf that slides into the opening is caught with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The sizes are ADA Table 407.4.1's and KONE's figures restated here; the open leaves' places follow from half the clear width.
 * @evidence contracts/development/testing.md#distinguishing-cases Closed and open leaves on both sides, a ranging width and the guide's height pairs.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the four scenarios and what each pins.
 */
export function test_archetype_elevator(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };

  // 1. The car's inside.
  findings.push(
    ...archetypeBandSweep([
      {
        name: "lift car door clear width",
        measure: (seed: number): number =>
          AutoMovieArchetypeElevator.create({}, seed).affordance("entrance").width!,
        minimum: ADA.door[0],
        maximum: ADA.door[1],
        source: "ADA Table 407.4.1",
      },
    ]),
    ...archetypeModelSweep([
      {
        name: "lift car and door heights",
        measure: (seed: number): readonly number[] => {
          const car: ReturnType<typeof AutoMovieArchetypeElevator.create> = AutoMovieArchetypeElevator.create(
            {},
            seed,
          );
          return [
            archetypeExtent(car, "y", ["roof"]).low,
            car.affordance("entrance").height!,
          ];
        },
        models: KONE.car.flatMap((car: number): number[][] =>
          KONE.door
            .filter((door: number): boolean => door < car)
            .map((door: number): number[] => [car, door]),
        ),
        source: "KONE MonoSpace planning guide",
      },
    ]),
  );
  for (const seed of [0, 8, 21]) {
    const car: ReturnType<typeof AutoMovieArchetypeElevator.create> = AutoMovieArchetypeElevator.create({}, seed);
    const inside: number =
      archetypeExtent(car, "x", ["side-left"]).low -
      archetypeExtent(car, "x", ["side-right"]).high;
    near(`car ${seed}: the inside width`, inside, ADA.width);
    const back: number = archetypeExtent(car, "z", ["back"]).high;
    near(
      `car ${seed}: back wall to the door`,
      archetypeExtent(car, "z", ["leftDoor-leaf"]).low - back,
      ADA.depth,
    );
    near(
      `car ${seed}: back wall to the front return`,
      archetypeExtent(car, "z", ["return-left"]).low - back,
      ADA.returns,
    );

    // 2. The entrance.
    const entrance: IAutoMovieAffordance = car.affordance("entrance");
    const roof: number = archetypeExtent(car, "y", ["roof"]).low;
    if (!(entrance.height! >= KONE.door[0]! - 1e-9 && entrance.height! <= roof))
      findings.push(
        `car ${seed}: the entrance is ${entrance.height} high under a ${roof} roof`,
      );
    near(
      `car ${seed}: the opening between the returns`,
      archetypeExtent(car, "x", ["return-left"]).low -
        archetypeExtent(car, "x", ["return-right"]).high,
      entrance.width!,
    );

    // 3. The leaves.
    const half: number = entrance.width! / 2;
    near(
      `car ${seed}: the closed leaves meet`,
      archetypeExtent(car, "x", ["leftDoor-leaf"]).low,
      archetypeExtent(car, "x", ["rightDoor-leaf"]).high,
    );
    const open: ReturnType<typeof AutoMovieArchetypeElevator.create> = car.articulate({
      leftDoor: car.affordance("leftDoor").travel!,
      rightDoor: car.affordance("rightDoor").travel!,
    });
    near(
      `car ${seed}: the open left leaf's edge`,
      archetypeExtent(open, "x", ["leftDoor-leaf"]).low,
      half,
    );
    near(
      `car ${seed}: the open right leaf's edge`,
      archetypeExtent(open, "x", ["rightDoor-leaf"]).high,
      -half,
    );
  }
  // 4. The call button.
  findings.push(
    ...archetypeBandSweep([
      {
        name: "landing call button height",
        measure: (seed: number): number =>
          AutoMovieArchetypeElevator.create({}, seed).affordance("call").frame.translation.y,
        minimum: 0.38,
        maximum: 1.22,
        source: "ADA 407.2.1.1 and 308.2.1",
      },
    ]),
  );
  const lift: ReturnType<typeof AutoMovieArchetypeElevator.create> = AutoMovieArchetypeElevator.create({}, 4);
  const call: IAutoMovieAffordance = lift.affordance("call");
  if (
    !(
      call.frame.translation.x > lift.affordance("entrance").width! / 2 &&
      call.frame.translation.x <
        archetypeExtent(lift, "x", ["return-left"]).high &&
      call.frame.translation.z >
        archetypeExtent(lift, "z", ["return-left"]).high - 1e-9
    )
  )
    findings.push(
      "the call button is not on the +X front return's landing face",
    );
  TestValidator.equals(
    "a lift car is the accessible car and its leaves clear the entrance",
    findings,
    [],
  );
}
