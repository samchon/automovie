import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanEntryState } from "../law/IHumanEntryState";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { StrikingBody } from "./StrikingBody";
import { StrikingContact } from "./StrikingContact";

/**
 * The relations every striking law reads from its entry state and its
 * target: which side leads, the line to the target, the feet as placed, how a
 * foot steps along the line or pivots on its ball, and the weapon's gap to
 * the struck body.
 */
export namespace StrikingTarget {
  /**
   * The leading side of an entry: the foot farther ahead along the body's
   * heading, orthodox (`left`) when the feet are level.
   *
   * @param entry The entry state.
   * @returns The leading side.
   */
  export function lead(entry: IHumanEntryState): "left" | "right" {
    const r: number = (entry.posture.yaw * Math.PI) / 180;
    const forward: IAutoMovieVector3 = { x: Math.sin(r), y: 0, z: Math.cos(r) };
    const ahead: number = Vector3.dot(Vector3.subtract(entry.feet.right.ankle, entry.feet.left.ankle), forward);
    return ahead > 0.02 ? "right" : "left";
  }

  /**
   * The horizontal unit line from a root to a target, or the heading's
   * forward when the target stands over the root.
   *
   * @param root The root, world metres.
   * @param target The target point, world metres.
   * @param yaw The fallback heading, degrees.
   * @returns A horizontal unit vector.
   */
  export function line(root: IAutoMovieVector3, target: IAutoMovieVector3, yaw: number): IAutoMovieVector3 {
    const d: IAutoMovieVector3 = { x: target.x - root.x, y: 0, z: target.z - root.z };
    if (Vector3.length(d) > 1e-6) return Vector3.normalize(d);
    const r: number = (yaw * Math.PI) / 180;
    return { x: Math.sin(r), y: 0, z: Math.cos(r) };
  }

  /**
   * The line's heading.
   *
   * @param line A horizontal unit vector.
   * @returns Degrees about +Y.
   */
  export function heading(line: IAutoMovieVector3): number {
    return (Math.atan2(line.x, line.z) * 180) / Math.PI;
  }

  /**
   * The entry's feet as placements.
   *
   * @param entry The entry state.
   * @returns Each foot's ankle and rotation.
   */
  export function feet(entry: IHumanEntryState): Record<"left" | "right", HumanFoot.IPlacement> {
    return {
      left: { ankle: entry.feet.left.ankle, rotation: entry.feet.left.rotation },
      right: { ankle: entry.feet.right.ankle, rotation: entry.feet.right.rotation },
    };
  }

  /**
   * A foot moved along a line and lifted.
   *
   * @param foot The foot.
   * @param line The horizontal unit line.
   * @param distance How far along it, metres.
   * @param lift How high above its place, metres.
   * @returns The moved foot.
   */
  export function slide(foot: HumanFoot.IPlacement, line: IAutoMovieVector3, distance: number, lift: number): HumanFoot.IPlacement {
    return { ankle: Vector3.add(foot.ankle, { x: line.x * distance, y: lift, z: line.z * distance }), rotation: foot.rotation };
  }

  /**
   * A foot turned about its ball, which stays fixed on the floor, with its
   * heel raised: the forefoot pivot of a rear-hand punch or a kick's support
   * foot.
   *
   * @param body The body.
   * @param side The foot.
   * @param foot Its flat placement.
   * @param turn The turn about the ball, degrees about +Y.
   * @param raise The heel raise, degrees (the foot's pitch, toes down).
   * @returns The pivoted foot.
   */
  export function pivot(body: IHumanBody, side: "left" | "right", foot: HumanFoot.IPlacement, turn: number, raise: number): HumanFoot.IPlacement {
    const ball: IAutoMovieVector3 = HumanFoot.point(body, side, "ball", foot);
    return HumanFoot.pivot(body, side, "ball", ball, HumanFrame.heading(foot.rotation) + turn, -raise);
  }

  /**
   * The signed gap between a weapon point and a struck body at a second: the
   * nearest distance to that body's posed collision shapes.
   *
   * @param struck The struck performer.
   * @param weapon The weapon point from the end joint and the second.
   * @returns The gap function, metres; non-positive in contact.
   */
  export function gap(
    struck: IHumanActionContext.IPerformer,
    weapon: (end: IAutoMovieVector3, seconds: number) => IAutoMovieVector3,
  ): (end: IAutoMovieVector3, seconds: number) => number {
    return (end: IAutoMovieVector3, seconds: number): number => {
      const shapes: StrikingContact.ICollider[] = StrikingBody.colliders(struck.body, struck.bones(seconds));
      return StrikingContact.nearest(weapon(end, seconds), shapes)?.distance ?? Infinity;
    };
  }
}
