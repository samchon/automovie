import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBindPartner,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionPropHold,
  IAutoMovieMotionPropWear,
} from "@automovie/interface";

import { armPhrase } from "../everyday/armPhrase";
import { HumanRefusal } from "../law/HumanRefusal";

/**
 * Bind another performer with a held restraint. The binder's hand carries the
 * restraint to the partner's region by the arm phrase that visits a target, the
 * fingers down and the palm turned in (the thumb ahead, clear of the binder's
 * own hips), and the restraint is worn on the bone under the region from the
 * phrase's stroke with the link: the partner's other region's bone, or a scene
 * target, and the slack. The performance then keeps the bound parts where they
 * were when the restraint went on (`HumanPerformanceBonds`) until a later grip
 * takes it off.
 */
export const bindPartner: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanBindPartner> =
  {
    name: "bindPartner",
    interrupts: {},
    plan: planBindPartner,
  };

/**
 * Bind another performer with a held restraint. The binder's hand carries the
 * restraint to the partner's region by the arm phrase that visits a target, the
 * fingers down and the palm turned in (the thumb ahead, clear of the binder's
 * own hips), and the restraint is worn on the bone under the region from the
 * phrase's stroke with the link: the partner's other region's bone, or a scene
 * target, and the slack. The performance then keeps the bound parts where they
 * were when the restraint went on (`HumanPerformanceBonds`) until a later grip
 * takes it off.
 */
function planBindPartner(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBindPartner>,
): IAutoMovieMotionHumanActionPlan {
  const link: IAutoMovieMotionHumanBindPartner.ILink = context.params.link;
  if ((link.region === undefined) === (link.target === undefined))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "link",
      value: link.region ?? "none",
      reason: "a binding links its region to exactly one other end",
      fix: "name either the partner's other region or a scene target",
    });
  if (!(link.slack >= 0))
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
  // The hand carries the restraint to the region in a neutral grip: the
  // fingers down and the palm turned in, so the thumb points ahead,
  // clear of the binder's own hips, as cuffs and ropes are put on wrists
  // from behind or beside, and the restraint is worn there from the
  // phrase's stroke, when the hand arrives.
  const side: AutoMovieHumanSide = context.params.side ?? "right";
  const phrase: IAutoMovieMotionHumanActionPlan = armPhrase.plan({
    ...context,
    params: {
      phrase: "visit",
      target: {
        kind: "person",
        subject: context.params.partner,
        region: context.params.region,
      },
      hand: side,
      facing: { fingers: "down", palm: "in" },
      held: context.params.prop,
      ...(context.params.point === undefined
        ? {}
        : { point: context.params.point }),
      ...(context.params.hold === undefined
        ? {}
        : { hold: context.params.hold }),
    },
  });
  const on: number = phrase.events.find(
    (event: IAutoMovieMotionEvent): boolean => event.name === "stroke",
  )!.share;
  const bound: IAutoMovieMotionPropWear.ILink = {
    ...(other === undefined ? {} : { bone: other }),
    ...(link.target === undefined ? {} : { target: link.target }),
    slack: link.slack,
  };
  // Worn on the partner, the restraint leaves the binder's hand: its
  // grip ends at the stroke and its closing hold is dropped.
  return {
    ...phrase,
    contacts: phrase.contacts.map(
      (
        window: IAutoMovieMotionHumanContactWindow,
      ): IAutoMovieMotionHumanContactWindow =>
        window.kind === "grip" &&
        window.support.kind === "prop" &&
        window.support.subject === context.params.prop
          ? { ...window, to: Math.min(window.to, on) }
          : window,
    ),
    holds: (phrase.holds ?? []).filter(
      (hold: IAutoMovieMotionPropHold): boolean =>
        hold.prop !== context.params.prop,
    ),
    wears: [
      ...(phrase.wears ?? []),
      {
        prop: context.params.prop,
        bone: worn,
        from: on,
        wearer: context.params.partner,
        link: bound,
      },
    ],
  };
}
