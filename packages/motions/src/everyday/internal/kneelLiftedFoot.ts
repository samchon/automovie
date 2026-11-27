import { ANKLE_DORSIFLEXION, Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRange } from "../../compose/AutoMovieMotionHumanRange";
import { HumanFoot } from "../../posture/HumanFoot";

/**
 * A kneel's foot turned toes down by a share of any excess of its ankle's
 * dorsiflexion over what a weightless ankle reaches
 * (`ANKLE_DORSIFLEXION.unloaded`), the excess read on the knee the fit will
 * place: the two-link knee in the plane of the hip, the ankle and the goal's
 * own bend point. The foot turns about its toes' joint while the toes extend by
 * the turn, up to their range, so the toe pads keep where they lie: a foot in
 * the air turns without dropping its toes, and a tucked foot rolls its ankle
 * over the toe pads it bears on.
 *
 * @param body The body.
 * @param side The leg.
 * @param pole The leg's pole: the direction its knee bends toward, the body's
 *   forward.
 * @param hip The leg's hip joint, world metres.
 * @param goal The leg goal, its foot turned by `rotation`.
 * @param toes The toes' extension the foot has, degrees.
 * @param weight The share of the excess turned, 0 to 1.
 * @returns The goal and the toes' extension, turned when they must be;
 *   unchanged otherwise.
 */
export function kneelLiftedFoot(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  hip: IAutoMovieVector3,
  goal: IAutoMovieHumanLimbGoal,
  toes: number,
  weight: number,
  pole: IAutoMovieVector3,
): kneelLiftedFoot.IFoot {
  const kept: kneelLiftedFoot.IFoot = { goal, toes };
  if (goal.rotation === undefined || weight <= 0) return kept;
  const thigh: number = body.measure.thigh;
  const shank: number = body.measure.shank;
  const reach: IAutoMovieVector3 = Vector3.subtract(goal.point, hip);
  const d: number = Math.max(1e-9, Vector3.length(reach));
  const u: IAutoMovieVector3 = Vector3.scale(reach, 1 / d);
  const across: (point: IAutoMovieVector3) => IAutoMovieVector3 = (
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    Vector3.subtract(point, Vector3.scale(u, Vector3.dot(point, u)));
  // The knee lies on the side of the hip-to-ankle line its bend point does,
  // never behind it: a knee bends forward, the leg's own pole. Where the bend
  // point falls near the line (a knee coming down under its hip) its side is
  // undetermined, so the pole decides, as the leg's fit does.
  const bend: IAutoMovieVector3 = across(Vector3.subtract(goal.bend, hip));
  const ahead: IAutoMovieVector3 = across(pole);
  const off: IAutoMovieVector3 =
    Vector3.length(bend) > SIDE * d && Vector3.dot(bend, ahead) > 0
      ? bend
      : ahead;
  if (Vector3.length(off) < 1e-9) return kept;
  const a: number = Math.min(
    thigh,
    (thigh * thigh - shank * shank + d * d) / (2 * d),
  );
  const knee: IAutoMovieVector3 = Vector3.add(
    hip,
    Vector3.add(
      Vector3.scale(u, a),
      Vector3.scale(
        Vector3.normalize(off),
        Math.sqrt(Math.max(0, thigh * thigh - a * a)),
      ),
    ),
  );
  const up: IAutoMovieVector3 = Quaternion.rotateVector(goal.rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(goal.rotation, {
    x: 0,
    y: 0,
    z: 1,
  });
  const leg: IAutoMovieVector3 = Vector3.subtract(knee, goal.point);
  const lean: number =
    (Math.atan2(Vector3.dot(leg, forward), Vector3.dot(leg, up)) * 180) /
    Math.PI;
  const excess: number = lean - (ANKLE_DORSIFLEXION.unloaded - MARGIN);
  if (excess <= 0) return kept;
  // The toes extend by the turn up to their range, the foot turning about
  // the toes' joint; past their range the toes turn with the foot about
  // their pads' tip, which stays.
  const range: number =
    AutoMovieMotionHumanRange.limit(`${side}Toes`, "flexion") ?? toes;
  const turn: number = excess * weight;
  const extend: number = Math.min(turn, Math.max(0, range - toes));
  const axis: IAutoMovieVector3 = Vector3.cross(up, forward);
  const about: (
    foot: IAutoMovieHumanLimbGoal,
    pivot: kneelLiftedFoot.Pivot,
    angle: number,
    bent: number,
  ) => IAutoMovieHumanLimbGoal = (
    foot: IAutoMovieHumanLimbGoal,
    pivot: kneelLiftedFoot.Pivot,
    angle: number,
    bent: number,
  ): IAutoMovieHumanLimbGoal => {
    if (angle <= 0) return foot;
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.fromAxisAngle(axis, angle),
      foot.rotation!,
    );
    const held: IAutoMovieVector3 = HumanFoot.point(
      body,
      side,
      pivot,
      { ankle: foot.point, rotation: foot.rotation! },
      bent,
    );
    const moved: IAutoMovieVector3 = HumanFoot.point(
      body,
      side,
      pivot,
      { ankle: foot.point, rotation },
      bent,
    );
    return {
      ...foot,
      point: Vector3.add(foot.point, Vector3.subtract(held, moved)),
      rotation,
    };
  };
  return {
    goal: about(
      about(goal, "mtp", extend, toes),
      "toe",
      turn - extend,
      toes + extend,
    ),
    toes: toes + extend,
  };
}
/** Companion types of {@link kneelLiftedFoot}. */
export namespace kneelLiftedFoot {
  /** A turned foot: its leg goal and its toes' extension, degrees. */
  export interface IFoot {
    /** The leg goal. */
    goal: IAutoMovieHumanLimbGoal;

    /** The toes' extension, degrees. */
    toes: number;
  }

  /** A foot point the turn keeps in place. */
  export type Pivot = Parameters<typeof HumanFoot.point>[2];
}

/**
 * How far off the hip-to-ankle line a bend point must lie to name the knee's
 * side, as a share of that line (provisional: a hundredth).
 */
const SIDE: number = 0.01;

/**
 * How far short of the unloaded limit the reading keeps a weightless ankle,
 * degrees: the closed-form knee and the fitted one differ by a few degrees
 * where the pelvis turns (provisional, as `unloadedFoot`'s).
 */
const MARGIN: number = 3;
