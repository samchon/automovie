import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHoldInfant,
  IAutoMovieVector3,
} from "@automovie/interface";

/** The world up. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/**
 * Shoulder flexion of the cradling upper arm, degrees: provisional, the elbow
 * carried forward of the trunk's side.
 */
const FLEXION: number = 35;

/**
 * How far the cradling forearm turns forward from straight across the front,
 * degrees: provisional, clear of the trunk.
 */
const ACROSS: number = 25;

/**
 * The cradling arm of a hold.
 *
 * @param body The body.
 * @param side The holding arm.
 * @param hold The hold.
 * @param shoulder The holding shoulder's joint, world metres.
 * @param forward The body's level forward, unit.
 * @param toward The level unit toward the holding side.
 * @returns The elbow and the wrist.
 */
export function holdInfantCrook(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  hold: holdInfantCrook.Lying,
  shoulder: IAutoMovieVector3,
  forward: IAutoMovieVector3,
  toward: IAutoMovieVector3,
): holdInfantCrook.ICrook {
  const length: (
    from: AutoMovieHumanoidBone,
    to: AutoMovieHumanoidBone,
  ) => number = (
    from: AutoMovieHumanoidBone,
    to: AutoMovieHumanoidBone,
  ): number => Vector3.distance(body.rest.get(from)!, body.rest.get(to)!);
  const radians: (degrees: number) => number = (degrees: number): number =>
    (degrees * Math.PI) / 180;
  const elbow: IAutoMovieVector3 = Vector3.add(
    shoulder,
    Vector3.scale(
      Vector3.add(
        Vector3.scale(UP, -Math.cos(radians(FLEXION))),
        Vector3.scale(forward, Math.sin(radians(FLEXION))),
      ),
      length(`${side}UpperArm`, `${side}LowerArm`),
    ),
  );
  const across: IAutoMovieVector3 = Vector3.add(
    Vector3.scale(toward, -Math.cos(radians(ACROSS))),
    Vector3.scale(forward, Math.sin(radians(ACROSS))),
  );
  return {
    elbow,
    wrist: Vector3.add(
      elbow,
      Vector3.scale(
        Vector3.add(
          Vector3.scale(across, Math.cos(radians(holdInfantCrook.RISE[hold]))),
          Vector3.scale(UP, -Math.sin(radians(holdInfantCrook.RISE[hold]))),
        ),
        length(`${side}LowerArm`, `${side}Hand`),
      ),
    ),
  };
}

/**
 * The arm an infant lies along in the cradle and the feed (`holdInfant`): the
 * upper arm hangs forward of the trunk, flexed `FLEXION` from hanging, and the
 * forearm runs across the front, turned `ACROSS` forward, rising from the wrist
 * to the elbow by the hold's `RISE`. The elbow and the wrist lie the arm's own
 * segment lengths from the shoulder, so a hold laid on them lies within the
 * arm's reach.
 */
export namespace holdInfantCrook {
  /** A hold that lays the infant along the forearm. */
  export type Lying = Exclude<IAutoMovieMotionHumanHoldInfant.Hold, "shoulder">;

  /** Where the cradling arm's elbow and wrist lie, world metres. */
  export interface ICrook {
    /** The elbow, under the infant's nape. */
    elbow: IAutoMovieVector3;

    /** The wrist of the hand under the infant's seat. */
    wrist: IAutoMovieVector3;
  }

  /**
   * How far the cradling forearm rises from the wrist to the elbow, degrees, so
   * the infant's head lies above its seat: slightly in the cradle, half sitting
   * for a feed so the milk runs down (provisional, the slopes 0.15 and 0.5).
   */
  export const RISE: Readonly<Record<Lying, number>> = {
    cradle: (Math.atan(0.15) * 180) / Math.PI,
    feed: (Math.atan(0.5) * 180) / Math.PI,
  };
}
