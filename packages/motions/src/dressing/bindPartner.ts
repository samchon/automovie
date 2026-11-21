import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBindPartner,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionPropHold,
  IAutoMovieMotionPropWear,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { dressPartner } from "./dressPartner";

/**
 * Bind another performer with a held restraint (#3974, #4002). The binder
 * puts the restraint on the partner's region by `dressPartner`, and the wear
 * it publishes carries the link: the partner's other region's bone, or a
 * scene target, and the slack. The performance then keeps the bound parts
 * where they were when the restraint went on (`HumanPerformanceBonds`)
 * until a later grip takes it off.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the reuse of the dressing, what the link names and who enforces it.
 * @evidence contracts/development/implementation.md#principled-implementation The partner's region resolves to the bone under it, the same way the dressing resolves the worn region.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One admission, one delegated plan and one mapped wear.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A link naming both or neither end, a negative or non-finite slack, or a second region on the worn bone is refused.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work over the dressing's plan.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing is repeated.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the plan.
 */
export const bindPartner: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanBindPartner> =
  {
    name: "bindPartner",
    interrupts: {},
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBindPartner>,
    ): IAutoMovieMotionHumanActionPlan => {
      const link: IAutoMovieMotionHumanBindPartner.ILink = context.params.link;
      if ((link.region === undefined) === (link.target === undefined))
        throw new HumanRefusal({
          kind: "parameter",
          axis: "link",
          value: link.region ?? "none",
          reason: "a binding links its region to exactly one other end",
          fix: "name either the partner's other region or a scene target",
        });
      if (!(link.slack >= 0 && Number.isFinite(link.slack)))
        throw new HumanRefusal({
          kind: "parameter",
          axis: "link.slack",
          value: link.slack,
          reason: "a binding's slack is a finite length of zero or more",
          fix: "give the chain's or the rope's free length in metres",
        });
      const regions: IAutoMovieMotionHumanBody["surfaces"]["regions"] =
        context.performer(context.params.partner).body.surfaces.regions;
      const worn: AutoMovieHumanoidBone = regions[context.params.region].bone;
      const other: AutoMovieHumanoidBone | undefined =
        link.region === undefined ? undefined : regions[link.region].bone;
      if (other === worn)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "link.region",
          value: link.region!,
          reason: "the linked region lies on the bone the restraint is worn on",
          fix: "link a region of another limb, such as the other wrist",
        });
      const { link: _link, ...dressing } = context.params;
      const plan: IAutoMovieMotionHumanActionPlan = dressPartner.plan({
        ...context,
        params: dressing,
      });
      const bound: IAutoMovieMotionPropWear.ILink = {
        ...(other === undefined ? {} : { bone: other }),
        ...(link.target === undefined ? {} : { target: link.target }),
        slack: link.slack,
      };
      // Worn on the partner, the restraint leaves the binder's hand: the
      // carried phrase's closing hold on it is dropped with the grip.
      return {
        ...plan,
        holds: (plan.holds ?? []).filter(
          (hold: IAutoMovieMotionPropHold): boolean =>
            hold.prop !== context.params.prop,
        ),
        wears: (plan.wears ?? []).map(
          (wear: IAutoMovieMotionPropWear): IAutoMovieMotionPropWear =>
            wear.prop === context.params.prop ? { ...wear, link: bound } : wear,
        ),
      };
    },
  };
