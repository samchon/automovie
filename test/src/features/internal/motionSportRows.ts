import type { IAutoMovieMotionHumanActionLaw, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanChain, IAutoMovieMotionHumanPerformance, IAutoMovieMotionHumanSegment } from "@automovie/interface";
import { HumanChain, HumanPerformance, HumanSport } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "./motionHumanBody";

/**
 * The sport net on one body at one proficiency, which the
 * `test_human_motion_sport_rows_*` specs read: every kind of the sport,
 * exercise, stretch and dance actions is accepted and planned out of quiet
 * standing, by the action's own method and by the row that names it for a
 * screenplay. A spec reads the whole net or one part of it, so the bodies and
 * the proficiencies a row must plan on are covered by parts that each stay
 * short (`pnpm --filter @automovie/test sweep:parts sportRows`).
 *
 * Scenarios, on the body at the proficiency:
 * 1. Each kind of `exercise`, `stretch`, `dance`, `martialArt`, `ballSport`,
 *    `baseball`, `racket` and `swim`, and `athletics` and `gymnastics` with
 *    their defaults, plans through its typed chain method and lasts a
 *    positive time. The kinds are listed here from the actions' published
 *    parameter types, which the type checker holds this list to.
 * 2. Each row of `HumanSport` plans alone with no parameters and is placed
 *    under its own name.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the net, its body, proficiency and parts, and the 2 scenarios.
 * @evidence contracts/development/design.md#principled-representation The net is one ordered list of checks, the kinds then the rows, which a part reads every n-th of.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The proficiency type, the check count the parts are sized by and the run.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No kind or row is left out of the list; a part is a share of it, never a choice.
 */
export namespace motionSportRows {
  /** The proficiency a net performs at. */
  export type Level = "novice" | "trained" | "elite";

  /**
   * How many checks the net makes on one body: the kinds and the rows.
   *
   * @returns The count.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is counted.
   * @evidence contracts/development/implementation.md#principled-implementation The same list the run reads, so a part's share is exact.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One sum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Counted from the list, not stated.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads `checks`, the run's own list.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function count(): number {
    return checks().length;
  }

  /**
   * Run the net, or one part of it, on a body at a proficiency.
   *
   * @param name The body.
   * @param level The proficiency; `trained` when absent.
   * @param part The part as its index and the part count, the checks whose position leaves the index when divided by the count; every check when absent.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and what is asserted.
   * @evidence contracts/development/implementation.md#principled-implementation Builds a performance of every kind and every row of the part through the public chain and input on a real body.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One check per kind and row, gathered as complaints and asserted once.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A refused kind is a complaint with the refusal's words.
   * @evidence contracts/development/implementation.md#efficient-algorithms One short performance per kind and row of the part.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by each body's, proficiency's and part's spec, so the net exists once.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; each performance is dropped after its check.
   */
  export function run(
    name: motionHumanBody.Name,
    level: Level = "trained",
    part?: readonly [number, number],
  ): void {
    const laws: IAutoMovieMotionHumanActionLaw<never>[] = Object.values(HumanSport);
    const complaints: string[] = [];
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    checks().forEach((c: ICheck, index: number): void => {
      if (part !== undefined && index % part[1] !== part[0]) return;
      try {
        const film: IAutoMovieMotionHumanPerformance = new HumanPerformance({
          seed: "sport",
          laws,
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level },
            },
          ],
          composition: c.build().node,
        });
        const act: IAutoMovieMotionHumanSegment.ISegment | undefined = film.segments("a")[1];
        if (act === undefined || !(act.end - act.entryTime > 0))
          complaints.push(`${c.label} on ${name} (${level}): it plans no time`);
        else if (c.placed !== undefined && act.name !== c.placed)
          complaints.push(
            `${c.label} on ${name} (${level}): placed as ${act.name}, ${c.placed} expected`,
          );
      } catch (error) {
        complaints.push(
          `${c.label} on ${name} (${level}): ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    });
    TestValidator.equals(
      `every sport kind is performable (${name}, ${level}${part === undefined ? "" : `, part ${part[0] + 1} of ${part[1]}`})`,
      complaints,
      [],
    );
  }
}

/** One check of the net: what it is called, how it is composed and the name its act must be placed under. */
interface ICheck {
  label: string;
  build: () => IAutoMovieMotionHumanChain;
  placed?: string;
}

/** The net's checks in order: every kind by its own method, then every row under its own name. */
function checks(): ICheck[] {
  const start = (): IAutoMovieMotionHumanChain =>
    HumanChain.subject("a").stand({ seconds: 0.3 });
  const kinds: Readonly<Record<string, () => IAutoMovieMotionHumanChain>> = {
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
  return [
    ...Object.entries(kinds).map(
      ([label, build]: [string, () => IAutoMovieMotionHumanChain]): ICheck => ({
        label,
        build,
      }),
    ),
    ...Object.values(HumanSport).map(
      (law: IAutoMovieMotionHumanActionLaw<never>): ICheck => ({
        label: `the row ${law.name}`,
        build: () => start().registered(law.name),
        placed: law.name,
      }),
    ),
  ];
}
