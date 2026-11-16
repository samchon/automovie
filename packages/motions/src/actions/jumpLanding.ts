import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { stand } from "./stand";

/**
 * Where a jump comes down, at the height of what it lands on (the floor's
 * 0, a box's top, a step's): both feet flat on footprints at the
 * destination, at the body's rest separation and turned out by the stance
 * angle, and the root's three places of the landing, touched down 0.03 hip
 * heights low and 0.1 back, absorbed 0.12 low, and stood upright.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the footprints and the three roots with their offsets.
 * @evidence contracts/development/design.md#principled-representation The landing's places, apart from the paths between them.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record and its builder, read by the jump.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every offset is a share of the hip height or the body's own lean.
 */
export namespace jumpLanding {
  /**
   * The landing's places.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its place and frame.
   * @evidence contracts/development/design.md#principled-representation The feet and the root at the landing's three instants.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, all read by the jump.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The heights include the surface's.
   */
  export interface ILanding {
    /** Each foot flat on its footprint, world metres. */
    feet: Record<"left" | "right", HumanFoot.IPlacement>;

    /** The root at touchdown, world metres. */
    touched: IAutoMovieVector3;

    /** The root absorbed, world metres. */
    absorbed: IAutoMovieVector3;

    /** The root stood upright, world metres. */
    stood: IAutoMovieVector3;
  }

  /**
   * The landing's places at a destination.
   *
   * @param body The body.
   * @param to The floor point under the destination, its height ignored.
   * @param heading The jump's heading, degrees about +Y.
   * @param rise The landing surface's height, metres.
   * @param lean The upright stand's forward lean, metres.
   * @returns The places.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, its unit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Each place is an offset in the heading's frame at the destination, lifted by the surface's height.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two footprints and three roots.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The footprints keep the body's rest separation, so the stance is the body's.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed-size work prepares one heading sine/cosine pair for the two footprints and three root offsets, instead of recomputing it at each conversion; each actual foot rotation remains evaluated and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The five original local offsets share one actual HumanFrame.prepare snapshot with identical multiply/add grouping; HumanFoot.rotation still owns each turned-out foot's quaternion.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The local frame and footprint reader release on synchronous return/throw; only fresh footprint and root vectors escape, without source frames, callbacks or history.
   */
  export function of(
    body: IHumanBody,
    to: IAutoMovieVector3,
    heading: number,
    rise: number,
    lean: number,
  ): ILanding {
    const m: IHumanBody["measure"] = body.measure;
    const l: number = m.hipHeight;
    const frame: HumanFrame.IPrepared = HumanFrame.prepare({ origin: { ...to, y: 0 }, yaw: heading });
    const footprint: (s: "left" | "right") => HumanFoot.IPlacement = (s: "left" | "right"): HumanFoot.IPlacement => ({
      ankle: frame.point({
        x: (s === "left" ? 1 : -1) * Math.abs(body.rest.get(`${s}Foot`)!.x),
        y: m.ankleHeight + rise,
        z: 0,
      }),
      rotation: HumanFoot.rotation(
        heading + (s === "left" ? stand.TOE_OUT : -stand.TOE_OUT),
        0,
      ),
    });
    return {
      feet: { left: footprint("left"), right: footprint("right") },
      touched: frame.point({
        x: 0,
        y: rise - 0.005 - 0.03 * l,
        z: -0.1 * l,
      }),
      stood: frame.point({ x: 0, y: rise - 0.005, z: lean }),
      absorbed: frame.point({
        x: 0,
        y: rise - 0.005 - 0.12 * l,
        z: 0.3 * lean,
      }),
    };
  }
}
