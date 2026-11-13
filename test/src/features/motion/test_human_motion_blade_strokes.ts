import { createPell, createSword } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanBlade,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A blade is the effector of blade work: the sword's own point and edge, as
 * the hand holds them, are what a thrust, a lunge and a cut bring onto the
 * target, on any body.
 *
 * The bounds are the motion campaign's: a contact lies within 15 mm of its
 * target at its event, and a planted foot slips at most 5 mm. The lunge's
 * length is provisional: fencing studies report the leading foot's travel,
 * and none was read, so the band is a wide one about half the stature (0.35
 * to 0.55), above a walking step's 0.41 only at its upper half.
 *
 * Scenarios, on the average man and the small woman. Each takes an arming
 * sword that lies point ahead by its grip, for use on the oblique line, once
 * (taking a tool for a use is the costly part of the film), then makes four
 * strokes in one film at four pells, each read at its own decisive instant,
 * so one film a body holds every claim:
 * 1. A thrust at a pell ahead: the sword's point is within 15 mm of the
 *    pell's target, and neither foot has left its place (5 mm).
 * 2. The same thrust at a pell 0.1 m to the side of the first: its point
 *    lands 0.1 m to the side of where the first landed, within 15 mm.
 * 3. A descending diagonal cut at a pell 25 degrees to the left: the pell's
 *    target is within 15 mm of the blade between guard and point, and over
 *    the frame before, the blade's landing part comes down more than 50 mm.
 * 4. A lunge at a pell 25 degrees to the right, a quarter of the stature
 *    farther than the thrust's: the point is within 15 mm of the target, the
 *    leading foot has travelled 0.35 to 0.55 of the stature, and at the end
 *    it is back within 5 mm of where it stood.
 * 5. With the bare hand, a thrust at a point 3 m ahead, beyond the longest
 *    advance, is refused on the reach with a feasible maximum under 1 m.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds performances through the public chain, props and input and reads the displayed sword and feet; a point or an edge off its target, a foot that slides, a lunge that does not travel or a silent miss fails.
 * @evidence contracts/development/testing.md#independent-expectations Each target is a pell's own declared contact placed in the world by the test; the bounds are the campaign's contact and slip bounds; the lunge band is stated provisional with what would source it. A wrong law lands the point elsewhere, which the distance catches; the test cannot tell a right landing reached by an ugly arm, which the verdict net owns.
 * @evidence contracts/development/testing.md#distinguishing-cases A thrust, a moved target, a cut and a lunge on three bearings; an unreachable target; two bodies of opposite build, which is what a blade's fixed length against a varying arm is sensitive to. Skill and seed are the blade skill test's, two blades meeting the exchange test's.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one film a body and one refused plan; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the bounds with their sources, why one film a body is enough and the 5 scenarios.
 */
