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
 * @evidence contracts/development/implementation.md#principled-implementation The ankle of a rigid foot turned about a fixed sole point is that point less the rotated socket offset. The rotation is `HumanFootRotation.prepare`'s and the offset `humanFootOffset`'s, the owners `HumanFoot.preparePivot` reads, and each component is the same difference `Vector3.subtract` takes there, so the three numbers are that placement's ankle.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One fixed rotation prefix and socket offset precede one pitch reader; the placement's rotation, which a rocker search never reads, is not handed out.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pitch is cached, rounded or clamped, and the quaternion product, its normalization and the vector's rotation stay the engine's.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation and evaluation. A read builds the pitch's quaternion and the rotated offset, four engine records, and neither an ankle nor a placement record of its own. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Body, side, socket, world point and heading fix the prefix and the offset for every pitch of one search; a change in any needs another reader.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader holds its prefix closure, the socket offset and one ankle record until its search releases it; no pitch or earlier ankle is kept.
 */
export function prepareHumanFootAnkle(
  body: IHumanBody,
  side: "left" | "right",
  pivot: "heel" | "ball" | "toe" | "sole" | "mtp",
  at: IAutoMovieVector3,
  heading: number,
): (pitch: number) => IAutoMovieVector3 {
  const turned: ReturnType<typeof HumanFootRotation.prepare> =
    HumanFootRotation.prepare(heading, 0);
  const local: IAutoMovieVector3 = humanFootOffset(body, side, pivot, 0);
  const ankle: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  return (pitch: number): IAutoMovieVector3 => {
    const rotation: IAutoMovieQuaternion = turned(pitch);
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(rotation, local);
    ankle.x = at.x - offset.x;
    ankle.y = at.y - offset.y;
    ankle.z = at.z - offset.z;
    return ankle;
  };
}
