import { createCar, createDoor } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSignature,
  IAutoMovieMotionObstacleAperture,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGait,
  AutoMovieMotionHumanRide,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
  HumanVerdicts,
} from "@automovie/motions";
import { HUMAN_LEXICON, HumanObstacle } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * An interceptor heads a walking person off: it arrives within arm's reach of
 * where the person is at that moment, not where they were when it set off, and
 * it does not run into them.
 *
 * Scenarios: the average man heading off the small woman and the reverse; the
 * person walks 6 m across the runner's front, from 3 m to the left to 3 m to
 * the right at 5 m ahead, and the runner starts as they do:
 *
 * 1. When the run ends, the runner's sternum is no further from the person's
 *    sternum, as displayed at that instant, than the two people's arms together
 *    reach (upper arm, forearm and hand of each), measured horizontally: a grab
 *    can follow.
 * 2. At that instant the two bodies overlap by no more than 10 mm (the campaign's
 *    penetration bound).
 * 3. The run ends more than 1 m, across the front, from where the person stood
 *    when it began: it went to where they are, not where they were.
 * 4. Heading off a person composed after the runner plans as well: the performance
 *    places a read person on demand, so their path is known whatever the order
 *    of composition.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs an interception of a walking person through the public chain and reads both displayed bodies at the run's end; a run to the person's starting place, a run that ends out of reach or inside them, or a silent plan against an unknown path fails.
 * @evidence contracts/development/testing.md#independent-expectations Within reach at the moment of arrival is what heading someone off means; the reach is the bodies' own arm lengths and the 10 mm the campaign's bound, neither read from the law. Limitation: the bearing through the run is not read, since one straight run holds it trivially while both go straight.
 * @evidence contracts/development/testing.md#distinguishing-cases The two orders of a tall and a short person, a target that moves across the front so its start and its meeting place differ by metres, and the reversed order of composition, planned by on-demand placement.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds four short performances in memory; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 4 scenarios with their bounds.
 */
