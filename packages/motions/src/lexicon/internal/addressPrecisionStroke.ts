import { AutoMovieEngineKinematics, AutoMovieEngineVector3 } from "@automovie/engine";
import type { AutoMovieHumanSide, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanFoot, IAutoMovieMotionHumanPosture, IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieMotionHumanPlaced } from "../../compose/internal/AutoMovieMotionHumanPlaced";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/*
 * Address a ball below the standing hand's reach: hinge the trunk forward at
 * the hips, move the pelvis back so the shoulders stay over their standing
 * place and on by the centre of mass's remaining travel, read once at the full
 * hinge, so the centre of mass stays where it stood over the base, and lower
 * the pelvis as far as the planted legs need.
 *
 * The hinge is the smallest one, not below `least`, that brings the striking
 * shoulder within reach of the grip's impact point, and the other shoulder
 * within reach of a bridge point when there is one. With the shoulders held
 * over the base the shoulder only descends as the hinge grows, so the
 * shoulder-to-grip distance falls monotonically and a bisection finds the
 * boundary. A grip already in reach needs no hinge; one out of reach at the
 * limit takes the limit and leaves the stroke's contact check to refuse.
 * Parameter body: The performer.
 * Parameter entry: The posture the stroke starts from.
 * Parameter feet: The planted feet the stroke keeps.
 * Parameter side: The striking hand.
 * Parameter grip: The grip's world point at impact, metres.
 * Parameter bridge: The other hand's bridge point on a supporting surface, world
 * metres, which must also come into reach; absent for an unbridged stroke.
 * Parameter least: The smallest hinge in degrees, such as a cue's lean over the
 * bed; 0 for none.
 * Parameter pelvisLimit: The pelvis's share limit passed to the trunk incline;
 * Infinity lets the pelvis tilt.
 * Returns: The address applied to a posture at a share from 0 to 1 of its full
 * depth.
 */
