import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanEntryState } from "../law/IHumanEntryState";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";

/**
 * The relations every striking law reads from its entry state and its
 * target: which side leads, the line to the target, the feet as placed, and
 * how a foot steps along the line or pivots on its ball.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the relations the namespace provides and the perception rule behind its look-back.
 * @evidence contracts/development/design.md#principled-representation Pure functions of the entry state and the target in world metres, degrees and film seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The look-back and the queries the striking laws and reactions share.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the entry state, foot placement, frame and target types.
 */
export namespace StrikingTarget {
  /**
   * How long before its start an action reads another performer to plan,
   * seconds: one film frame. Perception precedes action, and the rule keeps
   * every plan-time read in the other's earlier actions, so two performers
   * starting at the same instant (simultaneous strikes, a guard facing a
   * guard) never wait on each other's plans.
   */
  export const LOOK: number = 1 / 24;

  /**
   * The leading side of an entry: the foot farther ahead along the body's
   * heading, orthodox (`left`) when the feet are level.
   *
   * @param entry The entry state.
   * @returns The leading side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule and its default.
   * @evidence contracts/development/implementation.md#principled-implementation The right ankle's lead over the left along the heading's forward; more than 2 cm makes the right side lead.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One projection and one comparison.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The 2 cm threshold keeps level feet orthodox against rounding.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function lead(entry: IHumanEntryState): "left" | "right" {
    const r: number = (entry.posture.yaw * Math.PI) / 180;
    const forward: IAutoMovieVector3 = { x: Math.sin(r), y: 0, z: Math.cos(r) };
    const ahead: number = Vector3.dot(
      Vector3.subtract(entry.feet.right.ankle, entry.feet.left.ankle),
      forward,
    );
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result and the fallback.
   * @evidence contracts/development/implementation.md#principled-implementation The normalised horizontal difference, or the heading's forward when shorter than 1 µm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function line(
    root: IAutoMovieVector3,
    target: IAutoMovieVector3,
    yaw: number,
  ): IAutoMovieVector3 {
    const d: IAutoMovieVector3 = {
      x: target.x - root.x,
      y: 0,
      z: target.z - root.z,
    };
    if (Vector3.length(d) > 1e-6) return Vector3.normalize(d);
    const r: number = (yaw * Math.PI) / 180;
    return { x: Math.sin(r), y: 0, z: Math.cos(r) };
  }

  /**
   * The line's heading.
   *
   * @param line A horizontal unit vector.
   * @returns Degrees about +Y.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the convention.
   * @evidence contracts/development/implementation.md#principled-implementation The two-argument arctangent of the x and z components, 0 facing +Z.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function heading(line: IAutoMovieVector3): number {
    return (Math.atan2(line.x, line.z) * 180) / Math.PI;
  }

  /**
   * The entry's feet as placements.
   *
   * @param entry The entry state.
   * @returns Each foot's ankle and rotation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result.
   * @evidence contracts/development/implementation.md#principled-implementation Copies each entry foot's ankle and rotation into a placement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One object.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function feet(
    entry: IHumanEntryState,
  ): Record<"left" | "right", HumanFoot.IPlacement> {
    return {
      left: {
        ankle: entry.feet.left.ankle,
        rotation: entry.feet.left.rotation,
      },
      right: {
        ankle: entry.feet.right.ankle,
        rotation: entry.feet.right.rotation,
      },
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States every unit and that the rotation is kept.
   * @evidence contracts/development/implementation.md#principled-implementation The ankle translated along the line and raised, the rotation unchanged.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One translation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function slide(
    foot: HumanFoot.IPlacement,
    line: IAutoMovieVector3,
    distance: number,
    lift: number,
  ): HumanFoot.IPlacement {
    return {
      ankle: Vector3.add(foot.ankle, {
        x: line.x * distance,
        y: lift,
        z: line.z * distance,
      }),
      rotation: foot.rotation,
    };
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what stays fixed and every angle's sense.
   * @evidence contracts/development/implementation.md#principled-implementation The foot's rocker pivot about its ball point: the heading turned and the pitch raised with the ball held.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ball read and one pivot.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function pivot(
    body: IHumanBody,
    side: "left" | "right",
    foot: HumanFoot.IPlacement,
    turn: number,
    raise: number,
  ): HumanFoot.IPlacement {
    const ball: IAutoMovieVector3 = HumanFoot.point(body, side, "ball", foot);
    return HumanFoot.pivot(
      body,
      side,
      "ball",
      ball,
      HumanFrame.heading(foot.rotation) + turn,
      -raise,
    );
  }

  /**
   * A strike's aim at a film second: the context's aim for a person, a prop
   * or a point; for no target, a virtual opponent's point built from the
   * performer's own measure on the stance's line (the heading turned back by
   * the stance turn when the feet are staggered), at the line's height (low:
   * the thigh's upper third, middle: the chest, high: the head less half its
   * radius) and at the technique's range unless the target names one.
   *
   * @param context The action's context.
   * @param target The target.
   * @param seconds Film seconds.
   * @param range The technique's range from the stance centre, metres, given the line height.
   * @returns World point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both cases, each line's height and the range's source.
   * @evidence contracts/development/implementation.md#principled-implementation The context's aim for a real target; for none, a point on the stance's line at the line's height measured on the performer and at the technique's range or the named one.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch for a real target, then the virtual point.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The virtual opponent is built from the performer's own measure, not a fixed scene; a 5 cm stagger decides whether to turn back by the stance turn.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time beyond the context's aim.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs; callers memoise.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function aim(
    context: IHumanActionContext,
    target: AutoMovieMotionTarget,
    seconds: number,
    range: (height: number) => number,
  ): IAutoMovieVector3 {
    if (target.kind !== "none") return context.aim(target, seconds).point;
    const m = context.body.measure;
    const entry = context.entry;
    const lead: "left" | "right" = StrikingTarget.lead(entry);
    const r0: number = (entry.posture.yaw * Math.PI) / 180;
    const staggered: boolean =
      Math.abs(
        Vector3.dot(
          Vector3.subtract(entry.feet.left.ankle, entry.feet.right.ankle),
          { x: Math.sin(r0), y: 0, z: Math.cos(r0) },
        ),
      ) > 0.05;
    const yaw: number =
      entry.posture.yaw + (staggered ? (lead === "left" ? 30 : -30) : 0);
    const r: number = (yaw * Math.PI) / 180;
    const height: number =
      target.line === "low"
        ? m.hipHeight - 0.3 * m.thigh
        : target.line === "high"
          ? m.headHeight - 0.5 * m.headRadius
          : m.chestHeight;
    const distance: number = target.range ?? range(height);
    const centre: IAutoMovieVector3 = {
      x: (entry.feet.left.ankle.x + entry.feet.right.ankle.x) / 2,
      y: 0,
      z: (entry.feet.left.ankle.z + entry.feet.right.ankle.z) / 2,
    };
    return {
      x: centre.x + Math.sin(r) * distance,
      y: height,
      z: centre.z + Math.cos(r) * distance,
    };
  }
}
