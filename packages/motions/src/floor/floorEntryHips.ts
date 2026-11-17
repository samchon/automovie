import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Read a floor posture's authored hip origin in world metres.
 *
 * @param body The canonical body owning the hips' rest offset.
 * @param posture The actual current root and degree-valued heading.
 * @returns Its root plus the canonically rotated hips rest offset, as a fresh vector.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States actual root/heading input, canonical rest-offset provenance, world units and fresh output ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Preserves the original root-first Vector3.add argument read, then canonical heading rotation and body hips lookup; no joint fitting or alternative anchor model is introduced.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One canonical heading, quaternion-vector rotation and root addition serve raw and explicitly fixed floor transitions and entry references.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No source posture, goal, angle, root, contact or tolerance is replaced or retained, and every supplied posture is observed at the actual call position.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant geometry returns one fresh vector with no rig traversal, sample table or numerical search; runtime speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares only the original hip-anchor formula across actual consumers; every raw root/heading read remains current and no input/output result is cached.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no body, posture, point, reader or history after return or throw.
 */
export function floorEntryHips(
  body: IHumanBody,
  posture: Pick<IHumanPosture, "root" | "yaw" | "pitch" | "roll">,
): IAutoMovieVector3 {
  return Vector3.add(
    posture.root,
    Quaternion.rotateVector(
      resolveHumanPosture.heading(posture),
      body.rest.get("hips")!,
    ),
  );
}
