import { Quaternion, Transform, AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanDress,
  IAutoMovieMotionHumanProp,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * An item to put on, shaped as `AutoMovieArchetypeWearable.create` shapes it and
 * lying where the hand takes it: a 0.3 m hat 0.12 m high facing the way it is
 * worn, held at its brim's right side, or 0.14 m spectacles facing the body,
 * held at the bridge, each with its `wear` socket.
 * Parameter item: The item.
 * Parameter at: Where it lies, world metres.
 * Returns: The prop.
 */
export function dressCaseWearable(
  item: IAutoMovieMotionHumanDress.Item,
  at: IAutoMovieVector3,
): IAutoMovieMotionHumanProp {
  const hat: boolean = item === "hat";
  const hold: IAutoMovieAffordance = {
    id: "hold",
    kind: "handle",
    symmetry: "none",
    frame: Transform.of(
      hat ? { x: -0.13, y: 0.002, z: 0 } : { x: 0, y: 0.02, z: 0 },
      hat
        ? AutoMovieEngineMath.quaternionFromBasis(
            { x: 0, y: 0, z: 1 },
            { x: 0, y: 1, z: 0 },
            { x: -1, y: 0, z: 0 },
          )
        : AutoMovieEngineMath.quaternionFromBasis(
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 0, z: 1 },
            { x: 0, y: -1, z: 0 },
          ),
    ),
    extent: null,
    grip: "precision",
    aperture: 0.004,
  };
  return {
    subject: "item",
    frame: {
      position: at,
      rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, hat ? 0 : 180),
    },
    points: {},
    shapes: [
      {
        id: "body",
        material: hat ? "felt" : "acetate",
        transform: {
          position: hat ? { x: 0, y: 0.06, z: 0 } : { x: 0, y: 0.02, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        kind: "box",
        halfExtents: hat
          ? { x: 0.15, y: 0.06, z: 0.15 }
          : { x: 0.07, y: 0.02, z: 0.002 },
      },
    ],
    affordances: [
      hold,
      {
        id: "wear",
        kind: "socket",
        frame: dressCaseWearable.WEAR[item],
        extent: null,
      },
    ],
  };
}

/*
 * The items' wear sockets.
 */
export namespace dressCaseWearable {
  /*
   * The wear sockets of the two items, in their own frames, as
   * `AutoMovieArchetypeWearable.create` declares them.
   */
  export const WEAR: Readonly<
    Record<IAutoMovieMotionHumanDress.Item, IAutoMovieAffordance["frame"]>
  > = {
    hat: Transform.of(
      { x: 0, y: 0.11, z: 0 },
      AutoMovieEngineMath.quaternionFromBasis(
        { x: 0, y: 0, z: 1 },
        { x: 0, y: -1, z: 0 },
        { x: 1, y: 0, z: 0 },
      ),
    ),
    glasses: Transform.of(
      { x: 0, y: 0.016, z: -0.002 },
      AutoMovieEngineMath.quaternionFromBasis(
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: -1 },
        { x: 0, y: 1, z: 0 },
      ),
    ),
  };
}
