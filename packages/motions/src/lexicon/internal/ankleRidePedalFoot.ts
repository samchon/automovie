import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/HumanFoot";

/** The alternatives of `Placement2`'s site. */
type Placement2 = "point" | "rotation";

/** A foot's ankle point and turn. */
type Placement = Required<Pick<IAutoMovieHumanLimbGoal, Placement2>>;

/**
 * A foot goal turned toes-down about its contact until its ankle is within the
 * leg's reach of the hip with the knee `knee` bent, no further than `ankling`:
 * a cyclist's ankle through the bottom of the stroke (`HumanMountRider.ankled`,
 * which supplies the rider's bounds).
 *
 * @param body The body.
 * @param side The foot.
 * @param goal The foot's goal on its pedal.
 * @param hip The hip joint, world metres.
 * @param level The rotation a foot whose goal leaves its turn free stands with:
 *   level, facing as the body does.
 * @param knee The knee flexion the leg keeps, degrees.
 * @param ankling The furthest the foot points down, degrees.
 * @returns The goal, turned about the ball of the foot where the leg would run
 *   short; the goal itself where it reaches.
 */
export function ankleRidePedalFoot(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
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
