import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanTendHorse,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanMountRider } from "./HumanMountRider";
import { HumanRideHands } from "./HumanRideHands";

/** Tasks whose hand closes on what it holds; the others lay the hand on a surface. */
const GRIPPED: ReadonlySet<IAutoMovieMotionHumanTendHorse.Task> =
  new Set<IAutoMovieMotionHumanTendHorse.Task>(["lead", "hoof"]);

/** The displayed hand's largest distance from its contact while fully held, metres: the rider attachment contract's 10 mm budget. */
const CONTACT: number = 0.01;

/**
 * A handler's hand on a horse's actual moving contact while the handler stands: brushing, headgear, lead, saddle and a held hoof.
 *
 * The action is an arm overlay: the carrier under it, a stand, a crouch or a walk, owns the handler's feet and trunk. One hand acquires the named contact over `transition` on a minimum-jerk share, holds it, and releases it over `transition`; the contact is read from the horse prop at each film second, so it follows the horse's own responses, such as a hoof the horse lifts. A brushing hand strokes back and forth along the contact's line, one stroke out and back over the hold. While fully held the displayed hand must lie within 10 mm of the contact's surface, or the action refuses: an unreachable care or tack placement is refused, never clamped.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the carrier, the acquire, hold and release, the moving contact, the stroke and the refusal.
 * @evidence contracts/development/design.md#principled-representation One arm-and-hand overlay over its carrier, declaring its touch or grip window.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Reuses the ride's tack-grip reader and hand fit; the horse's responses stay with the horse.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The hand follows the contact's actual frame and never moves the horse.
 */
