import { createBall } from "@automovie/archetypes";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  HumanSportSwing,
  HumanSportThrow,
  HumanWeaponMelee,
  type IHumanActionLaw,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Every swing of an implement, every melee blow and every kick, leap and
 * dash the sport and weapon lexicons name is something a body can do: on
 * the average man and on the small woman it is accepted and planned out of
 * quiet standing, under its own name, with the empty hand standing in for
 * the implement.
 *
 * A row writes no motion; it fixes parameters of a law that already fits a
 * body. Its first possible fault is a fixed combination its law refuses on
 * some body, and this test is the net for that. Whether a planned row keeps
 * the physical bounds is the verdict net's; where an implement's striking
 * part lands is the blade strokes test's, on the law these rows share.
 *
 * Scenarios, for each of the two bodies:
 * 1. Each row of `HumanSportSwing` and of `HumanWeaponMelee` plans alone
 *    (the reload's palm goes to the performer's own abdomen, standing in for
 *    a magazine well) and is placed under its own name.
 * 2. `kickRight` and `kickLeft` at a football (`createBall`) on the floor
 *    0.45 m ahead toward a point 5 m away, `leap` to a place 0.6 m ahead and `dash` to a place
 *    4 m ahead plan and are placed under their names. The throws and the
 *    catches of `HumanSportThrow` need a held ball and a thrower and are not
 *    netted here.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers every row through the public input and builds a performance of it on real bodies; a row that is refused, or placed under another name, fails with the row, the body and the refusal's message.
 * @evidence contracts/development/testing.md#independent-expectations That each row is humanly performable out of standing is what the row claims; nothing is compared with a value read from a law. The net cannot tell a good swing from a poor one.
 * @evidence contracts/development/testing.md#distinguishing-cases Twelve swings, seven melee rows and four travel rows on two bodies of opposite build; the throw and catch rows are owed to a test with a ball.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one short performance per row and body, a football its only prop; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what the net catches, what it leaves to other tests and the 2 scenarios.
 */
export function test_human_motion_sport_swings(): void {
  const alone: IHumanActionLaw<never>[] = [
    ...Object.values(HumanSportSwing),
    ...Object.values(HumanWeaponMelee),
  ];
  const travel: IHumanActionLaw<never>[] = [
    HumanSportThrow.kickRight,
    HumanSportThrow.kickLeft,
    HumanSportThrow.leap,
    HumanSportThrow.dash,
  ];
  const ball: object = {
    ball: "ball",
    toward: { kind: "point", at: { x: 0, y: 0, z: 5 }, frame: "world" },
  };
  const football: HumanPerformance.IInput["props"] = [
    HumanObject.prop("ball", createBall({ kind: "football" }), {
      at: { x: 0, y: 0, z: 0.45 },
      yaw: 0,
    }),
  ];
  const given: Readonly<Record<string, object>> = {
    reloadFirearm: { target: { kind: "self", region: "abdomen" } },
    kickRight: ball,
    kickLeft: ball,
    leap: { to: { x: 0, y: 0, z: 0.6 } },
    dash: { to: { x: 0, y: 0, z: 4 } },
  };
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    for (const law of [...alone, ...travel])
      try {
        const film: HumanPerformance = new HumanPerformance({
          seed: "swings",
          laws: [...alone, ...travel],
          props: football,
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          composition: HumanChain.subject("a")
            .stand({ seconds: 0.3 })
            .registered(law.name, given[law.name] ?? {}).node,
        });
        const act: HumanSegment.ISegment | undefined = film.segments("a")[1];
        if (act === undefined || act.name !== law.name)
          complaints.push(
            `${law.name} on ${name}: placed as ${act?.name}, ${law.name} expected`,
          );
      } catch (error) {
        complaints.push(
          `${law.name} on ${name}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
  }
  TestValidator.equals("every swing is performable", complaints, []);
}
