import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "./HumanFoot";

/**
 * Collect the actual bones used by displayed foot sockets and sole outlines.
 *
 * @param body The canonical body whose actual surface and outline frames are read.
 * @param sides The feet an observation consumes; both when absent.
 * @returns A fresh read-only bone-name union for genuine FK preparation; ancestors remain the FK owner's responsibility.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States actual body-frame provenance, side default, FK-only membership purpose and fresh result ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Reads every heel/ball/toe socket's actual frame bone and every HumanFoot.outline frame bone for each named side, matching the displayed base/socket consumers instead of inferring a standard foot/toes pair.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One side traversal collects socket and outline owners into a Set; HumanFoot remains the geometry owner and poseBones.prepare owns hierarchy admission and ancestor closure.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No custom frame, bearing predicate, outline point or duplicate geometry traversal is removed; only repeated bone names coalesce in the membership set, and actual geometry readers retain their original order.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the selected feet's actual socket/outline frames with constant-time name insertion, performed once when the caller prepares its operation's FK demand rather than for each trial.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A caller may reuse this demand only while the body's surface/outline frames and selected feet stay unchanged; each actual pose is still fully admitted and resolved by the owning FK reader.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns only a bounded set of canonical names, no body or pose references; its operation owns and releases that set/prepared demand on return or throw, without a global cache, query history or external handle.
 */
export function humanFootBones(
  body: IHumanBody,
  sides: readonly ("left" | "right")[] = ["left", "right"],
): ReadonlySet<AutoMovieHumanoidBone> {
  const bones: Set<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>();
  for (const side of sides) {
    for (const socket of HumanFoot.SOCKETS)
      bones.add(body.surfaces.sockets[`${socket}${side === "left" ? "Left" : "Right"}`].bone);
    for (const frame of HumanFoot.outline(body, side)) bones.add(frame.bone);
  }
  return bones;
}
