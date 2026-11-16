import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { tags } from "typia";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanUnit } from "../law/HumanUnit";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { handGoals } from "./handGoals";
import { restGoals } from "./restGoals";

/**
 * Standing with the hands at rest places: in the front pockets, on the hips,
 * arms crossed, clasped in front or behind, behind the head, or the chin on
 * a fist, each hand moved there and held.
 *
 * Every rest place is an effector goal on the body's own surface: a hand
 * surface is laid on a region with the palm facing into it; the palm and
 * fist sockets lie on the hand's own collider surface, so a laid hand touches
 * the region rather than sinking into it ({@link HumanHand}). The places, with
 * the surface and region each uses:
 *
 * - `side`: no goal; the arm hangs relaxed as the stand law holds it.
 * - `pocket`: the palm on the front pocket region of the same side's thigh,
 *   fingers down, as a hand slipped into a front pocket shows from outside.
 * - `hip`: the palm on the side of the pelvis midway between the hip
 *   region and the waist, fingers forward and down, elbow out (akimbo).
 * - `crossed`: each palm lies on the front of the other upper arm three
 *   quarters of the way to its elbow, fingers round its outside, so the
 *   forearms cross in front of the lower chest. Each arm's pose depends on
 *   the other's goal, so both upper arms are set first: hanging forward at
 *   least 20 degrees (provisional) and enough for the forearms to clear the
 *   chest, the elbows drawn in until each palm lies one forearm from its own
 *   elbow; each elbow's hint is then that elbow, so the solved arms are the
 *   arms the palms were laid on.
 * - `claspedFront`: the left palm lies on the front of the pelvis, at the
 *   height a slightly flexed arm reaches, and the right palm on the back of
 *   the left hand; each hand continues its forearm (`restClasped`).
 * - `claspedBehind`: the back of the left hand rests on the sacrum, palm
 *   facing back, and the back of the right hand lies in the left palm
 *   (`restClasped`).
 * - `behindHead`: each palm on the back of the head beside the midline,
 *   elbows wide.
 * - `chinRest`: the top of the fist under the chin, fingers up and palm
 *   facing in, the elbow low and forward.
 * - `elbowSupport`: the palm under the other arm's elbow while that hand is
 *   at `chinRest`, the thinking pose.
 *
 * Each arm is carried in joint angles from where the entry left it to its
 * place on a minimum-jerk course (`AutoMovieMotionHumanArm.carry`), the
 * fingers taking the place's shape on the same course, over the free-space
 * time of the hand's distance
 * (`AutoMovieMotionHumanTiming.transport`) and holds there; the place follows the body,
 * so breathing and sway carry the hands with it. A hand at `side` is not
 * moved.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the goal, the method, the timing, the events and the refusals, with sources and provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table and a pure plan of postures in world metres and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters and the plan the performance dispatches through, plus the helpers its tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, hand and frame types; no body is special-cased.
 * @evidence contracts/development/implementation.md#principled-implementation Each place is an effector goal on the body's own surface, solved once by the shared inverse kinematics; the arm is carried to that solution in joint angles on a minimum-jerk course (a free arm movement is smooth in joint space, Soechting and Lacquaniti 1981) and the fingers take the place's shape on the same course. The body under it is the stand law's, or the carrier's when the rest is an overlay.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Plans the places, ordered moving sides and each arm's entry angles once; each posture is the base, the moving arm goals and one carry per moving arm.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Infeasible requests are refused with the feasible range instead of clamped; provisional constants are named and marked.
 * @evidence contracts/development/implementation.md#efficient-algorithms Per posture: one base posture, one fit per moving arm and its clearance in the carry; a rest without hand goals omits frame transforms and arm preparation, and nothing grows with the duration.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed goals, entry observations, moving-side order and finger-shape entries are prepared once per instance; every posture reads them while retaining fresh interpolated joint triples.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan's closures hold only the instance's own inputs and are released with the performance.
 */
export namespace rest {
  /** The action's name. */
  export const name: HumanActionName = "rest";

  /** A rest place. */
  export type Place =
    | "side"
    | "pocket"
    | "hip"
    | "crossed"
    | "claspedFront"
    | "claspedBehind"
    | "behindHead"
    | "chinRest"
    | "elbowSupport";

