import { Quaternion, Transform, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  humanRidePosting,
  humanRideWindows,
  placeRideFeet,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * The `HumanRide.ride` law's own logic: its rising trot (`humanRidePosting`),
 * the seat lifting `post · sin²(π s)` along the mount's up over each stride's
 * progress `s`, read by a stride time or on a cue track's strides; and its
 * support windows (`humanRideWindows`), the seat bearing on the support and
 * each resting foot planted by its ball on it or on its pedal or stirrup.
 *
 * Scenarios:
 *
 * 1. Posting 0.1 m at a 0.8 s stride, the seat is down at the stride's start and
 *    up the whole 0.1 m at its middle, 0.4 s; on strides at 1, 1.5 and 2.5 s of
 *    a ride starting at 1 s, 0.75 s in lies halfway through the second stride
 *    and past the last there is no stride.
 * 2. A cue track of one instant is refused.
 * 3. A seated ride on a horse plants the left foot on its stirrup point and the
 *    right on the horse, the seat bearing throughout; rising, the seat is left
 *    to the stirrups; a foot placed on its rest plants from `take`.
 * 4. A declared mount stirrup carries the displayed ankle, its ball and the
 *    knee pole through a translating and turning site. A pedal or a support
 *    without the exact named ball plant keeps the ordinary ride path.
 */
export function test_motions_lexicon_ride(): void {
  // 1. Posting.
  const timed: humanRidePosting.IPosting = humanRidePosting(
    { kind: "period", seconds: 0.8 },
    0,
    0.1,
  );
  const cued: humanRidePosting.IPosting = humanRidePosting(
    { kind: "strides", cue: "hooves", strides: [1, 1.5, 2.5] },
    1,
    0.1,
  );
  TestValidator.predicate(
    "the rising trot",
    timed.lift(0) === 0 &&
      nclose(timed.lift(0.4), 0.1, 1e-12) &&
      nclose(cued.stride(1)!, 0.5, 1e-12) &&
      cued.stride(2) === undefined &&
      humanRidePosting(undefined, 0, 0.1).lift(0.4) === 0,
  );

  // 2. Refused.
  TestValidator.predicate(
    "one stride's instant",
    throwsError(() =>
      humanRidePosting(
        { kind: "strides", cue: "hooves", strides: [1] },
        0,
        0.1,
      ),
    ),
  );

  // 3. The windows.
  const windows = (rising: boolean): IAutoMovieMotionHumanContactWindow[] =>
    humanRideWindows({
      on: "horse",
      seconds: 4,
      kept: [],
      resting: [{ side: "left", pedal: "leftStirrup" }, { side: "right" }],
      placed: rising ? [] : ["right"],
      take: 0.6,
      rising,
    });
  const seated: IAutoMovieMotionHumanContactWindow[] = windows(false);
  const stirrup: IAutoMovieMotionHumanContactWindow["support"] =
    seated[1]!.support;
  TestValidator.predicate(
    "the seat and the feet",
    seated[0]!.part === "seat" &&
      seated[0]!.from === 0 &&
      seated[0]!.to === 1 &&
      stirrup.kind === "prop" &&
      stirrup.point === "leftStirrup" &&
      seated[1]!.socket === "ball" &&
      nclose(seated[3]!.from, 0.15, 1e-12) &&
      windows(true).every(
        (w: IAutoMovieMotionHumanContactWindow): boolean => w.part !== "seat",
      ),
  );

  // 4. The kept stirrup uses the actual incoming pose and complete site frame.
  const forward: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const start: IAutoMovieRigidTransform = {
    position: { x: 1, y: 2, z: 3 },
    rotation: Quaternion.fromAxisAngle(up, 90),
  };
  const turned: IAutoMovieRigidTransform = {
    position: { x: 4, y: 6, z: 8 },
    rotation: Quaternion.fromAxisAngle(up, 180),
  };
  const id: string = "leftStirrup";
  const probe: placeRideFeet.IRetain = {
    entry: {
      base: {
        kind: "seated",
        seat: { at: start.position, yaw: 90, astride: true },
      },
      supports: [
        {
          part: "leftFoot",
          kind: "plant",
          socket: "ball",
          support: { kind: "prop", subject: "horse", point: id },
        },
      ],
    },
    foot: {
      ankle: { x: 2, y: 2, z: 3 },
      rotation: Quaternion.identity(),
      planted: true,
    },
    goal: {
      point: start.position,
      bend: { x: 1, y: 3, z: 4 },
      rotation: start.rotation,
      contact: { x: 0, y: 0, z: 0.2 },
      seed: { swivel: 30, branch: 1 },
    },
    support: {
      prop: {
        subject: "horse",
        frame: start,
        points: { [id]: { point: start.position, normal: up } },
        affordances: [
          { id, kind: "stirrup", frame: Transform.identity(), extent: null },
        ],
      },
      frame: () => start,
      site: (_id: string, film: number) => (film === 3 ? start : turned),
    },
    side: "left",
    id,
    start: 3,
  };
  const kept: placeRideFeet.IRetained = placeRideFeet.retain(probe)!;
  const read: IAutoMovieHumanLimbGoal = kept.at(5);
  // Bound roundoff from two relative frame operations, about 10 m in scale.
  const roundoff: number = 32 * Number.EPSILON * 10;
  TestValidator.predicate(
    "a named stirrup retains the displayed ankle, ball, knee pole and branch",
    Vector3.distance(kept.at(3).point, probe.foot.ankle) < roundoff &&
      Vector3.distance(read.point, { x: 4, y: 6, z: 7 }) < roundoff &&
      Vector3.distance(read.bend, { x: 5, y: 7, z: 8 }) < roundoff &&
      Vector3.distance(Quaternion.rotateVector(read.rotation!, forward), {
        x: 1,
        y: 0,
        z: 0,
      }) < roundoff &&
      Vector3.distance(
        Vector3.add(
          read.point,
          Quaternion.rotateVector(read.rotation!, read.contact!),
        ),
        { x: 4.2, y: 6, z: 7 },
      ) < roundoff &&
      read.planted === true &&
      read.seed === probe.goal.seed,
  );
  TestValidator.predicate(
    "only an exact incoming stirrup plant is retained",
    placeRideFeet.retain({
      ...probe,
      entry: { ...probe.entry, supports: [] },
    }) === undefined &&
      placeRideFeet.retain({
        ...probe,
        support: {
          ...probe.support,
          prop: {
            ...probe.support.prop,
            affordances: [
              { id, kind: "pedal", frame: Transform.identity(), extent: null },
            ],
          },
        },
      }) === undefined,
  );
}
