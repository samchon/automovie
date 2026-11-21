import {
  createRoundabout,
  createSeesaw,
  createSwing,
  rideRoundabout,
  rideSeesaw,
  rideSwing,
} from "@automovie/archetypes";
import { AutoMovieGravity, Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieComposition,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanWalkParams,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanSurface,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/** The two hands and feet. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/** The established seat and grip contact tolerance of the ride tests, metres. */
const HOLD: number = 0.02;

/** Each installation at the origin, unturned. */
const ORIGIN: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

/** A body key of the shared canonical bodies. */
type BodyKey = "m-average" | "f-small";

/**
 * A rider pumps a swing and leaps off it, two riders rock a seesaw, and a
 * pusher runs a roundabout round by its grab bar and then rides it.
 *
 * Scenarios, on the average man and the small woman:
 * 1. Pumping adds a positive angle each half swing, derived from the
 *    rider's body; the pelvis stays on the seat and the hands on the
 *    chains in the seat's frame; the trunk leans back while the seat
 *    swings forward and sits up while it swings back.
 * 2. Leaping off near the forward turning point, the pelvis follows the
 *    projectile from the seat's velocity and the feet land on the ground.
 * 3. A rider wider across the thighs than the seat is refused.
 * 4. On a seesaw each rider's pelvis stays on its seat and hands on its
 *    handles, and a foot is on the ground only while that end is low.
 * 5. The pusher's hand stays on the turning grab bar while walking round,
 *    and after stepping on, the feet stay still in the disc's frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the equipment, bodies, contacts and checked frames.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed pelvis, wrists, ankles and trunk against the actual seat, beam and disc frames of the rides.
 * @evidence contracts/development/testing.md#independent-expectations The seat, beam and disc frames come from the rides; the projectile from the seat's finite-difference velocity under standard gravity; contacts hold within the 20 mm ride tolerance.
 * @evidence contracts/development/testing.md#distinguishing-cases Forward and backward swing, low and high seesaw ends, held and released disc, an admitted and a refused rider, two bodies.
 * @evidence contracts/development/testing.md#execution-ownership In-memory archetypes, rides and Human performances; no host.
 */
export function test_motion_exercise_playground(): void {
  const failures: string[] = [];
  for (const key of ["m-average", "f-small"] as const) {
    swing(key, failures);
    roundabout(key, failures);
  }
  seesaw(failures);
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const narrow: ReturnType<typeof createSwing> = createSwing({
    seatWidth: 0.28,
  });
  let refusal: unknown;
  try {
    swingFilm(body, narrow, 2, 0).duration;
  } catch (error) {
    refusal = error;
  }
  if (!(refusal instanceof HumanRefusal && refusal.axis === "seat"))
    failures.push(
      `a rider wider than the seat is not refused: ${String(refusal)}`,
    );
  TestValidator.equals("playground rides", failures, []);
}

/** The seated swing take: sit on the held-back seat, pump, then leap. */
function swingFilm(
  body: IAutoMovieMotionHumanBody,
  frame: ReturnType<typeof createSwing>,
  halves: number,
  increment: number,
  lean: number = 30,
): HumanPerformance {
  const model: ReturnType<typeof createSwing.seat> = createSwing.seat(frame);
  const hang: number = frame.dimensions.pivot - frame.dimensions.clearance;
  const ride: rideSwing.IRide = rideSwing(frame, ORIGIN, {
    length: hang,
    start: -42,
    halves,
    pumps: halves - 1,
    increment,
  });
  const placed: IAutoMovieRigidTransform = rigid(ride.seat(0));
  const front: IAutoMovieVector3 = Vector3.add(
    placed.position,
    Quaternion.rotateVector(placed.rotation, { x: 0, y: -hang, z: 0.35 }),
  );
  const performer: Performer = {
    subject: "a",
    body,
    at: { ...front, y: 0 },
    yaw: 0,
    proficiency: { level: "trained" },
  };

  // The swing is held back while the rider sits and is let go as the sit ends.
  const sitting: number = new HumanPerformance({
    seed: "swing",
    performers: [performer],
    props: [HumanObject.prop("seat", model, placed)],
    composition: HumanChain.subject("a").sit({
      seat: HumanObject.seat(model, placed),
      seconds: 1.2,
    }).node,
  }).duration;
  const seatAt = (seconds: number): IAutoMovieRigidTransform =>
    rigid(ride.seat(Math.max(0, seconds - sitting)));
  return new HumanPerformance({
    seed: "swing",
    performers: [performer],
    props: [
      HumanObject.prop("frame", frame, rigid(ORIGIN)),
      HumanObject.prop("seat", model, placed, seatAt),
    ],
    laws: [HumanSurface.swingPump, HumanSurface.swingLeap],
    composition: HumanChain.subject("a")
      .sit({ seat: HumanObject.seat(model, placed), seconds: 1.2 })
      .registered("swingPump", {
        on: "seat",
        seat: "seat",
        hands: { left: "leftChain", right: "rightChain" },
        seconds: (halves - 0.15) * ride.half,
        lean,
      })
      .registered("swingLeap", { on: "seat" }).node,
  });
}

/** Pump a swing, check the seat, grips and lean, then the leap. */
function swing(key: BodyKey, failures: string[]): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(key);
  const frame: ReturnType<typeof createSwing> = createSwing({
    pivot: 2.3,
    clearance: 0.4,
    seatWidth: 0.45,
  });
  const hang: number = frame.dimensions.pivot - frame.dimensions.clearance;
  // A small body's arms hold the chains at a shallower lean.
  const lean: number = key === "f-small" ? 15 : 30;
  const increment: number = HumanSurface.pumpIncrement(body, hang, lean);
  if (!(increment > 0 && increment < 10))
    failures.push(
      `${key}: pumping adds ${increment.toFixed(3)} degrees a half swing`,
    );
  const film: HumanPerformance = swingFilm(body, frame, 7, increment, lean);
  if (key === "f-small") {
    let reach: unknown;
    try {
      swingFilm(body, frame, 7, increment, 40).duration;
    } catch (error) {
      reach = error;
    }
    if (!(reach instanceof HumanRefusal && reach.axis === "lean"))
      failures.push(
        `${key}: a lean beyond the arms' reach is not refused: ${String(reach)}`,
      );
  }
  const [sat, pump, leap]: readonly IAutoMovieMotionHumanSegment[] =
    film.segments("a");
  if (sat === undefined || pump === undefined || leap === undefined) {
    failures.push(`${key}: the sit, pump and leap did not all play`);
    return;
  }
  const seatFrame = (seconds: number): IAutoMovieRigidTransform =>
    film.prop("seat", seconds);
  const settled: number = pump.start + 0.6;
  const hips0: IAutoMovieVector3 = local(
    seatFrame(settled),
    joint(film, "hips", settled),
  );
  const wrists0: IAutoMovieVector3[] = SIDES.map(
    (side: AutoMovieHumanSide): IAutoMovieVector3 =>
      local(seatFrame(settled), joint(film, `${side}Hand`, settled)),
  );
  const end: number = pump.start + pump.plan.duration;
  let leanForward: number = 0;
  let leanBackward: number = 0;
  for (let at: number = settled; at <= end; at += 0.05) {
    const drift: number = Vector3.distance(
      local(seatFrame(at), joint(film, "hips", at)),
      hips0,
    );
    if (drift > HOLD)
      failures.push(
        `${key}: the pelvis leaves the seat by ${drift.toFixed(3)} m at ${at.toFixed(2)} s`,
      );
    SIDES.forEach((side: AutoMovieHumanSide, index: number): void => {
      const slip: number = Vector3.distance(
        local(seatFrame(at), joint(film, `${side}Hand`, at)),
        wrists0[index]!,
      );
      if (slip > 3 * HOLD)
        failures.push(
          `${key}: the ${side} hand leaves its chain by ${slip.toFixed(3)} m at ${at.toFixed(2)} s`,
        );
    });
    const motion: number =
      seatFrame(at + 0.01).rotation.x - seatFrame(at - 0.01).rotation.x;
    const trunk: number = joint(film, "neck", at).z - joint(film, "hips", at).z;
    if (motion < 0) leanForward = Math.min(leanForward, trunk);
    else leanBackward = Math.max(leanBackward, trunk);
  }
  if (!(leanForward < leanBackward - 0.05))
    failures.push(
      `${key}: the trunk does not lean back on the forward swing (${leanForward.toFixed(3)} vs ${leanBackward.toFixed(3)})`,
    );

  // The leap: the pelvis on the projectile from the seat point under it.
  const release: number = leap.start;
  const under = (seconds: number): IAutoMovieVector3 => {
    const now: IAutoMovieRigidTransform = seatFrame(seconds);
    const held: IAutoMovieRigidTransform = seatFrame(release);
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(held.rotation),
      Vector3.subtract(joint(film, "hips", release), held.position),
    );
    return Vector3.add(
      now.position,
      Quaternion.rotateVector(now.rotation, offset),
    );
  };
  const velocity: IAutoMovieVector3 = Vector3.scale(
    Vector3.subtract(under(release), under(release - 1e-3)),
    1e3,
  );
  const touchdown: number =
    release +
    leap.plan.duration *
      (leap.plan.events.find(
        (event: IAutoMovieMotionEvent): boolean => event.name === "touchdown",
      )?.share ?? 1);
  for (let at: number = release; at < touchdown; at += 0.05) {
    const t: number = at - release;
    const expected: IAutoMovieVector3 = Vector3.add(
      Vector3.add(joint(film, "hips", release), Vector3.scale(velocity, t)),
      { x: 0, y: (-AutoMovieGravity.STANDARD * t * t) / 2, z: 0 },
    );
    const off: number = Vector3.distance(joint(film, "hips", at), expected);
    if (off > HOLD / 2)
      failures.push(
        `${key}: the leap leaves the projectile by ${off.toFixed(3)} m at ${t.toFixed(2)} s`,
      );
  }
  const landed: number = leap.start + leap.plan.duration;
  for (const side of SIDES) {
    const height: number =
      joint(film, `${side}Foot`, landed).y - body.measure.ankleHeight;
    if (Math.abs(height) > HOLD)
      failures.push(
        `${key}: the ${side} foot lands ${height.toFixed(3)} m off the ground`,
      );
  }
}

