import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { KickCarriage } from "./KickCarriage";
import { StrikingFootPoint } from "./StrikingFootPoint";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";
import { punchFootwork } from "./punchFootwork";

/*
 * The lower body of a close strike: the pelvis turned about the vertical and
 * shifted along the line with both feet planted, or, for a spin, the whole
 * stance turned about the ball of the lead foot, which pivots in place while
 * the rear foot travels round it on a low arc.
 *
 * The turn, the lean, the shift and the drop follow one share in [0, 1] of the
 * strike out and back, so the stance returns to the entry's when the share
 * does. A planted turn may pivot the rear foot on its ball by half the turn
 * with the heel raised, as a rear-hand punch does; a drop lowers the hips for a
 * low target; a jump lifts both feet and the root. The root is lowered until
 * both legs reach their feet (`lowerHumanPosture`). A kick's support may rise
 * onto its ball with the share, and a tilt turns the whole body about a world
 * axis through the pivoting foot's hip, which stays put. A leg another
 * primitive writes (a kick's) is left out.
 * Parameter body: The body.
 * Parameter entry: The entry posture.
 * Parameter feet: The entry's feet.
 * Parameter lead: The pivoting side: the stance's lead, or a kick's support foot.
 * Parameter motion: The turn, lean, shift, spin, hop and drop by second, the rear
 * pivot and the free leg.
 * Returns: The primitive writing the root, the trunk and the legs it owns.
 */
