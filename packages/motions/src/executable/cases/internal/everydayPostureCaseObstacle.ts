import { Transform } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * A box to step over as a prop: a kerb's `edge` along its near top and its
 * `top` face's depth behind it, the contacts `createKerb` declares, turned so
 * its near side faces a performer at the origin facing `+Z`.
 * Parameter box: The near side's middle on the floor, the height and the depth,
 * metres.
 * Returns: The prop.
 */
export function everydayPostureCaseObstacle(
  box: IObstacleBox,
): IAutoMovieMotionHumanProp {
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  return {
    subject: "box",
    frame: {
      position: { x: box.at.x, y: box.at.y, z: box.at.z + box.depth },
      rotation: { x: 0, y: 1, z: 0, w: 0 },
    },
    points: {},
    affordances: [
      {
        id: "edge",
        kind: "ledge",
        frame: Transform.of({ x: 0, y: box.height, z: box.depth }, identity),
        extent: null,
      },
      {
        id: "top",
        kind: "surface",
        frame: Transform.of(
          { x: 0, y: box.height, z: box.depth / 2 },
          identity,
        ),
        extent: null,
        depth: box.depth,
      },
    ],
  };
}

/*
 * A box's near side on the floor and its size.
 */
interface IObstacleBox {
  /*
   * The near side's middle on the floor, world metres.
   */
  at: IAutoMovieVector3;

  /*
   * Its height, metres.
   */
  height: number;

  /*
   * Its depth behind the near side, metres.
   */
  depth: number;
}
