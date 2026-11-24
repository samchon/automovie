import {
  type AutoMovieArchetype,
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeEquineTeam,
  type AutoMovieArchetypeEquineTeamPlan,
  AutoMovieArchetypeFrame,
  type AutoMovieArchetypeRide,
  createCart,
  createHorse,
} from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  pointSegmentDistance,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanRide,
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
import { HumanFoot, HumanFrame, HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The seconds a performer has to take its seat before the team moves off. */
const WAIT: number = 6;

/** The contact tolerance of the towed driver's spec, metres (#3473, #3495). */
const TOLERANCE: number = 0.01;

/**
 * A four-in-hand's box driver sits on the brougham's box holding the eight reins, and a postilion rides the near wheeler, while the team draws the carriage through a turn.
 *
 * Scenarios:
 * 1. The team's reins run from every horse's bit rings to the box driver's two hand stations, the near reins to the left hand and the off reins to the right.
 * 2. At departure, mid-turn and the turn's exit the driver's seat socket lies within 10 mm of the box's seat rectangle and each palm within 10 mm of the skin of its reins.
 * 3. At the same seconds the postilion's seat socket lies within 10 mm of the near wheeler's saddle seat rectangle.
 * 4. A charioteer stands on a pair's chariot floor, carried by it: at the same course seconds each sole lies within 10 mm of the floor rectangle.
 * 5. Each take passes the shipped take verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios, the bodies and the tolerance.
 * @evidence contracts/development/testing.md#behavioral-verification Composes a team, a seated driver and a seated postilion through public APIs and reads displayed seat and palm sockets against the posed box, the laid reins and the posed saddle; a driver left behind, a hand off its reins or a rider off the saddle fails.
 * @evidence contracts/development/testing.md#independent-expectations The 10 mm tolerance is the towed driver's; seat rectangles are the vehicles' and the saddle's own affordances; reins are the laid segments widened by their radius; no rider target is read.
 * @evidence contracts/development/testing.md#distinguishing-cases A box driver on a carriage, a postilion on a horse in the same team and a standing charioteer on a pair's chariot at three course positions; the team's own spans and states belong to test_archetype_equine_draft_team.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name.
 */
export function test_motion_mount_equine_draft_driver(): void {
  const horses: AutoMovieArchetype<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  >[] = [
    createHorse({ tack: "both", withersHeight: 1.6, tempo: 0 }, 1),
    createHorse({ tack: "harness", withersHeight: 1.6, tempo: 0 }, 2),
    createHorse({ tack: "harness", withersHeight: 1.6, tempo: 0 }, 3),
    createHorse({ tack: "harness", withersHeight: 1.6, tempo: 0 }, 4),
  ];
  const carriage: ReturnType<typeof createCart> = createCart(
    { kind: "carriage" },
    1,
  );
  const params: AutoMovieArchetypeEquineTeamPlan.IParams = {
    hitch: "fourInHand",
    spacing: 0.8,
    length: 3,
    start: { x: 0, z: 0, heading: 0 },
    legs: [
      { kind: "straight", length: 8 },
      { kind: "turn", radius: 15, angle: 45 },
      { kind: "straight", length: 8 },
    ],
    cruise: 1.4,
    rate: 2,
    gait: "walk",
    trace: 2.6,
    stop: true,
    sag: 0.06,
  };
  const team: AutoMovieArchetypeEquineTeamPlan.ITeam<
    createCart.Affordance,
    createCart.Dimension
  > = AutoMovieArchetypeEquineTeam(horses, carriage, params);
  const issues: string[] = [];
  const instants: readonly number[] = [
    WAIT + 0.5,
    WAIT + (8 + (15 * Math.PI) / 8) / 1.4,
    WAIT + (8 + (15 * Math.PI) / 4) / 1.4,
  ];

  // 1. Every horse's two reins end at the box driver's hand on their side.
  const laid: Readonly<
    AutoMovieArchetypeEquineTeamPlan.ISample<
      createCart.Affordance,
      createCart.Dimension
    >
  > = team.at(3);
  for (let k: number = 0; k < horses.length; k++)
    for (const side of ["left", "right"] as const) {
      const rein: AutoMovieArchetypeRide.ILineState | undefined =
        laid.lines.find(
          (line: AutoMovieArchetypeRide.ILineState): boolean =>
            line.id === `rein-${k}-${side}`,
        );
      const hand: IAutoMovieVector3 = AutoMovieArchetypeFrame.compose(
        laid.placement,
        laid.vehicle.affordance(`${side}LineGrip`).frame,
      ).translation;
      if (
        rein === undefined ||
        Vector3.distance(rein.points.at(-1)!, hand) > 1e-9
      )
        issues.push(
          `horse ${k}'s ${side} rein does not reach the ${side} hand`,
        );
    }

  // 2. The box driver.
  const vehiclePlacement = (seconds: number): IAutoMovieRigidTransform => {
    const frame: IAutoMovieTransform = team.vehicle.at(
      Math.max(0, seconds - WAIT),
    ).placement;
    return { position: frame.translation, rotation: frame.rotation };
  };
  const vehiclePart = (id: string, seconds: number): IAutoMovieTransform =>
    team.vehicle.frame(
      id as createCart.Affordance,
      Math.max(0, seconds - WAIT),
    );
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const box: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
    carriage,
    vehiclePlacement(0),
    "box",
  );
  const driver: HumanPerformance | undefined = perform(
    "driver",
    carriage,
    box,
    vehiclePlacement,
    vehiclePart,
    {
      on: "carriage",
      duration: WAIT + team.duration,
      seat: "box",
      hands: { left: "leftLineGrip", right: "rightLineGrip" },
    },
  );
  if (driver !== undefined)
    for (const seconds of instants) {
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        driver.bones("driver", seconds);
      const placement: IAutoMovieTransform = team.vehicle.at(
        seconds - WAIT,
      ).placement;
      seated(
        `driver ${seconds.toFixed(2)}`,
        bones,
        AutoMovieArchetypeFrame.compose(
          placement,
          carriage.affordance("box").frame,
        ),
        carriage.affordance("box"),
      );
      const sample: AutoMovieArchetypeEquineTeamPlan.ISample<
        createCart.Affordance,
        createCart.Dimension
      > = team.at(seconds - WAIT);
      for (const side of ["left", "right"] as const) {
        const palm: IAutoMovieVector3 = HumanHand.frame(
          body,
          bones,
          side,
          "palm",
        ).point;
        const gap: number = Math.min(
          ...sample.lines
            .filter(
              (line: AutoMovieArchetypeRide.ILineState): boolean =>
                line.id.startsWith("rein-") && line.id.endsWith(`-${side}`),
            )
            .map(
              (line: AutoMovieArchetypeRide.ILineState): number =>
                pointSegmentDistance(
                  palm,
                  line.points[0]!,
                  line.points.at(-1)!,
                ) - line.radius,
            ),
        );
        if (!(gap <= TOLERANCE))
          issues.push(
            `driver ${seconds.toFixed(2)}: ${side} palm ${(gap * 1000).toFixed(1)} mm from its reins`,
          );
      }
    }

  // 3. The postilion on the near wheeler.
  const ride: AutoMovieArchetypeRide.IRide<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  > = team.rides[0]!;
  const horsePlacement = (seconds: number): IAutoMovieRigidTransform => {
    const frame: IAutoMovieTransform = ride.at(
      Math.max(0, seconds - WAIT),
    ).placement;
    return { position: frame.translation, rotation: frame.rotation };
  };
  const horsePart = (id: string, seconds: number): IAutoMovieTransform =>
    ride.frame(
      id as AutoMovieArchetypeEquine.Affordance,
      Math.max(0, seconds - WAIT),
    );
  // The postilion sits on the saddle as the ride poses it at its start, not on the rest horse's: a stance lowers the trunk.
  const saddle: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
    ride.at(0).archetype,
    horsePlacement(0),
  );
  const postilion: HumanPerformance | undefined = perform(
    "postilion",
    horses[0]!,
    saddle,
    horsePlacement,
    horsePart,
    {
      on: "horse",
      duration: WAIT + team.duration,
      seat: "seat",
      feet: { left: "leftStirrup", right: "rightStirrup" },
      hands: { left: "leftRein", right: "rightRein" },
    },
  );
  if (postilion !== undefined)
    for (const seconds of instants) {
      const sample: AutoMovieArchetypeRide.ISample<
        AutoMovieArchetypeEquine.Affordance,
        AutoMovieArchetypeEquine.Dimension
      > = ride.at(seconds - WAIT);
      seated(
        `postilion ${seconds.toFixed(2)}`,
        postilion.bones("postilion", seconds),
        AutoMovieArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance("seat").frame,
        ),
        horses[0]!.affordance("seat"),
      );
    }
  // 4. A charioteer standing on a pair's chariot floor.
  const chariot: ReturnType<typeof createCart> = createCart(
    { kind: "chariot", withersHeight: 1.6 },
    1,
  );
  const pair: AutoMovieArchetypeEquineTeamPlan.ITeam<
    createCart.Affordance,
    createCart.Dimension
  > = AutoMovieArchetypeEquineTeam([horses[1]!, horses[2]!], chariot, {
    ...params,
    hitch: "pair",
  });
  const floorAt = (seconds: number): IAutoMovieTransform =>
    pair.vehicle.frame("floor", Math.max(0, seconds - WAIT));
  const chariotPlacement = (seconds: number): IAutoMovieRigidTransform => {
    const frame: IAutoMovieTransform = pair.vehicle.at(
      Math.max(0, seconds - WAIT),
    ).placement;
    return { position: frame.translation, rotation: frame.rotation };
  };
  const floor: IAutoMovieAffordance = chariot.affordance("floor");
  let charioteer: HumanPerformance | undefined;
  try {
    charioteer = new HumanPerformance({
      seed: "team-charioteer",
      laws: [AutoMovieMotionHumanMount.rideHorse.ride],
      props: [
        HumanObject.prop(
          "chariot",
          chariot,
          chariotPlacement(0),
          chariotPlacement,
          (id: string, seconds: number): IAutoMovieTransform =>
            pair.vehicle.frame(
              id as createCart.Affordance,
              Math.max(0, seconds - WAIT),
            ),
        ),
      ],
      performers: [
        {
          subject: "charioteer",
          body,
          at: floorAt(0).translation,
          yaw:
            (Math.atan2(
              AutoMovieArchetypeFrame.axis(floorAt(0), "z").x,
              AutoMovieArchetypeFrame.axis(floorAt(0), "z").z,
            ) *
              180) /
            Math.PI,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("charioteer").stand({
        hold: WAIT + pair.duration,
        on: { prop: "chariot" },
      }).node,
    });
  } catch (error) {
    issues.push(
      `charioteer: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (charioteer !== undefined)
    for (const seconds of instants) {
      const frame: IAutoMovieTransform = floorAt(seconds);
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        charioteer.bones("charioteer", seconds);
      for (const side of ["left", "right"] as const) {
        const gap: number = Math.min(
          ...HumanFoot.sockets(body, bones, side).map(
            ({ point }: IAutoMovieMotionHumanFoot.ISocket): number => {
              const p: IAutoMovieVector3 = Quaternion.rotateVector(
                Quaternion.inverse(frame.rotation),
                Vector3.subtract(point, frame.translation),
              );
              return Math.hypot(
                Math.max(0, Math.abs(p.x) - floor.width! / 2),
                p.y,
                Math.max(0, Math.abs(p.z) - floor.depth! / 2),
              );
            },
          ),
        );
        if (!(gap <= TOLERANCE))
          issues.push(
            `charioteer ${seconds.toFixed(2)}: ${side} sole ${(gap * 1000).toFixed(1)} mm from the floor`,
          );
      }
    }
  TestValidator.equals(
    "the team's driver and postilion keep their seats and reins",
    issues,
    [],
  );
  for (const [label, take] of [
    ["the box driver's take", driver],
    ["the postilion's take", postilion],
    ["the charioteer's take", charioteer],
  ] as const)
    if (take !== undefined) assertTakeClean(label, take);

  /** Seat a performer from the ground beside its seat and ride the support for the take. */
  function perform<Id extends string, D extends string>(
    subject: string,
    model: AutoMovieArchetype<Id, D> & IAutoMovieMotionHumanObject.IModel,
    seat: IAutoMovieMotionHumanSeated.ISeat,
    placement: (seconds: number) => IAutoMovieRigidTransform,
    part: (id: string, seconds: number) => IAutoMovieTransform,
    ride: IAutoMovieMotionHumanRide.IParams,
  ): HumanPerformance | undefined {
    try {
      return new HumanPerformance({
        seed: `team-${subject}`,
        laws: [AutoMovieMotionHumanMount.rideHorse.ride],
        props: [
          HumanObject.prop(ride.on, model, placement(0), placement, part),
        ],
        performers: [
          {
            subject,
            body,
            at: HumanFrame.point(
              { origin: { ...seat.at, y: 0 }, yaw: seat.yaw },
              { x: 0.6, y: 0, z: -0.2 },
            ),
            yaw: seat.yaw,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject(subject)
          .sit({ seat, hold: 0.5 })
          .registered("ride", ride).node,
      });
    } catch (error) {
      issues.push(
        `${subject}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
  }

  /** The seat socket against a seat rectangle whose origin is its front edge and whose area lies behind it. */
  function seated(
    label: string,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    frame: IAutoMovieTransform,
    surface: IAutoMovieAffordance,
  ): void {
    const socket: typeof body.surfaces.regions.seat =
      body.surfaces.regions.seat;
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(frame.rotation),
      Vector3.subtract(
        resolveAutoMovieHumanoidSurfaces.place(socket, bones.get(socket.bone)!)
          .point,
        frame.translation,
      ),
    );
    const gap: number = Math.hypot(
      Math.max(0, Math.abs(local.x) - (surface.width ?? 0) / 2),
      local.y,
      Math.max(0, local.z, -(surface.depth ?? 0) - local.z),
    );
    if (!(gap <= TOLERANCE))
      issues.push(`${label}: seat ${(gap * 1000).toFixed(1)} mm from contact`);
  }
}
