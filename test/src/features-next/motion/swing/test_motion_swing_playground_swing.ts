import { createSwing, rideSwing } from "@automovie/archetypes";
import { AutoMovieGravity, Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRide,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { playgroundTake } from "../../../features/internal/playgroundTake";

/**
 * A rider sits on a swing, pumps it and leaps off it (#3989).
 *
 * Scenarios, on the average man and the small woman:
 * 1. Pumping adds a positive angle each half swing, derived from the
 *    rider's body; the pelvis stays on the seat and the hands on the
 *    chains in the seat's frame; the trunk leans back while the seat
 *    swings forward and sits up while it swings back.
 * 2. Leaping off near the forward turning point, the pelvis follows the
 *    projectile from the seat's velocity and the feet land on the ground.
 * 3. A rider wider across the thighs than the seat is refused, and so are
 *    a lean past the pump's range and a lean on chain grips held higher
 *    than the seated rider's arms reach.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the equipment, bodies, contacts and checked frames.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed pelvis, wrists, ankles and trunk against the actual seat frame of the ride.
 * @evidence contracts/development/testing.md#independent-expectations The seat frame comes from the ride; the projectile from the seat's finite-difference velocity under standard gravity; contacts hold within the 20 mm ride tolerance.
 * @evidence contracts/development/testing.md#distinguishing-cases Forward and backward swing, an admitted rider and three refused takes, two bodies.
 * @evidence contracts/development/testing.md#execution-ownership In-memory archetypes, rides and Human performances; no host.
 */
export function test_motion_swing_playground_swing(): void {
  const failures: string[] = [];
  for (const key of ["m-average", "f-small"] as const) swing(key, failures);
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const narrow: ReturnType<typeof createSwing> = createSwing({
    seatWidth: 0.28,
    grip: 0.45,
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
  TestValidator.equals("swing ride", failures, []);
}
/** The seated swing take: sit on the held-back seat, pump, then leap. */
function swingFilm(
  body: IAutoMovieMotionHumanBody,
  frame: ReturnType<typeof createSwing>,
  halves: number,
  increment: number,
  lean: number = 20,
): HumanPerformance {
  const model: ReturnType<typeof createSwing.seat> = createSwing.seat(frame);
  const hang: number = hanging(frame);
  const ride: rideSwing.IRide = rideSwing(frame, playgroundTake.ORIGIN, {
    length: hang,
    start: -42,
    halves,
    pumps: halves - 1,
    increment,
  });
  const placed: IAutoMovieRigidTransform = playgroundTake.rigid(ride.seat(0));
  const front: IAutoMovieVector3 = Vector3.add(
    placed.position,
    Quaternion.rotateVector(placed.rotation, { x: 0, y: -hang, z: 0.35 }),
  );
  const performer: playgroundTake.Performer = {
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
      hold: 1.2,
    }).node,
  }).duration;
  const seatAt = (seconds: number): IAutoMovieRigidTransform =>
    playgroundTake.rigid(ride.seat(Math.max(0, seconds - sitting)));
  return new HumanPerformance({
    seed: "swing",
    performers: [performer],
    props: [
      HumanObject.prop(
        "frame",
        frame,
        playgroundTake.rigid(playgroundTake.ORIGIN),
      ),
      HumanObject.prop("seat", model, placed, seatAt),
    ],
    laws: [
      AutoMovieMotionHumanRide.HumanSurface.swingPump,
      AutoMovieMotionHumanRide.HumanSurface.swingLeap,
    ],
    composition: HumanChain.subject("a")
      .sit({ seat: HumanObject.seat(model, placed), hold: 1.2 })
      .registered("swingPump", {
        on: "seat",
        seat: "seat",
        hands: { left: "leftChain", right: "rightChain" },
        duration: (halves - 0.15) * ride.half,
        lean,
      })
      .registered("swingLeap", { on: "seat" }).node,
  });
}

