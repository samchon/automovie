import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionKey,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanHandspring,
  IAutoMovieMotionHumanVault,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { WorkoutSupport } from "../exercise/WorkoutSupport";
import { HumanRefusal } from "../law/HumanRefusal";
import { handspring } from "./handspring";

/**
 * A handspring vault (#3377): a front handspring whose hands land on a
 * prop's top, a vaulting table, a box or a plyometric box, and fly from
 * it to the floor or named landing mat beyond. The post-table flight is
 * timed from its release to the landing surface's height, a separate
 * phase in the vault observations of Chen et al. (2026, PMC13350820).
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
  export const name: AutoMovieMotionHumanActionKey = "vault";

  /** Cancel table: the handspring's. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    handspring.interrupts;

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
   * @evidence contracts/development/implementation.md#efficient-algorithms One actual entry prop-frame read and first-match affordance lookup supply point, rotation and extents together, instead of repeating frame evaluation/lookup; the delegated handspring retains all original stations and searches. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work WorkoutSupport.placed owns this exact source observation; top placement, local extent check and delegated hand support use the same actual frame/primary metadata, without a time or pose cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The temporary placed record and construction-only extent callback release with planning return/throw; the handspring owns its resulting support/geometry plan and no independent source-frame history or workspace is retained here.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanVault.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const on: string = context.params.on;
    const landOn: string | undefined = context.params.landOn;
    return handspring.over(context, surfaceOf(context, on, "on"),
      landOn === undefined ? undefined : surfaceOf(context, landOn, "landOn"));
  }

  /** Resolve a named prop top and check contact points in its local footprint. */
  function surfaceOf(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanVault.IParams>,
    prop: string,
    axis: "on" | "landOn",
  ): IAutoMovieMotionHumanHandspring.ISurface {
    const surface: ReturnType<typeof WorkoutSupport.placed> = WorkoutSupport.placed(context, {
      prop,
      affordance: "surface",
    });
    const top: IAutoMovieVector3 = surface.point;
    const rotation: IAutoMovieQuaternion = surface.frame.rotation;
    const declared: IAutoMovieAffordance = surface.affordance;
    return {
      height: top.y,
      support: { kind: "prop", subject: prop },
      within: (point: IAutoMovieVector3): void => {
        const local: IAutoMovieVector3 = Quaternion.rotateVector(
          Quaternion.inverse(rotation),
          Vector3.subtract(point, top),
        );
        const width: number = declared.width ?? Infinity;
        const depth: number = declared.depth ?? Infinity;
        if (Math.abs(local.x) > width / 2 || Math.abs(local.z) > depth / 2)
          throw new HumanRefusal({
            kind: "reach",
            axis,
            value: prop,
            reason: `the ${axis === "on" ? "hands" : "landing foot"} reach ${local.x.toFixed(2)} m across and ${local.z.toFixed(2)} m along ${prop}'s top from its middle, off its ${width.toFixed(2)} by ${depth.toFixed(2)} m`,
            fix: `place ${prop} where the performer reaches it, or adjust the performer's entry`,
          });
      },
    };
  }
}
