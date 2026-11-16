import { Quaternion } from "@automovie/engine";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "./HumanFoot";

/**
 * Prepare only the world height of one fixed articulated sole socket.
 *
 * @param body The unchanged canonical body owning its socket and rest joints.
 * @param side The foot.
 * @param point The same sole socket or toes joint accepted by HumanFoot.point.
 * @param toes Fixed toe flexion, degrees; zero when absent.
 * @returns The exact metre Y component of HumanFoot.point for each actual placement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the fixed socket/body/toe inputs, default, changing placement and exact world-metre height result.
 * @evidence contracts/development/implementation.md#principled-implementation HumanFoot.offset remains the sole articulation owner; Quaternion.rotateVectorY evaluates exactly point's rotated Y expression, followed by the same ankle.y addition.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One socket-offset preparation precedes one scalar placement reader used by actual swinging-foot clearance loops.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not normalize the placement rotation, omit toe articulation, reassociate the height expression or change any clearance sample/bound; it only omits unread X/Z outputs.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation and scalar work per placement avoid full rotated/world point records and their unused X/Z output arithmetic across the original clearance passes.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The unchanged body, side, socket and toe flexion fix one local offset; every queried ankle and rotation is evaluated, and changing fixed inputs requires another reader.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One caller-owned reader retains one local offset until its swing/action releases it, without a placement, height, angle or time history.
 */
export function prepareHumanFootHeight(
  body: IHumanBody,
  side: "left" | "right",
  point: "heel" | "ball" | "toe" | "sole" | "mtp",
  toes: number = 0,
): (foot: HumanFoot.IPlacement) => number {
  const local: ReturnType<typeof HumanFoot.offset> = HumanFoot.offset(body, side, point, toes);
  return (foot: HumanFoot.IPlacement): number => foot.ankle.y + Quaternion.rotateVectorY(foot.rotation, local);
}