/** Pump a swing, check the seat, grips and lean, then the leap. */
function swing(key: playgroundTake.BodyKey, failures: string[]): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(key);
  const frame: ReturnType<typeof createSwing> = createSwing({
    pivot: 2.3,
    clearance: 0.4,
    seatWidth: 0.45,
    grip: 0.45,
  });
  const hang: number = hanging(frame);
  // A small body's arms hold the chains at a shallower lean.
  const lean: number = key === "f-small" ? 10 : 20;
  const increment: number = AutoMovieMotionHumanRide.HumanSurface.pumpIncrement(
    body,
    hang,
    lean,
  );
  if (!(increment > 0 && increment < 10))
    failures.push(
      `${key}: pumping adds ${increment.toFixed(3)} degrees a half swing`,
    );
  const film: HumanPerformance = swingFilm(body, frame, 7, increment, lean);
  if (key === "f-small") {
    // A lean past the law's range, and chains held higher than a seated
    // rider's arms reach, are both refused on the lean.
    const refused: readonly IRefusalCase[] = [
      {
        label: "a lean past its range",
        take: (): HumanPerformance => swingFilm(body, frame, 7, increment, 50),
      },
      {
        label: "a lean on chains beyond the arms' reach",
        take: (): HumanPerformance =>
          swingFilm(
            body,
            createSwing({
              pivot: 2.3,
              clearance: 0.4,
              seatWidth: 0.45,
              grip: 1.2,
            }),
            7,
            increment,
            lean,
          ),
      },
    ];
    for (const { label, take } of refused) {
      let refusal: unknown;
      try {
        take().duration;
      } catch (error) {
        refusal = error;
      }
      if (!(refusal instanceof HumanRefusal && refusal.axis === "lean"))
        failures.push(`${key}: ${label} is not refused: ${String(refusal)}`);
    }
  }
  playgroundTake.clean(`${key} swing`, film, failures);
  const [sat, pump, leap]: readonly IAutoMovieMotionHumanSegment[] =
    film.segments("a");
  if (sat === undefined || pump === undefined || leap === undefined) {
    failures.push(`${key}: the sit, pump and leap did not all play`);
    return;
  }
  const seatFrame = (seconds: number): IAutoMovieRigidTransform =>
    film.prop("seat", seconds);
  const settled: number = pump.start + 0.6;
  const hips0: IAutoMovieVector3 = playgroundTake.local(
    seatFrame(settled),
    playgroundTake.joint(film, "hips", settled),
  );
  const wrists0: IAutoMovieVector3[] = playgroundTake.SIDES.map(
    (side: AutoMovieHumanSide): IAutoMovieVector3 =>
      playgroundTake.local(
        seatFrame(settled),
        playgroundTake.joint(film, `${side}Hand`, settled),
      ),
  );
  const end: number = pump.start + pump.plan.duration;
  let leanForward: number = 0;
  let leanBackward: number = 0;
  for (let at: number = settled; at <= end; at += 0.05) {
    const drift: number = Vector3.distance(
      playgroundTake.local(
        seatFrame(at),
        playgroundTake.joint(film, "hips", at),
      ),
      hips0,
    );
    if (drift > playgroundTake.HOLD)
      failures.push(
        `${key}: the pelvis leaves the seat by ${drift.toFixed(3)} m at ${at.toFixed(2)} s`,
      );
    playgroundTake.SIDES.forEach(
      (side: AutoMovieHumanSide, index: number): void => {
        const slip: number = Vector3.distance(
          playgroundTake.local(
            seatFrame(at),
            playgroundTake.joint(film, `${side}Hand`, at),
          ),
          wrists0[index]!,
        );
        if (slip > 3 * playgroundTake.HOLD)
          failures.push(
            `${key}: the ${side} hand leaves its chain by ${slip.toFixed(3)} m at ${at.toFixed(2)} s`,
          );
      },
    );
    const motion: number =
      seatFrame(at + 0.01).rotation.x - seatFrame(at - 0.01).rotation.x;
    const trunk: number =
      playgroundTake.joint(film, "neck", at).z -
      playgroundTake.joint(film, "hips", at).z;
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
      Vector3.subtract(
        playgroundTake.joint(film, "hips", release),
        held.position,
      ),
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
      Vector3.add(
        playgroundTake.joint(film, "hips", release),
        Vector3.scale(velocity, t),
      ),
      { x: 0, y: (-AutoMovieGravity.STANDARD * t * t) / 2, z: 0 },
    );
    const off: number = Vector3.distance(
      playgroundTake.joint(film, "hips", at),
      expected,
    );
    if (off > playgroundTake.HOLD / 2)
      failures.push(
        `${key}: the leap leaves the projectile by ${off.toFixed(3)} m at ${t.toFixed(2)} s`,
      );
  }
  const landed: number = leap.start + leap.plan.duration;
  for (const side of playgroundTake.SIDES) {
    const height: number =
      playgroundTake.joint(film, `${side}Foot`, landed).y -
      body.measure.ankleHeight;
    if (Math.abs(height) > playgroundTake.HOLD)
      failures.push(
        `${key}: the ${side} foot lands ${height.toFixed(3)} m off the ground`,
      );
  }
}

/** A swing take the pump must refuse, and what it is. */
interface IRefusalCase {
  /** What the take asks for. */
  label: string;

  /** Builds the take, throwing the refusal. */
  take: () => HumanPerformance;
}

/** The swing's hanging length, from its pivot to its seat's clearance, as the frame drew them. */
function hanging(frame: ReturnType<typeof createSwing>): number {
  const { pivot, clearance } = frame.dimensions;
  if (pivot === undefined || clearance === undefined)
    throw new Error("the swing frame names no pivot or seat clearance");
  return pivot - clearance;
}
