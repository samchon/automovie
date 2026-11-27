import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanWorkoutSupport,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";

/** The record of `IPlacedResult`'s site. */
type IPlacedResult = {
  point: IAutoMovieVector3;
  frame: ReturnType<IAutoMovieMotionHumanPropReader["frame"]>;
  affordance: IAutoMovieAffordance;
};

/** The alternatives of `PlacedContext`'s site. */
type PlacedContext = "prop" | "start";

/** The alternatives of `AtContext`'s site. */
type AtContext = "prop" | "start";

/**
 * The support a prop gives a workout: a bench's top under a body that lies or
 * sits raised, a bar between the hands of a body that hangs, a box's top under
 * a foot. The prop names the place by one of its affordances, so the exercise
 * is done on the furniture the scene has, at its own height, instead of on a
 * height computed from the body.
 *
 * First pass: the place is read once, as the action starts, so a support that
 * moves during the exercise is not followed; the affordance's point is used and
 * its extent is not (a body may lie past a bench's end); the body goes to the
 * support by the workout's own entry blend, not by walking to it.
 */
export namespace WorkoutSupport {
  /**
   * Where a prop's affordance is as the action starts.
   *
   * @param context The action's context.
   * @param on The prop's subject id, the affordance's id and, for a support of
   *   two places such as a dip station's two bars, the other affordance's id.
   * @returns World metres; with two affordances, the middle between them.
   * @throws {HumanRefusal} When the prop has no such affordance.
   */
  export function at(
    context: Pick<IAutoMovieMotionHumanActionContext, AtContext>,
    on: IAutoMovieMotionHumanWorkoutSupport.IAtOn,
  ): IAutoMovieVector3 {
    return placed(context, on).point;
  }

  /**
   * Read one entry-time support observation with the prop frame and primary
   * affordance that define it. A two-affordance support still uses the same
   * ordered pair of world points and their original midpoint.
   *
   * @param context The prop reader and action start time, in seconds.
   * @param on The primary prop/affordance and optional second affordance.
   * @returns The fresh world-metre point and borrowed actual entry
   *   frame/primary affordance; no observation is retained by this owner.
   * @throws {HumanRefusal} At the first missing named affordance, primary
   *   before optional other.
   */
  export function placed(
    context: Pick<IAutoMovieMotionHumanActionContext, PlacedContext>,
    on: IAutoMovieMotionHumanWorkoutSupport.IAtOn,
  ): IPlacedResult {
    const read: IAutoMovieMotionHumanPropReader = context.prop(on.prop);
    const affordances: readonly IAutoMovieAffordance[] =
      read.prop.affordances ?? [];
    const frame: ReturnType<IAutoMovieMotionHumanPropReader["frame"]> =
      read.frame(context.start);
    const find: (id: string) => IAutoMovieAffordance = (
      id: string,
    ): IAutoMovieAffordance => {
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
      return found;
    };
    const point: (affordance: IAutoMovieAffordance) => IAutoMovieVector3 = (
      affordance: IAutoMovieAffordance,
    ): IAutoMovieVector3 =>
      Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, affordance.frame.translation),
      );
    const single: boolean = on.other === undefined;
    const affordance: IAutoMovieAffordance = find(on.affordance);
    const first: IAutoMovieVector3 = point(affordance);

    // Two affordances, as a dip station's two bars, bear at their middle.
    return {
      point: single ? first : Vector3.lerp(first, point(find(on.other!)), 0.5),
      frame,
      affordance,
    };
  }
}
