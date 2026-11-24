import {
  AutoMovieArchetypeCourse,
  createBicycle,
  createCyclingHelmet,
  createTransitionRack,
  rideBicycle,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanMount,
  AutoMovieMotionHumanRide,
  AutoMovieMotionHumanSwim,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanFoot, HumanFrame, HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** Contact bound in metres: one centimetre of displayed geometry. */
const METRE: number = 0.01;

/** The lane from the rack to the mount line, metres. */
const LANE: number = 6;

/** The lane from the dismount stop back to the rack, metres. */
const RETURN: number = 2;

/** The mount line, world z: the bicycle stops just beyond it. */
const MOUNT_LINE: number = 5.3;

/** The dismount line, world z: the bicycle stops just short of it. */
const DISMOUNT_LINE: number = -1.2;

/** The water surface over the ground at the swim exit, metres. */
const SURFACE: number = 0.6;

/** Seconds the bicycle stands at the mount line before the bike leg starts after the athlete is seated. */
const SETTLE: number = 0.2;

/** Seconds the bicycle stands at the dismount line: longer than any dismount. */
const DISMOUNT_PAUSE: number = 4;

/** How the athlete enters the lane. */
type Entry = "continuous" | "stop";

/** The scene: the bicycle's ride and its prop. */
interface IScene {
  /** The ride along the whole course. */
  ride: ReturnType<typeof rideBicycle>;

  /** The bicycle as a performance prop. */
  prop: IAutoMovieMotionHumanProp;
}

/**
 * One triathlete wheels the same bicycle from its rack spot to the mount
 * line, mounts, rides a loop, dismounts before the dismount line and wheels
 * it back to the same rack spot, on one film clock.
 *
 * Scenarios:
 * 1. A continuous lane entry: the segments run guide, mount, ride, dismount,
 *    guide, with both line events and the athlete's root continuous at each
 *    handoff.
 * 2. While wheeling, the near hand stays on the bicycle's grip, and each
 *    planted foot stays on the ground without slipping.
 * 3. A brief stop in the lane keeps the same bicycle, contacts and rack
 *    outcome, with the feet planted through the stop.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the take, its segments, the variation and the bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Composes the registered guide, transfer and ride laws over a scene bicycle on one course and reads displayed bones, grips and the bicycle frame.
 * @evidence contracts/development/testing.md#independent-expectations The bicycle's course and its posed grips are the scene's own; the ground plane bounds the soles; World Triathlon's line rule supplies the line events.
 * @evidence contracts/development/testing.md#distinguishing-cases A continuous lane entry and one with a stop share the outcome; root continuity is checked at every handoff.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of one generated body and one seeded bicycle.
 */
export function test_motion_seat_triathlon_transition(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const bicycle: ReturnType<typeof createBicycle> = createBicycle({}, 8);
  for (const entry of ["continuous", "stop"] as const) {
    // The athlete's mount time decides when the bike leg may leave.
    // T1 ends when the helmet is on; the mount decides when the bike leg leaves.
    const ready: number = take(body, bicycle, entry, "prefix").duration;
    const probe: HumanPerformance = take(body, bicycle, entry, "mount", {
      take: ready,
      depart: 60,
    });
    const mount: IAutoMovieMotionHumanSegment = probe
      .segments("athlete")
      .at(-1)!;
    const film: HumanPerformance = take(body, bicycle, entry, "full", {
      take: ready,
      depart: mount.start + mount.plan.duration + SETTLE,
    });
    const segments: readonly IAutoMovieMotionHumanSegment[] =
      film.segments("athlete");
    assertTakeClean(`${entry}: the take passes the generic audit`, film);
    TestValidator.equals(
      `${entry}: swim, exit, T1, bike leg, T2 and run in order`,
      segments.map((s: IAutoMovieMotionHumanSegment): string => s.name),
      [
        "swim",
        "aquatic",
        "run",
        "pickUp",
        "dress",
        "bikeGuide",
        "bikeTransfer",
        "ride",
        "bikeTransfer",
        "bikeGuide",
        "pickUp",
        "putDown",
        "run",
      ],
    );
    TestValidator.predicate(
      `${entry}: both line events are published`,
      segments[6]!.plan.events.some(
        (e): boolean => e.name === "mountLinePlant",
      ) &&
        segments[8]!.plan.events.some(
          (e): boolean => e.name === "dismountLinePlant",
        ),
    );
    let jump: number = 0;
    for (const segment of segments.slice(1)) {
      const at: number = segment.start;
      jump = Math.max(
        jump,
        Vector3.distance(
          film.bones("athlete", at - 1 / 120).get("hips")!.worldPosition,
          film.bones("athlete", at + 1 / 120).get("hips")!.worldPosition,
        ),
      );
    }
    TestValidator.predicate(
      `${entry}: the pelvis moves continuously through every handoff (${jump.toFixed(4)} m in 1/60 s)`,
      jump < 0.05,
    );

    // Wheeling: the hand on the grip and the planted soles on the ground.
    let grip: number = 0;
    let slip: number = 0;
    for (const segment of [segments[5]!, segments[9]!]) {
      const hand: IAutoMovieMotionHumanContactWindow =
        segment.plan.contacts.find(
          (c: IAutoMovieMotionHumanContactWindow): boolean => c.kind === "grip",
        )!;
      const side: AutoMovieHumanSide =
        hand.part === "leftHand" ? "left" : "right";
      for (let i: number = 0; i <= 40; ++i) {
        const share: number = hand.from + ((1 - hand.from) * i) / 40;
        const seconds: number = segment.start + share * segment.plan.duration;
        const bones: ReturnType<HumanPerformance["bones"]> = film.bones(
          "athlete",
          seconds,
        );
        const handle: IAutoMovieVector3 = gripAt(film, bicycle, side, seconds);
        grip = Math.max(
          grip,
          Vector3.distance(
            HumanHand.frame(body, bones, side, "grip").point,
            handle,
          ),
        );
      }
      // The entered prints blend out of the previous action at the cut,
      // which the performance's transition owns; every print this law lays
      // must hold.
      for (const window of segment.plan.contacts.filter(
        (c: IAutoMovieMotionHumanContactWindow): boolean =>
          c.kind === "plant" && c.from > 0,
      )) {
        const foot: AutoMovieHumanSide =
          window.part === "leftFoot" ? "left" : "right";
        const to: number = Math.min(1, window.to);
        const read = (share: number): IAutoMovieVector3 =>
          HumanFoot.sockets(
            body,
            film.bones(
              "athlete",
              segment.start + share * segment.plan.duration,
            ),
            foot,
          )[1]!.point;
        const first: IAutoMovieVector3 = read(window.from);
        for (let i: number = 1; i <= 6; ++i)
          slip = Math.max(
            slip,
            Vector3.distance(
              first,
              read(window.from + ((to - window.from) * i) / 6),
            ),
          );
      }
    }
    TestValidator.predicate(
      `${entry}: the hand holds the handlebar grip while wheeling (${grip.toFixed(4)} m)`,
      grip < METRE,
    );
    TestValidator.predicate(
      `${entry}: planted soles do not slip while wheeling (${slip.toFixed(4)} m)`,
      slip < METRE,
    );
    // Water exit: the feet bear on the bottom from footDown, and the pelvis
    // rises out of the water.
    const exit: IAutoMovieMotionHumanSegment = segments[1]!;
    const down: number = exit.plan.events.find(
      (e): boolean => e.name === "footDown",
    )!.share;
    let bottom: number = 0;
    for (let i: number = 0; i <= 8; ++i) {
      const seconds: number =
        exit.start + (down + ((1 - down) * i) / 8) * exit.plan.duration;
      for (const foot of ["left", "right"] as const)
        bottom = Math.max(
          bottom,
          Math.abs(
            HumanFoot.sockets(body, film.bones("athlete", seconds), foot)[1]!
              .point.y,
          ),
        );
    }
    TestValidator.predicate(
      `${entry}: both forefeet bear on the bottom from footDown (${bottom.toFixed(4)} m)`,
      bottom < 0.03,
    );
    TestValidator.predicate(
      `${entry}: the pelvis rises from the water onto the shore`,
      film.bones("athlete", exit.start).get("hips")!.worldPosition.y <
        SURFACE &&
        film.bones("athlete", exit.start + exit.plan.duration).get("hips")!
          .worldPosition.y > SURFACE,
    );

    // The helmet rides the head from T1 to T2 and returns to the rack.
    const on: number = segments[4]!.start + segments[4]!.plan.duration;
    const off: number = segments[10]!.start;
    const spread: number[] = [];
    for (let i: number = 0; i <= 12; ++i) {
      const seconds: number = on + ((off - on) * i) / 12;
      spread.push(
        Vector3.distance(
          film.prop("helmet", seconds).position,
          film.bones("athlete", seconds).get("head")!.worldPosition,
        ),
      );
    }
    TestValidator.predicate(
      `${entry}: the helmet stays on the head through the bike leg`,
      Math.max(...spread) - Math.min(...spread) < METRE,
    );
    TestValidator.predicate(
      `${entry}: the helmet is set back on the rack`,
      Vector3.distance(
        film.prop("helmet", film.duration).position,
        film.prop("helmet", 0).position,
      ) < 0.05,
    );
    const end: IAutoMovieRigidTransform = film.prop("bike", film.duration);
    const rack: IAutoMovieRigidTransform = film.prop("bike", 0);
    TestValidator.predicate(
      `${entry}: the same bicycle returns to its rack spot`,
      Vector3.distance(end.position, rack.position) < METRE,
    );
  }
}

/** The bicycle's course: lane, bike loop and return lane, with the stops. */
function scene(
  bicycle: ReturnType<typeof createBicycle>,
  entry: Entry,
  start: number,
  depart: number,
): IScene {
  // The bicycle stands at the mount line from its arrival until the bike
  // leg departs; nothing before that stop depends on its length.
  const course = (pause: number): AutoMovieArchetypeCourse.IPlan =>
    AutoMovieArchetypeCourse.plan("bicycle", {
      start: { x: 0, z: 0, heading: 0 },
      legs:
        entry === "continuous"
          ? [
              { kind: "straight", length: LANE, pause },
              { kind: "straight", length: 8 },
              { kind: "turn", radius: 6, angle: 180 },
              { kind: "straight", length: 22 },
              { kind: "turn", radius: 6, angle: 180 },
              { kind: "straight", length: 6, pause: DISMOUNT_PAUSE },
              { kind: "straight", length: RETURN },
            ]
          : [
              { kind: "straight", length: LANE / 2, pause: 1 },
              { kind: "straight", length: LANE / 2, pause },
              { kind: "straight", length: 8 },
              { kind: "turn", radius: 6, angle: 180 },
              { kind: "straight", length: 22 },
              { kind: "turn", radius: 6, angle: 180 },
              { kind: "straight", length: 6, pause: DISMOUNT_PAUSE },
              { kind: "straight", length: RETURN },
            ],
      speeds:
        entry === "continuous"
          ? [0, 5, 5, 5, 5, 0, 0]
          : [0, 0, 5, 5, 5, 5, 0, 0],
      cruise: 2.2,
      acceleration: 2,
      deceleration: 2.5,
      at: start,
    });
  const arrive: number = course(1).when(LANE);
  const plan: AutoMovieArchetypeCourse.IPlan = course(
    Math.max(0.05, depart - arrive),
  );
  const total: number = plan.length;
  const ride: ReturnType<typeof rideBicycle> = rideBicycle(bicycle, plan, {
    chainring: 34,
    sprocket: 17,
    coast: [
      [0, LANE],
      [total - RETURN, total],
    ],
  });
  const origin: IAutoMovieTransform = ride.at(0).placement;
  return {
    ride,
    prop: HumanObject.prop(
      "bike",
      bicycle,
      { position: origin.translation, rotation: origin.rotation },
      (t: number): IAutoMovieRigidTransform => {
        const placement: IAutoMovieTransform = ride.at(t).placement;
        return {
          position: placement.translation,
          rotation: placement.rotation,
        };
      },
      (id: string, t: number): IAutoMovieTransform =>
        ride.frame(id as createBicycle.Affordance, t),
    ),
  };
}

/** How much of the take to stage: the swim and T1 up to the guide, through the mount, or all of it. */
type Stage = "prefix" | "mount" | "full";

/** The timing a later stage reads from an earlier one, film seconds. */
interface ITiming {
  /** When the athlete takes the bicycle off the rack. */
  take: number;

  /** When the bike leg departs. */
  depart: number;
}

/** The whole take for one lane entry, staged as far as asked. */
function take(
  body: IAutoMovieMotionHumanBody,
  bicycle: ReturnType<typeof createBicycle>,
  entry: Entry,
  stage: Stage,
  timing: ITiming = { take: 0, depart: 60 },
): HumanPerformance {
  const { ride, prop }: IScene = scene(
    bicycle,
    entry,
    timing.take,
    timing.depart,
  );
  const placement: IAutoMovieTransform = ride.at(0).placement;
  const seat: ReturnType<typeof HumanObject.seat> = HumanObject.seat(bicycle, {
    position: placement.translation,
    rotation: placement.rotation,
  });
  const station: IAutoMovieVector3 = HumanFrame.point(
    { origin: { ...seat.at, y: 0 }, yaw: seat.yaw },
    { x: 0.45, y: 0, z: 0.1 },
  );

  // The rack bar sits under the saddle; the helmet waits on it, on the
  // athlete's left, away from the bicycle, so the left hand takes it.
  const rack: IAutoMovieMotionHumanProp = HumanObject.prop(
    "rack",
    createTransitionRack({ height: seat.at.y, length: 1.6 }, 1),
    { at: { x: 0, y: 0, z: seat.at.z }, yaw: 0, fixed: true },
  );
  const rest: IAutoMovieVector3 = { x: 0.7, y: seat.at.y, z: seat.at.z };
  const helmet: IAutoMovieMotionHumanProp = HumanObject.prop(
    "helmet",
    createCyclingHelmet({}, 1),
    { at: rest, yaw: 0 },
  );
  const performer: IAutoMovieMotionHumanPerformer = {
    subject: "athlete",
    body,
    at: { x: 5, y: SURFACE - 0.3, z: station.z },
    yaw: -90,
    proficiency: { level: "trained" },
  };
  const plan: AutoMovieArchetypeCourse.IPlan = ride.plan;
  const arrive: number = plan.when(LANE);
  const stop: number = plan.when(plan.length - RETURN);
  const prefix: ReturnType<typeof HumanChain.subject> = HumanChain.subject(
    "athlete",
  )
    .swim({ kind: "frontCrawl", water: SURFACE, count: 1 })
    .registered("aquatic", { kind: "waterExit", water: SURFACE })
    .run({ to: station, pace: "jog", face: seat.yaw })
    .pickUp({ prop: "helmet", handle: "hold", hand: "left" })
    .dress({ item: "hat", prop: "helmet", hand: "left" });
  const lane: ReturnType<typeof HumanChain.subject> = prefix
    .registered("bikeGuide", {
      on: "bike",
      side: "left",
      duration: arrive - timing.take,
    })
    .registered("bikeTransfer", {
      on: "bike",
      mode: "mount",
      line: { x: 0, z: MOUNT_LINE, heading: 0 },
    });
  return new HumanPerformance({
    seed: `triathlon-${entry}`,
    laws: [
      AutoMovieMotionHumanSwim.aquatic,
      AutoMovieMotionHumanRide.bikeGuide,
      AutoMovieMotionHumanRide.bikeTransfer,
      AutoMovieMotionHumanMount.rideHorse.ride,
    ],
    performers: [performer],
    props: [prop, rack, helmet],
    composition:
      stage === "prefix"
        ? prefix.node
        : stage === "mount"
          ? lane.node
          : lane
              .registered("ride", {
                on: "bike",
                duration: Math.max(1, stop - (timing.depart - SETTLE)),
                feet: { left: "leftPedal", right: "rightPedal" },
                hands: { left: "leftGrip", right: "rightGrip" },
              })
              .registered("bikeTransfer", {
                on: "bike",
                mode: "dismount",
                line: { x: 0, z: DISMOUNT_LINE, heading: 0 },
              })
              .registered("bikeGuide", {
                on: "bike",
                side: "left",
                duration: plan.when(plan.length) - stop,
              })
              .pickUp({ prop: "helmet", handle: "hold", hand: "left" })
              .putDown({ prop: "helmet", to: rest, yaw: 0, hand: "left" })
              .run({ to: { x: 4, y: 0, z: 1 }, pace: "jog" }).node,
  });
}
/** The world grip centre of the bicycle's handle on one side at a film second. */
function gripAt(
  film: HumanPerformance,
  bicycle: ReturnType<typeof createBicycle>,
  side: AutoMovieHumanSide,
  seconds: number,
): IAutoMovieVector3 {
  const frame: IAutoMovieRigidTransform = film.prop("bike", seconds);
  return Vector3.add(
    frame.position,
    Quaternion.rotateVector(
      frame.rotation,
      bicycle.affordance(side === "left" ? "leftGrip" : "rightGrip").frame
        .translation,
    ),
  );
}
