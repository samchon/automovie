import { createBall } from "@automovie/archetypes";
import { AutoMovieGravity, ROM_TOLERANCE, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanRefusal,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanSport,
  HumanSportThrow,
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
 * 2. A pitch of a handball held in the right hand, at a point 10 m ahead, by
 *    the average man and the small woman, launches the ball at the release
 *    and the ball flies: at the throw's end it is more than 2 m from where it
 *    was released.
 * 3. Over two rows of the same kind at novice and elite proficiency, the
 *    pitch plans at both.
 * 4. A throw-in of a football held from a `pickUp`, at a point on the floor
 *    15 m ahead, on the same two bodies: the ball is launched at the
 *    throw-in's `stroke`, rising at the distance-best release angle, 30
 *    degrees (Linthorne and Everett 2006), within the joints' resolution
 *    (`ROM_TOLERANCE`); its drag-free path from the launch passes the target
 *    within 10 mm (the issue's flight bound); and each foot stays within
 *    5 mm of where it stood (both feet on the ground, the Laws of the Game,
 *    with the issue's slip bound).
 * 5. A throw-in given a ball and no target is refused, a `parameter`
 *    refusal on `at`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the rows' records and performs a pitch with a real ball archetype; a row of the wrong law, a renamed skill, a ball left at the release or a proficiency that does not plan fails.
 * @evidence contracts/development/testing.md#independent-expectations The names and families are the shipped table's. The 2 m is a flight that left the hand, well under the 10 m aimed at. The release angle is Linthorne and Everett's within the joints' resolution, and the flight and slip bounds come from the issue.
 * @evidence contracts/development/testing.md#distinguishing-cases Every row family, novice and elite, and a throw-in with and without a target. The focused sprint-start test checks displayed set geometry.
 * @evidence contracts/development/testing.md#execution-ownership Reads the law records and builds only the pitch and throw-in performances in memory. The distinct geometry of registered sport rows is checked through the lexicon row specs.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the six scenarios with their bounds and sources.
 */
export function test_human_motion_sport_rows(): void {
  const rows = (lexicon: object): IAutoMovieMotionHumanActionLaw<never>[] =>
    Object.values(lexicon).filter(
      (value: unknown): value is IAutoMovieMotionHumanActionLaw<never> =>
        typeof value === "object" && value !== null && "plan" in value,
    );
  const sport: IAutoMovieMotionHumanActionLaw<never>[] = rows(HumanSport);
  const thrown: IAutoMovieMotionHumanActionLaw<never>[] = rows(HumanSportThrow);

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
    `every sport row is a row of a shipped sport law (${sport
      .filter((r) => !sportFamilies.has(r.family ?? ""))
      .map((r) => r.name)
      .join(", ")})`,
    sport.every((r) => sportFamilies.has(r.family ?? "")),
  );
  TestValidator.predicate(
    "every sport throw row has a family",
    thrown.every((r) => r.family !== undefined),
  );
  const names: string[] = [...sport, ...thrown].map((r) => r.name);
  TestValidator.equals(
    "no row name repeats",
    new Set(names).size,
    names.length,
  );

  // 2 and 3. A pitched ball flies.
  const ball = createBall({ kind: "handball" });
  for (const name of ["m-average", "f-small"] as const)
    for (const level of ["novice", "elite"] as const) {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
      let performance: IAutoMovieMotionHumanPerformance;
      try {
        performance = new HumanPerformance({
          seed: "pitch",
          laws: [HumanSportThrow.pitch],
          props: [
            HumanObject.prop("ball", ball, {
              at: { x: -0.25, y: 0.9, z: 0.35 },
              yaw: 0,
            }),
          ],
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level },
            },
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
      TestValidator.predicate(
        `${name} ${level}: the ball is launched`,
        flight !== undefined,
      );
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

  const complaints: string[] = [];

  // 4 and 5. A throw-in of a football.
  const football = createBall({ kind: "football" });
  for (const name of ["f-small", "m-large"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const target: IAutoMovieVector3 = { x: 0, y: 0, z: 15 };
    const throwIn = (
      at: IAutoMovieVector3 | undefined,
    ):
      | IAutoMovieMotionHumanPerformance
      | string
      | IAutoMovieMotionHumanRefusal => {
      try {
        return new HumanPerformance({
          seed: "throwIn",
          laws: [HumanSport.throwIn],
          props: [
            HumanObject.prop("ball", football, {
              at: { x: 0, y: 0.9, z: 0.3 },
              yaw: 0,
            }),
          ],
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
            .pickUp({ prop: "ball", handle: "grip" })
            .registered("throwIn", {
              prop: "ball",
              ...(at === undefined ? {} : { at }),
            }).node,
        });
      } catch (error) {
        if (error instanceof HumanRefusal) return error;
        return error instanceof Error ? error.message : String(error);
      }
    };
    const built:
      | IAutoMovieMotionHumanPerformance
      | string
      | IAutoMovieMotionHumanRefusal = throwIn(target);
    if (!(built instanceof HumanPerformance))
      complaints.push(
        `${name} throw-in: expected to plan, got ${built instanceof HumanRefusal ? built.message : built}`,
      );
    else {
      const all = built.segments("a");
      const placed = all[all.length - 1]!;
      const stroke: number =
        placed.start +
        (placed.plan.events.find((e): boolean => e.name === "stroke")?.share ??
          NaN) *
          placed.plan.duration;
      const flight = built.flights("ball")[0];
      if (flight === undefined)
        complaints.push(`${name} throw-in: the ball is not launched`);
      else {
        // The same second, to floating-point rounding.
        if (!(Math.abs(flight.launch - stroke) <= 1e-9))
          complaints.push(
            `${name} throw-in: the ball is launched at ${flight.launch.toFixed(3)} s, at the stroke ${stroke.toFixed(3)} s expected`,
          );
        const v: IAutoMovieVector3 = flight.published.velocity;
        const rise: number =
          (Math.atan2(v.y, Math.hypot(v.x, v.z)) * 180) / Math.PI;
        if (!(Math.abs(rise - 30) <= ROM_TOLERANCE))
          complaints.push(
            `${name} throw-in: the ball rises at ${rise.toFixed(3)} degrees, 30 expected`,
          );
        // The drag-free path where it is level with the target's distance.
        const o: IAutoMovieVector3 = flight.published.point;
        const t: number =
          Math.hypot(target.x - o.x, target.z - o.z) / Math.hypot(v.x, v.z);
        const height: number =
          o.y + v.y * t - 0.5 * AutoMovieGravity.STANDARD * t * t;
        if (!(Math.abs(height - target.y) <= 0.01))
          complaints.push(
            `${name} throw-in: the path passes ${((height - target.y) * 1000).toFixed(1)} mm off the target, within 10 mm expected`,
          );
      }
      const feet = (
        seconds: number,
      ): ReturnType<IAutoMovieMotionHumanPerformance["bones"]> =>
        built.bones("a", seconds);
      for (const side of ["left", "right"] as const) {
        const from: IAutoMovieVector3 = feet(placed.start).get(
          `${side}Foot`,
        )!.worldPosition;
        const to: IAutoMovieVector3 = feet(
          Number.isNaN(stroke) ? placed.end : stroke,
        ).get(`${side}Foot`)!.worldPosition;
        const slid: number = Vector3.length(Vector3.subtract(to, from));
        if (!(slid <= 0.005))
          complaints.push(
            `${name} throw-in: the ${side} foot moves ${(slid * 1000).toFixed(1)} mm before the release, within 5 mm expected`,
          );
      }
    }
    const refused:
      | IAutoMovieMotionHumanPerformance
      | string
      | IAutoMovieMotionHumanRefusal = throwIn(undefined);
    if (
      !(
        refused instanceof HumanRefusal &&
        refused.kind === "parameter" &&
        refused.axis === "at"
      )
    )
      complaints.push(
        `${name} throw-in with no target: expected a parameter refusal on at, got ${refused instanceof HumanRefusal ? `${refused.kind} on ${refused.axis}` : typeof refused === "string" ? refused : "a plan"}`,
      );
  }
  TestValidator.equals("the sport rows on the grammar", complaints, []);
}
