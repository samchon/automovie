import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanLanceCouchCarriage } from "./HumanLanceCouchCarriage";

/*
 * Whether a carriage keeps its grip, the middle of its forearm and its elbow
 * clear of the horse's shapes by `CLEAR`.
 * Parameter horse: The horse's body.
 * Parameter laid: The carriage, in the seat frame.
 * Returns: Whether every point clears.
 */
export function HumanLanceCouchClear(
  horse: HumanLanceCouchClear.IHorseBody,
  laid: HumanLanceCouchCarriage.ICarriage,
): boolean {
  const points: IAutoMovieVector3[] = [
    laid.hand.point,
    Vector3.lerp(laid.hand.point, laid.elbow, 0.5),
    laid.elbow,
  ];
  return points.every(
    (p: IAutoMovieVector3): boolean =>
      apart(horse.shapes, Vector3.add(horse.seat, p)) >= CLEAR,
  );
}

/*
 * `HumanLanceCouchClear` and its records.
 */
export namespace HumanLanceCouchClear {
  /*
   * The horse's body as a carriage keeps clear of it: its rest shapes, and
   * where the seat lies in its model.
   */
  export interface IHorseBody {
    /*
     * The horse's physical shapes in its model frame.
     */
    shapes: readonly IAutoMoviePhysicalShape[];

    /*
     * The seat contact's point in the horse's model frame, metres; the seat
     * frame's axes are the model's.
     */
    seat: IAutoMovieVector3;
  }
}

/*
 * How near the horse's shapes a hand, forearm or elbow may come, metres: half a
 * hand's thickness with the skin (provisional).
 */
const CLEAR: number = 0.06;

/*
 * A point's least signed distance from shapes in their common frame, metres:
 * exact for a sphere, a capsule and a box, and from a hull's bounding sphere
 * about its centroid, which never reads a hull nearer than it is.
 */
function apart(
  shapes: readonly IAutoMoviePhysicalShape[],
  point: IAutoMovieVector3,
): number {
  let least: number = Infinity;
  for (const shape of shapes) {
    const l: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(shape.transform.rotation),
      Vector3.subtract(point, shape.transform.position),
    );
    let d: number;
    if (shape.kind === "sphere") d = Vector3.length(l) - shape.radius;
    else if (shape.kind === "capsule")
      d =
        Vector3.length({
          x: l.x,
          y: l.y - Math.max(-shape.halfLength, Math.min(shape.halfLength, l.y)),
          z: l.z,
        }) - shape.radius;
    else if (shape.kind === "box") {
      const q: IAutoMovieVector3 = {
        x: Math.abs(l.x) - shape.halfExtents.x,
        y: Math.abs(l.y) - shape.halfExtents.y,
        z: Math.abs(l.z) - shape.halfExtents.z,
      };
      d =
        Vector3.length({
          x: Math.max(q.x, 0),
          y: Math.max(q.y, 0),
          z: Math.max(q.z, 0),
        }) + Math.min(Math.max(q.x, q.y, q.z), 0);
    } else {
      const centre: IAutoMovieVector3 = Vector3.scale(
        shape.points.reduce(
          (sum: IAutoMovieVector3, v: IAutoMovieVector3): IAutoMovieVector3 =>
            Vector3.add(sum, v),
          { x: 0, y: 0, z: 0 },
        ),
        1 / shape.points.length,
      );
      const radius: number = Math.max(
        ...shape.points.map((v: IAutoMovieVector3): number =>
          Vector3.distance(v, centre),
        ),
      );
      d = Vector3.distance(l, centre) - radius;
    }
    least = Math.min(least, d);
  }
  return least;
}
