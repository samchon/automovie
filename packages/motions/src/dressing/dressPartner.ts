import type {
  AutoMovieHumanSide,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanDressPartner,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionPropHold,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { courseArmGoal } from "../compose/courseArmGoal";
import { armPhrase } from "../everyday/armPhrase";
import { HumanRefusal } from "../law/HumanRefusal";

/** How far up a region's normal must point for the item to be set down onto it from above: within 45 degrees of up. */
const UP: number = Math.SQRT1_2;

/**
 * Dress another performer (#4015). The dresser's hand carries the held item
 * to the partner's region by the arm phrase that visits a target, the item
 * is worn on the partner's bone under that region from the phrase's stroke,
 * when the hand arrives, and the hand's grip ends there and no hold is left
 * on the item, so custody passes
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
      // Whether the partner's region faces up, read where the partner is at the start.
      const upward: boolean =
        context.aim({ kind: "person", subject: params.partner, region: params.region }, context.start).normal.y > UP;
      const phrase: IAutoMovieMotionHumanActionPlan = armPhrase.plan({
        ...context,
        params: {
          phrase: "visit",
          target: {
            kind: "person",
            subject: params.partner,
            region: params.region,
          },
          side,
          // An item set onto a region facing up, as a crown does, is set down
          // from above it: the palm faces down and the fingers forward, so the
          // hand's frame is defined where the region's normal points up. On
          // any other region (a chest, a wrist) the palm lays it against the
          // region's own normal, the arm phrase's default.
          ...(upward ? { facing: { fingers: "forward", palm: "down" } } : {}),
          held: params.prop,
          ...(params.point === undefined ? {} : { point: params.point }),
          ...(params.hold === undefined ? {} : { hold: params.hold }),
        },
      });
      // The phrase writes the hand's goal at each second; the arm is laid as
      // one course on it (`courseArmGoal`), so no instant's fit takes another
      // branch. The partner's region is read where it stands at the start.
      const at: (name: string, otherwise: number) => number = (name: string, otherwise: number): number =>
        (phrase.events.find(
          (event: IAutoMovieMotionEvent): boolean => event.name === name,
        )?.share ?? otherwise / phrase.duration) * phrase.duration;
      const plan: IAutoMovieMotionHumanActionPlan = courseArmGoal({
        body: context.body,
        plan: phrase,
        side,
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
        span: {
          start: at("start", 0),
          ready: at("ready", 0),
          relax: at("relax", phrase.duration),
          end: at("end", phrase.duration),
        },
      });
      const worn: number = plan.events.find(
        (event: IAutoMovieMotionEvent): boolean => event.name === "stroke",
      )!.share;
      return {
        ...plan,
        // The item is worn from the stroke, not left held: the visit's
        // closing hold would take it back into the hand at the phrase's end.
        holds: (plan.holds ?? []).filter(
          (hold: IAutoMovieMotionPropHold): boolean => hold.prop !== params.prop,
        ),
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
