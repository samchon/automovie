import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanTendHorse,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanGrip } from "../handling/HumanGrip";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanMountRider } from "./HumanMountRider";
import { HumanRideHands } from "./HumanRideHands";

/**
 * Tasks whose hand closes on what it holds; the others lay the hand on a
 * surface.
 */
const GRIPPED: ReadonlySet<IAutoMovieMotionHumanTendHorse.Task> =
  new Set<IAutoMovieMotionHumanTendHorse.Task>(["lead", "hoof"]);

/**
 * The displayed hand's largest distance from its contact while fully held,
 * metres: the rider attachment contract's 10 mm budget.
 */
const CONTACT: number = 0.01;

/**
 * Fit and verify the displayed hand against one of the horse's actual moving
 * contacts.
 */
function planHumanTendHorse(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTendHorse>,
): IAutoMovieMotionHumanActionPlan {
  const {
    on,
    side,
    point,
    task,
    duration: seconds,
    transition,
  } = context.params;
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
  const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
    context,
    seconds,
  );
  const { gripsAt, closures }: HumanRideHands.IHands = HumanRideHands(
    {
      ...context,
      params: { on, duration: seconds, hands: { [side]: point } },
    },
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
  const held: IHeldTool | undefined =
    context.params.tool === undefined
      ? undefined
      : heldTool(context, side, palm, context.params.tool);
  // A hand that holds a tool keeps the fingers it closed on the tool for
  // the whole action: the tool, not the horse's contact, is what they
  // grip, and opening them from the carrier's stance would drop the
  // grip's shape at the action's first instant.
  const gripped: IAutoMovieMotionHumanPosture["joints"] | undefined =
    context.params.tool === undefined
      ? undefined
      : HumanGrip.fingers(context.entry.pose, side);
  const onShare: number = transition / seconds;
  const toolGrip: IAutoMovieMotionHumanContactWindow[] =
    context.params.tool === undefined
      ? []
      : [
          {
            part: `${side}Hand`,
            kind: "grip",
            from: 0,
            to: 1,
            support: { kind: "prop", subject: context.params.tool.prop },
          },
        ];
  const offShare: number = 1 - onShare;
  // The law's goal: the hand on the horse's contact where the horse has
  // it at every second, the fingers closing and opening over the
  // transitions.
  const goals: IAutoMovieMotionHumanActionPlan = {
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
        // A care touch (brush, poll, stirrup, hoof) rests the hand on the horse without bearing weight; a held part is gripped.
        kind: GRIPPED.has(task) ? "grip" : "bear",
        ...(GRIPPED.has(task) ? {} : { load: 0 }),
        from: onShare,
        to: offShare,
        support: { kind: "prop", subject: on },
      },

      // A held tool stays gripped through the whole action and stays held after it.
      ...toolGrip,
    ],
    ...(context.params.tool === undefined
      ? {}
      : {
          holds: [
            {
              side,
              prop: context.params.tool.prop,
              from: 1,
              ...(context.entry.uses[side] === undefined
                ? {}
                : { use: context.entry.uses[side] }),
            },
          ],
        }),
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
      // A held tool's face lies `depth` beyond the palm along the palm's normal, so the palm stays that far off the contact.
      const surface: IAutoMovieVector3 =
        along === 0
          ? read.point
          : Vector3.addScaled(read.point, read.axis!, along);
      const grip: HumanRideHands.IMaterialGrip = {
        ...read,
        reinPalm: palm,
        point:
          held === undefined
            ? surface
            : Vector3.addScaled(surface, read.normal, held.depth),
      };
      const hand: ReturnType<typeof HumanMountRider.hold> =
        HumanMountRider.hold(
          context.body,
          side,
          stance,
          grip,
          1,
          closures[side] ?? {},
          resolution,
          projection,
        );
      const fingers: IAutoMovieMotionHumanPosture["joints"] = {
        ...gripped,
      };
      for (const [bone, closed] of gripped === undefined
        ? Object.entries(hand.fingers)
        : []) {
        if (closed === undefined) continue;
        const open: readonly [number, number, number] = stance.joints[
          bone as AutoMovieHumanoidBone
        ] ?? [0, 0, 0];
        fingers[bone as AutoMovieHumanoidBone] = [
          open[0] + (closed[0] - open[0]) * share,
          open[1] + (closed[1] - open[1]) * share,
          open[2] + (closed[2] - open[2]) * share,
        ];
      }
      const shown: IAutoMovieMotionHumanPosture = {
        ...stance,
        limbs: { ...stance.limbs, [`${side}Arm`]: hand.arm },
        joints: { ...stance.joints, ...fingers },
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

        // With a tool, the displayed working face must lie on the contact's surface; otherwise the palm must lie on its skin.
        const distance: number =
          held === undefined
            ? Vector3.distance(effector, skin)
            : Math.abs(
                Vector3.dot(
                  Vector3.subtract(
                    Vector3.add(
                      actual.worldPosition,
                      Quaternion.rotateVector(actual.worldRotation, held.face),
                    ),
                    Vector3.addScaled(surface, read.normal, read.radius ?? 0),
                  ),
                  read.normal,
                ),
              );
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

  // The arm reaches the horse, tends it and comes back on one planned
  // course from the arm the entry shows, so it never snaps at the
  // onset or the release.
  return courseArmGoal({
    context,
    plan: goals,
    side,
    span: {
      start: 0,
      ready: transition,
      relax: seconds - transition,
      end: seconds,
    },
  });
}

