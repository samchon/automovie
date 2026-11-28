import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineTransform,
  AutoMovieEngineVector3,
  AutoMovieEnginePhysics,
} from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  humanRidePosting
} from "../../../../../packages/motions/src/lexicon/internal/humanRidePosting";
import {
  humanRideWindows
} from "../../../../../packages/motions/src/lexicon/internal/humanRideWindows";
import {
  placeRideFeet
} from "../../../../../packages/motions/src/lexicon/internal/placeRideFeet";
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
 * 5. A newly acquired foot drops the entry fit and plants on its moving tread.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines rising trot, exact support-window authority and animation of acquired stirrups and seat rest.
 * @evidence contracts/development/testing.md#behavioral-verification Samples posting and authored stride tracks, builds seated and rising contact windows and reads moving stirrup and ordinary pedal goals.
 * @evidence contracts/development/testing.md#independent-expectations The specified 0.1 m post peaks midway through a 0.8 s stride. Only an exact incoming ball plant retains its seed and acquisition advances the new moving tread goal.
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
    rotation: AutoMovieEngineQuaternion.fromAxisAngle(up, 90),
  };
  const turned: IAutoMovieRigidTransform = {
    position: { x: 4, y: 6, z: 8 },
    rotation: AutoMovieEngineQuaternion.fromAxisAngle(up, 180),
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
      rotation: AutoMovieEngineQuaternion.identity(),
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
          { id, kind: "stirrup", frame: AutoMovieEngineTransform.identity(), extent: null },
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
    AutoMovieEngineVector3.distance(kept.at(3).point, probe.foot.ankle) < roundoff &&
      AutoMovieEngineVector3.distance(read.point, { x: 4, y: 6, z: 7 }) < roundoff &&
      AutoMovieEngineVector3.distance(read.bend, { x: 5, y: 7, z: 8 }) < roundoff &&
      AutoMovieEngineVector3.distance(AutoMovieEngineQuaternion.rotateVector(read.rotation!, forward), {
        x: 1,
        y: 0,
        z: 0,
      }) < roundoff &&
      AutoMovieEngineVector3.distance(
        AutoMovieEngineVector3.add(
          read.point,
          AutoMovieEngineQuaternion.rotateVector(read.rotation!, read.contact!),
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
              { id, kind: "pedal", frame: AutoMovieEngineTransform.identity(), extent: null },
            ],
          },
        },
      }) === undefined,
  );

  testFootAcquisition();
}

/** A newly acquired foot uses the new material goal instead of its entry fit. */
function testFootAcquisition(): void {
  const entry: IAutoMovieHumanLimbGoal = {
    point: { x: 0, y: 0.3, z: 0 },
    bend: { x: 0, y: 0.3, z: 0.3 },
    rotation: AutoMovieEngineQuaternion.identity(),
    contact: { x: 0, y: -0.05, z: 0.1 },
    planted: true,
    seed: { swivel: 25, branch: 1 },
  };
  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: { leftLeg: entry },
  };
  const rotation: IAutoMovieRigidTransform["rotation"] =
    AutoMovieEngineQuaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 30);
  const normal: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const foot: placeRideFeet.IRideFoot = {
    side: "left",
    id: "tread",
    contact: entry.contact!,
    at: (film: number) => ({
      point: { x: film / 10, y: 0.05, z: 0.2 },
      normal,
    }),
  };
  const seconds: readonly number[] = [3, 1, 2, 3];
  const acquired: IAutoMovieHumanLimbGoal[] = seconds.map(
    (second: number): IAutoMovieHumanLimbGoal =>
      placeRideFeet.acquire(foot, posture, second, 1),
  );
  TestValidator.predicate(
    "the cut keeps the original seeded shape",
    placeRideFeet.acquire(foot, posture, 0, 0) === entry,
  );
  const middle: IAutoMovieHumanLimbGoal = placeRideFeet.acquire(
    foot,
    posture,
    2,
    0.5,
  );
  TestValidator.predicate(
    "the acquisition midpoint advances the socket and drops the entry seed",
    middle.seed === undefined &&
      AutoMovieEngineVector3.distance(
        AutoMovieEngineVector3.add(
          middle.point,
          AutoMovieEngineQuaternion.rotateVector(middle.rotation!, foot.contact),
        ),
        { x: 0.1, y: 0.15, z: 0.15 },
      ) < 1e-12,
  );
  TestValidator.equals(
    "out-of-order reads repeat the fit goal",
    acquired[0],
    acquired[3],
  );

  // The synthetic solid has its lower face through the ball socket. Its
  // contact fits inside the finite 20 cm by 24 cm tread.
  const sole: IAutoMoviePhysicalShape = {
    id: "sole",
    material: "fixture",
    kind: "box",
    halfExtents: { x: 0.04, y: 0.01, z: 0.06 },
    transform: {
      position: { x: 0, y: -0.04, z: 0.1 },
      rotation: AutoMovieEngineQuaternion.identity(),
    },
  };
  const outline: readonly IAutoMovieVector3[] = [
    { x: -0.1, y: 0, z: -0.12 },
    { x: -0.1, y: 0, z: 0.12 },
    { x: 0.1, y: 0, z: 0.12 },
    { x: 0.1, y: 0, z: -0.12 },
  ];
  for (const [index, second] of seconds.entries()) {
    const goal: IAutoMovieHumanLimbGoal = acquired[index]!;
    const contact: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeFaceContact> =
      AutoMovieEnginePhysics.physicalShapeFaceContact(
        { position: goal.point, rotation: goal.rotation! },
        sole,
        { position: foot.at(second).point, rotation },
        outline,
      );
    TestValidator.predicate(
      `the fresh goal places a supported sole at ${second}s`,
      goal.seed === undefined &&
        goal.planted === true &&
        contact !== undefined &&
        nclose(contact.clearance, 0, 1e-12) &&
        AutoMovieEngineVector3.distance(contact.point, { x: 0, y: 0, z: 0 }) < 1e-12,
    );
  }
}
