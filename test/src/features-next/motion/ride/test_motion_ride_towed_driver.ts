import {
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRide,
  createCart,
  createHorse,
  prepareTowedCartDriver,
  rideHorse,
} from "@automovie/archetypes";
import {
  Quaternion,
  RigidCarrierSample,
  Vector3,
  pointSegmentDistance,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanSeated,
  IAutoMovieResolvedBone,
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
import { HumanFoot, HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * A seated driver stays on the seat and holds both driving lines while a
 * horse draws a cart at a walk through a quarter turn.
 *
 * Scenarios:
 * 1. The average man and the small woman board the same cart while it waits.
 * 2. At departure, mid-turn and turn exit, the seat socket lies within
 *    10 mm of the seat rectangle.
 * 3. At those same instants each palm lies within 10 mm of the skin of the
 *    driving line's run between the terret and the point held by the driver.
 * 4. Each foot bears within 10 mm of the cart's footboard at those instants.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the bodies, course and seat, palm and sole observations in metres at three named course positions.
 * @evidence contracts/development/testing.md#behavioral-verification Composes a real horse and cart through the public towing and ride APIs and reads the displayed driver's seat, palm and sole sockets against the actual posed cart and laid lines. A seat left behind or a hand following the wrong line fails.
 * @evidence contracts/development/testing.md#independent-expectations The 10 mm tolerance and quarter-turn radius are from #3473 and #3495. The seat rectangle is the cart's own affordance and the rein surface is the emitted line segment widened by its declared radius. The footboard rectangle comes from the cart's posed surface affordance. These oracles use no rider targets or prior rider poses. Three samples leave intervening instants and finger closure unchecked.
 * @evidence contracts/development/testing.md#distinguishing-cases Both body builds, both hands, both feet, and separate readings at departure, during steering and at the end of the turn. Cart ground contact and each harness anchor have separate archetype specs.
 * @evidence contracts/development/testing.md#execution-ownership The exported in-memory case shares one towing plan across the two drivers and reads their displayed bones once each at three instants.
 */
export function test_motion_ride_towed_driver(): void {
  const departuresAt: number = 6;
  const straight: number = 8;
  const radius: number = 10;
  const arc: number = (Math.PI * radius) / 2;
  const tolerance: number = 0.01;
  const seed: number = 4;
  const horse: ReturnType<typeof createHorse> = createHorse(
    { tack: "harness" },
    seed,
  );
  const cart: ReturnType<typeof createCart> = createCart(
    { kind: "cart", withersHeight: horse.dimensions.withersHeight! },
    seed,
  );
  const leader: ReturnType<typeof rideHorse> = rideHorse(horse, {
    start: { x: 0, z: 0, heading: 0 },
    legs: [
      { kind: "straight", length: straight },
      { kind: "turn", radius, angle: 90 },
      { kind: "straight", length: straight },
    ],
    at: departuresAt,
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
  const placement = (seconds: number): IAutoMovieRigidTransform => {
    const frame: IAutoMovieTransform = ride.at(seconds).placement;
    return { position: frame.translation, rotation: frame.rotation };
  };
  const initial: IAutoMovieRigidTransform = placement(0);
  const binding: RigidCarrierSample.IBinding = prepareTowedCartDriver(
    cart,
    ride,
  );
  const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
    cart,
    initial,
    "seat",
  );
  const board: IAutoMovieAffordance = cart.affordance("footboard");
  const boardAt: IAutoMovieTransform = ride.frame("footboard", 0);
  const onBoard = (x: number, z: number): IAutoMovieVector3 =>
    Vector3.add(
      boardAt.translation,
      Quaternion.rotateVector(boardAt.rotation, { x, y: 0, z }),
    );
  const seatSurface: IAutoMovieAffordance = cart.affordance("seat");
  const instants: readonly number[] = [
    departuresAt,
    ride.plan.when(straight + arc / 2),
    ride.plan.when(straight + arc),
  ];
  /** The provisional hand station follows the actual flexible material as the hitch turns. */
  const contact = (id: string, seconds: number): IAutoMovieTransform => {
    const nominal: IAutoMovieTransform = ride.frame(
      id as createCart.Affordance,
      seconds,
    );
    if (id !== "leftLineGrip" && id !== "rightLineGrip") return nominal;
    const side: "left" | "right" = id === "leftLineGrip" ? "left" : "right";
    const line: AutoMovieArchetypeRide.ILineState = ride
      .at(seconds)
      .lines!.find(
        (laid: AutoMovieArchetypeRide.ILineState): boolean =>
          laid.id === `line-${side}`,
      )!;
    const from: IAutoMovieVector3 = line.points.at(-1)!;
    const to: IAutoMovieVector3 = line.points.at(-2)!;
    const span: IAutoMovieVector3 = Vector3.subtract(to, from);
    const along: IAutoMovieVector3 = Vector3.normalize(span);
    const share: number = Math.min(
      1,
      Math.max(
        0,
        Vector3.dot(Vector3.subtract(nominal.translation, from), span) /
          Vector3.dot(span, span),
      ),
    );
    return AutoMovieArchetypeFrame.facing(
      Vector3.lerp(from, to, share),
      Vector3.addScaled({ x: 0, y: 1, z: 0 }, along, -along.y),
      along,
    );
  };
  const findings: string[] = [];
  const samePoint = (a: IAutoMovieVector3, b: IAutoMovieVector3): boolean =>
    Object.is(a.x, b.x) && Object.is(a.y, b.y) && Object.is(a.z, b.z);
  const sameRigid = (
    a: IAutoMovieRigidTransform,
    b: IAutoMovieRigidTransform,
  ): boolean =>
    samePoint(a.position, b.position) &&
    samePoint(a.rotation, b.rotation) &&
    Object.is(a.rotation.w, b.rotation.w);

  // Compare off-grid, backward and repeated native reads against the renderer path.
  for (const seconds of [
    instants[1]! + 0.013,
    instants[0]!,
    instants[2]!,
    instants[1]! + 0.013,
  ]) {
    TestValidator.predicate(
      "native root matches the rendered cart exactly",
      sameRigid(placement(seconds), binding.motion(seconds)),
    );
    for (const id of ["leftLineGrip", "rightLineGrip", "seat"] as const) {
      const a: IAutoMovieTransform = contact(id, seconds);
      const b: IAutoMovieTransform = binding.point(id, seconds);
      TestValidator.predicate(
        `native ${id} matches the full scene exactly`,
        sameRigid(
          { position: a.translation, rotation: a.rotation },
          { position: b.translation, rotation: b.rotation },
        ) && samePoint(a.scale, b.scale),
      );
    }
  }

  let reads: number = 0;
  const probe: RigidCarrierSample.IBinding = prepareTowedCartDriver(cart, {
    ...ride,
    geometry: (seconds: number): ReturnType<typeof ride.geometry> => {
      ++reads;
      return ride.geometry(seconds);
    },
  });
  const bound = HumanObject.prop(
    "bound",
    cart,
    initial,
    probe.motion,
    probe.point,
  );
  const current: RigidCarrierSample.IRead = RigidCarrierSample.playback(
    bound,
  )!.sample(instants[1]!);
  for (const id of ["leftLineGrip", "rightLineGrip", "seat"]) current.point(id);
  TestValidator.equals(
    "paired material reads take one current tow sample",
    reads,
    1,
  );

  const opaque = HumanObject.prop(
    "opaque",
    cart,
    initial,
    (seconds) => probe.motion(seconds),
    (id, seconds) => probe.point(id, seconds),
  );
  TestValidator.equals(
    "rewrapped readers receive no paired playback",
    RigidCarrierSample.playback(opaque),
    undefined,
  );
  for (const id of ["leftLineGrip", "rightLineGrip", "seat"])
    opaque.point!(id, instants[1]!);
  TestValidator.equals(
    "foreign readers still take each authored call",
    reads,
    4,
  );

  /** Report the missed contact in millimetres without interrupting the sweep. */
  const check = (label: string, gap: number): void => {
    if (!(gap <= tolerance))
      findings.push(`${label}: ${(gap * 1000).toFixed(1)} mm from contact`);
  };
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    // The driver boards at the seat-side edge of the real board. The seat's
    // two footrests are separate ball contacts on that rectangle.
    const boardRear: number = -board.depth! / 2;
    const foot: number = boardRear + body.measure.footLength / 2;
    const standAt: IAutoMovieVector3 = onBoard(0, foot);
    const drivingSeat: IAutoMovieMotionHumanSeated.ISeat = {
      ...seat,
      footrests: {
        left: onBoard(board.width! / 8, foot),
        right: onBoard(-board.width! / 8, foot),
      },
    };
    let performance: HumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "towed-driver",
        laws: [AutoMovieMotionHumanMount.rideHorse.ride],
        props: [
          HumanObject.prop(
            "cart",
            cart,
            initial,
            binding.motion,
            binding.point,
          ),
        ],
        performers: [
          {
            subject: "driver",
            body,
            at: standAt,
            yaw: seat.yaw,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("driver")
          .stand({ hold: 0.3, on: { prop: "cart" } })
          .sit({ seat: drivingSeat, hold: 0.5 })
          .registered("ride", {
            on: "cart",
            duration: ride.duration,
            seat: "seat",
            hands: { left: "leftLineGrip", right: "rightLineGrip" },
          }).node,
      });
    } catch (error) {
      findings.push(
        `${name}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }

    assertTakeClean(`the towed driver ${name}`, performance);
    for (const seconds of instants) {
      const label: string = `${name} at ${seconds.toFixed(2)} s`;
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        performance.bones("driver", seconds);
      const sample: ReturnType<typeof ride.at> = ride.at(seconds);

      // A seat's origin is the front edge. Its usable rectangle extends
      // behind that edge, with its normal along local +Y.
      const frame: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
        sample.placement,
        sample.archetype.affordance("seat").frame,
      );
      const socket: typeof body.surfaces.regions.seat =
        body.surfaces.regions.seat;
      const local: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(frame.rotation),
        Vector3.subtract(
          resolveAutoMovieHumanoidSurfaces.place(
            socket,
            bones.get(socket.bone)!,
          ).point,
          frame.translation,
        ),
      );
      check(
        `${label}, seat`,
        Math.hypot(
          Math.max(0, Math.abs(local.x) - seatSurface.width! / 2),
          local.y,
          Math.max(0, local.z, -seatSurface.depth! - local.z),
        ),
      );

      const board: IAutoMovieAffordance =
        sample.archetype.affordance("footboard");
      const boardFrame: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
        sample.placement,
        board.frame,
      );
      const boardInverse: ReturnType<typeof Quaternion.inverse> =
        Quaternion.inverse(boardFrame.rotation);
      for (const side of ["left", "right"] as const) {
        const sole: IAutoMovieVector3[] = HumanFoot.sockets(
          body,
          bones,
          side,
        ).map(
          ({ point }: IAutoMovieMotionHumanFoot.ISocket): IAutoMovieVector3 =>
            Quaternion.rotateVector(
              boardInverse,
              Vector3.subtract(point, boardFrame.translation),
            ),
        );
        check(
          `${label}, ${side} sole`,
          Math.min(
            ...sole.map((p: IAutoMovieVector3): number =>
              Math.hypot(
                Math.max(0, Math.abs(p.x) - board.width! / 2),
                p.y,
                Math.max(0, Math.abs(p.z) - board.depth! / 2),
              ),
            ),
          ),
        );
        check(
          `${label}, ${side} sole penetration`,
          -Math.min(...sole.map((p: IAutoMovieVector3): number => p.y)),
        );

        const line: AutoMovieArchetypeRide.ILineState | undefined =
          sample.lines?.find(
            (entry: AutoMovieArchetypeRide.ILineState): boolean =>
              entry.id === `line-${side}`,
          );
        const from: IAutoMovieVector3 | undefined = line?.points.at(-2);
        const to: IAutoMovieVector3 | undefined = line?.points.at(-1);
        if (line === undefined || from === undefined || to === undefined) {
          findings.push(`${label}, ${side} palm: no driving line was laid`);
          continue;
        }
        const palm: IAutoMovieVector3 = HumanHand.frame(
          body,
          bones,
          side,
          "palm",
        ).point;
        check(
          `${label}, ${side} palm`,
          Math.abs(pointSegmentDistance(palm, from, to) - line.radius),
        );
      }
    }
  }
  TestValidator.equals(
    "the seated driver stays on the drawn cart",
    findings,
    [],
  );
}
