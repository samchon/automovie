import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanPerformance,
  HumanPursuit,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A pursuit answers what the person pursued does: a follower takes the
 * leader's turn instead of cutting the corner, a chase breaks off the
 * moment the quarry is within reach, and a person fleeing looks back.
 *
 * Scenarios, the average man pursuing or fleeing the small woman:
 * 1. The leader walks 3 m ahead, turns left and walks 3 m more; the
 *    follower, 2 m behind at the start, passes within 0.8 m of the corner
 *    at some instant read four times a second. The straight line to its
 *    stop passes the corner 1.2 m off, so only a path through the leader's
 *    turn comes that near (the 0.8 m is a provisional reading of "takes the
 *    turn"). At every one of those instants the two pelvises are 1.2 to
 *    2.6 m apart: no nearer than the edge of Hall's social distance, and no
 *    further than the 2 m they started at plus 0.6 m (a provisional slack
 *    of about one step), because the follower keeps the leader's pace.
 * 2. A chase cut by proximity (`until` with the chaser's sternum within
 *    1.2 m of the quarry's, the far edge of Hall's personal distance) into
 *    a stand ends earlier than the same chase uncut, and at the cut the two
 *    sternums are 1.2 m apart within 0.1 m.
 * 3. A flight with one glance back scheduled a second into it
 *    (`HumanPursuit.glances`) plans, and at the middle of the glance the
 *    head's facing is at least 30 degrees nearer the pursuer than half a
 *    second before it (a glance back turns the head toward what is behind;
 *    the 30 degrees is a provisional floor).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs each pursuit through the public chain and layers and reads the displayed bodies; a follower that cuts the corner, a chase that runs on past reach, or a flight whose head never turns fails.
 * @evidence contracts/development/testing.md#independent-expectations The corner distance is the scene's own geometry, the 1.2 m is Hall's zone edge and the cut distance is the one the composition asks; none is read from the approach law. Limitation: speed matching on the way and the gap through the turn are not read, since the first pass does not model them.
 * @evidence contracts/development/testing.md#distinguishing-cases Three behaviours of a pursuit that a standing target never shows: a bent path, a cut on distance and a scheduled layer over a run.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds four short performances in memory, reading a few dozen instants; one pair of bodies, since each claim is geometric and the bands of both orders are `test_human_motion_travel_pursuit`'s.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 3 scenarios with their bounds and which are provisional.
 */
export function test_human_motion_travel_pursuit_moves(): void {
  const complaints: string[] = [];
  const man: IHumanBody = motionHumanBody("m-average");
  const woman: IHumanBody = motionHumanBody("f-small");
  const perform = (
    composition: HumanPerformance.IInput["composition"],
    b: { at: IAutoMovieVector3; yaw: number },
    layers?: HumanPerformance.IInput["layers"],
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "pursuit-moves",
      laws: [...HUMAN_LEXICON.pursuit!],
      performers: [
        {
          subject: "a",
          body: man,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body: woman,
          at: b.at,
          yaw: b.yaw,
          proficiency: { level: "trained" },
        },
      ],
      composition,
      ...(layers === undefined ? {} : { layers }),
    });
  const reading = (performance: HumanPerformance): HumanSignature.IReader =>
    HumanSignature.of(performance, "a", man, 0);
  const pelvis = (
    reader: HumanSignature.IReader,
    t: number,
  ): IAutoMovieVector3 => {
    const l: IAutoMovieVector3 = HumanSignature.joint(reader, t, "leftUpperLeg");
    const r: IAutoMovieVector3 = HumanSignature.joint(
      reader,
      t,
      "rightUpperLeg",
    );
    return { x: (l.x + r.x) / 2, y: 0, z: (l.z + r.z) / 2 };
  };
  const target: AutoMovieMotionTarget = {
    kind: "person",
    subject: "b",
    region: "sternum",
  };

  // 1. The follower takes the leader's turn.
  try {
    const turning: HumanPerformance = perform(
      HumanChain.subject("b")
        .stand({ seconds: 0.3 })
        .walk({ to: { x: 3, y: 0, z: 5 }, via: [{ x: 0, y: 0, z: 5 }] })
        .with(
          HumanChain.subject("a")
            .stand({ seconds: 0.3 })
            .registered("follow", { target }),
        ).node,
      { at: { x: 0, y: 0, z: 2 }, yaw: 0 },
    );
    const follow: HumanSegment.ISegment = turning.segments("a")[1]!;
    const reader: HumanSignature.IReader = reading(turning);
    const led: HumanSignature.IReader = HumanSignature.of(
      turning,
      "b",
      woman,
      0,
    );
    let nearest: number = Infinity;
    let least: number = Infinity;
    let most: number = 0;
    for (const t of HumanSignature.times(follow.entryTime, follow.end, 4)) {
      const at: IAutoMovieVector3 = pelvis(reader, t);
      const ahead: IAutoMovieVector3 = pelvis(led, t);
      nearest = Math.min(nearest, Math.hypot(at.x, at.z - 5));
      least = Math.min(least, Math.hypot(at.x - ahead.x, at.z - ahead.z));
      most = Math.max(most, Math.hypot(at.x - ahead.x, at.z - ahead.z));
    }
    if (least < 1.2 || most > 2.6)
      complaints.push(
        `following through a turn: the two pelvises are ${least.toFixed(3)} to ${most.toFixed(3)} m apart on the way, 1.2 to 2.6 m expected`,
      );
    if (nearest > 0.8)
      complaints.push(
        `following through a turn: the follower passes ${nearest.toFixed(3)} m from the corner at its nearest, within 0.8 m expected`,
      );
  } catch (error) {
    complaints.push(
      `following through a turn: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // 2. A chase breaks off within reach.
  try {
    const standing: { at: IAutoMovieVector3; yaw: number } = {
      at: { x: 0, y: 0, z: 5 },
      yaw: 180,
    };
    const chase = (cut: boolean): HumanPerformance => {
      const chasing: HumanChain = HumanChain.subject("a")
        .stand({ seconds: 0.3 })
        .registered("chase", { target });
      return perform(
        HumanChain.subject("b")
          .stand({ seconds: 0.3 })
          .with(
            cut
              ? chasing
                  .until({
                    proximity: { effector: "sternum", target, distance: 1.2 },
                  })
                  .stand({ seconds: 1 })
              : chasing,
          ).node,
        standing,
      );
    };
    const whole: HumanSegment.ISegment = chase(false).segments("a")[1]!;
    const broken: HumanPerformance = chase(true);
    const cut: HumanSegment.ISegment = broken.segments("a")[1]!;
    if (!(cut.end < whole.end - 1 / 24))
      complaints.push(
        `a chase cut by proximity ends at ${cut.end.toFixed(2)} s and the uncut one at ${whole.end.toFixed(2)} s, earlier expected`,
      );
    const mine: IAutoMovieVector3 = HumanSignature.region(
      reading(broken),
      "sternum",
      cut.end,
    );
    const theirs: IAutoMovieVector3 = HumanSignature.region(
      HumanSignature.of(broken, "b", woman, 180),
      "sternum",
      cut.end,
    );
    const gap: number = Math.hypot(
      mine.x - theirs.x,
      mine.y - theirs.y,
      mine.z - theirs.z,
    );
    if (Math.abs(gap - 1.2) > 0.1)
      complaints.push(
        `a chase cut by proximity: the sternums are ${gap.toFixed(3)} m apart at the cut, 1.2 m within 0.1 expected`,
      );
  } catch (error) {
    complaints.push(
      `a chase cut by proximity: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // 3. A flight looks back.
  try {
    const glance: number = 1.3;
    const fleeing: HumanPerformance = perform(
      HumanChain.subject("b")
        .stand({ seconds: 0.3 })
        .with(
          HumanChain.subject("a")
            .stand({ seconds: 0.3 })
            .registered("flee", { from: "b", metres: 6 }),
        ).node,
      { at: { x: 0, y: 0, z: -2 }, yaw: 0 },
      { a: [HumanPursuit.glances("b", [glance])] },
    );
    const reader: HumanSignature.IReader = reading(fleeing);

    // The angle between the head's facing and the direction to the pursuer, degrees.
    const off = (t: number): number => {
      const head: IAutoMovieResolvedBone = HumanSignature.bones(reader, t).get(
        "head",
      )!;
      const q: IAutoMovieQuaternion = head.worldRotation;
      const facing: IAutoMovieVector3 = {
        x: 2 * (q.x * q.z + q.w * q.y),
        y: 0,
        z: 1 - 2 * (q.x * q.x + q.y * q.y),
      };
      const toward: IAutoMovieVector3 = {
        x: 0 - head.worldPosition.x,
        y: 0,
        z: -2 - head.worldPosition.z,
      };
      const cos: number =
        (facing.x * toward.x + facing.z * toward.z) /
        (Math.hypot(facing.x, facing.z) * Math.hypot(toward.x, toward.z));
      return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
    };
    const before: number = off(glance - 0.5);
    const during: number = off(glance + HumanPursuit.GLANCE / 2);
    if (!(before - during >= 30))
      complaints.push(
        `a flight's glance back: the head faces ${during.toFixed(0)} degrees off the pursuer during the glance and ${before.toFixed(0)} before it, at least 30 nearer expected`,
      );
  } catch (error) {
    complaints.push(
      `a flight with a glance back: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  TestValidator.equals("a pursuit answers the pursued", complaints, []);
}
