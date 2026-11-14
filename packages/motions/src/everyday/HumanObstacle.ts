import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanProp } from "../perform/IHumanProp";

/**
 * A low obstacle as a stepping-over act reads it: the middle of its near
 * side on the floor, its height and its depth.
 *
 * The near side is the obstacle's `edge` contact, a kerb's top front edge
 * (`createKerb`), or without one its `top`, a hurdle's top bar edge
 * (`createHurdle`): a ledge along its `+X` with `+Y` up, its height the
 * edge's above the prop's base. Its depth is the `top` face's depth behind a
 * kerb's edge, or a hurdle's `bar` thickness, that bar's aperture.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, from which contacts of which archetypes, and the refusals.
 * @evidence contracts/development/design.md#principled-representation The near side's floor point, the height and the depth, the facts a crossing is planned from.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The record and one reader, used by `stepOver`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The edge, the height and the depth are the prop's own contacts; no obstacle is typed.
 */
export namespace HumanObstacle {
  /** An obstacle where it stands. */
  export interface IObstacle {
    /** The middle of its near side on the floor, world metres. */
    at: IAutoMovieVector3;

    /** Its height, metres. */
    height: number;

    /** Its depth across the near side, metres. */
    depth: number;
  }

  /**
   * The obstacle a prop is, at a second.
   *
   * @param context The action's context.
   * @param subject The obstacle's prop subject.
   * @returns The near side, the height and the depth.
   * @throws {HumanRefusal} When the prop declares no edge or top, no depth, or a non-positive height or depth.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The edge carried into the world by the prop's frame at the action's start; the height its rise over the prop's base.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The edge, then the depth, then the checks.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An obstacle without its contacts is refused with the ones it has, never crossed at a guessed size.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the prop's few contacts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    context: Pick<IHumanActionContext, "prop" | "start">,
    subject: string,
  ): IObstacle {
    const read: IHumanActionContext.IProp = context.prop(subject);
    const affordances: readonly IAutoMovieAffordance[] =
      read.prop.affordances ?? [];
    const find = (id: string): IAutoMovieAffordance | undefined =>
      affordances.find((a: IAutoMovieAffordance): boolean => a.id === id);
    const refuse = (reason: string): HumanRefusal =>
      new HumanRefusal({
        kind: "affordance",
        axis: "obstacle",
        value: subject,
        feasible: {
          kind: "alternatives",
          values: affordances.map((a: IAutoMovieAffordance): string => a.id),
        },
        reason,
        fix: "step over a kerb or a hurdle, whose edge and depth their contacts declare (createKerb, createHurdle)",
      });
    const edge: IAutoMovieAffordance | undefined = find("edge") ?? find("top");
    if (edge === undefined)
      throw refuse(`${subject} declares no edge or top to step over`);
    const depth: number | undefined =
      edge.id === "edge" ? find("top")?.depth : find("bar")?.aperture;
    if (depth === undefined)
      throw refuse(`${subject} declares no depth behind its ${edge.id}`);
    const frame: IHumanProp.IFrame = read.frame(context.start);
    const near: IAutoMovieVector3 = Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, edge.frame.translation),
    );
    const height: number = near.y - frame.position.y;
    if (!(height > 0 && depth > 0))
      throw refuse(
        `${subject} stands ${height.toFixed(3)} m high and ${depth.toFixed(3)} m deep; an obstacle has a positive height and depth`,
      );
    return {
      at: { x: near.x, y: frame.position.y, z: near.z },
      height,
      depth,
    };
  }
}
