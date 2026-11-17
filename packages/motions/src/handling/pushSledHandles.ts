import type { IAutoMovieAffordance, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanHand, IAutoMovieMotionHumanProp, IAutoMovieQuaternion } from "@automovie/interface";

import { Quaternion, Vector3 } from "@automovie/engine";

import { HumanRefusal } from "../law/HumanRefusal";

/**
 * The two handles a sled push (`pushSled`) takes, read on the pushed prop
 * where it stands at the push's start.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, from where and when.
 * @evidence contracts/development/design.md#principled-representation A handle is its grasp frame (the point, the palm's way in, the wrapped axis), its symmetry and its grip band, the prop's own affordance carried by the prop's frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The handle and its reader, read by `pushSled` alone.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The handles are the prop's named affordances; none is typed.
 */
export namespace pushSledHandles {
  /**
   * A handle where it stands at the grip.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame, its meaning and its unit.
   * @evidence contracts/development/design.md#principled-representation The grasp frame `HumanHand.reach` lays a fist on, with the affordance's own symmetry and band.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, each read by `pushSled`'s grasp search.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The symmetry is the affordance's own type, not restated.
   */
  export interface IHandle {
    /** Its frame: the point, the palm's way in (`normal`) and the wrapped axis (`forward`). */
    frame: IAutoMovieMotionHumanHand.IFrame;

    /** How its grasp repeats about the wrapped axis. */
    symmetry: IAutoMovieAffordance["symmetry"];

    /** Its grip band's length along the wrapped axis, metres; 0 when it declares no band. */
    length: number;
  }

  /**
   * Read a push's two handles.
   *
   * @param context The action's context.
   * @param sled The pushed prop's subject id.
   * @param left The left hand's handle id.
   * @param right The right hand's handle id.
   * @returns Each hand's handle.
   * @throws {HumanRefusal} An `affordance` refusal on `handle` when the prop has no handle of that name, listing its affordances.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The hand arrives along the handle's `-Y`, the palm into the bar, and wraps its `+X` (`HumanGrasp`), both carried by the prop's frame at the start.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and one frame per hand.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing handle is refused with the prop's affordances, never replaced.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the prop's few affordances.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    context: Pick<IAutoMovieMotionHumanActionContext, "prop" | "start">,
    sled: string,
    left: string,
    right: string,
  ): Record<IAutoMovieMotionHumanHand.Side, IHandle> {
    const read: IAutoMovieMotionHumanActionContext.IProp = context.prop(sled);
    const frame: IAutoMovieMotionHumanProp.IFrame = read.frame(context.start);
    const handle = (id: string): IHandle => {
      const found: IAutoMovieAffordance | undefined = (
        read.prop.affordances ?? []
      ).find((a: IAutoMovieAffordance): boolean => a.id === id);
      if (found === undefined)
        throw new HumanRefusal({
          kind: "affordance",
          axis: "handle",
          value: `${sled}.${id}`,
          feasible: {
            kind: "alternatives",
            values: (read.prop.affordances ?? []).map(
              (a: IAutoMovieAffordance): string => a.id,
            ),
          },
          reason: `${sled} has no handle named ${id}`,
          fix: "name the prop's handles as `left` and `right`",
        });
      const turn: IAutoMovieQuaternion = Quaternion.multiply(
        frame.rotation,
        found.frame.rotation,
      );
      return {
        frame: {
          point: Vector3.add(
            frame.position,
            Quaternion.rotateVector(frame.rotation, found.frame.translation),
          ),
          normal: Quaternion.rotateVector(turn, { x: 0, y: -1, z: 0 }),
          forward: Quaternion.rotateVector(turn, { x: 1, y: 0, z: 0 }),
        },
        symmetry: found.symmetry,
        length: found.length ?? 0,
      };
    };
    return { left: handle(left), right: handle(right) };
  }
}
