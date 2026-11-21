import {
  createHorse,
  createPoloMallet,
  createSphericalBall,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPolo,
  IAutoMovieMotionHumanRide,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanFoot,
  HumanHand,
  HumanObject,
  HumanPolo,
  HumanRefusal,
  HumanRide,
  HumanSignature,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../internal/assertTakeClean";
import { motionHumanBody } from "../internal/motionHumanBody";
import { mountedHorseScene } from "../internal/mountedHorseScene";

/** The campaign's held-contact bound, metres. */
const CONTACT: number = 0.01;

/** Seconds the horse stands while the rider sits on. */
const WAIT: number = 6;

/** Seconds into the polo act the head meets the ball. */
const AT: number = 1.6;

/** The admitted lean, degrees: the law's default. */
const LEAN: number = 30;

/**
 * Polo strokes from a cantering horse (#3955): offside and nearside forehands and backhands at a ball on the ground.
 *
 * Scenarios:
 * 1. For each stroke the displayed mallet head, read from the mallet prop's own frame and its `head` contact, is within the ball's radius plus the head's and 20 mm of the ball's centre at the contact.
 * 2. Through each swing the displayed head stays outside the straddle's half width wherever it is below the saddle, clearing the horse.
 * 3. Both balls of the feet stay within 10 mm of their stirrups' treads and the left wrist within 0.7 hand lengths of its rein; the trunk's roll against the saddle stays within the admitted 30 degrees plus 5.
 * 4. The events run take-away, top, contact, finish, and the ball's launch is at the contact, level, along the swing: forward for a forehand, backward for a backhand.
 * 5. A ball three metres out is refused on `ball`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the strokes, their scenarios and each bound's source.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the polo law over an actual cantering horse with an actual held mallet and ball and reads the displayed head, feet, wrist and trunk against the moving saddle, stirrups and rein; a miss, a head through the horse, a lost stirrup or a wrong launch fails.
 * @evidence contracts/development/testing.md#independent-expectations The head is the mallet prop's own displayed frame; the ball is placed by the test; the bounds are the campaign's.
 * @evidence contracts/development/testing.md#distinguishing-cases Offside against nearside, forehand against backhand, a reachable against an unreachable ball.
 * @evidence contracts/development/testing.md#execution-ownership In-memory films of one polygon man on one archetype horse with one mallet and one ball.
 */
export function test_motion_equestrian_polo(): void {
  const findings: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const horse: mountedHorseScene.Horse = createHorse(
    { withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0 },
    8,
  );
  const canter: mountedHorseScene.Ride = mountedHorseScene.course(
    horse,
    "canter",
  );
  const mallet: ReturnType<typeof createPoloMallet> = createPoloMallet();
  // No polo ball producer exists: a field hockey ball, 71 to 75 mm against polo's 76 to 89, stands in.
  const ball: ReturnType<typeof createSphericalBall> = createSphericalBall({
    kind: "fieldHockey",
  });
  const radius: number = ball.affordance("grip").aperture! / 2;

  // A dry take finds when the polo act starts and where the right hand rests.
  const dry: mountedHorseScene.IScene = stage(
    horse,
    body,
    canter,
    mallet,
    ball,
    { x: 0, y: -10, z: 0 },
    { x: 0, y: 0, z: 0 },
    "offside",
    "forehand",
  );
  const begun: number = dry.segments[dry.segments.length - 1]!.start;
  const struck: number = begun + AT;
  const grip: IAutoMovieVector3 = HumanHand.frame(
    body,
    dry.film.bones("rider", begun),
    "right",
    "grip",
  ).point;

  for (const side of ["offside", "nearside"] as const)
    for (const stroke of ["forehand", "backhand"] as const) {
      const label: string = `${side} ${stroke}`;
      const seat: IAutoMovieRigidTransform = dry.place(struck);
      const out: number = side === "offside" ? -1 : 1;
      const spot: IAutoMovieVector3 = {
        ...Vector3.add(
          dry.part("seat", struck).translation,
          Quaternion.rotateVector(seat.rotation, {
            x: out * 1.0,
            y: 0,
            z: 0.2,
          }),
        ),
        y: radius,
      };
      const scene: mountedHorseScene.IScene = stage(
        horse,
        body,
        canter,
        mallet,
        ball,
        spot,
        grip,
        side,
        stroke,
      );
      assertTakeClean(`a polo ${label}`, scene.film);
      const take: IAutoMovieMotionHumanSegment =
        scene.segments[scene.segments.length - 1]!;
      const head = (at: number): IAutoMovieVector3 => {
        const frame: IAutoMovieRigidTransform = scene.film.prop("mallet", at);
        return Vector3.add(
          frame.position,
          Quaternion.rotateVector(
            frame.rotation,
            mallet.affordance("head").frame.translation,
          ),
        );
      };

      // 1. The head meets the ball.
      const miss: number = Vector3.distance(head(struck), spot);
      if (
        miss >
        radius + createPoloMallet.BANDS.headDiameter.maximum / 2 + 0.02
      )
        findings.push(
          `${label}: the head misses the ball by ${miss.toFixed(3)} m`,
        );

      // 2. The head clears the horse.
      const feet: number = Math.abs(
        mountedHorseScene.local(
          scene.part("seat", begun),
          scene.film.bones("rider", begun).get("rightFoot")!.worldPosition,
        ).x,
      );
      for (let k: number = 0; k <= 24; ++k) {
        const at: number = begun + 0.4 + ((AT + 0.35) * k) / 24;
        const p: IAutoMovieVector3 = mountedHorseScene.local(
          scene.part("seat", at),
          head(at),
        );
        if (Math.abs(p.x) < feet && p.y < 0) {
          findings.push(
            `${label}: the head passes through the horse at ${at.toFixed(2)} s`,
          );
          break;
        }
      }

      // 3. Stirrups, rein and lean.
      for (const at of [begun + 0.9, struck, struck + 0.3]) {
        for (const foot of ["left", "right"] as const) {
          const ball2: IAutoMovieVector3 = mountedHorseScene.local(
            scene.part(`${foot}Stirrup`, at),
            HumanFoot.sockets(
              body,
              HumanSignature.bones(scene.reader, at),
              foot,
            ).find(
              (s: IAutoMovieMotionHumanFoot.ISocket): boolean =>
                s.socket === "ball",
            )!.point,
          );
          if (Math.abs(ball2.y) > CONTACT)
            findings.push(
              `${label}: the ${foot} ball leaves its stirrup at ${at.toFixed(2)} s`,
            );
        }
        const wrist: number = Vector3.length(
          mountedHorseScene.local(
            scene.part("leftRein", at),
            mountedHorseScene.joint(scene, "leftHand", at),
          ),
        );
        if (wrist > 0.7 * body.measure.hand)
          findings.push(
            `${label}: the left wrist leaves its rein at ${at.toFixed(2)} s`,
          );
        const shoulders: IAutoMovieVector3 = mountedHorseScene.turned(
          scene.part("seat", at),
          Vector3.subtract(
            mountedHorseScene.joint(scene, "leftUpperArm", at),
            mountedHorseScene.joint(scene, "rightUpperArm", at),
          ),
        );
        const roll: number =
          (Math.atan2(shoulders.y, shoulders.x) * 180) / Math.PI;
        if (Math.abs(roll) > LEAN + 5)
          findings.push(
            `${label}: the shoulders roll ${roll.toFixed(1)} degrees against the saddle`,
          );
      }

      // 4. The phase order and the launch.
      const names: string[] = take.plan.events.map((e) => e.name);
      if (names.join(",") !== "takeAway,top,contact,finish")
        findings.push(`${label}: events ${names.join(",")}`);
      const launch = take.plan.launches?.[0];
      const ahead: IAutoMovieVector3 = Quaternion.rotateVector(
        scene.part("seat", struck).rotation,
        { x: 0, y: 0, z: 1 },
      );
      if (
        launch === undefined ||
        Math.abs(launch.seconds - struck) > 1e-6 ||
        Math.abs(launch.velocity.y) > 1e-6 ||
        Vector3.dot(Vector3.normalize(launch.velocity), ahead) *
          (stroke === "forehand" ? 1 : -1) <
          0.9
      )
        findings.push(
          `${label}: the ball is not launched at the contact along the swing`,
        );
    }

  // 5. A ball out of reach is refused.
  let error: unknown = null;
  try {
    const far: mountedHorseScene.IScene = stage(
      horse,
      body,
      canter,
      mallet,
      ball,
      {
        ...dry.part("seat", struck).translation,
        x: dry.part("seat", struck).translation.x + 3,
        y: radius,
      },
      grip,
      "nearside",
      "forehand",
    );
    far.film.bones("rider", far.film.duration - 0.1);
  } catch (failure) {
    error = failure;
  }
  if (!(error instanceof HumanRefusal && error.axis === "ball"))
    findings.push(
      `an unreachable ball must be refused on ball, got ${String(error)}`,
    );

  TestValidator.equals("polo strokes from the saddle", findings, []);
}

/** Sit, ride on with the left rein while the right hand takes the mallet, then strike. */
function stage(
  horse: mountedHorseScene.Horse,
  body: IAutoMovieMotionHumanBody,
  course: mountedHorseScene.Ride,
  mallet: ReturnType<typeof createPoloMallet>,
  ball: ReturnType<typeof createSphericalBall>,
  spot: IAutoMovieVector3,
  grip: IAutoMovieVector3,
  side: IAutoMovieMotionHumanPolo.Side,
  stroke: IAutoMovieMotionHumanPolo.Stroke,
): mountedHorseScene.IScene {
  // The ride, holding the mallet from its end: a fixture as the precision-sport specs use.
  const holding: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanRide> = {
    ...HumanRide.ride,
    name: "poloFixtureRide",
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRide>,
    ): IAutoMovieMotionHumanActionPlan => ({
      ...HumanRide.ride.plan(context),
      holds: [{ side: "right", prop: "mallet", from: 1 }],
    }),
  };
  const handle: IAutoMovieVector3 = mallet.affordance("grip").frame.translation;
  // The ball's origin is its lowest point; `spot` is its centre.
  const centre: IAutoMovieVector3 = {
    x: 0,
    y: ball.affordance("grip").aperture! / 2,
    z: 0,
  };
  return mountedHorseScene.build({
    horse,
    body,
    gait: "canter",
    wait: WAIT,
    course,
    laws: [holding, HumanPolo],
    props: [
      HumanObject.prop("mallet", mallet, {
        position: Vector3.subtract(grip, handle),
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      }),
      HumanObject.prop("ball", ball, {
        position: Vector3.subtract(spot, centre),
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      }),
    ],
    from: { x: 0.6, y: 0, z: -0.2 },
    acts: (seated) =>
      seated
        .registered("poloFixtureRide", {
          on: "horse",
          seconds: WAIT - 1,
          seat: "seat",
          feet: { left: "leftStirrup", right: "rightStirrup" },
          hands: { left: "leftRein" },
        })
        .registered("polo", {
          on: "horse",
          frame: "seat",
          mallet: "mallet",
          ball: "ball",
          side,
          stroke,
          contact: AT,
        }),
  });
}
