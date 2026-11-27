import { Quaternion, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieHumanPostureRotation,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanJumpAirborne,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPosturePreparation } from "../../posture/internal/HumanPosturePreparation";
import { createHumanPostureRotation } from "../../posture/internal/createHumanPostureRotation";
import type { jumpTouchdownRotation } from "./jumpTouchdownRotation";

/*
 * An upright touchdown has no attitude offset.
 */
const STILL: ITouchdown = {
  about: { x: 0, y: 0, z: 0 },
  axis: { x: 0, y: 1, z: 0 },
  angle: 0,
};

/*
 * A flight's turns as plan members: the somersault signed by its way, a side
 * salto's somersault frame turned a quarter about the long axis, and the
 * rotation kept once the pass hands it back.
 * Parameter rotation: The requested turns, none when absent.
 * Parameter takeoff: Seconds of the jump at take-off.
 * Parameter touchdown: Seconds of the jump at touchdown.
 * Parameter duration: The jump's duration, seconds.
 * Parameter settled: Seconds of the jump where the landing's absorption ends.
 * Parameter touchdownRequirement: The native geometry target and check for the
 * returned rotation.
 * Returns: The turning.
 */
export function jumpAirborneTurning(
  rotation: IAutoMovieMotionHumanJumpAirborne.IRotation | undefined,
  takeoff: number,
  touchdown: number,
  duration: number,
  settled: number,
  touchdownRequirement?: jumpTouchdownRotation.IRequirement,
): jumpAirborneTurning.ITurning {
  const somersault: number =
    (rotation?.somersault ?? 0) * (rotation?.way === "backward" ? -1 : 1);
  const twist: number = rotation?.twist ?? 0;
  const sideways: boolean =
    rotation?.way === "left" || rotation?.way === "right";
  let rotated: ((seconds: number) => IAutoMovieHumanPostureRotation) | null =
    null;
  let offset: ITouchdown = STILL;
  const declared: Pick<IAutoMovieMotionHumanActionPlan, FlightMember> =
    somersault === 0 && twist === 0
      ? {}
      : {
          flight: {
            from: takeoff / duration,
            to: touchdown / duration,
            momentum: {
              kind: "turns",
              somersault,
              twist,
              ...(sideways
                ? {
                    frame: Quaternion.fromAxisAngle(
                      { x: 0, y: 1, z: 0 },
                      rotation?.way === "left" ? 90 : -90,
                    ),
                  }
                : {}),
            },
            ...(touchdownRequirement === undefined
              ? {}
              : { touchdown: touchdownRequirement }),
          },
          airborne: (
            handed: (seconds: number) => IAutoMovieHumanPostureRotation,
          ): void => {
            if (touchdownRequirement?.turnedLanding === true)
              touchdownRequirement.check(handed(to));
            rotated = handed;
            // The touchdown attitude the landing settles, read once as the
            // flight's rotation is handed over.
            offset =
              touchdownRequirement?.turnedLanding !== true && settled > to
                ? touchdownOf(handed(to))
                : STILL;
          },
        };
  // Every reader reconstructs seconds from the public shares. Use those
  // same representable boundaries for both phase selection and handback.
  const from: number =
    declared.flight === undefined ? takeoff : declared.flight.from * duration;
  const to: number =
    declared.flight === undefined ? touchdown : declared.flight.to * duration;
  // The actual touchdown attitude: the planted ground phase absorbs the
  // landing and settles this pose offset after contact.
  const touchdownOf = (at: IAutoMovieHumanPostureRotation): ITouchdown => {
    const turn: IAutoMovieQuaternion =
      at.turn.w < 0
        ? { x: -at.turn.x, y: -at.turn.y, z: -at.turn.z, w: -at.turn.w }
        : at.turn;
    const sine: number = Math.hypot(turn.x, turn.y, turn.z);
    if (!(sine > 0)) return STILL;
    const axis: IAutoMovieVector3 = {
      x: turn.x / sine,
      y: turn.y / sine,
      z: turn.z / sine,
    };
    const angle: number = (2 * Math.atan2(sine, turn.w) * 180) / Math.PI;
    return { about: at.about, axis, angle };
  };
  return {
    from,
    to,
    declared,
    // The touchdown offset is solved as the rotation is handed over.
    prepareLanding: (): void => {},
    turned: (
      placed: HumanPosturePreparation.IPlaced,
      t: number,
    ): HumanPosturePreparation.IPlaced =>
      // At touchdown itself the flight's turn still holds, so the landing's
      // decaying offset starts from exactly the pose the flight ends on.
      rotated === null || t <= from || t > to
        ? placed
        : HumanPosturePreparation.turned(placed, rotated(t)),
    landed: (
      posture: IAutoMovieMotionHumanPosture,
      t: number,
    ): IAutoMovieMotionHumanPosture => {
      // Turned footprints already place the body in the admitted terminal stance.
      if (
        touchdownRequirement?.turnedLanding === true ||
        rotated === null ||
        !(t > to) ||
        !(t < settled) ||
        !(settled > to)
      )
        return posture;
      const touch: ITouchdown = offset;
      const decayed: number = AutoMovieEngineMotionSampling.inertializeOffset(
        touch.angle,
        0,
        settled - to,
        t - to,
      ).value;
      return decayed === 0
        ? posture
        : {
            ...posture,
            rotation: {
              ...createHumanPostureRotation(
                touch.about,
                Quaternion.fromAxisAngle(touch.axis, decayed),
              ),
              planted: true,
            },
          };
    },
  };
}

