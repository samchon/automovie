import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";

/** A foot's ankle point and turn. */
type Placement = Required<Pick<IAutoMovieHumanLimbGoal, "point" | "rotation">>;

/**
 * A foot goal turned toes-down about its contact until its ankle is within the leg's reach of the hip with the knee `knee` bent, no further than `ankling`: a cyclist's ankle through the bottom of the stroke (`HumanMountRider.ankled`, which supplies the rider's bounds).
 *
 * @param body The body.
 * @param side The foot.
 * @param goal The foot's goal on its pedal.
 * @param hip The hip joint, world metres.
 * @param level The rotation a foot whose goal leaves its turn free stands with: level, facing as the body does.
 * @param knee The knee flexion the leg keeps, degrees.
 * @param ankling The furthest the foot points down, degrees.
 * @returns The goal, turned about the ball of the foot where the leg would run short; the goal itself where it reaches.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what turns, about what, how far and when nothing changes.
 * @evidence contracts/development/implementation.md#principled-implementation The ball stays where the goal puts it and the ankle moves on its circle about the ball's lateral axis; the least turn that reaches is found by bisection, the distance being monotonic in the turn up to `ankling`.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The ball, the turn as a function of an angle, the distance, the search.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A pedal beyond even `ankling` leaves the foot short of it, which the contact audit reports; a refusal with the saddle height that fits is owed.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four distance trials (none, the two signs and `ankling`) and twenty-four bisections; each trial is one rotation about the ball's prepared axis.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The ball, the axis and the contact are read once per call and shared by every trial; the returned goal is placed by the same function the trials measure.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; it returns the goal given or a new one.
 */
export function ankleRidePedalFoot(
  body: IAutoMovieMotionHumanBody,
  side: "left" | "right",
  goal: IAutoMovieHumanLimbGoal,
  hip: IAutoMovieVector3,
  level: IAutoMovieQuaternion,
  knee: number,
  ankling: number,
): IAutoMovieHumanLimbGoal {
  const reach: number =
    (body.measure.thigh + body.measure.shank) *
    Math.cos((knee * Math.PI) / 360);
  const rotation: IAutoMovieQuaternion = goal.rotation ?? level;

  // A foot on a pedal bears on its ball, whether or not its goal says what it turns about.
  const contact: IAutoMovieVector3 =
    goal.contact ?? HumanFoot.offset(body, side, "ball");
  const ball: IAutoMovieVector3 = Vector3.add(
    goal.point,
    Quaternion.rotateVector(rotation, contact),
  );
  const across: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
    x: 1,
    y: 0,
    z: 0,
  });
  const turn: ReturnType<typeof Quaternion.prepareAxisAngle> =
    Quaternion.prepareAxisAngle(across);
  const placement: (degrees: number) => Placement = (
    degrees: number,
  ): Placement => {
    const pitched: IAutoMovieQuaternion = Quaternion.multiply(
      turn(degrees),
      rotation,
    );
    return {
      rotation: pitched,
      point: Vector3.subtract(ball, Quaternion.rotateVector(pitched, contact)),
    };
  };
  const turnedBy: (degrees: number) => IAutoMovieHumanLimbGoal = (
    degrees: number,
  ): IAutoMovieHumanLimbGoal => ({ ...goal, contact, ...placement(degrees) });
  const far: (degrees: number) => number = (degrees: number): number =>
    Vector3.length(Vector3.subtract(placement(degrees).point, hip));
  if (far(0) <= reach) return goal;
  const sign: number = far(1) < far(-1) ? 1 : -1;
  if (far(sign * ankling) > reach) return turnedBy(sign * ankling);
  let low: number = 0;
  let high: number = ankling;
  for (let i: number = 0; i < 24; ++i) {
    const middle: number = (low + high) / 2;
    if (far(sign * middle) > reach) low = middle;
    else high = middle;
  }
  return turnedBy(sign * high);
}
