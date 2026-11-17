import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSeatedReach,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanMutual,
  HumanPerformance,
  HumanSeatedReach,
  seated,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A seated reach leans the trunk about the hips only when the arm alone
 * falls short (`HumanSeatedReach`): a seated body's hips have the room their
 * flexion range leaves, a standing body no joint with room, and two seated
 * partners whose
 * arms alone cannot meet shake hands with their trunks leaned, the seat
 * kept.
 *
 * Bounds: the pelvis within 10 mm of where sitting left it (#3361's seated
 * base); at the clasp the right wrists within the pair's mean hand length
 * (the mutual join's bound, as `test_human_motion_recompose_mutual` reads
 * it); the room within the hip's flexion range of the default rig (120
 * degrees, the engine's range table).
 *
 * Scenarios, the average man and the small woman facing each other 0.7 m
 * apart, each seated at its own popliteal height:
 * 1. Sitting leaves a seat window open at the sit's end, and the room each
 *    seated body has is more than none and no more than the range.
 * 2. Standing, the same body has no room.
 * 3. A handshake joined by `HumanChain.mutual` from the two seats plans; at
 *    the clasp the wrists lie within the mean hand length; through it each
 *    pelvis stays within 10 mm.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the sit and the handshake through the public chain and reads the plans' windows and the displayed bones; a seat closed at the sit's end, a room outside its range, a refused seated handshake, wrists apart at the clasp or a pelvis off the seat fails with its numbers.
 * @evidence contracts/development/testing.md#independent-expectations The seat bound is #3361's, the clasp bound the mutual join's, the range the engine's table; every reading is of the plans' declared windows or the displayed bones.
 * @evidence contracts/development/testing.md#distinguishing-cases Seated and standing room, two bodies of different stature, and one seated mutual act.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds three short performances; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, each bound with its source and the 3 scenarios.
 */
export function test_human_motion_seated_reach(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const APART: number = 0.7;
  const SEAT: number = 0.01;
  const RANGE: number = 120;
  const bodies: Record<"a" | "b", IAutoMovieMotionHumanBody> = {
    a: motionHumanBody("m-average"),
    b: motionHumanBody("f-small"),
  };
  const sit = (who: "a" | "b"): IAutoMovieMotionHumanChain => {
    const body: IAutoMovieMotionHumanBody = bodies[who];
    const seat: IAutoMovieMotionHumanSeated.ISeat = {
      at: {
        x: 0,
        y: seated.popliteal(body),
        z:
          who === "a"
            ? body.rest.get("leftFoot")!.z - 0.1
            : APART - body.rest.get("leftFoot")!.z + 0.1,
      },
      yaw: who === "a" ? 0 : 180,
      depth: 0.45,
    };
    return HumanChain.subject(who).sit({ seat });
  };
  const perform = (composition: {
    node: IAutoMovieMotionHumanPerformance.IInput["composition"];
  }): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "seated-reach",
      performers: (["a", "b"] as const).map((subject: "a" | "b") => ({
        subject,
        body: bodies[subject],
        at: { x: 0, y: 0, z: subject === "a" ? 0 : APART },
        yaw: subject === "a" ? 0 : 180,
        proficiency: { level: "trained" as const },
      })),
      composition: composition.node,
    });

  // 1 and 2. The seat and the room.
  const sat: IAutoMovieMotionHumanPerformance = perform(
    sit("a").with(sit("b")),
  );
  for (const who of ["a", "b"] as const) {
    const segments: readonly IAutoMovieMotionHumanSegment.ISegment[] =
      sat.segments(who);
    const last: IAutoMovieMotionHumanSegment.ISegment =
      segments[segments.length - 1]!;
    const seats: IAutoMovieMotionHumanContactWindow[] =
      last.plan.contacts.filter(
        (w: IAutoMovieMotionHumanContactWindow): boolean => w.kind === "seat",
      );
    all.check(
      `${who}: the sit's seat windows are ${seats.map((w) => `${w.part} ${w.from.toFixed(3)}-${w.to.toFixed(3)}`).join(", ") || "none"}, one open at its end expected`,
      seats.some(
        (w: IAutoMovieMotionHumanContactWindow): boolean => w.to === 1,
      ),
    );
    const end: number = last.start + last.plan.duration;
    const rooms: IAutoMovieMotionHumanSeatedReach.IJoint[] =
      HumanSeatedReach.rooms({
        body: bodies[who],
        posture: last.plan.posture(last.plan.duration),
        bones: sat.bones(who, end),
        seated: true,
      });
    const hips: number =
      rooms.find(
        (j: IAutoMovieMotionHumanSeatedReach.IJoint): boolean =>
          j.bone === "hips",
      )?.room ?? 0;
    all.check(
      `${who}: seated, the hips have ${hips.toFixed(1)} degrees of room, more than none and at most ${RANGE} expected (joints ${rooms.map((j) => `${j.bone} ${j.room.toFixed(1)}`).join(", ")})`,
      hips > 0 && hips <= RANGE,
    );
    const standing: IAutoMovieMotionHumanSeatedReach.IJoint[] =
      HumanSeatedReach.rooms({
        body: bodies[who],
        posture: segments[0]!.plan.posture(0),
        bones: sat.bones(who, 0),
        seated: false,
      });
    all.check(
      `${who}: standing, the trunk has ${standing.length} joints with room, none expected`,
      standing.length === 0,
    );
  }

  // 3. A seated handshake.
  try {
    const p: IAutoMovieMotionHumanPerformance = perform(
      HumanChain.mutual(HumanMutual.handshake, {
        one: sit("a"),
        other: sit("b"),
      }),
    );
    const shake: IAutoMovieMotionHumanSegment.ISegment = p.segments("a")[1]!;
    const clasp: number =
      shake.start +
      shake.plan.events.find(
        (e: { name: string }): boolean => e.name === "clasp",
      )!.share *
        shake.plan.duration;
    const hands: number = (bodies.a.measure.hand + bodies.b.measure.hand) / 2;
    const wrists: number = Vector3.length(
      Vector3.subtract(
        p.bones("a", clasp).get("rightHand")!.worldPosition,
        p.bones("b", clasp).get("rightHand")!.worldPosition,
      ),
    );
    all.check(
      `seated handshake: at the clasp the wrists are ${(wrists * 1000).toFixed(0)} mm apart, ${(hands * 1000).toFixed(0)} mm at most expected`,
      wrists <= hands,
    );
    for (const who of ["a", "b"] as const) {
      const segment: IAutoMovieMotionHumanSegment.ISegment =
        p.segments(who)[1]!;
      const settled: IAutoMovieVector3 = p
        .bones(who, segment.entryTime)
        .get("hips")!.worldPosition;
      let moved: number = 0;
      for (let t: number = segment.entryTime; t <= segment.end; t += 1 / 24)
        moved = Math.max(
          moved,
          Vector3.length(
            Vector3.subtract(
              p.bones(who, t).get("hips")!.worldPosition,
              settled,
            ),
          ),
        );
      all.check(
        `seated handshake: ${who}'s pelvis moves up to ${(moved * 1000).toFixed(1)} mm, ${SEAT * 1000} mm at most expected`,
        moved <= SEAT,
      );
    }
  } catch (error) {
    all.check(
      `seated handshake: planned expected, refused with ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  }
  all.assert("a seated reach leans the trunk only as far as the arm needs");
}
