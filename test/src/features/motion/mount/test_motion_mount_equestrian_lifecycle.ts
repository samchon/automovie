import { createHorse, rideHorse } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanRide,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanMount,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { HumanFoot, HumanFrame, HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { equineLeadOut } from "../../internal/equineLeadOut";
import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * The gaits these takes ride, each with its speed: walk, trot and canter; the
 * gallop is not ridden here.
 */
type Ridden = Exclude<IAutoMovieMotionHumanRide.EquestrianGait, "gallop">;

/** The horse producer's model. */
type Horse = ReturnType<typeof createHorse>;

/** A horse ride along a course. */
type Ride = ReturnType<typeof rideHorse>;

/** The gaits the sweep's bodies ride in turn. */
const GAITS: readonly Ridden[] = ["walk", "trot", "canter"];

/** Seconds the mounted ride waits before the horse sets off. */
const MOUNT_WAIT: number = 6;

/** The rider attachment contract's 10 mm contact budget. */
const CONTACT: number = 0.01;

/**
 * The full body sweep uses actual staged mount, ridden motion, dismount and
 * lead.
 *
 * Scenarios:
 *
 * 1. Every sweep body mounts a standing horse, rides it from a standing start to a
 *    halt, the bodies taking walk, trot and canter in turn so every gait is
 *    ridden, dismounts to the left and walks to the horse's head.
 * 2. The handler, standing at the horse's throat with the right shoulder 0.13 m
 *    outside the rope and the rope three quarters of an arm from the shoulder,
 *    then leads the horse 6 m on foot, the right hand on its lead rope; the
 *    horse's course is laid after the walk so that its progress follows the
 *    handler's rehearsed hips, as a led horse follows its handler.
 * 3. A handler staged 0.88 m beside the rope refuses with `leadReach`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the fourteen established bodies, all three gaits, independently published tack points, geometric ground recovery, the led course matched to the walker and on-foot grip.
 * @evidence contracts/development/testing.md#behavioral-verification Invokes the public posture, native horse, carried rider and on-foot named lead overlay in actual timed scenes. Reads the actual seat and foot sockets and the moving palm on its donor rope.
 * @evidence contracts/development/testing.md#independent-expectations A supported seat and actual foot balls meet the supplied tack; ground recovery is measured on the actual model. A palm position comes from actual FK and body shape, against the independently published lead frame and rope radius.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks the complete rider body sweep, the bodies riding walk, trot and canter in turn, including acquisition, visible travel, dismount and release. An unavailable hand-to-lead pose refuses after an initially reachable hold.
 * @evidence contracts/development/testing.md#execution-ownership A deterministic in-memory matrix with bounded pose observations. The separate seeded test owns its two hundred model contact cases.
 */
export function test_motion_mount_equestrian_lifecycle(): void {
  const findings: string[] = [];
  // The acceptance replays the sequence across the rider sweep; each body
  // rides one gait in turn, so every body and every gait are ridden.
  motionHumanBody.SWEEP.forEach(
    (name: motionHumanBody.Name, index: number): void => {
      const gait: Ridden = GAITS[index % GAITS.length]!;
      try {
        verify(build(motionHumanBody(name), gait));
      } catch (failure) {
        findings.push(
          `${name}/${gait}: ${failure instanceof Error ? failure.message : String(failure)}`,
        );
      }
    },
  );

  let bad: unknown = null;
  try {
    const far: Take = build(motionHumanBody("m-average"), "walk", {
      lateral: 0.88,
      forward: -0.04,
    });
    const overlay: IAutoMovieMotionHumanSegment =
      far.film.overlays("rider")[0]!;
    far.film.bones("rider", (overlay.start + overlay.end) / 2);
  } catch (failure) {
    bad = failure;
  }
  if (!(bad instanceof HumanRefusal && bad.axis === "leadReach"))
    findings.push(
      `The unreachable real lead must refuse with leadReach; got ${String(bad)}`,
    );

  TestValidator.equals(
    "full equestrian take across body and gait matrix",
    findings,
    [],
  );
}

/** One actual sequence with separate horse and actor readers on the film clock. */
interface Take {
  body: IAutoMovieMotionHumanBody;
  film: HumanPerformance;
  horse: Horse;
  mounted: Ride;
  part: (id: string, at: number) => IAutoMovieTransform;
}

/**
 * The led walking ride, laid after the handler's walk is rehearsed, and the
 * film second it starts.
 */
interface ILed {
  /** The led ride; absent until the rehearsal has timed it. */
  ride?: Ride;

  /** Film second the led ride starts; never reached before it is laid. */
  start: number;
}

/**
 * Which recorded ride currently carries the horse, and the second on that
 * ride's own clock.
 */
interface ICarrierTrack {
  /** The ride sampled. */
  ride: Ride;

  /** Seconds on the ride's clock. */
  local: number;
}

/**
 * Rehearse the handler's walk, then lay the led horse's course so its progress
 * follows the walker's.
 */
function build(
  body: IAutoMovieMotionHumanBody,
  gait: Ridden,
  staged?: equineLeadOut.IStanding,
): Take {
  const horse: Horse = createHorse(
    { withersHeight: 1.72, stirrupDrop: 0.66, tempo: 0 },
    5,
  );
  const scale: number = Math.sqrt(horse.dimensions.withersHeight! / 1.38);
  const speed: number =
    ({ walk: 1.4, trot: 3, canter: 5 } as const)[gait] * scale;
  const mounted: Ride = rideHorse(
    horse,
    {
      start: { x: 0, z: 0, heading: 0 },
      cruise: speed,
      startSpeed: 0,
      endSpeed: 0,
      acceleration: 1.6,
      deceleration: 1.6,
      startFromStanding: true,
      legs: [{ kind: "straight", length: speed * (2 + speed / 1.6) }],
    },
    gait,
  );
  const origin: IAutoMovieTransform = mounted.at(mounted.duration).placement;
  const resting: IAutoMovieTransform = mounted.frame("lead", mounted.duration);
  const stand: equineLeadOut.IStanding =
    staged ?? equineLeadOut.standing(body, resting.translation.y);
  const approach: IAutoMovieVector3 = {
    x: resting.translation.x + stand.lateral,
    y: 0,
    z: resting.translation.z + stand.forward,
  };
  const advance: IAutoMovieVector3 = {
    ...approach,
    z: approach.z + equineLeadOut.LENGTH,
  };
  const led: ILed = { start: Infinity };

  /**
   * The shot keeps the actual parked mount until the separate led walking track
   * begins.
   */
  function carrierAt(at: number): ICarrierTrack {
    return led.ride !== undefined && at >= led.start
      ? { ride: led.ride, local: Math.min(led.ride.duration, at - led.start) }
      : {
          ride: mounted,
          local: Math.max(0, Math.min(mounted.duration, at - MOUNT_WAIT)),
        };
  }
  const place = (at: number): IAutoMovieRigidTransform => {
    const track: ICarrierTrack = carrierAt(at);
    const frame: IAutoMovieTransform = track.ride.at(track.local).placement;
    return { position: frame.translation, rotation: frame.rotation };
  };
  const part = (id: string, at: number): IAutoMovieTransform => {
    const track: ICarrierTrack = carrierAt(at);
    return track.ride.frame(id as Parameters<Ride["frame"]>[0], track.local);
  };
  const saddle = HumanObject.seat(mounted.at(0).archetype, place(0));
  const actors = [
    {
      subject: "rider",
      body,
      at: HumanFrame.point(
        { origin: { ...saddle.at, y: 0 }, yaw: saddle.yaw },
        { x: 0.6, y: 0, z: -0.2 },
      ),
      yaw: saddle.yaw,
      proficiency: { level: "trained" as const },
    },
  ];
  const chain = HumanChain.subject("rider")
    .sit({ seat: saddle, hold: 0.5 })
    .registered("ride", {
      on: "horse",
      duration: MOUNT_WAIT + mounted.duration,
      seat: "seat",
      feet: { left: "leftStirrup", right: "rightStirrup" },
    })
    .rise({})
    .walk({ to: approach, face: 0 })
    .walk({ to: advance });
  const rehearsal: HumanPerformance = new HumanPerformance({
    seed: "equine-lifecycle",
    performers: actors,
    laws: [
      AutoMovieMotionHumanMount.rideHorse.ride,
      AutoMovieMotionHumanMount.leadHorse,
    ],
    props: [HumanObject.prop("horse", horse, place(0), place, part)],
    composition: chain.node,
  });
  const walking: IAutoMovieMotionHumanSegment = rehearsal
    .segments("rider")
    .at(-1)!;
  const walkingSeconds: number = walking.end - walking.start;

  // The handler leads: the horse's course is laid after the walk, so its progress follows the hips' displayed progress.
  const step: number = walkingSeconds / equineLeadOut.SAMPLES;
  const hips = (at: number): number =>
    rehearsal.bones("rider", at).get("hips")!.worldPosition.z;
  const begin: number = hips(walking.start);
  const progress: readonly number[] = Array.from(
    { length: equineLeadOut.SAMPLES + 1 },
    (_: unknown, i: number): number => hips(walking.start + i * step) - begin,
  );
  const matched: equineLeadOut.IMatchedCourse = equineLeadOut.match(
    progress,
    step,
  );
  led.start = walking.start;
  led.ride = rideHorse(
    horse,
    {
      start: { x: origin.translation.x, z: origin.translation.z, heading: 0 },
      cruise: matched.cruise,
      startSpeed: 0,
      endSpeed: 0,
      acceleration: matched.acceleration,
      deceleration: matched.deceleration,
      startFromStanding: true,
      legs: [{ kind: "straight", length: matched.length }],
    },
    "walk",
  );
  const film: HumanPerformance = new HumanPerformance({
    seed: "equine-lifecycle",
    performers: actors,
    laws: [
      AutoMovieMotionHumanMount.rideHorse.ride,
      AutoMovieMotionHumanMount.leadHorse,
    ],
    props: [HumanObject.prop("horse", horse, place(0), place, part)],
    composition: chain.over((handler) =>
      handler.registered("leadHorse", {
        on: "horse",
        hand: "right",
        duration: 0.79 * walkingSeconds,
        transition: 0.1 * walkingSeconds,
      }),
    ).node,
  });
  return { body, film, horse, mounted, part };
}

/** Read actual rig geometry through each actor/horse phase of the full scene. */
function verify(take: Take): void {
  const { body, film, horse, mounted, part } = take;
  assertTakeClean("the equestrian lifecycle take", film);
  const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
    film,
    "rider",
    body,
    0,
  );
  const [mount, ride, off, approach, walk] = film.segments("rider");
  if (
    mount === undefined ||
    ride === undefined ||
    off === undefined ||
    approach === undefined ||
    walk === undefined
  )
    throw new Error("The actor must play all five staged parts");
  for (const at of [mount.end, MOUNT_WAIT + mounted.duration * 0.45]) {
    const saddle: IAutoMovieTransform = part("seat", at);
    const actual: IAutoMovieVector3 = HumanSignature.region(reader, "seat", at);
    const alignment: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(saddle.rotation),
      Vector3.subtract(actual, saddle.translation),
    );
    if (Math.abs(alignment.y) > CONTACT)
      throw new Error("The displayed rider does not meet the actual saddle");
  }
  for (const side of ["left", "right"] as const) {
    if (!HumanSignature.bears(reader, off.end, side))
      throw new Error(`The ${side} foot does not carry the dismounted rider`);
    const ball: IAutoMovieMotionHumanFoot.ISocket = HumanFoot.sockets(
      body,
      HumanSignature.bones(reader, off.end),
      side,
    ).find(
      (socket: IAutoMovieMotionHumanFoot.ISocket): boolean =>
        socket.socket === "ball",
    )!;
    if (Math.abs(ball.point.y) > CONTACT)
      throw new Error(`The ${side} dismount support must lie on the floor`);
  }

  const held: IAutoMovieMotionHumanSegment = film.overlays("rider")[0]!;
  const window = held.plan.contacts.find(
    (contact): boolean =>
      contact.part === "rightHand" && contact.support.kind === "prop",
  );
  if (
    !window ||
    window.support.kind !== "prop" ||
    window.support.subject !== "horse"
  )
    throw new Error("A moving lead must name the actual horse contact");
  const duration: number = held.end - held.start;
  const acquired: number = held.start + window.from * duration;
  const release: number = held.start + window.to * duration;
  const palm = HumanHand.offset(body, "right", "palm");
  const radius: number =
    horse.affordances.find((contact): boolean => contact.id === "lead")!
      .aperture! / 2;
  for (let i: number = 1; i < 18; i++) {
    const at: number = acquired + ((release - acquired) * i) / 18;
    const hand = film.bones("rider", at).get("rightHand")!;
    const actual: IAutoMovieVector3 = Vector3.add(
      hand.worldPosition,
      Quaternion.rotateVector(hand.worldRotation, palm.point),
    );
    const rope: IAutoMovieTransform = part("lead", at);
    const surface: IAutoMovieVector3 = Vector3.addScaled(
      rope.translation,
      Quaternion.rotateVector(rope.rotation, { x: 0, y: 1, z: 0 }),
      radius,
    );
    if (Vector3.distance(actual, surface) > CONTACT)
      throw new Error(
        `The displayed palm misses the line at film second ${at}`,
      );
  }
  if (
    Vector3.distance(
      part("lead", acquired).translation,
      part("lead", release).translation,
    ) < 0.8
  )
    throw new Error("The held rope and horse must travel through the film");
  if (
    film.bones("rider", release).get("hips")!.worldPosition.z -
      film.bones("rider", acquired).get("hips")!.worldPosition.z <
    0.6
  )
    throw new Error(
      "The handler must walk instead of borrowing the prop's pose",
    );
}
