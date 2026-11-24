import {
  AutoMovieArchetypeRide,
  createCart,
  createHorse,
  prepareTowedCartDriver,
  rideHorse,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanMount,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { archetypeHorseRide } from "../../../features/internal/archetypeHorseRide";
import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** Seconds from each aid's onset to the transition it cues: the author's. */
const LATENCY: number = 0.4;

/**
 * A driver's aids on a horse-drawn cart (#3963): a shake of the lines before the horse moves off, a whip touch and a take-up of the lines, with the driving lines ending at the driver's palms.
 *
 * Scenarios:
 * 1. The shake's event lies `LATENCY` before the horse's first footfall after its departure, and through the shake both palms rise and fall by more than 20 mm against the cart.
 * 2. The whip touch carries the right palm forward along the cart by more than 30 mm and brings it back within 10 mm half a second after its transition.
 * 2b. A take-up before a third transition draws both palms back along the cart by more than 20 mm and gives the lines back within 10 mm half a second after it.
 * 3. Laid with their held ends at the driver's palms, both driving lines end exactly at the displayed palm through all three aids: the lines stay connected.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the take, its three scenarios and each bound's source.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the mounted law's driver aids on an actual towed cart and reads the displayed palms against the cart and the lines laid to them; an aid at the wrong time, no visible movement or a line off the palm fails.
 * @evidence contracts/development/testing.md#independent-expectations The transition is the horse's own first footfall; the lines are the cart's own laid with the palm as their end.
 * @evidence contracts/development/testing.md#distinguishing-cases A shake against a whip touch; the hand that touches against the other.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory film of one polygon man on one archetype cart and horse.
 */
export function test_motion_mount_equestrian_driver_aids(): void {
  const findings: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const seed: number = 4;
  const horse: ReturnType<typeof createHorse> = createHorse(
    { tack: "harness" },
    seed,
  );
  const cart: ReturnType<typeof createCart> = createCart(
    { kind: "cart", withersHeight: horse.dimensions.withersHeight! },
    seed,
  );
  const departs: number = 5;
  const leader: ReturnType<typeof rideHorse> = rideHorse(horse, {
    start: { x: 0, z: 0, heading: 0 },
    legs: [{ kind: "straight", length: 20 }],
    at: departs,
    cruise: 1.5,
    acceleration: 0.5,
    deceleration: 0.5,
  });
  const ride: AutoMovieArchetypeRide.ITowedRide<
    createCart.Affordance,
    createCart.Dimension
  > = AutoMovieArchetypeRide.towed(leader, "hitch", cart, "coupling", {
    lines: createCart.lines(cart),
    support: createCart.towing(cart),
  });
  const place = (seconds: number): IAutoMovieRigidTransform => {
    const frame: IAutoMovieTransform = ride.at(seconds).placement;
    return { position: frame.translation, rotation: frame.rotation };
  };
  const binding = prepareTowedCartDriver(cart, ride);
  const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
    cart,
    place(0),
    "seat",
  );
  const boardAt: IAutoMovieTransform = ride.frame("footboard", 0);
  const board = cart.affordance("footboard");
  const foot: number = -board.depth! / 2 + body.measure.footLength / 2;
  const onBoard = (x: number): IAutoMovieVector3 =>
    Vector3.add(
      boardAt.translation,
      Quaternion.rotateVector(boardAt.rotation, { x, y: 0, z: foot }),
    );
  const go: number = archetypeHorseRide
    .footfalls(leader, "leftFore")
    .find((s: number): boolean => s > departs)!;
  const touch: number = go + 3;
  const gather: number = touch + 2;
  const film: HumanPerformance = new HumanPerformance({
    seed: "driver-aids",
    laws: [
      AutoMovieMotionHumanMount.rideHorse.ride,
      AutoMovieMotionHumanMount.mounted,
    ],
    cues: {
      go: [{ name: "go", seconds: go }],
      touch: [{ name: "touch", seconds: touch }],
      gather: [{ name: "gather", seconds: gather }],
    },
    props: [
      HumanObject.prop("cart", cart, place(0), binding.motion, binding.point),
    ],
    performers: [
      {
        subject: "driver",
        body,
        at: onBoard(0),
        yaw: seat.yaw,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("driver")
      .stand({ hold: 0.3, on: { prop: "cart" } })
      .sit({
        seat: {
          ...seat,
          footrests: {
            left: onBoard(board.width! / 8),
            right: onBoard(-board.width! / 8),
          },
        },
        hold: 0.5,
      })
      .registered("ride", {
        on: "cart",
        duration: 0.6,
        seat: "seat",
        hands: { left: "leftLineGrip", right: "rightLineGrip" },
      })
      .registered("mounted", {
        on: "cart",
        frame: "seat",
        aids: [
          { kind: "shake", cue: "go", latency: LATENCY },
          { kind: "whipTouch", side: "right", cue: "touch", latency: LATENCY },
          { kind: "takeUp", cue: "gather", latency: LATENCY },
        ],
        figures: [
          {
            seat: "entered",
            transfer: 0.3,
            hold: gather + 1.5,
            supports: { leftHand: "leftLineGrip", rightHand: "rightLineGrip" },
          },
        ],
      }).node,
  });
  assertTakeClean("a driver's aids", film);
  const take: IAutoMovieMotionHumanSegment = film.segments("driver").at(-1)!;
  const event = (prefix: string): number | undefined => {
    const found = take.plan.events.find((e) => e.name.startsWith(prefix));
    return found === undefined
      ? undefined
      : take.start + found.share * (take.end - take.start);
  };
  const palm = (side: "left" | "right", at: number): IAutoMovieVector3 =>
    HumanHand.frame(body, film.bones("driver", at), side, "palm").point;
  const local = (side: "left" | "right", at: number): IAutoMovieVector3 => {
    const frame: IAutoMovieRigidTransform = place(at);
    return Quaternion.rotateVector(
      Quaternion.inverse(frame.rotation),
      Vector3.subtract(palm(side, at), frame.position),
    );
  };

  // 1. The shake's timing and its lift.
  const shaken: number | undefined = event("aid:shake");
  if (shaken === undefined || Math.abs(go - shaken - LATENCY) > 1e-6)
    findings.push(`shake: at ${shaken}, the horse moves off at ${go}`);
  else
    for (const side of ["left", "right"] as const) {
      let low: number = Infinity;
      let high: number = -Infinity;
      for (let k: number = 0; k <= 24; ++k) {
        const y: number = local(side, shaken + (LATENCY * k) / 24).y;
        low = Math.min(low, y);
        high = Math.max(high, y);
      }
      if (!(high - low > 0.02))
        findings.push(
          `shake: the ${side} palm rises and falls only ${(high - low).toFixed(3)} m`,
        );
    }

  // 2. The whip touch's flick.
  const flicked: number | undefined = event("aid:whipTouch");
  if (flicked !== undefined) {
    const before: IAutoMovieVector3 = local("right", flicked - 0.1);
    if (!(local("right", touch).z - before.z > 0.03))
      findings.push(
        `whip touch: the right palm comes forward only ${(local("right", touch).z - before.z).toFixed(3)} m`,
      );
    if (Vector3.distance(local("right", touch + 0.5), before) > 0.01)
      findings.push("whip touch: the right palm does not come back");
  } else findings.push("whip touch: no event");

  // 2b. The take-up gathers the lines: each palm travels back along the cart by more than 20 mm and comes forward again after the transition.
  for (const side of ["left", "right"] as const) {
    const before: IAutoMovieVector3 = local(side, gather - LATENCY - 0.1);
    const drawn: number = before.z - local(side, gather).z;
    if (!(drawn > 0.02))
      findings.push(
        `take-up: the ${side} palm draws back only ${drawn.toFixed(3)} m`,
      );
    if (Vector3.distance(local(side, gather + 0.5), before) > 0.01)
      findings.push(`take-up: the ${side} palm does not give the line back`);
  }

  // 3. The lines laid to the palms end at them.
  const held: AutoMovieArchetypeRide.ITowedRide<
    createCart.Affordance,
    createCart.Dimension
  > = AutoMovieArchetypeRide.towed(leader, "hitch", cart, "coupling", {
    lines: createCart.lines(cart, (side, at: number) => palm(side, at)),
    support: createCart.towing(cart),
  });
  for (const at of [go - 0.2, touch, gather]) {
    for (const side of ["left", "right"] as const) {
      const line = held
        .at(at)
        .lines!.find(
          (l: AutoMovieArchetypeRide.ILineState): boolean =>
            l.id === `line-${side}`,
        )!;
      if (Vector3.distance(line.points.at(-1)!, palm(side, at)) > 1e-6)
        findings.push(
          `lines: the ${side} line ends off the palm at ${at.toFixed(2)} s`,
        );
    }
  }

  TestValidator.equals("a driver's aids with connected lines", findings, []);
}
