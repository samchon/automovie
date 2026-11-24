import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanArmTrajectory,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEffort,
  IAutoMovieMotionHumanGesture,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmPlanned } from "../compose/AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanChannel as HumanChannels } from "../compose/AutoMovieMotionHumanChannel";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { HumanPhysics } from "../law/HumanPhysics";
import { HumanPreparedPlayback } from "../perform/HumanPreparedPlayback";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import type { gestureAdmit } from "./gestureAdmit";
import { gestureHands } from "./gestureHands";
import { gestureJoints } from "./gestureJoints";
import { gestureStroke } from "./gestureStroke";
import { handGoals } from "./handGoals";

/**
 * A gesture's planned posture (`gesture.plan`): the envelope that rises in the
 * preparation and falls in the retraction, a bow's pitch about the hips, the
 * posture before the arms with the head, shoulder and trunk angles and each
 * moving hand's request, the arms planned over the whole gesture as one
 * trajectory, and the plan with its prepared playback. Read from the plan's
 * context, Effort, phases, base and moving hands.
 *
 * @param scope What the gesture's plan is built from.
 * @returns The plan.
 */
export function gesturePlanned(
  scope: gesturePlanned.IScope,
): IAutoMovieMotionHumanActionPlan {
  const {
    context,
    p,
    body,
    mods,
    cycles,
    depth,
    sides,
    at0,
    begin,
    rest,
    hands,
    shapes,
    input,
    prepare,
    stroke,
    strokeEnd,
    retractAt,
    retract,
    duration,
    events,
    window,
    base,
    direct,
    claimed,
  }: gesturePlanned.IScope = scope;
  const weight: (t: number) => number = (t: number): number =>
    t < prepare
      ? minimumJerk.share(t / prepare)
      : t <= retractAt
        ? 1
        : 1 - minimumJerk.share((t - retractAt) / retract);

  // A bow: the trunk pitched about the hips by the transport's share of its
  // depth, the hips moved back by the balance shift solved at the deepest
  // pitch and scaled by the pitch's sine in between (`AutoMovieMotionHumanLean.bow`).
  const bowing: IAutoMovieMotionHumanPrimitive | undefined =
    p.kind === "bow"
      ? AutoMovieMotionHumanLean.bow(
          {
            body,
            standing: at0,
            peak: depth * mods.extent,
            from: 0,
            to: duration,
            weight,
          },
          window,
        )
      : undefined;
  const prior: (
    t: number,
    geometry?: boolean,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
  ) => gestureHands.IPrior = (
    t: number,
    geometry: boolean = true,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
  ): gestureHands.IPrior => {
    const read: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2] =
      resolution ?? prepareHumanPoseResolution();
    const envelope: number = weight(t);
    const u: number = Math.min(1, Math.max(0, (t - prepare) / stroke));
    let posture: IAutoMovieMotionHumanPosture = base.posture(
      t,
      undefined,
      read,
      projection,
    );
    if (bowing !== undefined) posture = bowing.write(posture, t);

    // Head, shoulder and trunk angles, added to what the stand holds.
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
    };
    if (direct.length !== 0)
      gestureJoints.add(joints, p.kind, u, cycles, envelope, mods.extent);

    const requests: IAutoMovieMotionHumanArmTarget.ISided[] = [];
    for (const side of sides) {
      if (!geometry) {
        hands[side]!.fingers(
          {
            shape: shapes[side]!,
            curl: gestureStroke.curl(p.kind, u, cycles, mods.extent),
          },
          envelope,
          joints,
        );
        continue;
      }
      const hand: IPlanPriorHand = hands[side]!.hand(
        posture,
        gestureStroke.hand(
          p.kind,
          side,
          u,
          cycles,
          input(posture, t, side, read),
        ),
        envelope,
        joints,
      );
      requests.push(hand.request);
    }
    return { posture: { ...posture, joints }, requests, envelope };
  };
  // The arms planned over the whole gesture as one trajectory, when the
  // gesture is planned, so no posture read plans them.
  const arms:
    | Map<AutoMovieHumanSide, IAutoMovieMotionHumanArmTrajectory.Played>
    | undefined =
    sides.length === 0
      ? undefined
      : gestureHands.planned(
          body,
          { start: 0, ready: prepare, relax: retractAt, end: duration },
          sides,
          begin,
          rest,
          (
            at: number,
            _channels?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[1],
            resolution?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[2],
            projection?: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >[3],
          ): gestureHands.IPrior => prior(at, true, resolution, projection),
          weight,
          // The gesture's span is its own, timed by its tempo.
          AutoMovieMotionHumanArmPlanned.together(
            context.handover,
            true,
            context.tempo,
          ),
        );

  const planned: IAutoMovieMotionHumanActionPlan = {
    duration,
    events,
    ...HumanPhysics.declared(context.params, window),
    contacts: base.contacts,

    // The hands the gesture moves, so a hand that holds a prop is refused it.
    ...(sides.length === 0 ? {} : { hands: sides }),
    ...(context.carrier === undefined
      ? {}
      : {
          enteredChannels: HumanChannels.ORDER.filter(
            (channel: AutoMovieMotionHumanChannel): boolean =>
              sides.some(
                (side: AutoMovieHumanSide): boolean =>
                  channel === `${side}Arm` || channel === `${side}Hand`,
              ),
          ),
          channels: HumanChannels.ORDER.filter(
            (c: AutoMovieMotionHumanChannel): boolean => claimed.has(c),
          ),
        }),
    posture: (seconds, _channels, resolution, projection) => {
      const t: number = Math.min(duration, Math.max(0, seconds));
      if (t > 0 && t < duration) return interior(t, resolution, projection);
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(resolution);
      const { posture, requests, envelope }: gestureHands.IPrior = prior(
        t,
        true,
        read,
        projection,
      );
      return arms === undefined
        ? posture
        : AutoMovieMotionHumanArm.carry(
            body,
            handGoals(body, posture, requests),
            t < prepare ? begin : rest,
            envelope,
            undefined,
            read,
            projection,
          );
    },
  };
  /**
   * Read fingers and the base at the actual second, then write the prepared
   * moving arms.
   */
  function interior(
    t: number,
    resolution: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    projection: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
  ): IAutoMovieMotionHumanPosture {
    const { posture }: gestureHands.IPrior = prior(
      t,
      false,
      resolution,
      projection,
    );
    return arms === undefined
      ? posture
      : gestureHands.written(posture, arms, t);
  }

  const exact: IAutoMovieMotionHumanActionPlan["posture"] = planned.posture;
  const bounds: readonly number[] = [
    0,
    prepare,
    strokeEnd,
    retractAt,
    duration,
  ];
  const sourcePlayback: IAutoMovieMotionHumanPlayback = {
    mode: "posture",
    phases: bounds.slice(0, -1).map((from, index) => ({
      from,
      to: bounds[index + 1]!,
      sample: (t, channels, resolution, projection) => ({
        posture:
          t === 0 || t === duration
            ? exact(t, channels, resolution, projection)
            : interior(t, resolution, projection),
      }),
    })),
  };
  HumanPreparedPlayback.attach(planned, body, sourcePlayback);
  return planned;
}

