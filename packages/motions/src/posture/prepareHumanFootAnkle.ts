import { Quaternion } from "@automovie/engine";
import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFootRotation } from "./HumanFootRotation";
import { humanFootOffset } from "./humanFootOffset";

/**
 * Prepare the ankle of a foot pivoting about a sole point fixed in the world,
 * for a search that reads many pitches and keeps none of them.
 *
 * @param body The body owning the sole socket.
 * @param side The foot.
 * @param pivot Which socket stays fixed.
 * @param at The socket's fixed world position, metres.
 * @param heading The fixed foot heading, degrees about +Y.
 * @returns A reader of pitch in degrees, positive toes up, giving the ankle of `HumanFoot.preparePivot`'s placement at that pitch with the toes flat and no roll, world metres. The reader owns the returned record and overwrites it at its next read, so a caller reads the three components before reading another pitch and never keeps the record.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the fixed inputs with their frames and units, the equivalence to the pivot's ankle, and that the returned record is the reader's own, valid until its next read.
 * @evidence contracts/development/implementation.md#principled-implementation The ankle of a rigid foot turned about a fixed sole point is that point less the rotated socket offset. The placement's rotation is heading, then roll (none here), then a turn of minus the pitch about the foot's own lateral axis X (`HumanFootRotation`), so the rotated offset is the heading's rotation applied to the offset turned about X: `(x, y cos t - z sin t, y sin t + z cos t)` with `t` minus the pitch. The heading's rotation is read once as the images of the three axes under `HumanFootRotation.prepare`'s own prefix at zero pitch, so the three numbers are that placement's ankle up to the rounding of one rotation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The heading's three axis images and the socket offset precede one pitch reader of one sine, one cosine and three sums; the placement's rotation, which a rocker search never reads, is not built.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pitch is cached, rounded or clamped; the heading's rotation and the socket offset are their owners' values.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation and evaluation. A read is one sine, one cosine and fifteen products, with no record made: the pitch's quaternion, its product with the prefix, the normalization and the rotated offset record a read built before are four records and a square root it no longer pays. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Body, side, socket, world point and heading fix the axis images and the offset for every pitch of one search; a change in any needs another reader.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader holds nine axis components, the socket offset and one ankle record until its search releases it; no pitch or earlier ankle is kept.
 */
export function prepareHumanFootAnkle(
  body: IHumanBody,
  side: "left" | "right",
  pivot: "heel" | "ball" | "toe" | "sole" | "mtp",
  at: IAutoMovieVector3,
  heading: number,
): (pitch: number) => IAutoMovieVector3 {
  // The foot's rotation at zero pitch (heading, no roll): the images of its
  // three axes are the columns every pitch's rotation is composed with.
  const level: IAutoMovieQuaternion = HumanFootRotation.prepare(heading, 0)(0);
  const xs: IAutoMovieVector3 = Quaternion.rotateVector(level, { x: 1, y: 0, z: 0 });
  const ys: IAutoMovieVector3 = Quaternion.rotateVector(level, { x: 0, y: 1, z: 0 });
  const zs: IAutoMovieVector3 = Quaternion.rotateVector(level, { x: 0, y: 0, z: 1 });
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
