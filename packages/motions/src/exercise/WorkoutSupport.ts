import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";

/**
 * The support a prop gives a workout: a bench's top under a body that lies
 * or sits raised, a bar between the hands of a body that hangs, a box's top
 * under a foot. The prop names the place by one of its affordances, so the
 * exercise is done on the furniture the scene has, at its own height,
 * instead of on a height computed from the body.
 *
 * First pass: the place is read once, as the action starts, so a support
 * that moves during the exercise is not followed; the affordance's point is
 * used and its extent is not (a body may lie past a bench's end); the body
 * goes to the support by the workout's own entry blend, not by walking to
 * it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a support is, why it is read from the prop and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A prop and an affordance id, the grammar's own way to name a place on an object, resolved to one world point.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one function the workout law calls.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An affordance the prop lacks is refused with the ones it has; nothing is guessed.
 */
export namespace WorkoutSupport {
  /**
   * Where a prop's affordance is as the action starts.
   *
   * @param context The action's context.
   * @param on The prop's subject id, the affordance's id and, for a support of two places such as a dip station's two bars, the other affordance's id.
   * @returns World metres; with two affordances, the middle between them.
   * @throws {HumanRefusal} When the prop has no such affordance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The affordance's translation in the prop's frame, carried into the world by the prop's frame at the action's start.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and one transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The refusal lists the affordances the prop does have.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function at(
    context: Pick<IHumanActionContext, "prop" | "start">,
    on: { prop: string; affordance: string; other?: string },
  ): IAutoMovieVector3 {
    const read: IHumanActionContext.IProp = context.prop(on.prop);
    const affordances: readonly IAutoMovieAffordance[] =
      read.prop.affordances ?? [];
    const frame: ReturnType<IHumanActionContext.IProp["frame"]> = read.frame(
      context.start,
    );
    const place = (id: string): IAutoMovieVector3 => {
      const found: IAutoMovieAffordance | undefined = affordances.find(
        (a: IAutoMovieAffordance): boolean => a.id === id,
      );
      if (found === undefined)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "on",
          value: id,
          reason: `the prop ${on.prop} has no affordance ${id}; it has ${affordances.map((a: IAutoMovieAffordance): string => a.id).join(", ")}`,
          fix: "name one of the prop's own affordances",
        });
      return Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, found.frame.translation),
      );
    };

    // Two affordances, as a dip station's two bars, bear at their middle.
    return on.other === undefined
      ? place(on.affordance)
      : Vector3.lerp(place(on.affordance), place(on.other), 0.5);
  }
}
