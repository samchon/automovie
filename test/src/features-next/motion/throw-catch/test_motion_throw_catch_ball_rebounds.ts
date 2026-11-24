import {
  createBall,
  createBasketballHoop,
  createTable,
} from "@automovie/archetypes";
import { AutoMovieComposition, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieComposition,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieMotionHumanPropOutcome,
  IAutoMovieMotionHumanStand,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

/** The release instant of every fixture toss, seconds into its action. */
const RELEASE: number = 0.2;

/** How long each fixture toss stands after its release, seconds. */
const STAND: number = 2.5;

/** One staged rebound: where the ball is aimed and what stands in its way. */
interface IRebound {
  /** What the toss is aimed at. */
  name: string;

  /** The ball centre's aim point, world metres. */
  aim: IAutoMovieVector3;

  /** Seconds the drag-free aim takes to reach it. */
  seconds: number;

  /** The props that stand in the way. */
  props: readonly IAutoMovieMotionHumanProp[];

  /** A person who stands in the way, when one does. */
  person?: IAutoMovieVector3;
}

/**
 * A basketball tossed at a standing person, a table top, a hoop and the floor
 * rebounds from each and flies on, and its bounces grip as a thin shell's.
 *
 * Scenarios:
 *
 * 1. Aimed at a standing person's chest, the ball meets the person (it does not
 *    pass through) and rebounds back toward the thrower, then meets the floor.
 * 2. Aimed at a table top, it rebounds off the table: the normal speed reverses at
 *    the ball's restitution, and the speed along the top is 3/5 of the arriving
 *    one, a thin shell (gyration 2/3) gripping once its contact point stops
 *    sliding; the next floor bounce leaves the same.
 * 3. Aimed at a hoop, it rebounds off the hoop and flies on to another contact.
 * 4. Bounced on the floor as a bounce pass, it keeps 3/5 of its speed along the
 *    floor, and its second floor bounce keeps that speed: the spin the first
 *    left rolls with it.
 *
 * The ball leaves an open hand by a fixture toss: a stand that holds it and
 * releases it on a drag-free aim, so the flight is the ball's own and no
 * throwing law shapes it. A gripping bounce is checked against Coulomb's limit
 * from the ball's own friction and restitution before 3/5 is expected.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the four aims, what each meets and the speeds expected after.
 * @evidence contracts/development/testing.md#behavioral-verification Runs each toss through HumanPerformance and reads the recorded flight's contacts and leg velocities.
 * @evidence contracts/development/testing.md#independent-expectations The grip ratio 1/(1 + 2/3) = 3/5 and the normal ratio e come from a rigid thin shell's impact, written here; the grip condition mu(1+e)|v_n| >= |v_t| k/(1+k) is checked from the ball's declared data.
 * @evidence contracts/development/testing.md#distinguishing-cases A person, a fixed prop's flat top, a hoop and the floor are each struck; the second floor bounce distinguishes a carried spin from a fresh grip.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory performances of polygon men, one ball and fixed props.
 */
export function test_motion_throw_catch_ball_rebounds(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const ball: ReturnType<typeof createBall> = createBall({
    kind: "basketball",
  });
  const radius: number = ball.affordance("grip").aperture! / 2;
  const centre: IAutoMovieVector3 = ball.affordance("grip").frame.translation;
  const restitution: number = ball.body!.restitution!;
  const declared: number | undefined =
    ball.body!.kineticFriction ?? ball.body!.friction;
  if (declared === undefined)
    throw new Error("the basketball declares no friction to grip with");
  const friction: number = declared;
  const gyration: number = 2 / 3;

  // The right hand's grip at the quiet stance, where the held ball starts.
  const hand: IAutoMovieVector3 = HumanHand.frame(
    body,
    new HumanPerformance({
      seed: "rebound-ready",
      performers: [
        {
          subject: "thrower",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("thrower").stand({ hold: 0.2, sway: 0 })
        .node,
    }).bones("thrower", 0),
    "right",
    "grip",
  ).point;
  const start: IAutoMovieVector3 = Vector3.subtract(hand, centre);
  const held: IAutoMovieVector3 = Vector3.add(start, centre);

  const hold: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
    {
      ...AutoMovieMotionHumanStance.stand,
      name: "reboundFixtureHold",
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
      ): IAutoMovieMotionHumanActionPlan => ({
        ...AutoMovieMotionHumanStance.stand.plan(context),
        holds: [{ side: "right", prop: "ball", from: 0 }],
      }),
    };

  /** A stand that lets the held ball go on a drag-free aim. */
  const toss: (
    rebound: IRebound,
  ) => IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> = (
    rebound: IRebound,
  ): IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> => ({
    ...AutoMovieMotionHumanStance.stand,
    name: "reboundFixtureToss",
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
    ): IAutoMovieMotionHumanActionPlan => {
      const still: IAutoMovieMotionHumanActionPlan =
        AutoMovieMotionHumanStance.stand.plan(context);
      return {
        ...still,
        contacts: [
          ...still.contacts,
          {
            part: "rightHand",
            kind: "grip",
            from: 0,
            to: RELEASE / still.duration,
            support: { kind: "prop", subject: "ball" },
          },
        ],
        launches: [
          {
            prop: "ball",
            seconds: RELEASE,
            point: start,
            velocity: { x: 0, y: 0, z: 0 },
            sphere: { radius, centre },
            aim: { point: rebound.aim, seconds: rebound.seconds },
          },
        ],
      };
    },
  });

  /** The ball's flight after the toss. */
  const flown: (
    rebound: IRebound,
  ) => IAutoMovieMotionHumanPropFlight.IFlight = (
    rebound: IRebound,
  ): IAutoMovieMotionHumanPropFlight.IFlight => {
    const law: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
      toss(rebound);
    const compositions: IAutoMovieComposition[] = [
      HumanChain.subject("thrower")
        .registered(hold.name, { hold: 0.2, sway: 0 })
        .registered(law.name, { hold: STAND, sway: 0 }).node,
    ];
    if (rebound.person !== undefined)
      compositions.push(
        HumanChain.subject("wall").stand({ hold: STAND + 1, sway: 0 }).node,
      );
    const take: HumanPerformance = new HumanPerformance({
      seed: `rebound-${rebound.name}`,
      laws: [hold, law],
      performers: [
        {
          subject: "thrower",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        ...(rebound.person === undefined
          ? []
          : [
              {
                subject: "wall",
                body,
                at: rebound.person,
                yaw: 180,
                proficiency: { level: "trained" as const },
              },
            ]),
      ],
      props: [
        HumanObject.prop("ball", ball, {
          position: start,
          rotation: Quaternion.identity(),
        }),
        ...rebound.props,
      ],
      composition: AutoMovieComposition.parallel(...compositions),
    });
    const flights: readonly IAutoMovieMotionHumanPropFlight.IFlight[] =
      take.flights("ball");
    if (flights.length !== 1)
      throw new Error(`${rebound.name}: ${flights.length} flights, not one`);
    return flights[0]!;
  };

  /** A leg's leaving velocity: a flight's, or a roll's. */
  const leaving: (
    leg: IAutoMovieMotionHumanPropOutcome.ILeg,
  ) => IAutoMovieVector3 = (
    leg: IAutoMovieMotionHumanPropOutcome.ILeg,
  ): IAutoMovieVector3 =>
    leg.segment.kind === "flight"
      ? leg.segment.projectile.velocity
      : leg.segment.kind === "roll"
        ? leg.segment.velocity
        : { x: 0, y: 0, z: 0 };
  const level: (v: IAutoMovieVector3) => number = (
    v: IAutoMovieVector3,
  ): number => Math.hypot(v.x, v.z);

  /** A level bounce grips: friction can stop the contact point's sliding. */
  const grips: (arriving: IAutoMovieVector3) => boolean = (
    arriving: IAutoMovieVector3,
  ): boolean =>
    friction * (1 + restitution) * Math.abs(arriving.y) >=
    (level(arriving) * gyration) / (1 + gyration);

  const findings: string[] = [];
  const observe: (label: string, read: () => boolean) => void = (
    label: string,
    read: () => boolean,
  ): void => {
    try {
      if (!read()) findings.push(label);
    } catch (error: unknown) {
      findings.push(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  // 1. A person in the ball's path is met and returns it.
  observe("a standing person meets the ball and returns it", (): boolean => {
    const flight: IAutoMovieMotionHumanPropFlight.IFlight = flown({
      name: "person",
      aim: { x: held.x, y: 1.3, z: 2.6 },
      seconds: 0.45,
      props: [],
      person: { x: held.x, y: 0, z: 2.6 },
    });
    const first: IAutoMovieMotionHumanPropFlight.IContact = flight.contact!;
    const leg: IAutoMovieMotionHumanPropOutcome.ILeg = flight.legs![0]!;
    return (
      first.struck.kind === "person" &&
      first.struck.subject === "wall" &&
      leaving(leg).z < 0 &&
      leg.contact?.struck.kind === "ground"
    );
  });

  // 2. A table top returns the ball at its restitution and grip.
  const table: ReturnType<typeof createTable> = createTable({
    kind: "dining",
  });
  const top: number = table.affordance("top").frame.translation.y;
  observe("a table top returns the ball gripping", (): boolean => {
    const flight: IAutoMovieMotionHumanPropFlight.IFlight = flown({
      name: "table",
      aim: { x: held.x, y: top + radius, z: 2 },
      seconds: 0.6,
      props: [
        HumanObject.prop("table", table, {
          position: { x: held.x, y: 0, z: 2 },
          rotation: Quaternion.identity(),
        }),
      ],
    });
    const first: IAutoMovieMotionHumanPropFlight.IContact = flight.contact!;
    const legs: readonly IAutoMovieMotionHumanPropOutcome.ILeg[] = flight.legs!;
    const after: IAutoMovieVector3 = leaving(legs[0]!);
    const floor: IAutoMovieVector3 = leaving(legs[1]!);
    return (
      first.struck.kind === "prop" &&
      first.struck.subject === "table" &&
      grips(first.velocity) &&
      nclose(after.y, -restitution * first.velocity.y, 1e-9) &&
      nclose(level(after), (3 / 5) * level(first.velocity), 1e-9) &&
      legs[0]!.contact?.struck.kind === "ground" &&
      nclose(level(floor), level(after), 1e-9)
    );
  });

  // 3. A hoop returns the ball and the flight goes on.
  const hoop: ReturnType<typeof createBasketballHoop> = createBasketballHoop({
    ring: 0.45,
    thickness: 0.013,
  });
  const hoopAt: IAutoMovieVector3 = { x: held.x, y: 0, z: 4 };
  const ring: IAutoMovieVector3 = Vector3.add(
    hoopAt,
    hoop.affordance("rim").frame.translation,
  );
  observe("a hoop returns the ball and it flies on", (): boolean => {
    const flight: IAutoMovieMotionHumanPropFlight.IFlight = flown({
      name: "hoop",
      aim: ring,
      seconds: 1,
      props: [
        HumanObject.prop("hoop", hoop, {
          position: hoopAt,
          rotation: Quaternion.identity(),
        }),
      ],
    });
    return (
      flight.contact?.struck.kind === "prop" &&
      flight.contact.struck.subject === "hoop" &&
      flight.legs !== undefined &&
      flight.legs[0]!.contact !== undefined
    );
  });

  // 4. A bounce pass keeps 3/5 of its speed along the floor, and then all of
  // it: the second bounce finds the ball already rolling.
  observe("a bounce pass keeps 3/5 of its floor speed", (): boolean => {
    const flight: IAutoMovieMotionHumanPropFlight.IFlight = flown({
      name: "bounce pass",
      aim: { x: held.x, y: radius, z: 1.6 },
      seconds: 0.3,
      props: [],
    });
    const first: IAutoMovieMotionHumanPropFlight.IContact = flight.contact!;
    const legs: readonly IAutoMovieMotionHumanPropOutcome.ILeg[] = flight.legs!;
    const after: IAutoMovieVector3 = leaving(legs[0]!);
    const second: IAutoMovieVector3 = leaving(legs[1]!);
    return (
      first.struck.kind === "ground" &&
      grips(first.velocity) &&
      nclose(level(after), (3 / 5) * level(first.velocity), 1e-9) &&
      legs[0]!.contact?.struck.kind === "ground" &&
      nclose(level(second), level(after), 1e-9)
    );
  });

  TestValidator.predicate(
    `every toss rebounds as a gripping thin shell: ${findings.join(" || ")}`,
    findings.length === 0,
  );
}
