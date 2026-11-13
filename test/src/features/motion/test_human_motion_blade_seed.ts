import { createPell, createSword } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanBlade,
  HumanChain,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A seed varies a take of a lunge without moving where its point lands, and
 * the same seed replays the take.
 *
 * The landing bound is the campaign's 15 mm contact bound at the decisive
 * instant; a replay is the same film, compared to a nanosecond and a
 * micrometre.
 *
 * Scenarios, on the average man and the small woman lunging with an arming
 * sword at a pell 0.91 of the stature away, trained:
 * 1. Under two seeds, at each take's decisive instant the point is within
 *    15 mm of the pell's target, and the two takes do not have the same
 *    decisive instant.
 * 2. The first seed built again gives the same decisive instant and the same
 *    point.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds performances through the public chain and input and reads the displayed sword point; a seed that moves the landing, a seed that changes nothing, or a take that does not replay fails.
 * @evidence contracts/development/testing.md#independent-expectations The landing bound is the campaign's; that seeds differ and that one seed repeats is the variation contract. A law that ignored its seed or drew outside its stream fails one of the two; the test does not judge the size of the variation, which the variation report owns.
 * @evidence contracts/development/testing.md#distinguishing-cases Two seeds and a repeated seed on two bodies of opposite build; skill is the blade skill test's.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds three films a body, each about 20 s while taking a tool for a use costs that; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the bounds and the 2 scenarios.
 */
export function test_human_motion_blade_seed(): void {
  const sword: ReturnType<typeof createSword> = createSword({
    kind: "armingSword",
  });
  const pell: ReturnType<typeof createPell> = createPell();
  const tip: IAutoMovieVector3 = sword.affordance("point").frame.translation;
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
    const place: { at: IAutoMovieVector3; yaw: number } = {
      at: { x: 0, y: 0, z: 0.91 * stature },
      yaw: 180,
    };
    const target: IAutoMovieVector3 = Vector3.add(
      place.at,
      Quaternion.rotateVector(
        HumanObject.frame(place).rotation,
        pell.affordance("target").frame.translation,
      ),
    );
    const stage = (
      level: "novice" | "trained" | "elite",
      seed: string,
    ): {
      point: (seconds: number) => IAutoMovieVector3;
      act: HumanSegment.ISegment;
      at: number;
    } => {
      const film: HumanPerformance = new HumanPerformance({
        seed,
        laws: Object.values(HumanBlade),
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level },
          },
        ],
        props: [
          // The sword lies level before the right hand, point ahead.
          HumanObject.prop("sword", sword, {
            position: {
              x: -0.1 * stature,
              y: 0.6 * stature,
              z: 0.18 * stature,
            },
            rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
          }),
          HumanObject.prop("pell", pell, place),
        ],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .pickUp({
            prop: "sword",
            handle: "grip",
            use: { tip: "point", line: "oblique" },
          })
          .registered("lunge", {
            blade: "sword",
            target: { kind: "prop", subject: "pell", point: "target" },
          }).node,
      });
      const act: HumanSegment.ISegment = film
        .segments("a")
        .find((s: HumanSegment.ISegment): boolean => s.name === "lunge")!;
      return {
        act,
        at: act.start + (act.plan.contact ?? Number.NaN),
        point: (seconds: number): IAutoMovieVector3 => {
          const frame: IHumanProp.IFrame = film.prop("sword", seconds);
          return Vector3.add(
            frame.position,
            Quaternion.rotateVector(frame.rotation, tip),
          );
        },
      };
    };

    // 1. Seeds vary the take, not the landing.
    const instants: Set<string> = new Set();
    const takes: ReturnType<typeof stage>[] = [];
    for (const seed of ["s1", "s2"]) {
      const take: ReturnType<typeof stage> = stage("trained", seed);
      takes.push(take);
      instants.add((take.at - take.act.entryTime).toFixed(4));
      const missed: number = Vector3.length(
        Vector3.subtract(take.point(take.at), target),
      );
      if (!(missed <= 0.015))
        complaints.push(
          `${name}, seed ${seed}: the lunge's point is ${(missed * 1000).toFixed(1)} mm from the target, 15 mm at most expected`,
        );
    }
    if (instants.size < 2)
      complaints.push(
        `${name}: two seeds give one decisive instant, ${[...instants].join(", ")} s into the lunge; a varied timing expected`,
      );

    // 2. A seed replays.
    const first: ReturnType<typeof stage> = takes[0]!;
    const again: ReturnType<typeof stage> = stage("trained", "s1");
    const apart: number = Vector3.length(
      Vector3.subtract(first.point(first.at), again.point(again.at)),
    );
    if (!(Math.abs(first.at - again.at) <= 1e-9 && apart <= 1e-6))
      complaints.push(
        `${name}: the same seed gives decisive instants ${first.at} and ${again.at} s and points ${(apart * 1e6).toFixed(1)} um apart`,
      );
  }
  TestValidator.equals("a seed varies a lunge and replays it", complaints, []);
}