export function test_human_motion_blade_strokes(): void {
  const FRAME: number = 1 / 24;
  const sword: ReturnType<typeof createSword> = createSword({
    kind: "armingSword",
  });
  const pell: ReturnType<typeof createPell> = createPell();
  const complaints: string[] = [];
  const placed = (
    frame: IHumanProp.IFrame,
    local: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    Vector3.add(frame.position, Quaternion.rotateVector(frame.rotation, local));
  const apart = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Vector3.length(Vector3.subtract(a, b));

  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;

    // A pell on a bearing (degrees to the performer's left) at a distance,
    // its target facing the performer, with an offset to the side.
    const stands = (
      bearing: number,
      distance: number,
      aside: number = 0,
    ): { at: IAutoMovieVector3; yaw: number } => {
      const radians: number = (bearing * Math.PI) / 180;
      return {
        at: {
          x: distance * Math.sin(radians) + aside,
          y: 0,
          z: distance * Math.cos(radians),
        },
        yaw: bearing + 180,
      };
    };
    const near: number = 0.66 * stature;
    const pells: Readonly<Record<string, { at: IAutoMovieVector3; yaw: number }>> =
      {
        ahead: stands(0, near),
        aside: stands(0, near, 0.1),
        left: stands(25, 0.5 * stature),
        right: stands(-25, near + 0.25 * stature),
      };
    const target = (id: string): IAutoMovieVector3 =>
      placed(
        HumanObject.frame(pells[id]!),
        pell.affordance("target").frame.translation,
      );
    const at = (id: string): object => ({
      blade: "sword",
      target: { kind: "prop", subject: id, point: "target" },
    });
    const film: HumanPerformance = new HumanPerformance({
      seed: "blade",
      laws: Object.values(HumanBlade),
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        // The sword lies level before the right hand, point ahead, edge
        // down, as on a table.
        HumanObject.prop("sword", sword, {
          position: { x: -0.1 * stature, y: 0.6 * stature, z: 0.18 * stature },
          rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
        }),
        ...Object.entries(pells).map(
          ([id, where]: [string, { at: IAutoMovieVector3; yaw: number }]) =>
            HumanObject.prop(id, pell, where),
        ),
      ],
      composition: HumanChain.subject("a")
        .stand({ seconds: 0.3 })
        .pickUp({
          prop: "sword",
          handle: "grip",
          use: { tip: "point", line: "oblique" },
        })
        .registered("thrust", at("ahead"), "first")
        .registered("thrust", at("aside"), "second")
        .registered("cut", { ...at("left"), from: "aboveForehand" }, "cut")
        .registered("lunge", at("right"), "lunge").node,
    });
    const act = (anchor: string): HumanSegment.ISegment =>
      film
        .segments("a")
        .find((s: HumanSegment.ISegment): boolean => s.id === anchor)!;
    const decisive = (segment: HumanSegment.ISegment): number =>
      segment.start + (segment.plan.contact ?? Number.NaN);
    const point = (seconds: number): IAutoMovieVector3 =>
      placed(
        film.prop("sword", seconds),
        sword.affordance("point").frame.translation,
      );
    const reader: HumanSignature.IReader = HumanSignature.of(film, "a", body, 0);
    const toes = (seconds: number, side: "left" | "right"): IAutoMovieVector3 =>
      HumanSignature.joint(reader, seconds, `${side}Toes`);

    // 1. A thrust from where they stand.
    const first: HumanSegment.ISegment = act("first");
    const missed: number = apart(point(decisive(first)), target("ahead"));
    if (!(missed <= 0.015))
      complaints.push(
        `${name}: the thrust's point is ${(missed * 1000).toFixed(1)} mm from the pell's target at its decisive instant, 15 mm at most expected`,
      );
    for (const side of ["left", "right"] as const) {
      const slid: number = apart(
        toes(first.entryTime, side),
        toes(decisive(first), side),
      );
      if (!(slid <= 0.005))
        complaints.push(
          `${name}: the ${side} foot moves ${(slid * 1000).toFixed(1)} mm during a thrust made standing, 5 mm at most expected`,
        );
    }

    // 2. The point follows a moved target.
    const followed: number = apart(
      point(decisive(act("second"))),
      Vector3.add(point(decisive(first)), { x: 0.1, y: 0, z: 0 }),
    );
    if (!(followed <= 0.015))
      complaints.push(
        `${name}: at a pell 0.1 m aside the thrust's point lands ${(followed * 1000).toFixed(1)} mm from 0.1 m aside of where it first landed, 15 mm at most expected`,
      );

    // 3. A descending diagonal cut.
    const cut: number = decisive(act("cut"));
    const blade = (seconds: number, share: number): IAutoMovieVector3 =>
      Vector3.lerp(film.prop("sword", seconds).position, point(seconds), share);
    let least: number = Infinity;
    let where: number = 0;
    for (let share: number = 0; share <= 1; share += 0.01) {
      const gap: number = apart(blade(cut, share), target("left"));
      if (gap < least) {
        least = gap;
        where = share;
      }
    }
    if (!(least <= 0.015))
      complaints.push(
        `${name}: at the cut's decisive instant the pell's target is ${(least * 1000).toFixed(1)} mm from the blade, 15 mm at most expected`,
      );
    const fell: number = blade(cut - FRAME, where).y - blade(cut, where).y;
    if (!(fell > 0.05))
      complaints.push(
        `${name}: over the frame before its decisive instant the descending cut's landing part comes down ${(fell * 1000).toFixed(0)} mm, more than 50 mm expected`,
      );

    // 4. A lunge.
    const lunge: HumanSegment.ISegment = act("lunge");
    const short: number = apart(point(decisive(lunge)), target("right"));
    if (!(short <= 0.015))
      complaints.push(
        `${name}: the lunge's point is ${(short * 1000).toFixed(1)} mm from the pell's target at its decisive instant, 15 mm at most expected`,
      );
    const travelled: number =
      apart(
        { ...toes(decisive(lunge), "right"), y: 0 },
        { ...toes(lunge.entryTime, "right"), y: 0 },
      ) / stature;
    if (!(travelled >= 0.35 && travelled <= 0.55))
      complaints.push(
        `${name}: the lunge's leading foot travels ${travelled.toFixed(3)} of the stature, 0.35 to 0.55 expected (provisional)`,
      );
    const back: number = apart(
      toes(lunge.end, "right"),
      toes(lunge.entryTime, "right"),
    );
    if (!(back <= 0.005))
      complaints.push(
        `${name}: after the lunge's recovery the leading foot is ${(back * 1000).toFixed(1)} mm from where it stood, 5 mm at most expected`,
      );

    // 5. Out of reach of the longest advance.
    let refused: unknown = null;
    try {
      new HumanPerformance({
        seed: "blade",
        laws: Object.values(HumanBlade),
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
          .registered("thrust", {
            target: {
              kind: "point",
              at: { x: 0, y: 0.7 * stature, z: 3 },
              frame: "world",
            },
          }).node,
      });
    } catch (error) {
      refused = error;
    }
    if (
      !(
        refused instanceof HumanRefusal &&
        refused.kind === "reach" &&
        refused.feasible?.kind === "range" &&
        refused.feasible.maximum !== null &&
        refused.feasible.maximum < 1
      )
    )
      complaints.push(
        `${name}: a bare-hand thrust at a point 3 m away: a reach refusal with the arm's length expected, got ${refused instanceof Error ? refused.message : String(refused)}`,
      );
  }
  TestValidator.equals("the blade meets its target", complaints, []);
}
