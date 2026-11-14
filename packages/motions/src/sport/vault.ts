import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionKey } from "../HumanActionKey";
import { WorkoutSupport } from "../exercise/WorkoutSupport";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { handspring } from "./handspring";

/**
 * A handspring vault (#3377): a front handspring whose hands land on a
 * prop's top, a vaulting table, a box or a plyometric box, and fly from
 * it to the floor beyond.
 *
 * The motion is the handspring's (`handspring.over`) with the hands bearing
 * on the prop's `surface` affordance, read where the prop stands as the
 * action starts. The hands come down where the lunge brings them, so a
 * surface that is not there is refused: the hands' middle must lie inside
 * the top's declared `width` and `depth`; a top that declares neither is
 * taken as wide as it needs to be. The higher hands give the flight a
 * longer fall, so the rate that lands it is lower than on the floor.
 *
 * First pass: no run-up, hurdle, springboard or flight onto the table;
 * the body is entered standing before the prop and lunges onto it, and
 * whether the legs clear the prop's edge is not checked.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is reused, where the surface is read, the refusal, the effect of the height and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A law record over the handspring's plan with the prop's top as its hands' surface.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The prop is named by its own affordance; no height is stated.
 */
export namespace vault {
  /** The action's name. */
  export const name: HumanActionKey = "vault";

  /** Cancel table: the handspring's. */
  export const interrupts: IHumanActionLaw["interrupts"] =
    handspring.interrupts;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The prop's subject id and the leading leg.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A subject id, resolved through the prop's own affordance.
   */
  export interface IParams extends handspring.IParams {
    /** The prop vaulted over, its subject id; its `surface` is where the hands land. */
    on: string;
  }

  /**
   * Plan a vault.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the prop has no `surface`, the hands come down off it, or the handspring refuses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The top's point from the prop's frame at the start, and the hands' place taken into the prop's frame to compare with its width along X and its depth along Z.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The surface record, then the handspring.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A place off the top is refused, never moved onto it.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work over the handspring's.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the workout's support reading and the handspring's plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing of its own.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const top: IAutoMovieVector3 = WorkoutSupport.at(context, {
      prop: context.params.on,
      affordance: "surface",
    });
    const read: IHumanActionContext.IProp = context.prop(context.params.on);
    const rotation: IAutoMovieQuaternion = read.frame(context.start).rotation;
    const declared: IAutoMovieAffordance | undefined = (
      read.prop.affordances ?? []
    ).find((a: IAutoMovieAffordance): boolean => a.id === "surface");
    return handspring.over(context, {
      height: top.y,
      support: { kind: "prop", subject: context.params.on },
      within: (point: IAutoMovieVector3): void => {
        const local: IAutoMovieVector3 = Quaternion.rotateVector(
          Quaternion.inverse(rotation),
          Vector3.subtract(point, top),
        );
        const width: number = declared?.width ?? Infinity;
        const depth: number = declared?.depth ?? Infinity;
        if (Math.abs(local.x) > width / 2 || Math.abs(local.z) > depth / 2)
          throw new HumanRefusal({
            kind: "reach",
            axis: "on",
            value: context.params.on,
            reason: `the hands come down ${local.x.toFixed(2)} m across and ${local.z.toFixed(2)} m along ${context.params.on}'s top from its middle, off its ${width.toFixed(2)} by ${depth.toFixed(2)} m`,
            fix: `place ${context.params.on} where the lunge brings the hands, or stand the performer so it is there`,
          });
      },
    });
  }
}