/** Two riders rock a seesaw by pushing off at the low end. */
function seesaw(failures: string[]): void {
  const post: ReturnType<typeof createSeesaw> = createSeesaw({
    pivot: 0.55,
    length: 3.2,
  });
  const beam: ReturnType<typeof createSeesaw.beam> = createSeesaw.beam(post);
  // The beam is held level while both riders sit, then let go to rock: the
  // sits are measured on the held beam and the release follows them.
  const sitting: number = 1.2;
  const placed: IAutoMovieRigidTransform = {
    position: { x: 0, y: post.dimensions.pivot!, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const ends: readonly SeesawEnd[] = ["front", "rear"];
  const keys: readonly BodyKey[] = ["m-average", "f-small"];
  const performers: Performer[] = ends.map(
    (end: SeesawEnd, index: number): Performer => {
      const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
        beam,
        placed,
        `${end}Seat`,
      );
      const ahead: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, seat.yaw),
        { x: 0, y: 0, z: 0.3 },
      );
      return {
        subject: end,
        body: motionHumanBody(keys[index]!),
        at: { ...Vector3.add(seat.at, ahead), y: 0 },
        yaw: seat.yaw,
        proficiency: { level: "trained" as const },
      };
    },
  );
  const sit = (end: SeesawEnd): ReturnType<typeof HumanChain.subject> =>
    HumanChain.subject(end).sit({
      seat: HumanObject.seat(beam, placed, `${end}Seat`),
      seconds: sitting,
    });
  const seated: number = new HumanPerformance({
    seed: "seesaw",
    performers,
    props: [HumanObject.prop("beam", beam, placed)],
    composition: {
      kind: "parallel",
      parts: ends.map((end: SeesawEnd): IAutoMovieComposition => sit(end).node),
    },
  }).duration;
  const settle: number = seated + 0.3;
  const ride: rideSeesaw.IRide = rideSeesaw(post, ORIGIN, {
    settle,
    pushes: [settle + 1.5, settle + 3.5, settle + 5.5],
    swing: 1.2,
  });
  const beamAt = (seconds: number): IAutoMovieRigidTransform =>
    rigid(ride.beam(seconds));
  const film: HumanPerformance = new HumanPerformance({
    seed: "seesaw",
    performers,
    props: [
      HumanObject.prop("post", post, rigid(ORIGIN)),
      HumanObject.prop("beam", beam, placed, beamAt),
    ],
    laws: [HumanSurface.seesawRide],
    composition: {
      kind: "parallel",
      parts: ends.map(
        (end: SeesawEnd): IAutoMovieComposition =>
          sit(end).registered("seesawRide", {
            on: "beam",
            seat: `${end}Seat`,
            hands: { left: `${end}LeftHandle`, right: `${end}RightHandle` },
            seconds: settle + 7 - seated,
          }).node,
      ),
    },
  });
  ends.forEach((end: SeesawEnd, index: number): void => {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(keys[index]!);
    const riding: IAutoMovieMotionHumanSegment = film
      .segments(end)
      .find(
        (segment: IAutoMovieMotionHumanSegment): boolean =>
          segment.name === "seesawRide",
      )!;
    const settled: number = riding.start + 0.6;
    const hips0: IAutoMovieVector3 = local(
      beamAt(settled),
      joint(film, "hips", settled, end),
    );
    let lowFeet: number = 0;
    let lowestSole: number = Infinity;
    let lowestSeat: number = Infinity;
    for (
      let at: number = settled;
      at <= riding.start + riding.plan.duration;
      at += 0.05
    ) {
      const drift: number = Vector3.distance(
        local(beamAt(at), joint(film, "hips", at, end)),
        hips0,
      );
      if (drift > HOLD)
        failures.push(
          `${end}: the pelvis leaves the seat by ${drift.toFixed(3)} m at ${at.toFixed(2)} s`,
        );
      const seatHeight: number = film.bones(end, at).get("hips")!.worldPosition
        .y;
      const reach: number =
        body.measure.shank +
        body.measure.ankleHeight +
        body.measure.hipHeight * 0.2;
      for (const side of SIDES) {
        const sole: number =
          joint(film, `${side}Foot`, at, end).y - body.measure.ankleHeight;
        lowestSole = Math.min(lowestSole, sole);
        lowestSeat = Math.min(lowestSeat, seatHeight);
        if (sole < HOLD) {
          lowFeet += 1;
          if (seatHeight > reach)
            failures.push(
              `${end}: the ${side} foot is on the ground with the seat high at ${at.toFixed(2)} s`,
            );
        }
      }
    }
    if (lowFeet === 0)
      failures.push(
        `${end}: lowest sole ${lowestSole.toFixed(3)} m, lowest pelvis ${lowestSeat.toFixed(3)} m`,
      );
    if (lowFeet === 0)
      failures.push(`${end}: the feet never reach the ground at the low end`);
  });
}

