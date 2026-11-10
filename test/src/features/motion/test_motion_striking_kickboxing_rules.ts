import {
  type AutoMovieComposition,
  type IAutoMovieIntent,
  checkAutoMovieLegality,
  resolveAutoMovieSchedule,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  KickboxingRing,
  KickboxingRules,
  KnockdownCount,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The kickboxing ruleset flags fouls and attacks on a downed opponent, and
 * the ring and the count place and time the knockdown procedure.
 *
 * Scenarios:
 * 1. Punches and round kicks to the face, ribs and thigh are legal; any
 *    strike at the back of the head, the spine, the throat or the groin is a
 *    foul; a push kick at the thigh is a foul and at the abdomen is legal.
 * 2. A schedule where `a` punches `b` while `b` is in a knockdown is
 *    flagged once; the same punch after `b`'s next action has started, or
 *    before the knockdown, is not. A knee followed at once by a punch breaks
 *    the single clinch knee; with a pause between them it does not.
 * 3. A ring turned 30 degrees reports its corners a margin inside the ropes,
 *    keeps inside points and clamps outside ones onto the margin.
 * 4. The count's numbers land one second apart from its start, numbers
 *    outside one to ten throw, and the corner chosen is the neutral corner
 *    farther from the fallen fighter.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public foul test, the engine's legality check over the ruleset, the ring and the count, and reads their verdicts and points; a missed foul, a false flag, a corner on the wrong diagonal or a clamp outside the margin fails.
 * @evidence contracts/development/testing.md#independent-expectations Fouls are the GLORY rule list; the downed window is the knockdown's start to the next action's start; ring points follow from the square's half side and the rotation.
 * @evidence contracts/development/testing.md#distinguishing-cases Legal and foul regions, punch and both kicks, strikes before, during and after a knockdown, inside and outside points, both neutral corners.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit over hand-built schedules; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 scenarios and what each pins.
 */
export function test_motion_striking_kickboxing_rules(): void {
  const at = (region: string) => ({
    at: { kind: "person", subject: "b", region },
  });
  TestValidator.predicate(
    "legal targets",
    ["face", "ribsLeft", "thighOuterLeft"].every(
      (r: string): boolean =>
        KickboxingRules.foul("punch", at(r)) === null &&
        KickboxingRules.foul("kick", { ...at(r), technique: "round" }) === null,
    ),
  );
  TestValidator.predicate(
    "foul targets",
    ["headBack", "upperBack", "throat", "groin"].every(
      (r: string): boolean => KickboxingRules.foul("punch", at(r)) !== null,
    ),
  );
  TestValidator.predicate(
    "linear kicks to the legs",
    KickboxingRules.foul("kick", {
      ...at("thighFrontLeft"),
      technique: "push",
    }) !== null &&
      KickboxingRules.foul("kick", { ...at("abdomen"), technique: "push" }) ===
        null,
  );

  const intent = (
    subject: string,
    capability: string,
    params: object,
    anchor?: string,
  ): AutoMovieComposition => ({
    kind: "intent",
    intent: {
      subject,
      capability,
      parameters: { params },
      ...(anchor === undefined ? {} : { anchor }),
    } satisfies IAutoMovieIntent,
  });
  const durations: Record<string, number> = {
    knockdown: 2,
    punch: 0.6,
    stand: 1,
    guard: 1,
  };
  const verdicts = (strikeAt: number): number => {
    const composition: AutoMovieComposition = {
      kind: "parallel",
      parts: [
        {
          kind: "sequence",
          parts: [
            intent("b", "guard", {}),
            intent("b", "knockdown", {}),
            intent("b", "guard", {}),
          ],
        },
        {
          kind: "sequence",
          parts: [
            intent("a", "stand", { seconds: strikeAt }),
            intent("a", "punch", at("face")),
          ],
        },
      ],
    };
    const schedule = resolveAutoMovieSchedule(composition, {
      timing: (i: IAutoMovieIntent) => ({
        duration:
          i.capability === "stand"
            ? (i.parameters?.params as { seconds: number }).seconds
            : durations[i.capability]!,
      }),
    });
    return checkAutoMovieLegality(schedule, KickboxingRules.rules).length;
  };
  TestValidator.predicate(
    "a strike at the downed opponent is flagged once",
    verdicts(1.5) === 1,
  );
  TestValidator.predicate(
    "strikes before or after the knockdown are not",
    verdicts(0.5) === 0 && verdicts(3.5) === 0,
  );
  const knees = (gap: boolean): number => {
    const parts: AutoMovieComposition[] = [
      intent("a", "knee", at("abdomen")),
      ...(gap ? [intent("a", "stand", { seconds: 1 })] : []),
      intent("a", "punch", at("face")),
    ];
    const schedule = resolveAutoMovieSchedule(
      { kind: "sequence", parts },
      {
        timing: (i: IAutoMovieIntent) => ({
          duration: i.capability === "stand" ? 1 : 0.8,
        }),
      },
    );
    return checkAutoMovieLegality(schedule, KickboxingRules.rules).filter(
      (v) => v.rule === "single-clinch-knee",
    ).length;
  };
  TestValidator.predicate(
    "a knee chained to a punch keeps the clinch; a disengaged one does not",
    knees(false) === 1 && knees(true) === 0,
  );

  const ring: KickboxingRing.IRing = {
    centre: { x: 1, y: 0, z: 2 },
    size: 6,
    yaw: 30,
  };
  const near = (a: IAutoMovieVector3, b: IAutoMovieVector3): boolean =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < 1e-9;
  const blue: IAutoMovieVector3 = KickboxingRing.corner(ring, "blue", 0.5);
  const r: number = (30 * Math.PI) / 180;
  TestValidator.predicate(
    "corner a margin inside",
    near(blue, {
      x: 1 + 2.5 * Math.cos(r) + 2.5 * Math.sin(r),
      y: 0,
      z: 2 - 2.5 * Math.sin(r) + 2.5 * Math.cos(r),
    }) &&
      KickboxingRing.inside(ring, blue, 0.5) &&
      !KickboxingRing.inside(ring, blue, 0.6),
  );
  const outside: IAutoMovieVector3 = { x: 20, y: 0, z: 2 };
  const clamped: IAutoMovieVector3 = KickboxingRing.clamp(ring, outside, 0.4);
  TestValidator.predicate(
    "clamp onto the margin",
    !KickboxingRing.inside(ring, outside) &&
      KickboxingRing.inside(ring, clamped, 0.4) &&
      !KickboxingRing.inside(ring, clamped, 0.41),
  );
  TestValidator.predicate(
    "inside points stay",
    near(KickboxingRing.clamp(ring, { x: 1.5, y: 0, z: 2.2 }, 0.4), {
      x: 1.5,
      y: 0,
      z: 2.2,
    }),
  );

  TestValidator.predicate(
    "count numbers",
    KnockdownCount.number(157, 3) === 160 &&
      KnockdownCount.number(157, KnockdownCount.TEN) === 167,
  );
  TestValidator.error("count zero", (): unknown => KnockdownCount.number(0, 0));
  TestValidator.error("count eleven", (): unknown =>
    KnockdownCount.number(0, 11),
  );
  const fallen: IAutoMovieVector3 = KickboxingRing.corner(ring, "neutralA", 1);
  TestValidator.predicate(
    "farther neutral corner",
    near(
      KnockdownCount.corner(ring, fallen, 0.5),
      KickboxingRing.corner(ring, "neutralB", 0.5),
    ),
  );
}