/**
 * A handler's hand on a horse's actual moving contact while the handler stands:
 * brushing, headgear, lead, saddle and a held hoof.
 *
 * The action is an arm overlay: the carrier under it, a stand, a crouch or a
 * walk, owns the handler's feet and trunk. One hand acquires the named contact
 * over `transition` on a minimum-jerk share, holds it, and releases it over
 * `transition`; the contact is read from the horse prop at each film second, so
 * it follows the horse's own responses, such as a hoof the horse lifts. A
 * brushing hand strokes back and forth along the contact's line, one stroke out
 * and back over the hold. While fully held the displayed hand must lie within
 * 10 mm of the contact's surface, or the action refuses: an unreachable care or
 * tack placement is refused, never clamped.
 */
export const HumanTendHorse: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanTendHorse> =
  {
    name: "tendHorse",
    overlay: true,
    interrupts: {},
    plan: planHumanTendHorse,
  };

/**
 * A held tool's working face in the holding hand's wrist frame, and how far
 * beyond the palm it lies.
 */
interface IHeldTool {
  /** The face's centre in the wrist frame, metres. */
  face: IAutoMovieVector3;

  /** The face's distance beyond the palm along the palm's normal, metres. */
  depth: number;
}

/**
 * Read where a held tool's working face sits in the holding hand, from the
 * displayed hand and tool where the action begins, as a put-down reads its held
 * offset.
 */
function heldTool(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTendHorse>,
  side: AutoMovieHumanSide,
  palm: IAutoMovieMotionHumanHand.IFrame,
  tool: IAutoMovieMotionHumanTendHorse.ITool,
): IHeldTool {
  const reader: IAutoMovieMotionHumanPropReader = context.prop(tool.prop);
  const face: IAutoMovieAffordance | undefined = reader.prop.affordances?.find(
    (contact: IAutoMovieAffordance): boolean => contact.id === tool.face,
  );
  if (face === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "tool",
      value: tool.face,
      feasible: null,
      reason: `${tool.prop} has no contact ${tool.face}`,
      fix: "Name the held tool's working contact.",
    });
  const hand: IAutoMovieResolvedBone = poseBones(
    context.body,
    context.entry.pose,
    undefined,
    new Set<AutoMovieHumanoidBone>([`${side}Hand`]),
  ).get(`${side}Hand`)!;
  const frame: IAutoMovieRigidTransform = reader.frame(context.start);
  const world: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, face.frame.translation),
  );
  const local: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(hand.worldRotation),
    Vector3.subtract(world, hand.worldPosition),
  );
  return {
    face: local,
    depth: Vector3.dot(Vector3.subtract(local, palm.point), palm.normal),
  };
}