export function addressPrecisionStroke(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMovieMotionHumanPosture,
  feet: Readonly<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>
  >,
  side: AutoMovieHumanSide,
  grip: IAutoMovieVector3,
  bridge: IAutoMovieVector3 | undefined,
  least: number,
  pelvisLimit: number,
): (
  posture: IAutoMovieMotionHumanPosture,
  share: number,
) => IAutoMovieMotionHumanPosture {
  // The incline bends the spine in the joints and returns the pelvis's
  // share as a pitch the posture carries.
  const tip = (
    posture: IAutoMovieMotionHumanPosture,
    angle: number,
  ): IAutoMovieMotionHumanPosture => {
    const bent: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
      posture.joints,
      angle,
      pelvisLimit,
    );
    return {
      ...posture,
      pitch: posture.pitch + bent.pitch,
      joints: bent.joints,
    };
  };
  const inclined = (angle: number): IAutoMovieMotionHumanPosture =>
    tip(entry, angle);
  const standing: IAutoMovieVector3 = AutoMovieMotionHumanPlaced.shoulders(
    body,
    entry,
  );

  // The pelvis moves back by the shoulders' forward travel, so the
  // shoulders stay over the standing base as the trunk tips.
  const back = (angle: number): IAutoMovieVector3 => {
    const tipped: IAutoMovieVector3 = AutoMovieMotionHumanPlaced.shoulders(
      body,
      inclined(angle),
    );
    return { x: standing.x - tipped.x, y: 0, z: standing.z - tipped.z };
  };
  const reach: number = ARM * (body.measure.upperArm + body.measure.forearm);
  const short = (
    angle: number,
    hand: AutoMovieHumanSide,
    point: IAutoMovieVector3,
  ): number =>
    AutoMovieEngineVector3.distance(
      AutoMovieEngineVector3.add(
        AutoMovieMotionHumanPlaced.joint(
          body,
          inclined(angle),
          `${hand}UpperArm`,
        ),
        back(angle),
      ),
      point,
    ) - reach;

  // A bridged stroke needs both hands in reach: the grip and the bridge.
  const gap = (angle: number): number =>
    bridge === undefined
      ? short(angle, side, grip)
      : Math.max(
          short(angle, side, grip),
          short(angle, side === "right" ? "left" : "right", bridge),
        );
  // A forward hinge lowers the shoulders, so it helps only a grip below the
  // striking shoulder; an overhead contact keeps the standing trunk.
  const low: boolean =
    grip.y < AutoMovieMotionHumanPlaced.joint(body, entry, `${side}UpperArm`).y;
  let hinge: number = least;
  if (low && gap(least) > 0)
    if (gap(LIMIT) > 0) hinge = LIMIT;
    else {
      let low: number = least;
      let high: number = LIMIT;

      // Twenty halvings resolve the hinge below 1e-4 degrees.
      for (let round: number = 0; round < 20; ++round) {
        const middle: number = (low + high) / 2;
        if (gap(middle) > 0) low = middle;
        else high = middle;
      }
      hinge = high;
    }
  if (hinge <= 0)
    return (
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieMotionHumanPosture => posture;

  // The shoulders kept over the standing base still leave the hinged
  // trunk's mass ahead of where it stood: the pelvis moves back further by
  // the centre of mass's horizontal travel, read once at the full hinge, so
  // the centre of mass stays over the base it balanced on standing (the hip
  // strategy: the pelvis shifts against the trunk's lean, Horak and Nashner
  // 1986).
  const centre = (posture: IAutoMovieMotionHumanPosture): IAutoMovieVector3 =>
    AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(
      body.massModel,
      poseBones(body, resolveHumanPosture(body, posture)),
    );
  const kept: IAutoMovieVector3 = back(hinge);
  const stood: IAutoMovieVector3 = centre(entry);
  const leaned: IAutoMovieVector3 = centre({
    ...inclined(hinge),
    root: AutoMovieEngineVector3.add(entry.root, kept),
  });
  const shift: IAutoMovieVector3 = {
    x: kept.x + stood.x - leaned.x,
    y: 0,
    z: kept.z + stood.z - leaned.z,
  };

  // Lower the pelvis until each planted ankle is within the leg's reach of
  // its hip, read after the hinge and the shift back.
  const legReach: number = LEG * (body.measure.thigh + body.measure.shank);
  let drop: number = 0;
  for (const leg of ["left", "right"] as const) {
    const hip: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      AutoMovieMotionHumanPlaced.joint(body, inclined(hinge), `${leg}UpperLeg`),
      shift,
    );
    const ankle: IAutoMovieVector3 = feet[leg].ankle;
    const across: number = Math.hypot(hip.x - ankle.x, hip.z - ankle.z);
    if (across < legReach)
      drop = Math.max(
        drop,
        hip.y - ankle.y - Math.sqrt(legReach ** 2 - across ** 2),
      );
  }
  const move: IAutoMovieVector3 = { ...shift, y: -drop };
  return (
    posture: IAutoMovieMotionHumanPosture,
    share: number,
  ): IAutoMovieMotionHumanPosture =>
    tip(
      {
        ...posture,
        root: AutoMovieEngineVector3.add(posture.root, AutoMovieEngineVector3.scale(move, share)),
      },
      hinge * share,
    );
}

/*
 * The deepest address hinge, degrees. Golf address trunk flexion is about 30 to
 * 45 degrees (Hume, Keogh and Reid 2005, Sports Med 35:429); the provisional
 * cap leaves room for shorter implements and lower balls.
 */
const LIMIT: number = 60;

/*
 * Share of the upper arm and forearm a fitted grip may sit from its shoulder,
 * keeping the elbow off its lock; provisional.
 */
const ARM: number = 0.95;

/*
 * Share of the thigh and shank a planted leg may span from hip to ankle,
 * keeping the knee off its lock; provisional.
 */
const LEG: number = 0.98;