export const HumanTendHorse: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanTendHorse> =
  {
    name: "tendHorse",
    overlay: true,
    interrupts: {},
    /**
     * Fit and verify the displayed hand against one of the horse's actual moving contacts.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines the carrier-owned stance, the held material point, the stroke, the authored phase and the typed refusals.
     * @evidence contracts/development/implementation.md#principled-implementation Read the contact's world frame at each second, add the stroke along its line, acquire and release by minimum jerk and fit the arm with the ride's hand fit; while fully held, measure the realized hand against the contact's surface.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit timing and contact, reuse the grip reader and finger closure, fit and measure per sample.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The carrier's stance is not moved to reach; a hand that cannot reach refuses instead of marking a false contact.
     * @evidence contracts/development/implementation.md#efficient-algorithms One contact read and one arm fit per sample; one selected-hand pose observation while fully held.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The ride's grip reader, finger closure and hand fit supply the hand.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the admitted contact reader, the closure and the carrier's plan for this action.
     */
    plan(
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTendHorse>,
    ): IAutoMovieMotionHumanActionPlan {
      const { on, side, point, task, seconds, transition } = context.params;
      const stroke: number = context.params.stroke ?? 0;
      if (
        ![seconds, transition, stroke].every(Number.isFinite) ||
        !(transition > 0 && 2 * transition < seconds && stroke >= 0) ||
        (stroke > 0 && task !== "brush")
      )
        throw new HumanRefusal({
          kind: "parameter",
          axis: "transition",
          value: transition,
          feasible: null,
          reason:
            "care needs positive acquire, hold and release intervals, and only a brush strokes",
          fix: "Give a transition shorter than half the total seconds and a nonnegative stroke for a brush only.",
        });
      const support: IAutoMovieMotionHumanPropReader = context.prop(on);
      if (support.prop.points[point] === undefined)
        throw new HumanRefusal({
          kind: "affordance",
          axis: "point",
          value: point,
          feasible: {
            kind: "alternatives",
            values: Object.keys(support.prop.points),
          },
          reason: `${on} has no contact ${point}`,
          fix: "Name one of the horse's contacts.",
        });
      if (context.carrier === undefined)
        throw new HumanRefusal({
          kind: "base",
          axis: "carrier",
          value: context.entry.base.kind,
          feasible: null,
          reason: "care needs a carrier that owns the handler's stance",
          fix: "Put tendHorse over an authored stand, crouch or walk that yields the requested arm and hand.",
        });
      const base: IAutoMovieMotionHumanActionPlan =
        AutoMovieMotionHumanBase.under(context, seconds);
      const { gripsAt, closures }: HumanRideHands.IHands = HumanRideHands.of(
        { ...context, params: { on, seconds, hands: { [side]: point } } },
        on,
        support,
        base.posture(0),
        support.frame(context.start),
        transition,
      );
      const channels = [`${side}Arm`, `${side}Hand`] as const;
      const wrist: AutoMovieHumanoidBone = `${side}Hand`;
      const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set([wrist]);
      // Every care contact is met by the body's measured palm frame, as a rein is: the palm seats on the contact's skin facing it.
      const palm: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(
        context.body,
        side,
        "palm",
      );
      const onShare: number = transition / seconds;
      const offShare: number = 1 - onShare;
      return {
        duration: seconds,
        channels,
        enteredChannels: channels,
        hands: [side],
        events: [
          { name: "careOn", share: onShare },
          { name: "careOff", share: offShare },
        ],
        contacts: [
          {
            part: `${side}Hand`,
            kind: GRIPPED.has(task) ? "grip" : "touch",
            from: onShare,
            to: offShare,
            support: { kind: "prop", subject: on },
          },
        ],
        posture(
          at,
          _channels,
          resolution,
          projection,
        ): IAutoMovieMotionHumanPosture {
          const time: number = Math.max(0, Math.min(seconds, at));
          const stance: IAutoMovieMotionHumanPosture = base.posture(
            time,
            undefined,
            resolution,
            projection,
          );
          const share: number = minimumJerk.share(
            Math.min(1, time / transition, (seconds - time) / transition),
          );
          if (share === 0) return stance;
          const film: number = context.start + time;
          const read: HumanRideHands.IMaterialGrip = gripsAt(
            film,
            support.frame(film),
          )[side]!;

          // One stroke out and back along the contact's line over the hold.
          const along: number =
            stroke === 0 || read.axis === undefined
              ? 0
              : (stroke / 2) *
                (1 -
                  Math.cos(
                    (2 * Math.PI * Math.max(0, time - transition)) /
                      (seconds - 2 * transition),
                  ));
          const grip: HumanRideHands.IMaterialGrip = {
            ...read,
            reinPalm: palm,
            point:
              along === 0
                ? read.point
                : Vector3.addScaled(read.point, read.axis!, along),
          };
          const hand: ReturnType<typeof HumanMountRider.hold> =
            HumanMountRider.hold(
              context.body,
              side,
              stance,
              grip,
              share,
              closures[side] ?? {},
              resolution,
              projection,
            );
          const shown: IAutoMovieMotionHumanPosture = {
            ...stance,
            limbs: { ...stance.limbs, [`${side}Arm`]: hand.arm },
            joints: { ...stance.joints, ...hand.fingers },
          };
          if (share === 1) {
            const reader: ReturnType<typeof prepareHumanPoseResolution> =
              prepareHumanPoseResolution(resolution);
            const pose: ReturnType<typeof resolveHumanPosture.seeded> =
              resolveHumanPosture.seeded(
                context.body,
                shown,
                undefined,
                undefined,
                reader,
                prepareHumanPoseResolution.isNativeSource(resolution)
                  ? requested
                  : undefined,
                projection,
              );
            const actual: IAutoMovieResolvedBone = poseBones(
              context.body,
              pose.pose,
              reader(),
              requested,
            ).get(wrist)!;
            const effector: IAutoMovieVector3 = Vector3.add(
              actual.worldPosition,
              Quaternion.rotateVector(
                actual.worldRotation,
                hand.arm.contact ?? palm.point,
              ),
            );
            const skin: IAutoMovieVector3 = Vector3.addScaled(
              grip.point,
              grip.normal,
              grip.radius ?? 0,
            );
            const distance: number = Vector3.distance(effector, skin);
            if (!(distance <= CONTACT))
              throw new HumanRefusal({
                kind: "affordance",
                axis: "careReach",
                value: distance,
                feasible: {
                  kind: "range",
                  minimum: 0,
                  maximum: CONTACT,
                  unit: "m",
                },
                reason: `the displayed ${side} palm at ${JSON.stringify(effector)} misses ${on}.${point} at ${JSON.stringify(skin)} by ${distance} m at film second ${film}`,
                fix: "Stand the handler within reach of the horse's contact.",
              });
          }
          return shown;
        },
      };
    },
  };