/** A pusher walks a roundabout round by its bar, then steps on and rides. */
function roundabout(key: BodyKey, failures: string[]): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(key);
  const base: ReturnType<typeof createRoundabout> = createRoundabout({
    radius: 1,
    height: 0.15,
  });
  const disc: ReturnType<typeof createRoundabout.disc> =
    createRoundabout.disc(base);
  const ring: number = 1.35;
  const around = (degrees: number): IAutoMovieVector3 => ({
    x: ring * Math.sin(degrees * Quaternion.DEG2RAD),
    y: 0,
    z: ring * Math.cos(degrees * Quaternion.DEG2RAD),
  });
  const performer: Performer = {
    subject: "a",
    body,
    at: around(-8),
    yaw: 90,
    proficiency: { level: "trained" as const },
  };
  const path: IAutoMovieMotionHumanWalkParams = {
    to: around(100),
    via: [around(30), around(60)],
  };

  // The disc follows the pusher: its angle is the pusher's angle round the spindle.
  const probe: HumanPerformance = new HumanPerformance({
    seed: "roundabout",
    performers: [performer],
    composition: HumanChain.subject("a").walk(path).node,
  });
  const angleOf = (seconds: number): number => {
    const hips: IAutoMovieVector3 = probe
      .bones("a", seconds)
      .get("hips")!.worldPosition;
    return Math.atan2(hips.x, hips.z) / Quaternion.DEG2RAD;
  };
  const release: number = probe.duration;
  const ride: rideRoundabout.IRide = rideRoundabout(ORIGIN, {
    driven: (seconds: number): number => angleOf(seconds) - angleOf(0),
    release,
  });
  const discAt = (seconds: number): IAutoMovieRigidTransform =>
    rigid(ride.disc(seconds));
  const board: IAutoMovieVector3 = Quaternion.rotateVector(
    discAt(release + 1.2).rotation,
    { x: 0, y: 0.15, z: 0.55 },
  );
  const film: HumanPerformance = new HumanPerformance({
    seed: "roundabout",
    performers: [performer],
    props: [
      HumanObject.prop("base", base, rigid(ORIGIN)),
      HumanObject.prop("disc", disc, discAt(0), discAt),
    ],
    laws: [HumanSurface.roundaboutPush],
    composition: HumanChain.subject("a")
      .registered("roundaboutPush", {
        ...path,
        on: "disc",
        bar: "bar0",
        hand: "left",
      })
      .walk({ to: board, on: { prop: "disc" } })
      .stand({ seconds: 1.5, on: { prop: "disc" } }).node,
  });
  const [push, , riding]: readonly IAutoMovieMotionHumanSegment[] =
    film.segments("a");
  if (push === undefined || riding === undefined) {
    failures.push(`${key}: the push, step-on and ride did not all play`);
    return;
  }
  const grip0: IAutoMovieVector3 = local(
    discAt(push.start + 0.6),
    joint(film, "leftHand", push.start + 0.6),
  );
  for (
    let at: number = push.start + 0.6;
    at <= push.start + push.plan.duration;
    at += 0.05
  ) {
    const slip: number = Vector3.distance(
      local(discAt(at), joint(film, "leftHand", at)),
      grip0,
    );
    if (slip > 3 * HOLD)
      failures.push(
        `${key}: the pushing hand leaves the bar by ${slip.toFixed(3)} m at ${at.toFixed(2)} s`,
      );
  }
  const ride0: number = riding.start + 0.1;
  for (const side of SIDES) {
    const first: IAutoMovieVector3 = local(
      discAt(ride0),
      joint(film, `${side}Foot`, ride0),
    );
    const last: IAutoMovieVector3 = local(
      discAt(riding.start + riding.plan.duration),
      joint(film, `${side}Foot`, riding.start + riding.plan.duration),
    );
    if (Vector3.distance(first, last) > HOLD)
      failures.push(`${key}: the ${side} foot slips on the turning disc`);
  }
}

/** Which end of the seesaw a rider sits on. */
type SeesawEnd = "front" | "rear";

/** One performer as a performance takes it. */
type Performer = ConstructorParameters<
  typeof HumanPerformance
>[0]["performers"][number];

/** A world transform in the rigid form a prop takes. */
function rigid(transform: IAutoMovieTransform): IAutoMovieRigidTransform {
  return { position: transform.translation, rotation: transform.rotation };
}

/** A world point in a support's frame. */
function local(
  frame: IAutoMovieRigidTransform,
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    Quaternion.inverse(frame.rotation),
    Vector3.subtract(point, frame.position),
  );
}

/** A displayed joint. */
function joint(
  film: HumanPerformance,
  bone: Parameters<ReturnType<HumanPerformance["bones"]>["get"]>[0],
  at: number,
  subject: string = "a",
): IAutoMovieVector3 {
  return film.bones(subject, at).get(bone)!.worldPosition;
}
