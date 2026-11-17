import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanWorkoutSupport,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

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
 * @evidence contracts/development/design.md#minimal-and-owned-surface Workout reads the support point through at; vault planners read placed's same entry observation together with its actual frame and primary affordance, without repeating those lookups.
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates to the single placed owner and selects its point.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The refusal lists the affordances the prop does have.
   * @evidence contracts/development/implementation.md#efficient-algorithms The placed owner performs one frame read and at most two ordered O(A) searches for A affordances, with constant transforms.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the original frame/lookup/transform algorithm with placed; each call still observes its actual entry-time prop.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the point returns; the local frame and affordance references are released with the delegated observation.
   */
  export function at(
    context: Pick<IAutoMovieMotionHumanActionContext, "prop" | "start">,
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
   * @returns The fresh world-metre point and borrowed actual entry frame/primary affordance; no observation is retained by this owner.
   * @throws {HumanRefusal} At the first missing named affordance, primary before optional other.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States entry time, world point, borrowed frame/primary affordance, ordered two-point midpoint and refusal order.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the actual prop frame once at context.start, transforms each first-matching named affordance translation by that frame and preserves the original ordered midpoint when other is present.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure After the original frame preparation, the other-property branch is read before primary lookup/point. One lookup and rigid-transform owner then exposes the already observed primary/frame to real vault consumers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the original other-property observation before the primary lookup, then its second read only in the two-point branch after the first point. Missing names keep original refusal/alternatives, duplicate ids keep the first match, and no target, extent or frame is guessed or cached across times.
   * @evidence contracts/development/implementation.md#efficient-algorithms One frame read and one or two ordered O(A) searches for A affordances produce the point and metadata together; callers need no repeated prop/frame read or primary search.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Point, frame and primary affordance belong to this exact synchronous entry observation. At delegates here, and consumers borrow those actual values rather than starting a second observation of the same prop/time.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the returned point/frame/affordance record survives under the caller's ownership; this owner stores no plan, prop reader, observation, current pose or time history.
   */
  export function placed(
    context: Pick<IAutoMovieMotionHumanActionContext, "prop" | "start">,
    on: IAutoMovieMotionHumanWorkoutSupport.IAtOn,
  ): {
    point: IAutoMovieVector3;
    frame: ReturnType<IAutoMovieMotionHumanPropReader["frame"]>;
    affordance: IAutoMovieAffordance;
  } {
    const read: IAutoMovieMotionHumanPropReader = context.prop(on.prop);
    const affordances: readonly IAutoMovieAffordance[] =
      read.prop.affordances ?? [];
    const frame: ReturnType<IAutoMovieMotionHumanPropReader["frame"]> = read.frame(
      context.start,
    );
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