export function CloseStrikeLegs(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMovieMotionHumanPosture,
  feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
  lead: AutoMovieHumanSide,
  motion: CloseStrikeLegs.IMotion,
): IAutoMovieMotionHumanPrimitive {
  const rear: AutoMovieHumanSide = lead === "left" ? "right" : "left";
  const ball: IAutoMovieVector3 = HumanFoot.point(
    body,
    lead,
    "ball",
    feet[lead],
  );
  const lift: number = CloseStrikeLegs.LIFT * StrikingStance.length(body);
  const free: AutoMovieHumanSide | undefined = motion.free;
  return {
    channels: [
      "root",
      "trunk",
      ...(["leftLeg", "rightLeg"] as const).filter(
        (leg: CloseStrikeLegsLeg): boolean => leg !== `${free}Leg`,
      ),
    ],
    from: 0,
    to: motion.duration,
    write: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      _before?: IAutoMovieMotionHumanPrimitive.Reader,
      resolution?: Parameters<typeof lowerHumanPosture>[3],
    ): IAutoMovieMotionHumanPosture => {
      const share: number = motion.share(seconds);
      const spun: number = motion.spin(seconds);
      const about: IAutoMovieMotionHumanFoot.IPlacement = {
        ankle: ball,
        rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, spun),
      };
      const turnAbout = (point: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(
          ball,
          Quaternion.rotateVector(
            about.rotation,
            Vector3.subtract(point, ball),
          ),
        );
      const turnFoot = (
        foot: IAutoMovieMotionHumanFoot.IPlacement,
      ): IAutoMovieMotionHumanFoot.IPlacement => ({
        ankle: turnAbout(foot.ankle),
        rotation: Quaternion.multiply(about.rotation, foot.rotation),
      });
      // In a spin the rear foot rises before it travels round the pivot and
      // lands before the turn ends, so it never skates: it goes round on the
      // middle `ROUND` share of the turn.
      const rounded = (
        foot: IAutoMovieMotionHumanFoot.IPlacement,
        angle: number,
      ): IAutoMovieMotionHumanFoot.IPlacement => {
        const by: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
          { x: 0, y: 1, z: 0 },
          CloseStrikeLegs.round(angle),
        );
        return {
          ankle: Vector3.add(
            ball,
            Quaternion.rotateVector(by, Vector3.subtract(foot.ankle, ball)),
          ),
          rotation: Quaternion.multiply(by, foot.rotation),
        };
      };

      // The rear foot rises on its way round and settles back.
      // A planted turn pivots the rear foot on its ball by half the turn,
      // the heel raised, as a rear-hand punch's (`punchFootwork`).
      const swing: IAutoMovieMotionHumanFoot.IPlacement =
        motion.pivot === true && spun === 0
          ? StrikingTarget.pivot(
              body,
              rear,
              feet[rear],
              0.5 * motion.turn * share,
              punchFootwork.HEEL_RAISE * share,
            )
          : spun === 0
            ? turnFoot(feet[rear])
            : rounded(feet[rear], spun);
      const turned: number = Math.min(1, Math.abs(spun) / 360);
      const bump: number = spun === 0 ? 0 : Math.sin(Math.PI * turned) ** 2;
      const risen: IAutoMovieMotionHumanFoot.IPlacement =
        spun === 0
          ? swing
          : StrikingFootPoint(
              body,
              rear,
              {
                ...swing,
                ankle: { ...swing.ankle, y: swing.ankle.y + lift * bump },
              },
              bump,
            );
      // A kick's support rises onto its ball with the strike's share, the
      // ball held where the turn left it.
      const raised: number =
        motion.raise === undefined ? 0 : motion.raise * share;
      const pivoted: IAutoMovieMotionHumanFoot.IPlacement =
        raised === 0
          ? turnFoot(feet[lead])
          : StrikingTarget.pivot(body, lead, turnFoot(feet[lead]), 0, raised);
      const placed: Record<
        AutoMovieHumanSide,
        IAutoMovieMotionHumanFoot.IPlacement
      > =
        lead === "left"
          ? { left: pivoted, right: risen }
          : { left: risen, right: pivoted };
      // A jump lifts the root and both feet together.
      const hop: number = motion.hop === undefined ? 0 : motion.hop(seconds);
      if (hop > 0)
        for (const side of ["left", "right"] as const)
          placed[side] = {
            ...placed[side],
            ankle: { ...placed[side].ankle, y: placed[side].ankle.y + hop },
          };
      const root: IAutoMovieVector3 = Vector3.add(
        turnAbout(entry.root),
        Vector3.scale(motion.shift, share),
      );
      // A low target drops the hips by bending the support knee.
      const drop: number = (motion.drop ?? 0) * share;
      const yaw: number = entry.yaw + spun + motion.turn * share;
      // A tilt turns the whole body about its world axis through the
      // pivoting foot's hip, the root moved so that hip stays put.
      const flat: IAutoMovieMotionHumanPosture = {
        ...posture,
        root: { ...root, y: entry.root.y + hop - drop },
        yaw,
        pitch: entry.pitch + motion.lean * share,
      };
      const degrees: number =
        motion.tilt === undefined ? 0 : motion.tilt.degrees * share;
      const leaned: IAutoMovieMotionHumanPosture =
        motion.tilt === undefined || degrees === 0
          ? flat
          : {
              ...flat,
              ...humanPostureHeading.angles(
                Quaternion.normalize(
                  Quaternion.multiply(
                    Quaternion.fromAxisAngle(motion.tilt.axis, degrees),
                    humanPostureHeading(flat),
                  ),
                ),
              ),
            };
      const tilted: IAutoMovieMotionHumanPosture =
        leaned === flat
          ? flat
          : {
              ...leaned,
              root: Vector3.add(
                leaned.root,
                Vector3.subtract(
                  KickCarriage.hip(body, flat, lead),
                  KickCarriage.hip(body, leaned, lead),
                ),
              ),
            };
      const lowered: IAutoMovieMotionHumanPosture = lowerHumanPosture(
        body,
        {
          ...tilted,
          joints: {
            ...StrikingStance.facing(posture.joints, yaw - entry.yaw),
            // A pivot's raised heel bends the toes to stay flat on the floor.
            ...(motion.pivot === true && spun === 0
              ? {
                  [`${rear}Toes`]: [
                    punchFootwork.HEEL_RAISE * share,
                    0,
                    0,
                  ] as const,
                }
              : {}),
            // A support risen on its ball bends its toes by the same angle,
            // so they lie on the floor (the forefoot rocker).
            ...(raised === 0
              ? {}
              : { [`${lead}Toes`]: [raised, 0, 0] as const }),
          },
          limbs: {
            ...posture.limbs,
            ...legs(
              StrikingStance.legs(body, placed, {
                left: hop === 0 && !(rear === "left" && spun !== 0),
                right: hop === 0 && !(rear === "right" && spun !== 0),
              }),
            ),
          },
        },
        lowerHumanPosture.KNEE,
        resolution,
      );
      return lowered;
    },
  };

  /*
   * The leg goals less the free leg's, which another primitive writes.
   */
  function legs(
    goals: ReturnType<typeof StrikingStance.legs>,
  ): ReturnType<typeof StrikingStance.legs> {
    if (free === undefined) return goals;
    const kept: ReturnType<typeof StrikingStance.legs> = { ...goals };
    delete kept[`${free}Leg`];
    return kept;
  }
}

