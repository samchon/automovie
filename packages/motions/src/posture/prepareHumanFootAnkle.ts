import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFootRotation } from "./HumanFootRotation";
import { humanFootOffset } from "./humanFootOffset";

/** The alternatives of `PrepareHumanFootAnklePivot`'s site. */
type PrepareHumanFootAnklePivot = "heel" | "ball" | "toe" | "sole" | "mtp";

/**
 * Prepare the ankle of a foot pivoting about a sole point fixed in the world,
 * for a search that reads many pitches and keeps none of them.
 *
 * @param body The body owning the sole socket.
 * @param side The foot.
 * @param pivot Which socket stays fixed.
 * @param at The socket's fixed world position, metres.
 * @param heading The fixed foot heading, degrees about +Y.
 * @returns A reader of pitch in degrees, positive toes up, giving the ankle of
 *   `HumanFoot.preparePivot`'s placement at that pitch with the toes flat and
 *   no roll, world metres. The reader owns the returned record and overwrites
 *   it at its next read, so a caller reads the three components before reading
 *   another pitch and never keeps the record.
 */
export function prepareHumanFootAnkle(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  pivot: PrepareHumanFootAnklePivot,
  at: IAutoMovieVector3,
  heading: number,
): (pitch: number) => IAutoMovieVector3 {
  // The foot's rotation at zero pitch (heading, no roll): the images of its
  // three axes are the columns every pitch's rotation is composed with.
  const level: IAutoMovieQuaternion = HumanFootRotation.prepare(heading, 0)(0);
  const xs: IAutoMovieVector3 = Quaternion.rotateVector(level, {
    x: 1,
    y: 0,
    z: 0,
  });
  const ys: IAutoMovieVector3 = Quaternion.rotateVector(level, {
    x: 0,
    y: 1,
    z: 0,
  });
  const zs: IAutoMovieVector3 = Quaternion.rotateVector(level, {
    x: 0,
    y: 0,
    z: 1,
  });
  const local: IAutoMovieVector3 = humanFootOffset(body, side, pivot, 0);
  const ankle: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  return (pitch: number): IAutoMovieVector3 => {
    // The offset turned by minus the pitch about the foot's lateral axis.
    const turn: number = (-pitch * Math.PI) / 180;
    const cosine: number = Math.cos(turn);
    const sine: number = Math.sin(turn);
    const y: number = local.y * cosine - local.z * sine;
    const z: number = local.y * sine + local.z * cosine;
    ankle.x = at.x - (xs.x * local.x + ys.x * y + zs.x * z);
    ankle.y = at.y - (xs.y * local.x + ys.y * y + zs.y * z);
    ankle.z = at.z - (xs.z * local.x + ys.z * y + zs.z * z);
    return ankle;
  };
}
