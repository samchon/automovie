import { Quaternion } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

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
 * @evidence contracts/development/common.md#meaningful-documentation States the fixed socket/body/toe inputs, default, changing placement and exact world-metre height result; articulated prepares body/socket geometry first and binds each actual toe angle for its unchanged-placement-height loop.
 * @evidence contracts/development/implementation.md#principled-implementation HumanFoot.offset and prepareOffset share the sole articulation owner; Quaternion.rotateVectorY evaluates exactly point's rotated Y expression, followed by the same ankle.y addition. The articulated companion preserves the same fixed-angle local offset across each actual ankle correction loop.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One socket-offset preparation precedes one scalar placement reader used by actual swinging-foot clearance loops. The articulated companion adds a fixed-geometry reader before that same offset/height boundary.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not normalize the placement rotation, omit toe articulation, reassociate the height expression or change any clearance sample/bound; it only omits unread X/Z outputs.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation and scalar work per placement avoid full rotated/world point records and their unused X/Z output arithmetic across the original clearance passes. articulated additionally resolves body/socket geometry once for the swing, retaining actual toe trigonometry once for each angle's original correction loop.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The unchanged body, side, socket and toe flexion fix one local offset; every queried ankle and rotation is evaluated, and changing fixed inputs requires another reader. articulated binds one actual toe angle before its same-angle placement loop, without retaining or keying previous angles.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One caller-owned reader retains one local offset until its swing/action releases it. articulated retains only fixed body/socket geometry, and each actual toe angle's local offset releases with its synchronous correction read; neither reader stores placement, height, angle or time history.
 */
export function prepareHumanFootHeight(
  body: IHumanBody,
  side: "left" | "right",
  point: "heel" | "ball" | "toe" | "sole" | "mtp",
  toes: number = 0,
): (foot: HumanFoot.IPlacement) => number {
  const local: ReturnType<typeof HumanFoot.offset> = HumanFoot.offset(body, side, point, toes);
  return (foot: HumanFoot.IPlacement): number => height(local, foot);
}

/**
 * Height readers whose fixed socket has changing toe flexion between reads.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the fixed body/socket, varying toe-angle boundary and exact scalar-height reader.
 * @evidence contracts/development/design.md#principled-representation A fixed geometry reader binds each actual toe angle to its ankle-local offset, then reads changing placements without storing a placed result.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The articulated companion serves actual gait swing/clearance consumers; raw fixed-angle height remains the default function.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Both entries share HumanFoot's original articulation and one exact quaternion-Y/addition owner; no derived caller offset, changed contact bound or queried-angle cache is admitted.
 */
export namespace prepareHumanFootHeight {
  /**
   * Bind unchanged body/socket geometry once; each actual toe angle creates one
   * exact local offset and a height reader for that angle's placement trials.
   * Release the angle reader with its synchronous query and the fixed reader
   * with its swing/action. Neither reader retains a queried placement or history.
   */
  export function articulated(
    body: IHumanBody,
    side: "left" | "right",
    point: "heel" | "ball" | "toe" | "sole" | "mtp",
  ): (toes: number) => (foot: HumanFoot.IPlacement) => number {
    const offset: ReturnType<typeof HumanFoot.prepareOffset> = HumanFoot.prepareOffset(body, side, point);
    return (toes: number): ((foot: HumanFoot.IPlacement) => number) => {
      const local: IAutoMovieVector3 = offset(toes);
      return (foot: HumanFoot.IPlacement): number => height(local, foot);
    };
  }
}

/** The exact original rigid point height, omitting only unread X/Z outputs. */
function height(local: IAutoMovieVector3, foot: HumanFoot.IPlacement): number {
  return foot.ankle.y + Quaternion.rotateVectorY(foot.rotation, local);
}
