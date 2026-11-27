import {
  ANKLE_DORSIFLEXION,
  DEFAULT_HUMANOID_ROM,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { prepareWalkLegLean } from "../../actions/internal/prepareWalkLegLean";
import { walkLeg } from "../../actions/internal/walkLeg";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { hipJoints } from "../../posture/internal/hipJoints";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";

/**
 * How far a foot must roll past the roll asked of it so the ankle stays within
 * its range: the shank's lean across the foot from the vertical, the hip over
 * the ankle, less the ankle's own roll range (`DEFAULT_HUMANOID_ROM`'s foot
 * abduction), signed as `HumanFoot.roll`.
 *
 * @param hip The hip joint, world metres.
 * @param ankle The ankle joint, world metres.
 * @param heading The foot's heading, degrees.
 * @param asked The roll the placement asks, degrees.
 * @returns Degrees to add to the roll; zero within the range.
 */
function sideways(
  hip: IAutoMovieVector3,
  ankle: IAutoMovieVector3,
  heading: number,
  asked: number,
): number {
  const yaw: number = (heading * Math.PI) / 180;
  // The foot's lateral axis on the floor (`HumanFoot.heading` reads its
  // heading off that axis: +X at rest).
  const across: number =
    (hip.x - ankle.x) * Math.cos(yaw) - (hip.z - ankle.z) * Math.sin(yaw);
  const up: number = hip.y - ankle.y;
  if (!(up > 1e-9)) return 0;
  // A shank leaning toward +X asks the foot's -X border up: the roll that
  // lays the sole square to the shank is minus the lean.
  const square: number = -(Math.atan2(across, up) * 180) / Math.PI;
  const demand: number = square - asked;
  return demand > ROLL_MOST
    ? demand - ROLL_MOST
    : demand < ROLL_LEAST
      ? demand - ROLL_LEAST
      : 0;
}

/**
 * The ankle's least roll, degrees: the foot's abduction range's low end
 * (`DEFAULT_HUMANOID_ROM`).
 */
const ROLL_LEAST: number = DEFAULT_HUMANOID_ROM.leftFoot!.abduction!.min;

/**
 * The ankle's greatest roll, degrees: the foot's abduction range's high end
 * (`DEFAULT_HUMANOID_ROM`).
 */
const ROLL_MOST: number = DEFAULT_HUMANOID_ROM.leftFoot!.abduction!.max;

/**
 * The placement a foot bearing a share of the weight can hold.
 *
 * @param body The body.
 * @param posture The posture written so far, read for its root, heading and
 *   pelvis.
 * @param side Which foot.
 * @param placement The placement the law asks.
 * @param share The share of the weight the foot bears, 0 to 1; none when
 *   absent.
 * @param grounded Whether the forefoot is on the floor, so the heel rises about
 *   it; a foot in the air turns about its ankle instead.
 * @param ball Whether the heel rises about the ball the foot bears on, for a
 *   support held under the ball (a line, a stirrup); about the toes' joint when
 *   false.
 * @param edge The forefoot edge a foot rolled past the ankle's range bears on
 *   and turns about, in the foot's rest frame from the ankle
 *   (`HumanFoot.edge`); the pivot above when absent.
 * @returns The placement with its heel raised about the toes' joint where the
 *   ask would pass the limit, else the ask.
 */
export function AutoMovieMotionHumanFootRelax(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide,
  placement: IAutoMovieMotionHumanFoot.IPlacement,
  share: number = 0,
  grounded: boolean = true,
  ball: boolean = false,
  edge?: IAutoMovieVector3,
): IAutoMovieMotionHumanFoot.IPlacement {
  const hip: IAutoMovieVector3 = hipJoints(
    body,
    posture.root,
    humanPostureHeading(posture),
    posture.joints.hips,
    prepareHumanPoseResolution()(),
  )[side];
  const direction: ReturnType<typeof HumanFoot.headingPitch> =
    HumanFoot.headingPitch(placement.rotation);
  const lean: (hip: IAutoMovieVector3, ankle: IAutoMovieVector3) => number =
    prepareWalkLegLean(body, direction.heading);
  // A foot in the air turns toes down about its ankle until it is within
  // the passive dorsal range; a pointed foot is left as it is.
  if (!grounded) {
    const most: number =
      ANKLE_DORSIFLEXION.unloaded - walkLeg.ANKLE - lean(hip, placement.ankle);
    return direction.pitch <= most
      ? placement
      : {
          ankle: placement.ankle,
          rotation: HumanFoot.rotation(direction.heading, most),
        };
  }
  const pivot: Parameters<typeof HumanFoot.point>[2] = ball ? "ball" : "mtp";
  const forefoot: IAutoMovieVector3 = HumanFoot.point(
    body,
    side,
    pivot,
    placement,
  );
  const dorsal: number = walkLeg.dorsal(share);
  // The ankle's room at the shank's lean is closed form; raising the heel
  // about the toes' joint moves the ankle and so the lean, so the excess
  // is taken off again from where it leaves the ankle, a fixed number of
  // times (`PASSES`).
  const limit: number = dorsal - walkLeg.ANKLE;
  const asked: number = HumanFoot.roll(placement.rotation);
  let foot: IAutoMovieMotionHumanFoot.IPlacement = placement;
  let pitch: number = direction.pitch;
  let roll: number = asked;
  for (
    let pass: number = 0;
    pass < AutoMovieMotionHumanFootRelax.PASSES;
    pass++
  ) {
    const excess: number = lean(hip, foot.ankle) + pitch - limit;
    // A shank leaning sideways past the ankle's roll rolls the foot onto
    // the forefoot's edge about the same pivot, as a foot rolls onto the
    // ball's edge; within the range the foot keeps the roll asked.
    const over: number = sideways(hip, foot.ankle, direction.heading, asked);
    if (!(excess > 1e-6) && !(Math.abs(over) > 1e-6)) break;
    if (excess > 1e-6) pitch -= excess;
    roll = asked + over;
    // A foot that bears on an edge the law names (`HumanFoot.edge`), the
    // one it rolls onto past the range, turns about that edge throughout,
    // so the point it bears on holds.
    foot = HumanFoot.pivot(
      body,
      side,
      edge ?? pivot,
      edge === undefined
        ? forefoot
        : Vector3.add(
            placement.ankle,
            Quaternion.rotateVector(placement.rotation, edge),
          ),
      direction.heading,
      pitch,
      0,
      roll,
    );
  }
  return foot;
}

/**
 * A foot kept within the ankle's dorsal range for its contact state. A foot
 * bearing any of the body's weight dorsiflexes as far as the loaded limit, one
 * bearing nothing only to the passive one (`ANKLE_DORSIFLEXION`; the binary
 * limit of `walkLeg.dorsal`, as the range audit reads it). A law that carries a
 * foot at a placement of its own (held flat, or turned as it was set down)
 * would ask the ankle past that limit whenever the shank leans over it, so the
 * placement's heel is raised about the toes' joint (about the ball, for a
 * support held under it) as the forefoot rocker raises a walking foot's, read
 * in closed form from the shank's lean (`prepareWalkLegLean`): the forefoot
 * stays where the law put it, so a foot on the floor rises onto its ball rather
 * than driving its toes into the floor; a foot in the air turns toes down about
 * its ankle, a pointed foot left pointed. A planted foot bears from its landing
 * to its lift (`load`), the contact state the limit is read by.
 */
export namespace AutoMovieMotionHumanFootRelax {
  /**
   * How many times the heel's rise is corrected for the lean it changes; the
   * lean moves by a fraction of the rise, so the residual shrinks
   * geometrically.
   */
  export const PASSES: number = 3;

  /**
   * Whether a planted foot bears at an action second, as the share the limit
   * reads (`walkLeg.dorsal`): it bears strictly between its landing and its
   * lift, the contact window's own state, with no ramp of its own between the
   * two limits, which no study relates to a partial load.
   *
   * @param seconds The action second.
   * @param leave The second the foot lifts.
   * @param at The second the plant began.
   * @returns 1 between the landing and the lift, 0 at and outside them.
   */
  export function load(
    seconds: number,
    leave: number,
    at: number = -Infinity,
  ): number {
    return at < seconds && seconds < leave ? 1 : 0;
  }
}