/*
 * The turning a flight's plan members carry.
 */
export namespace jumpAirborneTurning {
  /*
   * A flight's declared turns and the rotation the flight pass hands back.
   */
  export interface ITurning {
    /*
     * Takeoff in action-local seconds, reconstructed from the authored flight
     * share and duration.
     */
    from: number;
    /*
     * Touchdown in action-local seconds, reconstructed from the authored flight
     * share and duration.
     */
    to: number;

    /*
     * The plan's flight members, none for a flight with no turns.
     */
    declared: Pick<IAutoMovieMotionHumanActionPlan, FlightMember>;

    /*
     * Prepare the handed-back touchdown offset after the native flight pass
     * when landing has a nonempty absorption interval.
     */
    prepareLanding(): void;

    /*
     * A posture in flight with the rotation handed back, unchanged before it
     * arrives and outside the flight; at touchdown itself the turn still holds,
     * so the landing's offset (`landed`) starts from it.
     * Parameter placed: The posture placed in flight, with its solve.
     * Parameter seconds: Seconds of the jump.
     * Returns: The posture and its solve, turned.
     */
    turned(
      placed: HumanPosturePreparation.IPlaced,
      seconds: number,
    ): HumanPosturePreparation.IPlaced;

    /*
     * A landing posture carrying the flight's touchdown attitude away: the
     * laws' own rule at a change of motion (Bollo 2018, inertialization). The
     * turn the flight hands back at touchdown, its residual from the landing's
     * unturned attitude decays on Bollo's quintic (`inertializeOffset`) over
     * the landing's absorption, from touchdown to settled, as a rigid turn
     * about the touchdown centre. The two-foot contact arrests the free-flight
     * angular rate at the impact. A posture rotation turns the root and the
     * free goals only, so the planted feet keep their places and the legs are
     * re-solved onto them.
     * Parameter posture: The landing posture.
     * Parameter seconds: Seconds of the jump.
     * Returns: The posture, turned by the decaying offset, or unchanged outside
     * the absorption, without a handed-back turn or with an admitted turned
     * stance.
     */
    landed(
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanPosture;
  }
}

/*
 * Action-plan members supplied for an authored turning flight.
 */
type FlightMember = "flight" | "airborne";

/*
 * The flight's actual touchdown attitude: centre, world axis and angle in
 * degrees.
 */
interface ITouchdown {
  /*
   * The touchdown centre the turn is about, world metres.
   */
  about: IAutoMovieVector3;

  /*
   * The turn's unit axis, world.
   */
  axis: IAutoMovieVector3;

  /*
   * The turn's angle, degrees.
   */
  angle: number;
}