  /** Cancel table: holding a rest place has no stroke, so it can be cut anywhere. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
    walk: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    look: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
    gesture: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
    rest: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
  };

  /** A rest may be performed over a carrier: it claims the arms it places, with their hands. */
  export const overlay: boolean = true;

  /** Parameters. */
  export interface IParams {
    /** The left hand's place; `side` when absent. */
    left?: Place;

    /** The right hand's place; `side` when absent. */
    right?: Place;

    /** How long, seconds; 2 when absent. */
    seconds?: number & tags.ExclusiveMinimum<0> & HumanUnit<"s">;
  }

  /** Places that hold both hands together, so both hands must name them. */
  export const PAIRED: readonly Place[] = [
    "crossed",
    "claspedFront",
    "claspedBehind",
    "behindHead",
  ];

  /**
   * Plan a rest.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When a paired place names one hand only, or the time is not positive.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const places: Record<HumanHand.Side, Place> = {
      left: context.params.left ?? "side",
      right: context.params.right ?? "side",
    };
    for (const place of PAIRED)
      if ((places.left === place) !== (places.right === place))
        throw new HumanRefusal({
          kind: "parameter",
          axis: "rest",
          value: place,
          reason: `${place} holds both hands; name it for both`,
          fix: `name ${place} for both hands`,
        });
    for (const side of ["left", "right"] as const)
      if (
        places[side] === "elbowSupport" &&
        places[side === "left" ? "right" : "left"] !== "chinRest"
      )
        throw new HumanRefusal({
          kind: "parameter",
          axis: "rest",
          value: "elbowSupport",
          reason: `elbowSupport holds the other arm's elbow; the other hand must be at chinRest`,
          fix: "put the other hand at chinRest",
        });
    const duration: number = context.params.seconds ?? 2;
    HumanBound.above("seconds", duration, 0, "s");

    // The body under the rest: the carrier's when the rest is an overlay,
    // otherwise the stand law's.
    const base: IHumanActionPlan =
      context.carrier === undefined
        ? stand.plan({ ...context, params: { seconds: duration } })
        : AutoMovieMotionHumanBase.under(context, duration);
    const at0: IHumanPosture = base.posture(0);
    const frame0: HumanFrame.IFrame = { origin: at0.root, yaw: at0.yaw };

    // Goals, solved once in the performer's frame and carried by the body.
    const goals: Partial<Record<HumanHand.Side, IGoal>> = rest.goals(
      body,
      at0,
      places,
    );
    const sides: readonly HumanHand.Side[] = (["left", "right"] as const).filter(
      (side: HumanHand.Side): boolean => goals[side] !== undefined,
    );
    const requested: Set<AutoMovieHumanoidBone> = new Set();
    for (const side of sides)
      for (const bone of HumanHand.frameBones(body, side, goals[side]!.surface))
        requested.add(bone);
    const entry: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> | undefined =
      requested.size === 0 ? undefined : poseBones(body, context.entry.pose, undefined, requested);
    const begin: Partial<
      Record<
        HumanHand.Side,
        { angles: AutoMovieMotionHumanArm.IAngles; travel: number }
      >
    > = {};
    for (const side of sides) {
      const goal: IGoal = goals[side]!;
      const from: IAutoMovieVector3 = HumanHand.frame(
        body,
        entry!,
        side,
        goal.surface,
      ).point;
      begin[side] = {
        angles: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
        travel: Math.min(
          duration,
          AutoMovieMotionHumanTiming.transport(
            Vector3.length(Vector3.subtract(from, goal.point)),
          ),
        ),
      };
    }
    const local: Partial<Record<HumanHand.Side, IGoal>> = {};
    const reference: HumanFrame.IPrepared | undefined = sides.length === 0
      ? undefined : HumanFrame.prepare(frame0);
    const inverseTurn: IAutoMovieQuaternion | undefined = sides.length === 0
      ? undefined : HumanFrame.turn(-frame0.yaw);
    for (const side of sides) {
      const goal: IGoal = goals[side]!;
      local[side] = {
        ...goal,
        point: reference!.local(goal.point),
        rotation: Quaternion.multiply(
          inverseTurn!,
          goal.rotation,
        ),
        elbow: reference!.local(goal.elbow),
      };
    }
    const arrive: number = Math.max(
      0,
      ...Object.values(begin).map((b) => b!.travel),
    );
    const shapes: Partial<Record<HumanHand.Side, readonly [AutoMovieHumanoidBone, readonly [number, number, number]][]>> = {};
    for (const side of sides)
      shapes[side] = Object.entries(HumanHand.shape(side, local[side]!.shape)) as
        [AutoMovieHumanoidBone, readonly [number, number, number]][];

    return {
      duration,
      events: [{ name: "placed", share: arrive / duration }],
      contacts: base.contacts,

      // Over a carrier the rest takes the arms it places, with their hands.
      ...(context.carrier === undefined
        ? {}
        : {
            channels: AutoMovieMotionHumanChannel.ORDER.filter(
              (c: AutoMovieMotionHumanChannel): boolean =>
                sides.some(
                  (side: HumanHand.Side): boolean =>
                    (c === `${side}Arm` || c === `${side}Hand`),
                ),
            ),
          }),
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const posture: IHumanPosture = base.posture(t);
        if (sides.length === 0)
          return { ...posture, joints: { ...posture.joints } };
        const frame: HumanFrame.IFrame = {
          origin: posture.root,
          yaw: posture.yaw,
        };
        const turn: IAutoMovieQuaternion = HumanFrame.turn(frame.yaw);
        const joints: IHumanPosture["joints"] = { ...posture.joints };
        const requests: AutoMovieMotionHumanArm.ISided[] = [];
        const shares: [HumanHand.Side, number][] = [];
        for (const side of sides) {
          const goal: IGoal = local[side]!;
          const from: { angles: AutoMovieMotionHumanArm.IAngles; travel: number } = begin[side]!;
          const s: number = minimumJerk.share(t / from.travel);
          shares.push([side, s]);
          requests.push({
            side,
            surface: goal.surface,
            shape: goal.shape,
            point: HumanFrame.point(frame, goal.point),
            rotation: Quaternion.multiply(turn, goal.rotation),
            bend: HumanFrame.point(frame, goal.elbow),
          });
          // The fingers take the place's shape on the hand's own course, from
          // what the body under the rest holds them in.
          for (const [bone, angles] of shapes[side]!) {
            const was: readonly [number, number, number] = posture.joints[
              bone
            ] ?? [0, 0, 0];
            joints[bone] = [
              was[0] + (angles[0] - was[0]) * s,
              was[1] + (angles[1] - was[1]) * s,
              was[2] + (angles[2] - was[2]) * s,
            ];
          }
        }
        // Each arm is solved on its place and carried there in joint angles
        // from what the entry held (a free arm movement is smooth in joint
        // space, Soechting and Lacquaniti 1981), so no instant asks the fit
        // for a hand part way along a nearly straight arm, where the
        // elbow's side is ill-conditioned.
        let placed: IHumanPosture = handGoals(
          body,
          { ...posture, joints },
          requests,
        );
        for (const [side, s] of shares)
          if (begin[side] !== undefined)
            placed = AutoMovieMotionHumanArm.carry(
              body,
              placed,
              { [side]: begin[side].angles },
              s,
            );
        return placed;
      },
    };
  }

  /** A hand's rest goal in world metres. */
  export interface IGoal {
    /** The surface laid on the place. */
    surface: HumanHand.Surface;

    /** The hand shape. */
    shape: HumanHand.Shape;

    /** Where the surface goes, world metres. */
    point: IAutoMovieVector3;

    /** The hand's world rotation from rest. */
    rotation: IAutoMovieQuaternion;

    /** The elbow's bend hint, world metres. */
    elbow: IAutoMovieVector3;
  }

  /**
   * Both hands' rest goals on a posture ({@link restGoals}).
   *
   * @param body The body.
   * @param posture The standing posture.
   * @param places Each hand's place.
   * @returns The goals of the hands that move.
   * @throws {HumanRefusal} When the trunk has no surface where a clasp is laid.
   */
  export function goals(
    body: IHumanBody,
    posture: IHumanPosture,
    places: Record<HumanHand.Side, Place>,
  ): Partial<Record<HumanHand.Side, IGoal>> {
    return restGoals(body, posture, places);
  }
}
