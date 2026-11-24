import {
  createBall,
  createGolfClub,
  createPuttingGreen,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBallPlay,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPrecisionDeck,
  IAutoMovieMotionHumanStand,
  IAutoMoviePhysicalMaterial,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanBilliards,
  AutoMovieMotionHumanStance,
  AutoMovieMotionHumanSwing,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import {
  AutoMovieMotionHumanHeld,
  HumanHand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { rigidProfile } from "../../../features/internal/rigidProfile";
import { vclose } from "../../../features/internal/vclose";

/**
 * A putt strikes a ball resting on the green with the putter face, and the
 * same ball rolls on the green into the cup, or past it on a pulled line.
 *
 * Scenarios:
 * 1. The putter face meets the resting ball's surface at the stroke, which
 *    publishes the ball's only launch.
 * 2. The released ball, handed to the precision deck at its displayed pose
 *    and launch velocity, rolls 1.5 m and drops below the green inside the
 *    cup's mouth: a holed putt.
 * 3. The same putt addressed and aimed on a line 0.3 m wide of the cup
 *    rolls past and is never credited.
 * 4. The deck's ball starts exactly where the performance shows it.
 *
 * Rules of Golf, definition of Hole: 4.25 in (108 mm) across and at least
 * 4 in deep, which createPuttingGreen builds. The ball is credited only
 * once wholly below the green inside the mouth. The ball-to-turf material
 * is authored for the fixture, not a measured green speed; the hand-off
 * tolerance of 20 um allows the deck's single-precision state.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the stroke, the two outcomes, the cup rule and the authored material.
 * @evidence contracts/development/testing.md#behavioral-verification Runs golfPutt through HumanPerformance, then AutoMovieMotionHumanBilliards.bakePrecisionDeck and readPocketed on the released ball.
 * @evidence contracts/development/testing.md#independent-expectations The cup's size is the Rules of Golf's; the hand-off compares the deck's first frame with the performance's own display.
 * @evidence contracts/development/testing.md#distinguishing-cases The same stroke speed holes on the cup line and misses on a line 0.3 m wide.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory performance and native in-process deck solves; no host.
 */
export async function test_motion_swing_golf_putt(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const identity: IAutoMovieQuaternion = Quaternion.identity();
  const putter: ReturnType<typeof createGolfClub> = createGolfClub({
    kind: "putter",
  });
  const ball: ReturnType<typeof createBall> = createBall({ kind: "golf" });
  const green: ReturnType<typeof createPuttingGreen> = createPuttingGreen();
  const centre: IAutoMovieVector3 = ball.affordance("grip").frame.translation;
  const radius: number = ball.affordance("grip").aperture! / 2;
  const resting: IAutoMovieVector3 = { x: 0, y: radius, z: 0.24 };
  const cup: IAutoMovieVector3 = { x: resting.x, y: 0, z: resting.z + 1.5 };

  // The putter hangs from the ready pose's right grip, its shaft 79 degrees
  // down as the putt row holds it, as the precision-contact fixture places it.
  const grip: IAutoMovieVector3 = putter.affordance("grip").frame.translation;
  const shaft: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 0, z: 1 },
    90 - 79,
  );
  const quiet: ReturnType<HumanPerformance["bones"]> = new HumanPerformance({
    seed: "golf-quiet",
    performers: [
      {
        subject: "golfer",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("golfer").stand({ hold: 0.2, sway: 0 })
      .node,
  }).bones("golfer", 0);

  // The golfer stands at the putt's own address for the ball and the line
  // putted, square to the line as a right-handed golfer addresses it: facing
  // the ball, the line along the left shoulder, so the shoulders rock the
  // putter along it (Pelz, Putting Bible), the putter read in the hand as
  // the hold keeps it (`PrecisionStrokeForms.address`).
  const heading = (aim: IAutoMovieVector3): number =>
    (Math.atan2(aim.x - resting.x, aim.z - resting.z) * 180) / Math.PI - 90;
  const performers = (
    aim: IAutoMovieVector3,
  ): IAutoMovieMotionHumanPerformance.IInput["performers"] => [
    {
      subject: "golfer",
      body,
      at: AutoMovieMotionHumanSwing.PrecisionStrokeForms.address({
        body,
        row: "golfPutt",
        side: "right",
        yaw: heading(aim),
        ball: resting,
        radius,
        toward: aim,
        held: AutoMovieMotionHumanHeld.grasped(
          body,
          "right",
          "putter",
          {
            position: Vector3.subtract(
              HumanHand.frame(body, quiet, "right", "grip").point,
              Quaternion.rotateVector(shaft, grip),
            ),
            rotation: shaft,
          },
          putter.affordances ?? [],
          {
            point: quiet.get("rightHand")!.worldPosition,
            rotation: quiet.get("rightHand")!.worldRotation,
          },
        ),
      }),
      yaw: heading(aim),
      proficiency: { level: "trained" },
    },
  ];
  // The putter hangs in the hand as at the quiet pose, turned with the
  // stance to the line.
  const hung = (aim: IAutoMovieVector3): IAutoMovieQuaternion =>
    Quaternion.multiply(
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, heading(aim)),
      shaft,
    );
  const hand = (aim: IAutoMovieVector3): IAutoMovieVector3 =>
    HumanHand.frame(
      body,
      new HumanPerformance({
        seed: "golf-ready",
        performers: performers(aim),
        composition: HumanChain.subject("golfer").stand({ hold: 0.2, sway: 0 })
          .node,
      }).bones("golfer", 0),
      "right",
      "grip",
    ).point;

  const hold: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
    {
      ...AutoMovieMotionHumanStance.stand,
      name: "golfFixtureHold",
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
      ): IAutoMovieMotionHumanActionPlan => ({
        ...AutoMovieMotionHumanStance.stand.plan(context),
        holds: [{ side: "right", prop: "putter", from: 0 }],
      }),
    };
  const impact: number = 0.48;
  const putt = (aim: IAutoMovieVector3): HumanPerformance =>
    new HumanPerformance({
      seed: `golf-putt-${aim.x}`,
      laws: [hold, AutoMovieMotionHumanSwing.HumanPrecisionSport.golfPutt],
      performers: performers(aim),
      props: [
        HumanObject.prop("putter", putter, {
          position: Vector3.subtract(
            hand(aim),
            Quaternion.rotateVector(hung(aim), grip),
          ),
          rotation: hung(aim),
        }),
        HumanObject.prop("ball", ball, {
          position: Vector3.subtract(resting, centre),
          rotation: identity,
        }),
      ],
      composition: HumanChain.subject("golfer")
        .registered(hold.name, { hold: 0.2, sway: 0 })
        .registered("golfPutt", {
          tool: "putter",
          ball: "ball",
          speed: 1,
          impact,
          target: { kind: "point", frame: "world", at: aim },
        }).node,
    });

  const material: IAutoMoviePhysicalMaterial = {
    id: "turf",
    friction: 0.3,
    restitution: 0.1,
    compliance: 0,
    damping: 0,
  };
  const deck = async (
    film: HumanPerformance,
  ): Promise<IAutoMovieMotionHumanPrecisionDeck.IResult> => {
    const launch: IAutoMovieMotionHumanBallPlay.Event | undefined = film
      .play("ball")
      .events.find(
        (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
          event.kind === "launch",
      );
    if (launch?.kind !== "launch") throw new Error("The putt never launches");
    const released: IAutoMovieRigidTransform = film.prop(
      "ball",
      launch.seconds,
    );
    const result: IAutoMovieMotionHumanPrecisionDeck.IResult =
      await AutoMovieMotionHumanBilliards.bakePrecisionDeck({
        release: launch.seconds,
        duration: 4,
        maximumSteps: 480,
        surface: {
          id: "green",
          profile: rigidProfile(green, "green", material),
          pose: { position: cup, rotation: identity },
        },
        ball: {
          id: "ball",
          profile: rigidProfile(ball, "ball", material),
          pose: released,
          velocity: launch.velocity,
        },
        targets: [],
        floor: -0.5,
        floorBounds: {
          min: { x: -12, z: -12 },
          max: { x: 12, z: 12 },
          thickness: 1,
        },
      });
    TestValidator.predicate(
      "the deck's ball starts where the performance shows it at the strike",
      vclose(
        result.cache.at(0).bodies.ball!.root!.position,
        released.position,
        2e-5,
      ),
    );
    return result;
  };
  const mouth: IAutoMovieMotionHumanPrecisionDeck.IPocket = {
    id: "cup",
    point: cup,
    reach: createPuttingGreen.CUP_DIAMETER / 2,
  };

  const holed: HumanPerformance = putt(cup);
  const strike: number = holed.flights("ball")[0]!.launch;
  const face: IAutoMovieRigidTransform = holed.prop("putter", strike);
  const facePoint: IAutoMovieVector3 = Vector3.add(
    face.position,
    Quaternion.rotateVector(
      face.rotation,
      putter.affordance("face").frame.translation,
    ),
  );
  TestValidator.predicate(
    "the putter face meets the resting ball's surface and the stroke launches it once",
    Math.abs(Vector3.distance(facePoint, resting) - radius) <=
      Math.min(0.012, 0.2 * radius) && holed.flights("ball").length === 1,
  );
  const made: IAutoMovieMotionHumanPrecisionDeck.IResult = await deck(holed);
  const sunk: IAutoMovieMotionHumanPrecisionDeck.IPocketed[] =
    AutoMovieMotionHumanBilliards.readPocketed({
      balls: [
        {
          id: "ball",
          profile: rigidProfile(ball, "ball", material),
          pose: { position: resting, rotation: identity },
        },
      ],
      pockets: [mouth],
      result: made,
    });
  TestValidator.predicate(
    "the putt on the cup line drops into the cup",
    sunk.length === 1 && sunk[0]!.pocket === "cup" && sunk[0]!.seconds > strike,
  );

  const pulled: HumanPerformance = putt({ ...cup, x: cup.x + 0.3 });
  const missed: IAutoMovieMotionHumanPrecisionDeck.IResult = await deck(pulled);
  TestValidator.predicate(
    "the putt 0.3 m wide rolls past the cup",
    AutoMovieMotionHumanBilliards.readPocketed({
      balls: [
        {
          id: "ball",
          profile: rigidProfile(ball, "ball", material),
          pose: { position: resting, rotation: identity },
        },
      ],
      pockets: [mouth],
      result: missed,
    }).length === 0,
  );

  // The takes pass the shipped verdicts a viewer would show.
  assertTakeClean("holed putt", holed);
}
