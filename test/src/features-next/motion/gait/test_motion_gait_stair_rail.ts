import { createStairs } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanClimbStairs,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanFoot, HumanHand } from "@automovie/motions/internal";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * Climb a fixed flight with a hand bearing on its rail, release and turn on the landing.
 *
 * Scenarios:
 * 1. An average man and a small woman climb four steps of a stair archetype
 *    with the left hand on its left rail, then walk onto the landing turning
 *    left.
 * 2. The grip is a loaded window on the stair prop, the displayed grip stays
 *    within 18 mm of the finite rail and slides more than 25 cm along it.
 * 3. The rail lets go before the exit walk; the feet end on the landing's
 *    height and the hips face the turn.
 * 4. The far rail, beyond the left hand's reach, is refused naming it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the staged fixture, loaded contact and onward beat.
 * @evidence contracts/development/testing.md#behavioral-verification Reads canonical grip, foot and hips bones and the named contact windows on the complete path.
 * @evidence contracts/development/testing.md#independent-expectations Uses the fixed archetype's authored bar line and landing height as independent geometry.
 * @evidence contracts/development/testing.md#distinguishing-cases Verifies two supported bodies and a far-side rail that cannot be reached.
 * @evidence contracts/development/testing.md#execution-ownership Uses the public HumanChain and installed stairs package in memory.
 */
export function test_motion_gait_stair_rail(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const riser: number = 0.17;
  const tread: number = 0.28;
  const count: number = 4;
  const model = createStairs({
    steps: count,
    riser,
    tread,
    occupancy: "under50",
    rail: "both",
  });
  const stairs = HumanObject.prop("stairs", model, {
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
    fixed: true,
  });
  const rail = model.affordances.find((a) => a.id === "leftRail")!;
  const axis = Quaternion.rotateVector(rail.frame.rotation, {
    x: 1,
    y: 0,
    z: 0,
  });
  const landing = model.affordances.find((a) => a.id === "landing")!;
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const performer = {
      subject: "a",
      body,
      at: { x: 0.19, y: 0, z: -0.42 },
      yaw: 0,
      proficiency: { level: "trained" as const },
    };
    const standing = new HumanPerformance({
      seed: "stair-rail-standing",
      performers: [performer],
      composition: HumanChain.subject("a").stand({ hold: 0.25 }).node,
    });
    const entered = standing.bones("a", 0);
    const start: number = -Math.max(
      HumanFoot.sockets(body, entered, "left")[2]!.point.z,
      HumanFoot.sockets(body, entered, "right")[2]!.point.z,
    );
    const stage = (point: string): HumanPerformance => {
      const p: IAutoMovieMotionHumanClimbStairs.IParams = {
        count,
        riser,
        tread,
        start,
        on: "stairs",
        rail: { point, hand: "left" },
      };
      return new HumanPerformance({
        seed: "stair-rail",
        performers: [performer],
        props: [stairs],
        composition: HumanChain.subject("a")
          .climbStairs(p)
          .walk({
            to: { x: -0.18, y: count * riser, z: landing.frame.translation.z },
            face: -90,
            on: { prop: "stairs" },
            pace: "slow",
          }).node,
      });
    };
    let film: HumanPerformance;
    try {
      film = stage(rail.id);
    } catch (error) {
      all.check(
        name +
          ": the real stair and near rail admit the climb: " +
          String(error),
        false,
      );
      continue;
    }
    const climb: IAutoMovieMotionHumanSegment = film.segments("a")[0]!;
    const hand = climb.plan.contacts.find(
      (contact) => contact.part === "leftHand",
    );
    all.check(
      name + ": the left grip carries a positive share on the fixture",
      hand?.kind === "grip" &&
        hand.support.kind === "prop" &&
        hand.support.subject === stairs.subject &&
        (hand.load ?? 0) > 0,
    );
    if (hand !== undefined) {
      let worst: number = 0;
      let first: number = Infinity;
      let last: number = -Infinity;
      for (let i: number = 0; i <= 30; i++) {
        const share: number = hand.from + ((hand.to - hand.from) * i) / 30;
        const socket: IAutoMovieVector3 = HumanHand.frame(
          body,
          film.bones("a", climb.start + share * climb.plan.duration),
          "left",
          "grip",
        ).point;
        const outward = Vector3.subtract(socket, rail.frame.translation);
        const distance = Vector3.dot(outward, axis);
        if (i === 0) first = distance;
        if (i === 30) last = distance;
        worst = Math.max(
          worst,
          Vector3.length(
            Vector3.subtract(
              outward,
              Vector3.scale(
                axis,
                Math.max(
                  -rail.length! / 2,
                  Math.min(rail.length! / 2, distance),
                ),
              ),
            ),
          ),
        );
      }
      all.check(
        name + ": the posed grip advances along the finite rail, miss " + worst,
        worst <= 0.018 && last - first > 0.25,
      );
      all.check(
        name + ": rail support releases before the exit beat",
        hand.to < 1,
      );
    }
    const final = film.bones("a", film.duration);
    const heading = Quaternion.rotateVector(final.get("hips")!.worldRotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    all.check(
      name +
        ": the feet finish on the physical landing and the torso turns with the exit",
      Math.abs(
        HumanFoot.sockets(body, final, "left")[1]!.point.y - count * riser,
      ) <= 0.015 &&
        final.get("hips")!.worldPosition.z > (count - 1) * tread &&
        -heading.x > 0.85,
    );
    let failure: unknown;
    try {
      stage("rightRail");
    } catch (error) {
      failure = error;
    }
    all.check(
      name +
        ": an unreachable bar identifies its named rail: " +
        String(failure),
      failure instanceof HumanRefusal &&
        failure.axis === "rail.point" &&
        failure.value === "rightRail",
    );
  }
  all.assert(
    "the public stair travel bears on a real rail and turns on its landing",
  );
}
