import {
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  HumanSport,
  type IHumanActionLaw,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "./motionHumanBody";

/**
 * The sport net on one body, which the `test_human_motion_sport_rows_*` specs
 * read one body each: every kind of the sport, exercise, stretch and dance
 * actions is accepted and planned out of quiet standing, by the action's own
 * method and by the row that names it for a screenplay.
 *
 * Scenarios, on the body:
 * 1. Each kind of `exercise`, `stretch`, `dance`, `martialArt`, `ballSport`,
 *    `baseball`, `racket` and `swim`, and `athletics` and `gymnastics` with
 *    their defaults, plans through its typed chain method and lasts a
 *    positive time. The kinds are listed here from the actions' published
 *    parameter types, which the type checker holds this list to.
 * 2. Each row of `HumanSport` plans alone with no parameters and is placed
 *    under its own name.
 *
 * @param name The body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the net, the body and the 2 scenarios.
 * @evidence contracts/development/implementation.md#principled-implementation Builds a performance of every kind and every row through the public chain and input on a real body.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One check per kind and row, gathered as complaints and asserted once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A refused kind is a complaint with the refusal's words.
 * @evidence contracts/development/implementation.md#efficient-algorithms One short performance per kind and row.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by each body's spec, so the net exists once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; each performance is dropped after its check.
 */
export function motionSportRows(name: motionHumanBody.Name): void {
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
    check(`the row ${law.name}`, () => start().registered(law.name), law.name);
  TestValidator.equals(
    `every sport kind is performable (${name})`,
    complaints,
    [],
  );
}
