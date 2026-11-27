import {
  AutoMovieEngineMotionSampling,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieMotionHumanChannel,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanMountRider,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSurface,
  IAutoMovieMotionTarget,
  IAutoMoviePose,
  IAutoMoviePoseResolution,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../../compose/internal/AutoMovieMotionHumanArm";
import { composeAutoMovieMotionHumanAction } from "../../../compose/internal/composeAutoMovieMotionHumanAction";
import { HumanRefusal } from "../../../law/HumanRefusal";
import { HumanBound } from "../../../law/internal/HumanBound";
import { HumanMountRider } from "../../../lexicon/internal/HumanMountRider";
import { HumanSurfaceGlide } from "../../internal/HumanSurfaceGlide";
import { pivotSurfaceFoot } from "../../internal/pivotSurfaceFoot";
import { admitSnowGlide } from "./admitSnowGlide";

/*
 * Turn on the selected ski edges or use a Nordic pole and opposite ski on the
 * shared glide. Alpine skiing measures a transfer across opposing edges during
 * the turn (https://doi.org/10.1371/journal.pone.0176975). The distinct Nordic
 * stroke follows the pole and opposite ski phases of Pellegrini et al. (2020,
 * Figure 2, https://pubmed.ncbi.nlm.nih.gov/32439501/). The authored glide
 * supplies speed and stopping. The pole's own prop motion supplies its moving
 * grip.
 * Parameter context: The entered stance and the authored snow technique.
 * Returns: The fitted glide and the named edge or pole transitions.
 * When the edge change or the pole support is
 * infeasible.
 */
export function planSnowGlide(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSurface.ISnowGlideParams>,
): IAutoMovieMotionHumanActionPlan {
  const transfer: IAutoMovieMotionHumanSurface.ISkiEdgeTransfer | undefined =
    context.params.edgeTransfer;
  const stroke: IAutoMovieMotionHumanSurface.INordicStroke | undefined =
    context.params.nordic;
  admitSnowGlide(context.params.duration, transfer, stroke);

  const base: IAutoMovieMotionHumanActionPlan = HumanSurfaceGlide.plan(context);
  if (transfer === undefined && stroke === undefined) return base;
  if (transfer !== undefined) {
    return {
      ...base,
      events: [
        ...base.events,
        { name: "edgeChange", share: transfer.at / base.duration },
      ].sort(byShare),
      posture: (at: number): IAutoMovieMotionHumanPosture => {
        const posture: IAutoMovieMotionHumanPosture = base.posture(at);
        const first: boolean = at <= transfer.at;
        const edge: IAutoMovieMotionHumanSurface.IBladeEdge = first
          ? transfer.first
          : transfer.next;
        const share: number = first
          ? at / transfer.at
          : (at - transfer.at) / (base.duration - transfer.at);
        const weight: number =
          AutoMovieEngineMotionSampling.minimumJerkShare(2 * share) *
          (1 - AutoMovieEngineMotionSampling.minimumJerkShare(2 * share - 1));
        const twist: number =
          transfer.counter * weight * Math.sign(edge.degrees);
        const chest: readonly [number, number, number] = posture.joints
          .chest ?? [0, 0, 0];
        return {
          ...posture,
          joints: {
            ...posture.joints,
            chest: [chest[0], chest[1], chest[2] - twist],
          },
          limbs: {
            ...posture.limbs,
            leftLeg: pivotSurfaceFoot(
              posture.limbs.leftLeg!,
              edge.pivots.left,
              FORWARD,
              edge.degrees * weight,
            ),
            rightLeg: pivotSurfaceFoot(
              posture.limbs.rightLeg!,
              edge.pivots.right,
              FORWARD,
              edge.degrees * weight,
            ),
          },
        };
      },
    };
  }
  if (stroke === undefined) return base;
  const { start: catchAt, end: release }: typeof stroke.window = stroke.window;
  HumanBound.within(
    "nordic.window.start",
    catchAt,
    0,
    base.duration,
    "s",
    "both",
  );
  HumanBound.within(
    "nordic.window.end",
    release,
    catchAt,
    base.duration,
    "s",
    "both",
  );
  HumanBound.within(
    "nordic.kick",
    stroke.kick,
    0,
    context.body.measure.shank,
    "m",
    "minimum",
  );
  const pole: IAutoMovieMotionHumanPropReader = context.prop(stroke.on);
  const named: IAutoMovieMotionTarget = {
    kind: "prop",
    subject: stroke.on,
    point: stroke.grip,
  };
  const affordance: IAutoMovieAffordance | undefined =
    pole.prop.affordances?.find(
      (item: IAutoMovieAffordance): boolean => item.id === stroke.grip,
    );
  const radius: number = (affordance?.aperture ?? 0) / 2;

  // A pole whose grip moves within it says where; a rigid pole carries its
  // rest point and handle frame on its displayed frame, as a rider's hands
  // read a carried handle (`HumanRideHands`).
  const read = (at: number): IAutoMovieMotionHumanMountRider.IHoldGrip => {
    const film: number = context.start + at;
    const moving: IAutoMovieMotionHumanProp.IPlacedPoint | undefined =
      pole.prop.point?.(stroke.grip, film);
    if (moving === undefined && !Object.hasOwn(pole.prop.points, stroke.grip))
      throw new HumanRefusal({
        kind: "affordance",
        axis: "nordic.grip",
        value: stroke.grip,
        feasible: {
          kind: "alternatives",
          values: Object.keys(pole.prop.points),
        },
        reason: `${stroke.on} has no point named ${stroke.grip}`,
        fix: "name one of the pole's grip points",
      });
    const contact: IAutoMovieMotionHumanProp.IPlacedPoint =
      moving ?? context.aim(named, film);
    const rotation: IAutoMovieQuaternion | undefined =
      moving?.rotation ??
      (affordance === undefined
        ? undefined
        : Quaternion.multiply(
            pole.frame(film).rotation,
            affordance.frame.rotation,
          ));
    return {
      point: contact.point,
      normal: contact.normal,
      radius,
      ...(rotation === undefined
        ? {}
        : { axis: Quaternion.rotateVector(rotation, HANDLE) }),
    };
  };
  read(catchAt);
  read(release);
  const leg: AutoMovieHumanLimb =
    stroke.hand === "left" ? "rightLeg" : "leftLeg";
  const duration: number = base.duration;
  const events: IAutoMovieMotionEvent[] = [
    ...base.events,
    { name: "poleCatch", share: catchAt / duration },
    { name: "poleRelease", share: release / duration },
  ].sort(byShare);

  // The glide with the opposite ski's kick through the pole phase.
  const kicked: IAutoMovieMotionHumanActionPlan = {
    ...base,
    events,
    contacts: [
      ...base.contacts,
      {
        part: `${stroke.hand}Hand`,
        kind: "grip",
        support: { kind: "prop", subject: stroke.on },
        from: catchAt / duration,
        to: release / duration,
      },
    ],
    posture: (
      at: number,
      channels?: readonly AutoMovieMotionHumanChannel[],
      resolution?: IAutoMoviePoseResolution.ISource,
      projection?: (pose: IAutoMoviePose) => IAutoMoviePose,
    ): IAutoMovieMotionHumanPosture => {
      const posture: IAutoMovieMotionHumanPosture = base.posture(
        at,
        channels,
        resolution,
        projection,
      );
      const foot: IAutoMovieHumanLimbGoal | undefined = posture.limbs[leg];
      if (foot === undefined) return posture;
      const amount: number =
        AutoMovieEngineMotionSampling.minimumJerkShare(
          (at - catchAt) / (release - catchAt),
        ) *
        (1 -
          AutoMovieEngineMotionSampling.minimumJerkShare(
            (at - release) / (duration - release),
          ));
      const kick: IAutoMovieVector3 = Quaternion.rotateVector(foot.rotation!, {
        x: 0,
        y: 0,
        z: -stroke.kick * amount,
      });
      return {
        ...posture,
        limbs: {
          ...posture.limbs,
          [leg]: {
            ...foot,
            point: Vector3.add(foot.point, kick),
            bend: Vector3.add(foot.bend, kick),
          },
        },
      };
    },
  };

  // The pole hand's whole stroke is one planned arm (the planner's
  // trajectory over the action, `AutoMovieMotionHumanArm.carried`): it
  // leaves its rest at the start, takes the grip by the catch, rides the
  // moving grip to the release and returns by the end. A grip goal solved
  // afresh at each second chose its elbow anew at each, and turned it over
  // between two of them.
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.carried({
    body: context.body,
    side: stroke.hand,
    from: 0,
    to: duration,
    rest: AutoMovieMotionHumanArm.angles(context.entry.pose, stroke.hand),
    weight: (at: number): number =>
      (catchAt > 0
        ? AutoMovieEngineMotionSampling.minimumJerkShare(at / catchAt)
        : 1) *
      (release < duration
        ? 1 -
          AutoMovieEngineMotionSampling.minimumJerkShare(
            (at - release) / (duration - release),
          )
        : 1),
    span: { start: 0, ready: catchAt, relax: release, end: duration },
    goal: (
      posture: IAutoMovieMotionHumanPosture,
      at: number,
    ): IAutoMovieHumanLimbGoal =>
      HumanMountRider.hold(context.body, stroke.hand, posture, read(at), 1, {})
        .arm,
  });
  const composed: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base: kicked,
      clock: AutoMovieMotionClock(
        duration,
        events.map(
          (event: IAutoMovieMotionEvent): IAutoMovieMotionClockInstant => ({
            name: event.name,
            seconds: event.share * duration,
          }),
        ),
      ),
      primitives: [arm],
    });
  // The glide writes the whole body: the composed arm is its own, not a
  // channel it leaves to a carrier.
  const { channels: _arm, ...written }: IAutoMovieMotionHumanActionPlan =
    composed;
  void _arm;
  return { ...kicked, ...written };
}
/*
 * The ski's local forward axis.
 */
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/*
 * The axis a handle is wrapped about: its affordance frame's local +X.
 */
const HANDLE: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };

/*
 * Emit simultaneous support events in chronological order.
 */
function byShare(
  left: IAutoMovieMotionEvent,
  right: IAutoMovieMotionEvent,
): number {
  return left.share - right.share;
}
