import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { HumanTrunk } from "../everyday/HumanTrunk";

/**
 * The deepest address hinge, degrees. Golf address trunk flexion is about
 * 30 to 45 degrees (Hume, Keogh and Reid 2005, Sports Med 35:429); the
 * provisional cap leaves room for shorter implements and lower balls.
 */
const LIMIT: number = 60;

/** Share of the upper arm and forearm a fitted grip may sit from its shoulder, keeping the elbow off its lock; provisional. */
const ARM: number = 0.95;

/** Share of the thigh and shank a planted leg may span from hip to ankle, keeping the knee off its lock; provisional. */
const LEG: number = 0.98;

/**
 * Address a ball below the standing hand's reach: hinge the trunk forward
 * at the hips, move the pelvis back so the shoulders stay over their
 * standing place, and lower the pelvis as far as the planted legs need.
 *
 * The hinge is the smallest one, not below `least`, that brings the
 * striking shoulder within reach of the grip's impact point. With the
 * shoulders held over the base the shoulder only descends as the hinge
 * grows, so the shoulder-to-grip distance falls monotonically and a
 * bisection finds the boundary. A grip already in reach needs no hinge; one
 * out of reach at the limit takes the limit and leaves the stroke's contact
 * check to refuse.
 *
 * @param body The performer.
 * @param entry The posture the stroke starts from.
 * @param feet The planted feet the stroke keeps.
 * @param side The striking hand.
 * @param grip The grip's world point at impact, metres.
 * @param least The smallest hinge in degrees, such as a cue's lean over the bed; 0 for none.
 * @param pelvisLimit The pelvis's share limit passed to the trunk incline; Infinity lets the pelvis tilt.
 * @returns The address applied to a posture at a share from 0 to 1 of its full depth.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three address movements, the hinge rule, its monotone search, the limits and the refusal hand-off.
 * @evidence contracts/development/implementation.md#principled-implementation A golf address flexes the trunk at the hips with the pelvis behind the feet and slightly flexed knees, keeping the centre of mass over the base; the hinge is solved from reach, the pelvis shift from the shoulders' forward travel and the drop from the leg's reach to each planted ankle.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The stroke law keeps its path and contact check; this function owns only the stance that makes the path reachable.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No per-sport stance: one reach rule serves every row. The provisional shares and cap are named with their basis.
 * @evidence contracts/development/implementation.md#efficient-algorithms About two dozen forward-kinematic shoulder reads during preparation; the returned function is constant time per sample.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Solves once per planned stroke and reuses the result at every sampled time.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains only the solved hinge and two vectors.
 */
export function addressPrecisionStroke(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMovieMotionHumanPosture,
  feet: Readonly<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>
  >,
  side: AutoMovieHumanSide,
  grip: IAutoMovieVector3,
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
  const gap = (angle: number): number =>
    Vector3.distance(
      Vector3.add(
        AutoMovieMotionHumanPlaced.joint(
          body,
          inclined(angle),
          `${side}UpperArm`,
        ),
        back(angle),
      ),
      grip,
    ) - reach;
  let hinge: number = least;
  if (gap(least) > 0)
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

  // Lower the pelvis until each planted ankle is within the leg's reach of
  // its hip, read after the hinge and the shift back.
  const shift: IAutoMovieVector3 = back(hinge);
  const legReach: number = LEG * (body.measure.thigh + body.measure.shank);
  let drop: number = 0;
  for (const leg of ["left", "right"] as const) {
    const hip: IAutoMovieVector3 = Vector3.add(
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
        root: Vector3.add(posture.root, Vector3.scale(move, share)),
      },
      hinge * share,
    );
}
