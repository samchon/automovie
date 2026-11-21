import type {
  AutoMovieHumanSide,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanDressPartner,
  IAutoMovieMotionHumanPerformerReader,
} from "@automovie/interface";

import { armPhrase } from "../everyday/armPhrase";
import { HumanRefusal } from "../law/HumanRefusal";

/**
 * Dress another performer (#4015). The dresser's hand carries the held item
 * to the partner's region by the arm phrase that visits a target, the item
 * is worn on the partner's bone under that region from the phrase's stroke,
 * when the hand arrives, and the hand's grip ends there, so custody passes
 * from the hand to the partner's body without a gap or an overlap. The
 * partner's region is read where it is at the phrase's start, so a partner
 * who presents a hand, bows or kneels first is met where they stand.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the carry, the custody change and when the target is read.
 * @evidence contracts/development/design.md#principled-representation A law over the shipped arm phrase with the wear record that names the partner as the wearer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Adds only the custody transfer; reach, timing and refusals are the arm phrase's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The item is never posed here; the performance carries it on the partner's bone.
 */
export const dressPartner: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanDressPartner> =
  {
    name: "dressPartner",
    interrupts: {},
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDressPartner>,
    ): IAutoMovieMotionHumanActionPlan => {
      const params: IAutoMovieMotionHumanDressPartner = context.params;
      const side: AutoMovieHumanSide = params.side ?? "right";
      if (params.partner === context.subject)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "partner",
          value: params.partner,
          reason: "a performer dresses itself with dress or wardrobe",
          fix: "name another performer as the partner",
        });
      const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
        params.partner,
      );
      const plan: IAutoMovieMotionHumanActionPlan = armPhrase.plan({
        ...context,
        params: {
          phrase: "visit",
          target: {
            kind: "person",
            subject: params.partner,
            region: params.region,
          },
          side,
          held: params.prop,
          ...(params.point === undefined ? {} : { point: params.point }),
          ...(params.hold === undefined ? {} : { hold: params.hold }),
        },
      });
      const worn: number = plan.events.find(
        (event: IAutoMovieMotionEvent): boolean => event.name === "stroke",
      )!.share;
      return {
        ...plan,
        contacts: plan.contacts.map(
          (
            window: IAutoMovieMotionHumanContactWindow,
          ): IAutoMovieMotionHumanContactWindow =>
            window.kind === "grip" &&
            window.support.kind === "prop" &&
            window.support.subject === params.prop
              ? { ...window, to: Math.min(window.to, worn) }
              : window,
        ),
        wears: [
          ...(plan.wears ?? []),
          {
            prop: params.prop,
            bone: partner.body.surfaces.regions[params.region].bone,
            from: worn,
            wearer: params.partner,
          },
        ],
      };
    },
  };
