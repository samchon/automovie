import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHandTarget } from "../../posture/internal/HumanHandTarget";

/*
 * Rank the palm rolls for one catching hand by the displayed arm's strain.
 * Parameter input: The catcher and contact with the ball, and any worn-glove
 * correction.
 * Returns: The selected world-space finger direction, upward first when
 * equivalent.
 */
export function catchObjectFingers(
  input: ICatchObjectFingers,
): IAutoMovieVector3 {
  const {
    body,
    standing,
    yaw,
    side,
    outward,
    meet,
    radius,
    rolls,
    pocketPoint,
  } = input;

  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const across: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
    up,
    AutoMovieEngineVector3.scale(outward, AutoMovieEngineVector3.dot(up, outward)),
  );
  const first: IAutoMovieVector3 =
    AutoMovieEngineVector3.length(across) > 1e-6
      ? AutoMovieEngineVector3.normalize(across)
      : HumanFrame.point(
          { origin: { x: 0, y: 0, z: 0 }, yaw },
          { x: 0, y: 0, z: 1 },
        );
  const back: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    meet,
    AutoMovieEngineVector3.scale(outward, radius),
  );
  let best: ICatchObjectFingersBest = {
    fingers: first,
    strain: Infinity,
  };
  const bends: ReturnType<typeof AutoMovieMotionHumanBend.prepare> =
    AutoMovieMotionHumanBend.prepare({ body, posture: standing, side });
  const hand: ReturnType<typeof HumanHandTarget.prepareMoving> =
    HumanHandTarget.prepareMoving(body, side, {
      surface: "palm",
      shape: "relaxed",
    });
  for (const roll of rolls) {
    // A turn about the palm's normal mirrors to the opposite turn about
    // the mirrored normal, so the left hand reads the list negated: of
    // two turns it holds alike, each hand keeps the one that is the
    // other's mirror.
    const degrees: number = side === "left" && roll !== 0 ? -roll : roll;
    const fingers: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      AutoMovieEngineQuaternion.fromAxisAngle(outward, degrees),
      first,
    );
    const frame: ReturnType<typeof hand.frame> = hand.frame(
      standing,
      outward,
      fingers,
    );
    const point: IAutoMovieVector3 = pocketPoint(back, frame.rotation);
    const solve: IAutoMovieMotionHumanBend.ISolve = {
      body,
      posture: standing,
      side,
      point: frame.place(point).point,
      rotation: frame.rotation,
    };
    const strain: number = bends.strain(
      solve,
      bends.solve({ ...solve, fallback: "hang" }),
    );
    if (strain < best.strain - 1e-9) best = { fingers, strain };
  }
  return best.fingers;
}
/*
 * The body and ball geometry shared by the candidate rolls of one catching
 * hand.
 */
interface ICatchObjectFingers {
  /*
   * The catcher.
   */
  body: IAutoMovieMotionHumanBody;

  /*
   * The standing pose on which the candidate wrist and elbow are ranked.
   */
  standing: IAutoMovieMotionHumanPosture;

  /*
   * The catcher's heading in degrees, used when upward lies along the palm
   * normal.
   */
  yaw: number;

  /*
   * The catching hand.
   */
  side: AutoMovieHumanSide;

  /*
   * The hand's outward world-space palm normal.
   */
  outward: IAutoMovieVector3;

  /*
   * The ball's centre at contact, in world metres.
   */
  meet: IAutoMovieVector3;

  /*
   * The ball's radius in metres.
   */
  radius: number;

  /*
   * Candidate roll angles in degrees, in the law's preference order.
   */
  rolls: readonly number[];

  /*
   * Correct a world palm contact and rotation for a worn glove.
   */
  pocketPoint: (
    point: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
  ) => IAutoMovieVector3;
}

/*
 * The record of `ICatchObjectFingersBest`'s site.
 */
type ICatchObjectFingersBest = { fingers: IAutoMovieVector3; strain: number };
