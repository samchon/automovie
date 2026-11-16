import type { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanTrunk } from "../everyday/HumanTrunk";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { handshake } from "./handshake";

/**
 * The handshake's standing shoulder and sternum offsets from one actual trunk.
 *
 * @param body The body whose stand posture fixes the approach geometry.
 * @param side The shaking hand.
 * @returns World-metre offsets from the stand law's zero floor origin and heading.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the actual standing source, hand, zero-floor convention and returned metre offsets.
 * @evidence contracts/development/implementation.md#principled-implementation The shoulder joint and sternum region are placed on the same stand posture by canonical authored-joint FK; approach geometry uses actual body dimensions rather than measure estimates.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One prepared trunk reading serves the joint and the surface region that define the stance.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original stand posture, exact region placement and absolute lateral shoulder offset are unchanged.
 * @evidence contracts/development/implementation.md#efficient-algorithms One demanded shoulder/sternum-ancestor FK replaces two independent full-body trunk readings.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both observed offsets belong to this same unchanged standing body/posture; no reading is reused across bodies or calls.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns four scalars and releases the synchronous prepared trunk reading without a cache or handle.
 */
export function handshakeStance(body: IHumanBody, side: HumanHand.Side): handshake.IStance {
  const posture: IHumanPosture = stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const reading: ReturnType<typeof HumanTrunk.prepare> = HumanTrunk.prepare(
    body, posture, new Set<AutoMovieHumanoidBone>([
      `${side}UpperArm`, body.surfaces.regions.sternum.bone,
    ]),
  );
  const shoulder: IAutoMovieVector3 = reading.bones.get(`${side}UpperArm`)!.worldPosition;
  return {
    height: shoulder.y,
    sternum: reading.region("sternum").point.z,
    shoulder: shoulder.z,
    across: Math.abs(shoulder.x),
  };
}
