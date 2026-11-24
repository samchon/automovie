import { createHorse, createPolearm } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { mountedHorseScene } from "../../../features/internal/mountedHorseScene";

/** Where the rider stands before sitting on, in the seat's frame on the floor. */
const FROM: IAutoMovieVector3 = { x: 0.6, y: 0, z: -0.2 };

/** Seconds the horse stands while the rider picks up the lance and sits on. */
const WAIT: number = 6;

/** The lance lying level, its shaft from the butt along +Z: the model stands along +Y, turned a quarter about +X. */
const LYING: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
  { x: 1, y: 0, z: 0 },
  90,
);

/**
 * A held lance carried through a gallop (#3956): the hand that holds a prop keeps the carriage it brought into the ride, and only the rein hand takes the ride's grip.
 *
 * Scenarios:
 * 1. The lance taken up along the forearm on the ground, the rider sits on and gallops with the left rein: the take passes the shipped verdicts, so the held hand never enters the thigh.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staging and the verdict read.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the ride over a real gallop of an archetype horse with a real lance in a polygon man's hand and reads the shipped verdicts over the whole take.
 * @evidence contracts/development/testing.md#independent-expectations The verdicts are the shipped report's; the staging is the tent-pegging run's before its couch.
 * @evidence contracts/development/testing.md#distinguishing-cases A held hand beside a rein hand in one ride.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory film of one polygon man on one archetype horse.
 */
export function test_motion_blade_equestrian_held_lance(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const horse: mountedHorseScene.Horse = createHorse(
    { withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0 },
    8,
  );
  const lance: ReturnType<typeof createPolearm> = createPolearm({
    kind: "lance",
  } as Parameters<typeof createPolearm>[0]);
  const rack: IAutoMovieVector3 = mountedHorseScene.rack(horse, body, FROM);
  const scene: mountedHorseScene.IScene = mountedHorseScene.build({
    horse,
    body,
    gait: "gallop",
    wait: WAIT,
    course: mountedHorseScene.course(horse, "gallop"),
    props: [
      // Lying level along the rider's facing on the rack, so the hand takes it along the forearm.
      HumanObject.prop("lance", lance, {
        position: Vector3.subtract(
          rack,
          Quaternion.rotateVector(
            LYING,
            lance.affordance("grip").frame.translation,
          ),
        ),
        rotation: LYING,
      }),
    ],
    from: FROM,
    before: (chain) =>
      chain.pickUp({
        prop: "lance",
        handle: "grip",
        hand: "right",
        use: { tip: "tip", line: "forearm" },
      }),
    acts: (seated: mountedHorseScene.Seated): mountedHorseScene.Seated =>
      seated.registered("ride", {
        on: "horse",
        duration: 4,
        seat: "seat",
        feet: { left: "leftStirrup", right: "rightStirrup" },
        hands: { left: "leftRein" },
      }),
  });
  assertTakeClean("a held lance through a gallop", scene.film);
}
