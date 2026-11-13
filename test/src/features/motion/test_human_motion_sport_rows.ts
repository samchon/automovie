import {
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  HumanSport,
  type IHumanActionLaw,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Every kind of the sport, exercise, stretch and dance actions is something
 * a body can do: on the average man and on the small woman it is accepted
 * and planned out of quiet standing, by the action's own method and by the
 * row that names it for a screenplay.
 *
 * A kind's first possible fault is a posture or a reach its law refuses on
 * some body, and this test is the net for that across the ten actions.
 * Whether a planned kind keeps the physical bounds is the verdict net's,
 * and what it should look like its own signature test's.
 *
 * Scenarios, for each of the two bodies:
 * 1. Each kind of `exercise`, `stretch`, `dance`, `martialArt`, `ballSport`,
 *    `baseball`, `racket` and `swim`, and `athletics` and `gymnastics` with
 *    their defaults, plans through its typed chain method and lasts a
 *    positive time. The kinds are listed here from the actions' published
 *    parameter types, which the type checker holds this list to.
 * 2. Each row of `HumanSport` plans alone with no parameters and is placed
 *    under its own name.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds a performance of every kind and every row through the public chain and input on real bodies; a kind that is refused, plans no time, or a row placed under another name fails with the kind, the body and the refusal's message.
 * @evidence contracts/development/testing.md#independent-expectations That each kind is humanly performable out of standing is what the vocabulary claims; nothing is compared with a value read from a law.
 * @evidence contracts/development/testing.md#distinguishing-cases Twenty-nine kinds and twenty-six rows on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one short performance per kind, row and body; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what the net catches, what it leaves to other tests and the 2 scenarios.
 */
export function test_human_motion_sport_rows(): void {
  const start = (): HumanChain =>
    HumanChain.subject("a").stand({ seconds: 0.3 });
  const kinds: Readonly<Record<string, () => HumanChain>> = {
    "exercise squat": () => start().exercise({ kind: "squat" }),
    "exercise lunge": () => start().exercise({ kind: "lunge" }),
    "exercise highKnees": () => start().exercise({ kind: "highKnees" }),
    "exercise jumpingJack": () => start().exercise({ kind: "jumpingJack" }),
    "stretch neckSide": () => start().stretch({ kind: "neckSide" }),
    "stretch crossBody": () => start().stretch({ kind: "crossBody" }),
    "stretch overheadSide": () => start().stretch({ kind: "overheadSide" }),
    "stretch quadriceps": () => start().stretch({ kind: "quadriceps" }),
    "stretch tree": () => start().stretch({ kind: "tree" }),
    "dance bounce": () => start().dance({ kind: "bounce" }),
    "dance sway": () => start().dance({ kind: "sway" }),
    "dance stepTouch": () => start().dance({ kind: "stepTouch" }),
    "martialArt horseStance": () => start().martialArt({ kind: "horseStance" }),
    "martialArt chokuZuki": () => start().martialArt({ kind: "chokuZuki" }),
    "martialArt taiChiPush": () => start().martialArt({ kind: "taiChiPush" }),
    "ballSport dribble": () => start().ballSport({ kind: "dribble" }),
    "ballSport dig": () => start().ballSport({ kind: "dig" }),
    "ballSport set": () => start().ballSport({ kind: "set" }),
    "ballSport throwIn": () => start().ballSport({ kind: "throwIn" }),
    "baseball catcherCrouch": () => start().baseball({ kind: "catcherCrouch" }),
    "baseball groundBall": () => start().baseball({ kind: "groundBall" }),
    "baseball battingStance": () => start().baseball({ kind: "battingStance" }),
    "racket readyPosition": () => start().racket({ kind: "readyPosition" }),
    "racket splitStep": () => start().racket({ kind: "splitStep" }),
    "racket golfAddress": () => start().racket({ kind: "golfAddress" }),
    "swim treadWater": () => start().swim({ kind: "treadWater" }),
    "swim frontCrawl": () => start().swim({ kind: "frontCrawl" }),
    athletics: () => start().athletics(),
    gymnastics: () => start().gymnastics(),
  };
  const laws: IHumanActionLaw<never>[] = Object.values(HumanSport);
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const check = (
      label: string,
      build: () => HumanChain,
      placed?: string,
    ): void => {
      try {
        const film: HumanPerformance = new HumanPerformance({
          seed: "sport",
          laws,
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          composition: build().node,
        });
        const act: HumanSegment.ISegment | undefined = film.segments("a")[1];
        if (act === undefined || !(act.end - act.entryTime > 0))
          complaints.push(`${label} on ${name}: it plans no time`);
        else if (placed !== undefined && act.name !== placed)
          complaints.push(
            `${label} on ${name}: placed as ${act.name}, ${placed} expected`,
          );
      } catch (error) {
        complaints.push(
          `${label} on ${name}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    };

    // 1. Every kind by its own method.
    for (const [label, build] of Object.entries(kinds)) check(label, build);

    // 2. Every row under its own name.
    for (const law of laws)
      check(
        `the row ${law.name}`,
        () => start().registered(law.name),
        law.name,
      );
  }
  TestValidator.equals("every sport kind is performable", complaints, []);
}