/*
 * Companion types and constants of CloseStrikeLegs.
 */
export namespace CloseStrikeLegs {
  /*
   * How far a spinning strike has carried the feet round: a whole turn on a
   * minimum-jerk share over the `ROUND` part of the spin, signed with it, the
   * spin read up to one turn.
   * Parameter angle: The spin, degrees.
   * Returns: Degrees.
   */
  export function round(angle: number): number {
    const u: number = Math.min(1, Math.abs(angle) / 360);
    return (
      Math.sign(angle) *
      360 *
      AutoMovieEngineMotionSampling.minimumJerkShare((u - ROUND[0]) / (ROUND[1] - ROUND[0]))
    );
  }

  /*
   * The rear foot's arc height on a spin, a share of the stance length
   * (provisional).
   */
  export const LIFT: number = 0.25;

  /*
   * The shares of a spin's turn between which the rear foot travels round the
   * pivot, after it rises and before it lands (provisional).
   */
  export const ROUND: readonly [number, number] = [0.2, 0.8];

  /*
   * The lower body's carriage over a close strike.
   */
  export interface IMotion {
    /*
     * The action's duration, seconds.
     */
    duration: number;

    /*
     * The pelvis turn at full share, degrees, positive toward the performer's
     * left.
     */
    turn: number;

    /*
     * The trunk's forward lean at full share, degrees.
     */
    lean: number;

    /*
     * The pelvis's horizontal shift at full share, world metres.
     */
    shift: IAutoMovieVector3;

    /*
     * The share of the strike out and back at an action second, in [0, 1].
     */
    share: (seconds: number) => number;

    /*
     * The spin about the lead ball at an action second, degrees; 0 without a
     * spin.
     */
    spin: (seconds: number) => number;

    /*
     * The height both feet and the root are lifted at an action second, metres;
     * none when absent.
     */
    hop?: (seconds: number) => number;

    /*
     * The hips' drop at full share, metres, the support knee bending for a low
     * target; none when absent.
     */
    drop?: number;

    /*
     * Whether a planted turn pivots the rear foot on its ball by half the turn,
     * the heel raised; it stays flat when absent.
     */
    pivot?: boolean;

    /*
     * The leg another primitive writes, left out of this one's channels and
     * goals; none when absent.
     */
    free?: AutoMovieHumanSide;

    /*
     * The pivoting foot's heel raise onto its ball at full share, degrees, its
     * toes bent as far; flat when absent.
     */
    raise?: number;

    /*
     * The whole body's tilt at full share about a world axis through the
     * pivoting foot's hip; none when absent.
     */
    tilt?: ITilt;
  }

  /*
   * A tilt of the whole body about a world axis through a hip.
   */
  export interface ITilt {
    /*
     * The world axis, unit; a positive angle turns by the right hand about it.
     */
    axis: IAutoMovieVector3;

    /*
     * The angle at full share, degrees.
     */
    degrees: number;
  }
}

/*
 * The alternatives of `CloseStrikeLegsLeg`'s site.
 */
type CloseStrikeLegsLeg = "leftLeg" | "rightLeg";
