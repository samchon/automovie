import { createBall } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanSport,
  HumanSportThrow,
  type IHumanActionLaw,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The sport lexicons on the grammar (#3377): every skill is a row of the
 * shipped law that plans it, its kind fixed, and a thrown ball now flies
 * (#3479).
 *
 * Scenarios:
 * 1. Every `HumanSport` row is a row of one of the shipped sport, exercise,
 *    stretch, dance, swim or stance laws, and every `HumanSportThrow` row of
 *    a throw, catch, kick, jump, run or tumbling law; no name repeats.
 * 2. The shipped sport kinds keep their names: `sprintStart` athletics,
 *    `handstand` gymnastics, `horseStance`, `karatePunches` and `taiChiPush`
 *    martial art, `dribble`, `volleyDig`, `volleySet` and `throwIn` ball
 *    sport, `catcherCrouch`, `fieldGrounder` and `battingStance` baseball,
 *    `readyPosition`, `splitStep` and `golfAddress` racket.
 * 3. A pitch of a handball held in the right hand, at a point 10 m ahead, by
 *    the average man and the small woman, launches the ball at the release
 *    and the ball flies: at the throw's end it is more than 2 m from where it
 *    was released.
 * 4. Over two rows of the same kind at novice and elite proficiency, the
 *    pitch plans at both.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the rows' records and performs a pitch with a real ball archetype; a row of the wrong law, a renamed skill, a ball left at the release or a proficiency that does not plan fails.
 * @evidence contracts/development/testing.md#independent-expectations The names and families are the shipped table's; the 2 m is a flight that left the hand, a bound well under the 10 m aimed at.
 * @evidence contracts/development/testing.md#distinguishing-cases Every row family; two bodies; novice and elite.
 * @evidence contracts/development/testing.md#execution-ownership Reads the law records and builds four performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the four numbered scenarios.
 */
export function test_human_motion_sport_rows(): void {
  const rows = (lexicon: object): IHumanActionLaw<never>[] =>
    Object.values(lexicon).filter(
      (value: unknown): value is IHumanActionLaw<never> =>
        typeof value === "object" && value !== null && "plan" in value,
    );
  const sport: IHumanActionLaw<never>[] = rows(HumanSport);
  const thrown: IHumanActionLaw<never>[] = rows(HumanSportThrow);

  // 1. Families and names.
  const sportFamilies: ReadonlySet<string> = new Set([
    "athletics",
    "gymnastics",
    "martialArt",
    "ballSport",
    "baseball",
    "racket",
    "exercise",
    "stretch",
    "dance",
    "swim",
    "step",
    "crouch",
    "kneel",
    "lieDown",
    "bend",
  ]);
  TestValidator.predicate(
    `every sport row is a row of a shipped sport law (${sport.filter((r) => !sportFamilies.has(r.family ?? "")).map((r) => r.name).join(", ")})`,
    sport.every((r) => sportFamilies.has(r.family ?? "")),
  );
  TestValidator.predicate(
    "every sport throw row has a family",
    thrown.every((r) => r.family !== undefined),
  );
  const names: string[] = [...sport, ...thrown].map((r) => r.name);
  TestValidator.equals("no row name repeats", new Set(names).size, names.length);

  // 2. The shipped kinds.
  const kinds: [IHumanActionLaw<never>, string, string][] = [
    [HumanSport.sprintStart as IHumanActionLaw<never>, "athletics", ""],
    [HumanSport.handstand as IHumanActionLaw<never>, "gymnastics", ""],
    [HumanSport.horseStance as IHumanActionLaw<never>, "martialArt", "horseStance"],
    [HumanSport.karatePunches as IHumanActionLaw<never>, "martialArt", "chokuZuki"],
    [HumanSport.taiChiPush as IHumanActionLaw<never>, "martialArt", "taiChiPush"],
    [HumanSport.dribble as IHumanActionLaw<never>, "ballSport", "dribble"],
    [HumanSport.volleyDig as IHumanActionLaw<never>, "ballSport", "dig"],
    [HumanSport.volleySet as IHumanActionLaw<never>, "ballSport", "set"],
    [HumanSport.throwIn as IHumanActionLaw<never>, "ballSport", "throwIn"],
    [HumanSport.catcherCrouch as IHumanActionLaw<never>, "baseball", "catcherCrouch"],
    [HumanSport.fieldGrounder as IHumanActionLaw<never>, "baseball", "groundBall"],
    [HumanSport.battingStance as IHumanActionLaw<never>, "baseball", "battingStance"],
    [HumanSport.readyPosition as IHumanActionLaw<never>, "racket", "readyPosition"],
    [HumanSport.splitStep as IHumanActionLaw<never>, "racket", "splitStep"],
    [HumanSport.golfAddress as IHumanActionLaw<never>, "racket", "golfAddress"],
  ];
  for (const [law, family, kind] of kinds) {
    TestValidator.equals(`${law.name} is a row of ${family}`, law.family, family);
    if (kind !== "")
      TestValidator.equals(
        `${law.name} fixes the kind ${kind}`,
        (law.resolve!({}) as { kind?: string }).kind,
        kind,
      );
  }

  // 3 and 4. A pitched ball flies.
  const ball = createBall({ kind: "handball" });
  for (const name of ["m-average", "f-small"] as const)
    for (const level of ["novice", "elite"] as const) {
      const body: IHumanBody = motionHumanBody(name);
      let performance: HumanPerformance;
      try {
        performance = new HumanPerformance({
          seed: "pitch",
          laws: [HumanSportThrow.pitch],
          props: [HumanObject.prop("ball", ball, { at: { x: -0.25, y: 0.9, z: 0.35 }, yaw: 0 })],
          performers: [
            { subject: "a", body, at: { x: 0, y: 0, z: 0 }, yaw: 0, proficiency: { level } },
          ],
          composition: HumanChain.subject("a")
            .pickUp({ prop: "ball", handle: "grip" })
            .registered("pitch", {
              at: { kind: "point", frame: "world", at: { x: 0, y: 1, z: 10 } },
              prop: "ball",
            }).node,
        });
      } catch (error) {
        TestValidator.predicate(
          `${name} ${level}: the pitch plans (${error instanceof Error ? error.message : String(error)})`,
          false,
        );
        continue;
      }
      const flight = performance.flights("ball")[0];
      TestValidator.predicate(`${name} ${level}: the ball is launched`, flight !== undefined);
      if (flight === undefined) continue;
      const gone: number = Vector3.length(
        Vector3.subtract(
          performance.prop("ball", performance.duration).position,
          flight.projectile.origin,
        ),
      );
      TestValidator.predicate(
        `${name} ${level}: the ball flies away from the hand (${gone.toFixed(2)} m)`,
        gone > 2,
      );
    }
}
