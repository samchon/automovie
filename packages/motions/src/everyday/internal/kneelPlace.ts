import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieBodyMeasure,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";

/*
 * Where the kneeling hip joint comes to rest over the knee: behind the front
 * ankle by what the thigh's length leaves after the height difference, the
 * reverse lunge, or straight over a named floor point the knee comes down on,
 * the kneeling leg stepping there while the front foot stays planted.
 * Parameter input: The hip, the front foot and the optional knee point.
 * Returns: The kneeling hip joint, world metres.
 * When the hip over the named point would stand less
 * than the reverse lunge's distance behind the front ankle, folding the front
 * knee ahead of its foot, or the front foot would be out of the front leg's
 * reach.
 */
export function kneelPlace(input: kneelPlace.IInput): IAutoMovieVector3 {
  const {
    body,
    hip,
    front,
    forward,
    behind,
    height,
    across,
    at,
  }: kneelPlace.IInput = input;
  if (at === undefined)
    return {
      ...Vector3.add(
        hip,
        Vector3.scale(
          forward,
          Vector3.dot(Vector3.subtract(front, hip), forward) - behind,
        ),
      ),
      y: height,
    };
  const placed: IAutoMovieVector3 = { x: at.x, y: height, z: at.z };
  const leg: number = body.measure.thigh + body.measure.shank;
  const along: number = Vector3.dot(Vector3.subtract(front, placed), forward);
  if (along < behind)
    throw new HumanRefusal({
      kind: "reach",
      axis: "at",
      value: along,
      feasible: { kind: "range", minimum: behind, maximum: leg, unit: "m" },
      reason: `kneeling there leaves the hip ${along.toFixed(3)} m behind the front ankle, short of the reverse lunge's ${behind.toFixed(3)} m, so the front knee folds ahead of its foot by up to a thigh into whatever stands in front`,
      fix: "name a knee point at least the reverse lunge's distance behind the other foot, or leave at out",
    });
  const reach: number = Vector3.distance(Vector3.add(placed, across), front);
  if (reach > leg)
    throw new HumanRefusal({
      kind: "reach",
      axis: "at",
      value: reach,
      feasible: { kind: "range", minimum: 0, maximum: leg, unit: "m" },
      reason: `kneeling there leaves the other ankle ${reach.toFixed(3)} m from its hip, beyond the leg's ${leg.toFixed(3)} m`,
      fix: "name a knee point within a leg's length of the other foot",
    });
  return placed;
}

/*
 * Inputs of kneelPlace.
 */
export namespace kneelPlace {
  /*
   * What the placement reads.
   */
  export interface IInput {
    /*
     * The performer.
     */
    body: { measure: Pick<IAutoMovieBodyMeasure, "thigh" | "shank"> };

    /*
     * The kneeling leg's standing hip joint, world metres.
     */
    hip: IAutoMovieVector3;

    /*
     * The planted front ankle, world metres.
     */
    front: IAutoMovieVector3;

    /*
     * The heading's unit direction.
     */
    forward: IAutoMovieVector3;

    /*
     * How far the reverse lunge's hip stands behind the front ankle, metres.
     */
    behind: number;

    /*
     * The kneeling hip joint's height, metres.
     */
    height: number;

    /*
     * The front hip joint less the kneeling one, world metres.
     */
    across: IAutoMovieVector3;

    /*
     * The floor point the knee comes down on, world metres; the reverse lunge's
     * when absent.
     */
    at?: IAutoMovieVector3;
  }
}
