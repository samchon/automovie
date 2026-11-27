import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";

/*
 * A foot goal turned toes-down about its contact until its ankle is within the
 * leg's reach of the hip with the knee `knee` bent, no further than `ankling`:
 * a cyclist's ankle through the bottom of the stroke (`HumanMountRider.ankled`,
 * which supplies the rider's bounds).
 * Parameter body: The body.
 * Parameter side: The foot.
 * Parameter goal: The foot's goal on its pedal.
 * Parameter hip: The hip joint, world metres.
 * Parameter level: The rotation a foot whose goal leaves its turn free stands with:
 * level, facing as the body does.
 * Parameter knee: The knee flexion the leg keeps, degrees.
 * Parameter ankling: The furthest the foot points down, degrees.
 * Returns: The goal, turned about the ball of the foot where the leg would run
 * short; the goal itself where it reaches.
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
  const ball: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    goal.point,
    AutoMovieEngineQuaternion.rotateVector(rotation, contact),
  );
  const across: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(rotation, {
    x: 1,
    y: 0,
    z: 0,
  });
  const turn: ReturnType<typeof AutoMovieEngineQuaternion.prepareAxisAngle> =
    AutoMovieEngineQuaternion.prepareAxisAngle(across);
  const placement: (degrees: number) => Placement = (
    degrees: number,
  ): Placement => {
    const pitched: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      turn(degrees),
      rotation,
    );
    return {
      rotation: pitched,
      point: AutoMovieEngineVector3.subtract(ball, AutoMovieEngineQuaternion.rotateVector(pitched, contact)),
    };
  };
  const turnedBy: (degrees: number) => IAutoMovieHumanLimbGoal = (
    degrees: number,
  ): IAutoMovieHumanLimbGoal => ({ ...goal, contact, ...placement(degrees) });
  const far: (degrees: number) => number = (degrees: number): number =>
    AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(placement(degrees).point, hip));
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

/*
 * The alternatives of `Placement2`'s site.
 */
type Placement2 = "point" | "rotation";

/*
 * A foot's ankle point and turn.
 */
type Placement = Required<Pick<IAutoMovieHumanLimbGoal, Placement2>>;
