import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHoldInfant,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HoldInfantCrookData } from "./HoldInfantCrookData";

/*
 * The cradling arm of a hold.
 * Parameter body: The body.
 * Parameter side: The holding arm.
 * Parameter hold: The hold.
 * Parameter shoulder: The holding shoulder's joint, world metres.
 * Parameter forward: The body's level forward, unit.
 * Parameter toward: The level unit toward the holding side.
 * Returns: The elbow and the wrist.
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
  ): number => AutoMovieEngineVector3.distance(body.rest.get(from)!, body.rest.get(to)!);
  const radians: (degrees: number) => number = (degrees: number): number =>
    (degrees * Math.PI) / 180;
  const elbow: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    shoulder,
    AutoMovieEngineVector3.scale(
      AutoMovieEngineVector3.add(
        AutoMovieEngineVector3.scale(HoldInfantCrookData.UP, -Math.cos(radians(HoldInfantCrookData.FLEXION))),
        AutoMovieEngineVector3.scale(forward, Math.sin(radians(HoldInfantCrookData.FLEXION))),
      ),
      length(`${side}UpperArm`, `${side}LowerArm`),
    ),
  );
  const across: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    AutoMovieEngineVector3.scale(toward, -Math.cos(radians(HoldInfantCrookData.ACROSS))),
    AutoMovieEngineVector3.scale(forward, Math.sin(radians(HoldInfantCrookData.ACROSS))),
  );
  return {
    elbow,
    wrist: AutoMovieEngineVector3.add(
      elbow,
      AutoMovieEngineVector3.scale(
        AutoMovieEngineVector3.add(
          AutoMovieEngineVector3.scale(across, Math.cos(radians(holdInfantCrook.RISE[hold]))),
          AutoMovieEngineVector3.scale(HoldInfantCrookData.UP, -Math.sin(radians(holdInfantCrook.RISE[hold]))),
        ),
        length(`${side}LowerArm`, `${side}Hand`),
      ),
    ),
  };
}

/*
 * The arm an infant lies along in the cradle and the feed (`holdInfant`): the
 * upper arm hangs forward of the trunk, flexed `FLEXION` from hanging, and the
 * forearm runs across the front, turned `ACROSS` forward, rising from the wrist
 * to the elbow by the hold's `RISE`. The elbow and the wrist lie the arm's own
 * segment lengths from the shoulder, so a hold laid on them lies within the
 * arm's reach.
 */
export namespace holdInfantCrook {
  /*
   * A hold that lays the infant along the forearm.
   */
  export type Lying = Exclude<IAutoMovieMotionHumanHoldInfant.Hold, "shoulder">;

  /*
   * Where the cradling arm's elbow and wrist lie, world metres.
   */
  export interface ICrook {
    /*
     * The elbow, under the infant's nape.
     */
    elbow: IAutoMovieVector3;

    /*
     * The wrist of the hand under the infant's seat.
     */
    wrist: IAutoMovieVector3;
  }

  /*
   * How far the cradling forearm rises from the wrist to the elbow, degrees, so
   * the infant's head lies above its seat: slightly in the cradle, half sitting
   * for a feed so the milk runs down (provisional, the slopes 0.15 and 0.5).
   */
  export const RISE: Readonly<Record<Lying, number>> = {
    cradle: (Math.atan(0.15) * 180) / Math.PI,
    feed: (Math.atan(0.5) * 180) / Math.PI,
  };
}