export function test_motion_gait_travel_target(): void {
  checkMovingHandle();
  checkSeatEntrance();
  checkSearchStop();
  checkMovingTarget();
  const complaints: string[] = [];
  for (const names of [["m-average", "f-small"]] as const) {
    const bodies: readonly [
      IAutoMovieMotionHumanBody,
      IAutoMovieMotionHumanBody,
    ] = [motionHumanBody(names[0]), motionHumanBody(names[1])];
    const label: string = `${names[0]} heading off ${names[1]}`;
    const walking: IAutoMovieMotionHumanChain = HumanChain.subject("b")
      .stand({ hold: 0.3 })
      .walk({ to: { x: 3, y: 0, z: 5 } });
    const running: IAutoMovieMotionHumanChain = HumanChain.subject("a")
      .stand({ hold: 0.3 })
      .registered("intercept", { target: "b" });
    const perform = (
      first: IAutoMovieMotionHumanChain,
      second: IAutoMovieMotionHumanChain,
    ): IAutoMovieMotionHumanPerformance =>
      new HumanPerformance({
        seed: "intercept",
        laws: [...HUMAN_LEXICON.pursuit!],
        performers: [
          {
            subject: "a",
            body: bodies[0],
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          {
            subject: "b",
            body: bodies[1],
            at: { x: -3, y: 0, z: 5 },
            yaw: 90,
            proficiency: { level: "trained" },
          },
        ],
        composition: first.with(second).node,
      });

    // 4. The person's path is known whatever the order: a read person is
    // placed on demand.
    let thrown: unknown = null;
    try {
      perform(running, walking);
    } catch (error) {
      thrown = error;
    }
    if (thrown !== null)
      complaints.push(
        `${label}, composed before them: expected the interception to plan, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
      );

    // 1 to 3. Within reach of where they are.
    let performance: IAutoMovieMotionHumanPerformance;
    try {
      performance = perform(walking, running);
    } catch (error) {
      complaints.push(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const end: number = performance.segments("a")[1]!.end;
    const a: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
      performance,
      "a",
      bodies[0],
      0,
    );
    const b: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
      performance,
      "b",
      bodies[1],
      90,
    );
    const mine: IAutoMovieVector3 = HumanSignature.region(a, "sternum", end);
    const theirs: IAutoMovieVector3 = HumanSignature.region(b, "sternum", end);
    const gap: number = Math.hypot(mine.x - theirs.x, mine.z - theirs.z);
    const arms: number = bodies
      .map(
        (body: IAutoMovieMotionHumanBody): number =>
          body.measure.upperArm + body.measure.forearm + body.measure.hand,
      )
      .reduce((sum: number, arm: number): number => sum + arm, 0);
    if (gap > arms)
      complaints.push(
        `${label}: the chests are ${gap.toFixed(3)} m apart when the run ends, within the two arms' ${arms.toFixed(3)} m expected`,
      );
    const apart: number = HumanSignature.apart(a, b, end);
    if (apart < -0.01)
      complaints.push(
        `${label}: the bodies overlap by ${(-apart * 1000).toFixed(1)} mm when the run ends, at most 10 mm expected`,
      );
    if (!(mine.x > -2))
      complaints.push(
        `${label}: the run ends ${(mine.x + 3).toFixed(3)} m across from where the person stood, more than 1 m expected`,
      );
  }
  TestValidator.equals("an interceptor heads a walker off", complaints, []);
}

/** A single waypoint owns the stop, planted feet and opposite scanning bearings. */
function checkSearchStop(): void {
  const body = motionHumanBody("m-average"),
    waypoint = { x: 0, y: 0, z: 2 };
  const pause = 1.6;
  const performance = new HumanPerformance({
    seed: "search-stop",
    performers: [
      {
        subject: "walker",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: AutoMovieMotionHumanGait.HumanPursuit.search(
      HumanChain.subject("walker"),
      [waypoint],
      "stop",
      pause,
    ).node,
    layers: {
      walker: AutoMovieMotionHumanGait.HumanPursuit.sweeps(1, "stop", pause),
    },
  });
  const [walk, stop] = performance.segments("walker");
  TestValidator.equals(
    "the waypoint is followed by its authored pause",
    stop!.end - stop!.entryTime,
    pause,
  );
  const reader = HumanSignature(performance, "walker", body, 0);
  const middle = (stop!.entryTime + stop!.end) / 2;
  const left = HumanSignature.joint(reader, middle, "leftUpperLeg"),
    right = HumanSignature.joint(reader, middle, "rightUpperLeg");
  TestValidator.predicate(
    "stop is at the requested waypoint",
    Math.hypot(
      (left.x + right.x) / 2 - waypoint.x,
      (left.z + right.z) / 2 - waypoint.z,
    ) <= 0.3,
  );
  TestValidator.predicate(
    "both feet bear during the pause",
    HumanSignature.bears(reader, middle, "left") &&
      HumanSignature.bears(reader, middle, "right"),
  );
  for (const [share, side] of [
    [0.25, 1],
    [0.75, -1],
  ] as const) {
    const bones = performance.bones("walker", stop!.entryTime + share * pause);
    const heading = (bone: "head" | "hips"): number => {
      const q = bones.get(bone)!.worldRotation;
      return (
        (Math.atan2(
          2 * (q.x * q.z + q.w * q.y),
          1 - 2 * (q.x * q.x + q.y * q.y),
        ) *
          180) /
        Math.PI
      );
    };
    TestValidator.predicate(
      "head sweeps to each side of the pelvis",
      side * (((heading("head") - heading("hips") + 540) % 360) - 180) >= 20,
    );
  }
  TestValidator.predicate("active travel precedes the stop", walk!.end > 0);
}

/**
 * Sampling both moving bodies detects a follower that aims at the first target
 * position.
 */
function checkMovingTarget(): void {
  const body = motionHumanBody("m-average"),
    origin = { x: 0, y: 0, z: 0 };
  const target = {
    kind: "person",
    subject: "leader",
    region: "sternum",
  } as const;
  const performance = new HumanPerformance({
    seed: "follow",
    laws: [AutoMovieMotionHumanGait.HumanPursuit.follow],
    performers: ["leader", "follower"].map((subject, i) => ({
      subject,
      body,
      at: { ...origin, z: i === 0 ? 3 : 0 },
      yaw: 0,
      proficiency: { level: "trained" as const },
    })),
    composition: HumanChain.subject("leader")
      .stand({ hold: 0.3 })
      .walk({ to: { ...origin, z: 7 } })
      .with(
        HumanChain.subject("follower")
          .stand({ hold: 0.3 })
          .registered("follow", { target }),
      ).node,
  });
  const leader = HumanSignature(performance, "leader", body, 0),
    follower = HumanSignature(performance, "follower", body, 0);
  for (const t of HumanSignature.times(0, performance.duration, 4))
    TestValidator.predicate(
      "follower stays behind throughout travel",
      HumanSignature.region(follower, "sternum", t).z <
        HumanSignature.region(leader, "upperBack", t).z,
    );
  const chest = HumanSignature.region(
      follower,
      "sternum",
      performance.duration,
    ),
    back = HumanSignature.region(leader, "upperBack", performance.duration);
  const gap = Math.hypot(chest.x - back.x, chest.z - back.z);
  TestValidator.predicate(
    "moving target ends at a social gap",
    gap >= 1.2 && gap <= 2.1,
  );
  for (const [row, fixed] of [
    [
      AutoMovieMotionHumanGait.HumanPursuit.follow,
      { from: "behind", at: "social", track: "pace" },
    ],
    [
      AutoMovieMotionHumanGait.HumanPursuit.escort,
      { from: "left", at: "personal", track: "pace" },
    ],
    [
      AutoMovieMotionHumanGait.HumanPursuit.chase,
      { pace: "fast", at: "handing", track: true },
    ],
    [
      AutoMovieMotionHumanGait.HumanPursuit.confront,
      { from: "front", at: "faceToFace" },
    ],
  ] as const)
    TestValidator.equals(
      "author target and selected approach geometry",
      row.resolve!({ target }),
      { target, ...fixed },
    );
}

/**
 * The seat and aperture independently bound a car entry's final posture and
 * clearance.
 */
function checkSeatEntrance(): void {
  const car = createCar({ kind: "sedan" }),
    body = motionHumanBody("m-average");
  const placement = { at: { x: 0, y: 0, z: 0 }, yaw: 0 };
  const seat = HumanObject.seat(car, placement, "driverSeat");
  const aperture = HumanObstacle.apertures(car, placement).find(
    (part) => part.id === "driverAperture",
  )!;
  const facing = (seat.yaw * Math.PI) / 180;
  const depth = seat.depth ?? 0.45;
  const normal = { x: aperture.across.z, z: -aperture.across.x };
  const side =
    (seat.at.x - aperture.at.x) * normal.x +
      (seat.at.z - aperture.at.z) * normal.z >
    0
      ? -1
      : 1;
  const outward = { x: side * normal.x, z: side * normal.z };
  const at = {
    x:
      seat.at.x -
      (Math.sin(facing) * depth) / 2 +
      outward.x * (depth / 2 + 0.25),
    y: 0,
    z:
      seat.at.z -
      (Math.cos(facing) * depth) / 2 +
      outward.z * (depth / 2 + 0.25),
  };
  const enter = (through: IAutoMovieMotionObstacleAperture) =>
    new HumanPerformance({
      seed: "aperture",
      laws: [AutoMovieMotionHumanRide.travelCar.getIn],
      performers: [
        {
          subject: "rider",
          body,
          at,
          yaw: (Math.atan2(outward.x, outward.z) * 180) / Math.PI,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("rider").registered("getIn", {
        seat,
        through,
      }).node,
    });
  const performance = enter(aperture);
  const reader = HumanSignature(performance, "rider", body, 0);
  for (const time of HumanSignature.times(0, performance.duration, 10)) {
    const crown = HumanSignature.region(reader, "crown", time);
    const outside =
      (crown.x - aperture.at.x) * outward.x +
      (crown.z - aperture.at.z) * outward.z;
    if (outside <= 0.1)
      TestValidator.predicate(
        "head clears the opening",
        crown.y <= aperture.at.y + aperture.height,
      );
  }
  TestValidator.predicate(
    "end rests on the authored seat",
    Math.abs(
      HumanSignature.region(reader, "seat", performance.duration).y - seat.at.y,
    ) <= 0.01,
  );
  const q = performance
    .bones("rider", performance.duration)
    .get("hips")!.worldRotation;
  const heading =
    (Math.atan2(2 * (q.x * q.z + q.w * q.y), 1 - 2 * (q.x * q.x + q.y * q.y)) *
      180) /
    Math.PI;
  TestValidator.predicate(
    "end faces along the seat",
    Math.abs(((heading - seat.yaw + 540) % 360) - 180) <= 15,
  );
  for (const closed of [
    { ...aperture, width: 0.2 },
    { ...aperture, height: 0.5 },
  ]) {
    let error: unknown;
    try {
      enter(closed);
    } catch (cause) {
      error = cause;
    }
    TestValidator.predicate(
      "inadequate opening is attributed to aperture reach",
      error instanceof HumanRefusal &&
        error.kind === "reach" &&
        error.axis === "aperture",
    );
  }
}

/**
 * A hand follows a moving support in the support frame or reports its reachable
 * arc.
 */
function checkMovingHandle(): void {
  const door = createDoor({ hinge: "right", hardware: "plate" }),
    body = motionHumanBody("f-small");
  const origin = { x: 0, y: 0, z: 0 };
  const placement: IAutoMovieTransform = {
    translation: origin,
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const handle = door.placed("pull", placement).translation;
  const moving =
    (over: number) =>
    (part: string, time: number): IAutoMovieTransform => {
      const u = Math.min(1, Math.max(0, (time - 0.5) / over));
      return door
        .articulate({ hinge: 90 * u ** 3 * (10 - 15 * u + 6 * u ** 2) })
        .placed(part as Parameters<typeof door.placed>[0], placement);
    };
  const perform = (over: number) =>
    new HumanPerformance({
      seed: "moving-support",
      laws: [AutoMovieMotionHumanRide.travelLeaf.openDoor],
      props: [
        HumanObject.prop(
          "door",
          door,
          { at: origin, yaw: 0 },
          undefined,
          moving(over),
        ),
      ],
      performers: [
        {
          subject: "walker",
          body,
          at: { x: handle.x + Math.sign(handle.x) * 0.25, y: 0, z: 0.45 },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("walker").registered("openDoor", {
        door: "door",
        handle: "pull",
        duration: over + 1,
      }).node,
    });
  const over = 6,
    performance = perform(over),
    stroke = performance.segments("walker")[0]!;
  const local = (time: number): IAutoMovieVector3 => {
    const frame = moving(over)("pull", time);
    return Quaternion.rotateVector(
      Quaternion.inverse(frame.rotation),
      Vector3.subtract(
        performance.bones("walker", time).get("rightHand")!.worldPosition,
        frame.translation,
      ),
    );
  };
  const taken =
    stroke.entryTime + AutoMovieMotionHumanRide.travelLeaf.TAKE + 0.01;
  const base = local(taken);
  TestValidator.predicate(
    "feet step to follow the displacement",
    stroke.plan.contacts.filter(
      (contact) =>
        contact.kind === "plant" &&
        (contact.part === "leftFoot" || contact.part === "rightFoot"),
    ).length > 2,
  );
  for (const time of HumanSignature.times(taken, stroke.end - 0.01, 8))
    TestValidator.predicate(
      "wrist stays within five millimetres in handle space",
      Vector3.length(Vector3.subtract(local(time), base)) <= 0.005,
    );
  TestValidator.equals(
    "stepping preserves floor contact",
    HumanVerdicts(performance).findings.filter(
      (f) =>
        ["slip", "lift", "floor"].includes(f.check) &&
        /Foot|Toes/.test(f.where),
    ),
    [],
  );
  let error: unknown;
  try {
    perform(0.5);
  } catch (cause) {
    error = cause;
  }
  TestValidator.predicate(
    "unfollowable quarter turn reports the reachable subarc",
    error instanceof HumanRefusal &&
      error.kind === "reach" &&
      error.axis === "handle" &&
      error.feasible?.kind === "range" &&
      (error.feasible.maximum ?? 0) > 0 &&
      (error.feasible.maximum ?? 90) < 90,
  );
}
