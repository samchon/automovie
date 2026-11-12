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

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import type { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
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
 * Each hand travels from where the entry left it to its place on a
 * minimum-jerk path over the free-space time of its distance
 * (`AutoMovieMotionHumanTiming.transport`) and holds there; the place follows the body,
 * so breathing and sway carry the hands with it. A hand at `side` is not
 * moved.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the goal, the method, the timing, the events and the refusals, with sources and provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table and a pure plan of postures in world metres and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters and the plan the performance dispatches through, plus the helpers its tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, hand and frame types; no body is special-cased.
 * @evidence contracts/development/implementation.md#principled-implementation Effector goals (sockets, footprints, the gaze line) solved by the shared inverse kinematics, with balance and timing from the cited laws.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Plans once, then evaluates each posture in closed form.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Infeasible requests are refused with the feasible range instead of clamped; provisional constants are named and marked.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per posture beyond a few forward-kinematics passes and limb fits.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan is computed once per instance and every posture reads it.
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

  /** Parameters. */
  export interface IParams {
    /** The left hand's place; `side` when absent. */
    left?: Place;

    /** The right hand's place; `side` when absent. */
    right?: Place;

    /** How long, seconds; 2 when absent. */
    seconds?: number;
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
    const base: IHumanActionPlan = stand.plan({
      ...context,
      params: { seconds: duration },
    });
    const at0: IHumanPosture = base.posture(0);
    const frame0: HumanFrame.IFrame = { origin: at0.root, yaw: at0.yaw };

    // Goals, solved once in the performer's frame and carried by the body.
    const goals: Partial<Record<HumanHand.Side, IGoal>> = rest.goals(
      body,
      at0,
      places,
    );
    const entry: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      context.entry.pose,
    );
    const begin: Partial<
      Record<
        HumanHand.Side,
        {
          point: IAutoMovieVector3;
          rotation: IAutoMovieQuaternion;
          travel: number;
        }
      >
    > = {};
    for (const side of ["left", "right"] as const) {
      const goal: IGoal | undefined = goals[side];
      if (goal === undefined) continue;
      const from: IAutoMovieVector3 = HumanHand.frame(
        body,
        entry,
        side,
        goal.surface,
      ).point;
      begin[side] = {
        point: HumanFrame.local(frame0, from),
        rotation: Quaternion.multiply(
          HumanFrame.turn(-frame0.yaw),
          entry.get(`${side}Hand`)!.worldRotation,
        ),
        travel: Math.min(
          duration,
          AutoMovieMotionHumanTiming.transport(
            Vector3.length(Vector3.subtract(from, goal.point)),
          ),
        ),
      };
    }
    const local: Partial<Record<HumanHand.Side, IGoal>> = {};
    for (const side of ["left", "right"] as const) {
      const goal: IGoal | undefined = goals[side];
      if (goal !== undefined)
        local[side] = {
          ...goal,
          point: HumanFrame.local(frame0, goal.point),
          rotation: Quaternion.multiply(
            HumanFrame.turn(-frame0.yaw),
            goal.rotation,
          ),
          elbow: HumanFrame.local(frame0, goal.elbow),
        };
    }
    const arrive: number = Math.max(
      0,
      ...Object.values(begin).map((b) => b!.travel),
    );

    return {
      duration,
      events: [{ name: "placed", share: arrive / duration }],
      contacts: base.contacts,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const posture: IHumanPosture = base.posture(t);
        const frame: HumanFrame.IFrame = {
          origin: posture.root,
          yaw: posture.yaw,
        };
        const turn: IAutoMovieQuaternion = HumanFrame.turn(frame.yaw);
        const joints: IHumanPosture["joints"] = { ...posture.joints };
        const requests: AutoMovieMotionHumanArm.ISided[] = [];
        for (const side of ["left", "right"] as const) {
          const goal: IGoal | undefined = local[side];
          const from = begin[side];
          if (goal === undefined || from === undefined) continue;
          const s: number = minimumJerk(t / from.travel).s;
          requests.push({
            side,
            surface: goal.surface,
            shape: goal.shape,
            point: HumanFrame.point(
              frame,
              Vector3.lerp(from.point, goal.point, s),
            ),
            rotation: Quaternion.multiply(
              turn,
              Quaternion.slerp(from.rotation, goal.rotation, s),
            ),
            bend: HumanFrame.point(frame, goal.elbow),
          });
          Object.assign(joints, HumanHand.shape(side, goal.shape));
        }
        return handGoals(body, { ...posture, joints }, requests);
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
