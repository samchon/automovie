import { Quaternion, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanDressPartner,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionPropHold,
} from "@automovie/interface";

import { AutoMovieMotionHumanPartnerClear } from "../compose/AutoMovieMotionHumanPartnerClear";
import { courseArmGoal } from "../compose/courseArmGoal";
import { armPhrase } from "../everyday/armPhrase";
import { HumanTrunkLean } from "../handling/HumanTrunkLean";
import { requireOtherPerformer } from "../touch/requireOtherPerformer";

/**
 * How far up a region's normal must point for the item to be set down onto it
 * from above: within 45 degrees of up.
 */
const UP: number = Math.SQRT1_2;

/**
 * Dress another performer. The dresser's hand carries the held item to the
 * partner's region by the arm phrase that visits a target, the item is worn on
 * the partner's bone under that region from the phrase's stroke, when the hand
 * arrives, and the hand's grip ends there and no hold is left on the item, so
 * custody passes from the hand to the partner's body without a gap or an
 * overlap. The partner's region is read where it is at the phrase's start, so a
 * partner who presents a hand, bows or kneels first is met where they stand. A
 * region beyond the standing arm, such as a kneeling partner's crown, is
 * reached by the least hinge at the hips that brings the wrist within the arm
 * (`HumanTrunkLean`), so the dresser keeps its standoff; no hinge within the
 * hip's range is refused as a reach.
 */
function planDressPartner(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDressPartner>,
): IAutoMovieMotionHumanActionPlan {
  const params: IAutoMovieMotionHumanDressPartner = context.params;
  const side: AutoMovieHumanSide = params.side ?? "right";
  requireOtherPerformer(
    context.subject,
    params.partner,
    "a performer dresses itself with dress or wardrobe",
  );
  const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
    params.partner,
  );
  // Whether the partner's region faces up, read where the partner is at the start.
  const upward: boolean =
    context.aim(
      { kind: "person", subject: params.partner, region: params.region },
      context.start,
    ).normal.y > UP;
  const phrase: IAutoMovieMotionHumanActionPlan = armPhrase.plan({
    ...context,
    params: {
      phrase: "visit",
      target: {
        kind: "person",
        subject: params.partner,
        region: params.region,
      },
      hand: side,
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
  const at: (name: string, otherwise: number) => number = (
    name: string,
    otherwise: number,
  ): number =>
    (phrase.events.find(
      (event: IAutoMovieMotionEvent): boolean => event.name === name,
    )?.share ?? otherwise / phrase.duration) * phrase.duration;
  // A region beyond the standing arm, a kneeling partner's crown, is
  // reached by hinging at the hips rather than stepping in, so the
  // dresser keeps the standoff that clears the partner's body: the least
  // hinge that brings the wrist the phrase asks at its stroke within the
  // arm (`HumanTrunkLean`), eased in over the reach and out over the
  // return on the minimum-jerk profile. A region the standing arm
  // already reaches asks no hinge.
  const stroke: number = at("stroke", phrase.duration);
  const asked: IAutoMovieHumanLimbGoal | undefined =
    phrase.posture(stroke).limbs[`${side}Arm`];
  const forward: number =
    asked === undefined || asked.on !== undefined
      ? 0
      : HumanTrunkLean.least(context, [
          {
            side,
            point: asked.point,
            rotation: asked.rotation ?? Quaternion.identity(),
          },
        ]);
  const ready: number = at("ready", 0);
  const relax: number = at("relax", phrase.duration);
  const hinge: (seconds: number) => number = (seconds: number): number =>
    forward *
    (seconds <= relax
      ? minimumJerk.share(
          ready > 0 ? Math.min(1, Math.max(0, seconds / ready)) : 1,
        )
      : 1 -
        minimumJerk.share(
          Math.min(
            1,
            Math.max(0, (seconds - relax) / (phrase.duration - relax)),
          ),
        ));
  const leaned: IAutoMovieMotionHumanActionPlan =
    forward > 0
      ? {
          ...HumanTrunkLean.moving(phrase, forward),
          posture: (
            seconds: number,
            channels?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[1],
            resolution?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[2],
            projection?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[3],
          ): IAutoMovieMotionHumanPosture =>
            HumanTrunkLean.lean(
              context.body,
              phrase.posture(seconds, channels, resolution, projection),
              hinge(seconds),
            ),
        }
      : phrase;
  // The partner's body is the arm's obstacle as much as the dresser's
  // own: its posed segments at each second lie on the arm's goal
  // (`AutoMovieMotionHumanPartnerClear`), so the forearm passes over a
  // kneeling partner's head instead of through it.
  const cleared: IAutoMovieMotionHumanActionPlan = {
    ...leaned,
    posture: (
      seconds: number,
      channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture =>
      AutoMovieMotionHumanPartnerClear.onto(
        leaned.posture(seconds, channels, resolution, projection),
        `${side}Arm`,
        AutoMovieMotionHumanPartnerClear.at(partner, context.start + seconds),
      ),
  };
  const plan: IAutoMovieMotionHumanActionPlan = courseArmGoal({
    context,
    plan: cleared,
    side,
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
}

/**
 * Dress another performer. The dresser's hand carries the held item to the
 * partner's region by the arm phrase that visits a target, the item is worn on
 * the partner's bone under that region from the phrase's stroke, when the hand
 * arrives, and the hand's grip ends there and no hold is left on the item, so
 * custody passes from the hand to the partner's body without a gap or an
 * overlap. The partner's region is read where it is at the phrase's start, so a
 * partner who presents a hand, bows or kneels first is met where they stand. A
 * region beyond the standing arm, such as a kneeling partner's crown, is
 * reached by the least hinge at the hips that brings the wrist within the arm
 * (`HumanTrunkLean`), so the dresser keeps its standoff; no hinge within the
 * hip's range is refused as a reach.
 */
export const dressPartner: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanDressPartner> =
  {
    name: "dressPartner",
    interrupts: {},
    plan: planDressPartner,
  };