/** What a gesture's planned posture reads. */
export namespace gesturePlanned {
  /** What a gesture plan is built from. */
  export interface IScope {
    /** The action's context. */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGesture.IParams>;

    /** The action's parameters. */
    p: IAutoMovieMotionHumanGesture.IParams;

    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The Effort's modifiers. */
    mods: IAutoMovieMotionHumanEffort.IModifiers;

    /** The stroke's cycles (`gestureAdmit`). */
    cycles: gestureAdmit.IAdmitted["cycles"];

    /** A bow's depth, degrees (`gestureAdmit`). */
    depth: gestureAdmit.IAdmitted["depth"];

    /** The moving hands (`gestureAdmit`). */
    sides: gestureAdmit.IAdmitted["sides"];

    /** The body under the gesture at its start. */
    at0: IAutoMovieMotionHumanPosture;

    /** Each moving arm's angles at entry. */
    begin: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>
    >;

    /** Each moving arm's angles at rest. */
    rest: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>
    >;

    /** Each moving hand's prepared writer (`gestureHands.prepare`). */
    hands: Partial<
      Record<AutoMovieHumanSide, ReturnType<typeof gestureHands.prepare>>
    >;

    /** Each moving hand's shape. */
    shapes: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanHand.Shape>
    >;

    /**
     * A moving hand's stroke input at a second.
     *
     * @param base The posture under the hand.
     * @param seconds Seconds.
     * @param side The hand.
     * @param resolution The borrowed forward-kinematics source, if any.
     * @returns The stroke input.
     */
    input: (
      base: IAutoMovieMotionHumanPosture,
      seconds: number,
      side: AutoMovieHumanSide,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ) => gestureStroke.IInput;

    /** The preparation's seconds. */
    prepare: number;

    /** The stroke's seconds. */
    stroke: number;

    /** The stroke's end, seconds. */
    strokeEnd: number;

    /** The retraction's start, seconds. */
    retractAt: number;

    /** The retraction's seconds. */
    retract: number;

    /** The gesture's seconds. */
    duration: number;

    /** The plan's events. */
    events: IAutoMovieMotionHumanActionPlan["events"];

    /** The physical window. */
    window: HumanPhysics.Window;

    /** The body under the gesture. */
    base: IAutoMovieMotionHumanActionPlan;

    /** The direct bones the gesture's kind claims. */
    direct: readonly AutoMovieHumanoidBone[];

    /** The channels the gesture claims from its carrier. */
    claimed: Set<AutoMovieMotionHumanChannel>;
  }
}
/** The record of `IPlanPriorHand`'s site. */
type IPlanPriorHand = {
  request: IAutoMovieMotionHumanArmTarget.ISided;
  fingers: IAutoMovieMotionHumanPosture["joints"];
};
