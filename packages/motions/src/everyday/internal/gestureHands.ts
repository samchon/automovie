import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanArmTrajectory,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGesture,
  IAutoMovieMotionHumanGestureStroke,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmObservation } from "../../compose/internal/AutoMovieMotionHumanArmObservation";
import { AutoMovieMotionHumanArmPlanned } from "../../compose/internal/AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanArmPlayed } from "../../compose/internal/AutoMovieMotionHumanArmPlayed";
import { AutoMovieMotionHumanArmTarget } from "../../compose/internal/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { HumanHand } from "../../posture/internal/HumanHand";
import { HumanHandShape } from "../../posture/internal/HumanHandShape";

/**
 * A gesture's hands: each moving hand's request on the stroke's goal and its
 * fingers' shape at a second, and the moving arms planned over the whole
 * gesture as one trajectory (`AutoMovieMotionHumanArmPlanned`).
 */
export namespace gestureHands {
  /**
   * What the gesture is at a second before its arms: the posture, the hands'
   * requests and the transport's share.
   */
  export interface IPrior {
    /** The posture before the arms. */
    posture: IAutoMovieMotionHumanPosture;
    /** Each moving hand's request on the stroke's goal. */
    requests: IAutoMovieMotionHumanArmTarget.ISided[];
    /** The transport's share, 0 at rest and 1 on the stroke. */
    envelope: number;
  }

  /**
   * Prepare one gesture hand: its fixed palm turn and finger-shape tables, and
   * readers that turn a stroke goal into a hand request and fingers at each
   * posture. The request is turned in the hand's own palm plane (mirrored for
   * the left hand), its aimed digit pointed at the world's up or down, and the
   * fingers carried from the posture's own (the relaxed cascade where it holds
   * none) to the gesture's shape by the transport's share.
   *
   * @param body The body used by this gesture plan.
   * @param side The moving hand.
   * @param p The gesture's turn, emblem and digit aim.
   * @param digit The aimed digit's direction in the hand's frame, when one is
   *   aimed.
   * @param elbow The Effort's elbow modifier, a share of the upper arm added to
   *   the goal's outward elbow hint.
   * @param stroke The stroke's hand surface and shape, which its kind fixes.
   * @returns The hand and finger readers; an optional caller-owned joint record
   *   receives the fingers and is returned.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    p: Pick<IAutoMovieMotionHumanGesture.IParams, PrepareP>,
    digit: IAutoMovieVector3 | undefined,
    elbow: number,
    stroke: Pick<IAutoMovieMotionHumanGestureStroke.IHand, PrepareStroke>,
  ): IPrepared {
    const turn: IAutoMovieQuaternion | undefined =
      p.turn === undefined
        ? undefined
        : Quaternion.fromAxisAngle(
            { x: 0, y: -1, z: 0 },
            (side === "left" ? -1 : 1) * p.turn,
          );
    const relaxed: ReturnType<typeof HumanHand.shape> = HumanHand.shape(
      side,
      "relaxed",
    );
    const emblem: ReturnType<typeof HumanHand.shape> | undefined =
      p.shape === undefined ? undefined : HumanHandShape.emblem(side, p.shape);
    // The finger table of a goal's shape: the emblem's when one is given.
    const table = (
      shape: IAutoMovieMotionHumanHand.Shape,
    ): readonly IFinger[] => {
      const angles: ReturnType<typeof HumanHand.shape> =
        emblem ?? HumanHand.shape(side, shape);
      return (Object.keys(angles) as AutoMovieHumanoidBone[]).map(
        (bone: AutoMovieHumanoidBone): IFinger => ({
          bone,
          at: angles[bone]!,
          relaxed: relaxed[bone]!,
          curls: !bone.includes("Thumb") && emblem === undefined,
        }),
      );
    };
    // The stroke's own shape and surface, fixed by its kind, prepared here;
    // any other goal is read as it comes.
    const strokeFingers: readonly IFinger[] = table(stroke.shape);
    const target: IPrepareTarget = {
      surface: stroke.surface,
      shape: stroke.shape,
      emit: AutoMovieMotionHumanArmTarget.prepareSidedTarget(
        body,
        side,
        stroke.surface,
        stroke.shape,
      ),
    };
    const fingers: IPrepared["fingers"] = (
      goal: Pick<IAutoMovieMotionHumanGestureStroke.IHand, PrepareFingersGoal>,
      envelope: number,
      output?: IAutoMovieMotionHumanPosture["joints"],
    ): IAutoMovieMotionHumanPosture["joints"] => {
      const entries: readonly IFinger[] =
        goal.shape === stroke.shape ? strokeFingers : table(goal.shape);
      const joints: IAutoMovieMotionHumanPosture["joints"] = output ?? {};
      const askedCurl: number = emblem === undefined ? (goal.curl ?? 0) : 0;

      // From the hand the posture before the gesture holds (the relaxed
      // cascade where it holds no finger), so a hand an entry laid flat on
      // a thigh leaves and comes back flat, not curled into the thigh.
      for (const entry of entries) {
        const curl: number = entry.curls ? askedCurl : 0;
        const own: readonly [number, number, number] | undefined =
          joints[entry.bone];
        const flexion: number = own?.[0] ?? entry.relaxed[0];
        const spread: number = own?.[1] ?? 0;
        // The digit's own roll too (a thumb the entry turned), carried to the
        // shape's none: dropped, it would snap at the gesture's first frame.
        const twist: number = own?.[2] ?? 0;
        joints[entry.bone] = [
          flexion + (entry.at[0] + curl - flexion) * envelope,
          spread + (entry.at[1] - spread) * envelope,
          twist * (1 - envelope),
        ];
      }
      return joints;
    };
    return {
      fingers,
      hand: (
        posture: IAutoMovieMotionHumanPosture,
        goal: IAutoMovieMotionHumanGestureStroke.IHand,
        envelope: number,
        output?: IAutoMovieMotionHumanPosture["joints"],
      ): IHandRead => {
        const turned: IAutoMovieQuaternion =
          turn === undefined
            ? goal.rotation
            : Quaternion.multiply(goal.rotation, turn);
        const surface: IAutoMovieMotionHumanHand.Surface = goal.surface;
        const shape: IAutoMovieMotionHumanHand.Shape = goal.shape;
        const point: IAutoMovieVector3 = goal.point;
        const rotation: IAutoMovieQuaternion =
          digit === undefined || p.aim === undefined
            ? turned
            : HumanHandShape.aim(turned, digit, p.aim.toward);
        const bend: IAutoMovieVector3 =
          goal.elbow === undefined
            ? AutoMovieMotionHumanBend.hang(
                body,
                posture,
                side,
                goal.out + elbow,
              )
            : AutoMovieMotionHumanBend.arm(
                body,
                posture,
                side,
                goal.elbow,
                goal.out + elbow,
              );
        const emit: IPrepareTarget["emit"] =
          target.surface === surface && target.shape === shape
            ? target.emit
            : AutoMovieMotionHumanArmTarget.prepareSidedTarget(
                body,
                side,
                surface,
                shape,
              );
        return {
          request: emit({ point, rotation, bend }),
          fingers: fingers(goal, envelope, output),
        };
      },
    };
  }

  /**
   * One hand read at a second: the hand's request on the stroke's goal and the
   * fingers' joints.
   */
  export interface IHandRead {
    /** The hand's request on the stroke's goal. */
    request: IAutoMovieMotionHumanArmTarget.ISided;

    /** The fingers' clinical angles, degrees. */
    fingers: IAutoMovieMotionHumanPosture["joints"];
  }

  /** One gesture hand's prepared geometry and independently writable fingers. */
  export interface IPrepared {
    /**
     * A live world-space hand request and fresh clinical finger triples for the
     * actual posture/goal at transport envelope [0,1]. An optional owned output
     * receives/returns the same fresh triples instead of a new map.
     */
    hand(
      posture: IAutoMovieMotionHumanPosture,
      goal: IAutoMovieMotionHumanGestureStroke.IHand,
      envelope: number,
      output?: IAutoMovieMotionHumanPosture["joints"],
    ): IHandRead;

    /**
     * Fresh clinical finger joints from this actual shape/curl and envelope
     * [0,1], without requesting independent world hand geometry. Optional owned
     * output receives these fresh triples and is returned instead of a new
     * map.
     */
    fingers(
      goal: Pick<IAutoMovieMotionHumanGestureStroke.IHand, FingersGoal>,
      envelope: number,
      output?: IAutoMovieMotionHumanPosture["joints"],
    ): IAutoMovieMotionHumanPosture["joints"];
  }

  /**
   * The shortest transport that keeps one moving arm within the audit's travel
   * bound between an arm and the hand on a stroke goal
   * (`AutoMovieMotionHumanArmObservation.reachingGoal`), which the gesture's
   * preparation and retraction last at least: a time read off the hand's
   * straight distance alone asks an arm whose fingertips sweep a longer arc to
   * pass the bound on any path.
   *
   * @param body The body.
   * @param posture The posture before the arms the arm moves in.
   * @param side The moving hand.
   * @param from The arm at the transport's other end: the entry's or the
   *   rest's.
   * @param hand The hand's prepared geometry.
   * @param goal The stroke's goal at the transport's stroke end.
   * @param maximumSpeed Optional elbow and wrist travel limit in metres per
   *   second.
   * @returns Seconds.
   */
  export function reaching(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    from: IAutoMovieMotionHumanArmAngles.IAngles,
    hand: IPrepared,
    goal: IAutoMovieMotionHumanGestureStroke.IHand,
    maximumSpeed?: number,
  ): number {
    return AutoMovieMotionHumanArmObservation.reachingGoal(
      body,
      posture,
      side,
      from,
      AutoMovieMotionHumanArm.goal(
        body,
        side,
        hand.hand(posture, goal, 1).request,
      ),
      maximumSpeed,
    );
  }

  /**
   * The moving arms planned over the whole gesture as one trajectory: from the
   * entry's arms to the stroke's goals, held on them through the stroke, and on
   * to the rest arms, read off the gesture's own posture before its arms.
   *
   * @param body The body.
   * @param span The gesture's preparation start, stroke start, retraction start
   *   and end.
   * @param sides The moving hands.
   * @param begin Each arm at the entry.
   * @param rest Each arm at rest.
   * @param prior The gesture before its arms at a second, borrowing the
   *   planner's FK workspace and ROM projector for that call.
   * @param envelope The same transport share `prior` returns, read without
   *   building its geometry.
   * @param plan The arms' handover and span flag
   *   (`AutoMovieMotionHumanArmPlanned.planned`'s `plan`); absent, nothing is
   *   handed on and the span is not taken to stretch.
   * @returns Each arm's trajectory.
   */
  export function planned(
    body: IAutoMovieMotionHumanBody,
    span: IAutoMovieMotionHumanArmPlanned.ISpan,
    sides: readonly AutoMovieHumanSide[],
    begin: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>
    >,
    rest: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>
    >,
    prior: (
      ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
    ) => IPrior,
    envelope: (seconds: number) => number,
    plan?: Parameters<typeof AutoMovieMotionHumanArmPlanned.planned>[4],
  ): Map<AutoMovieHumanSide, IAutoMovieMotionHumanArmTrajectory.Played> {
    return AutoMovieMotionHumanArmPlanned.planned(
      body,
      span,
      sides.map(
        (
          side: AutoMovieHumanSide,
        ): IAutoMovieMotionHumanArmPlanned.IPlanned => ({
          side,
          rest: begin[side]!,
          back: rest[side]!,
          goal: (
            _posture: IAutoMovieMotionHumanPosture,
            at: number,
          ): IAutoMovieHumanLimbGoal => {
            const before: IPrior = prior(at);
            const request: IAutoMovieMotionHumanArmTarget.ISided =
              before.requests.find(
                (hand: IAutoMovieMotionHumanArmTarget.ISided): boolean =>
                  hand.side === side,
              )!;
            return AutoMovieMotionHumanArm.goal(body, side, request);
          },
          weight: envelope,
        }),
      ),
      (
        at: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture =>
        prior(at, undefined, resolution, projection).posture,
      plan,
    );
  }

  /**
   * A posture with the planned arms written as joints at a second.
   *
   * @param posture The posture before the arms.
   * @param arms Each arm's trajectory.
   * @param seconds The second.
   * @returns The posture.
   */
  export function written(
    posture: IAutoMovieMotionHumanPosture,
    arms: ReadonlyMap<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanArmTrajectory.Played
    >,
    seconds: number,
  ): IAutoMovieMotionHumanPosture {
    // Each planned arm, its hand's fingers as the plan plays them
    // (`AutoMovieMotionHumanArmPlayed.written`).
    let out: IAutoMovieMotionHumanPosture = posture;
    for (const [side, trajectory] of arms) {
      const arm: IAutoMovieMotionHumanArmTrajectory.IPlayed =
        trajectory(seconds);
      out = AutoMovieMotionHumanArmPlayed.written(out, side, arm, arm.digits);
    }
    return out;
  }

  /**
   * One finger joint's working and relaxed angles, and whether it takes a
   * stroke's extra curl.
   */
  interface IFinger {
    /** The digit joint receiving its fresh output triple. */
    bone: AutoMovieHumanoidBone;

    /** Working clinical angles, degrees. */
    at: readonly [number, number, number];

    /** Relaxed clinical angles, degrees. */
    relaxed: readonly [number, number, number];

    /** Whether this non-emblem finger accepts the stroke's extra flexion. */
    curls: boolean;
  }
}

/** The alternatives of `FingersGoal`'s site. */
type FingersGoal = "shape" | "curl";

/** The alternatives of `PrepareFingersGoal`'s site. */
type PrepareFingersGoal = "shape" | "curl";

/** The record of `IPrepareTarget`'s site. */
type IPrepareTarget = {
  surface: IAutoMovieMotionHumanHand.Surface;
  shape: IAutoMovieMotionHumanHand.Shape;
  emit: ReturnType<typeof AutoMovieMotionHumanArmTarget.prepareSidedTarget>;
};

/** The stroke fields a gesture hand is prepared on. */
type PrepareStroke = "surface" | "shape";

/** The alternatives of `PrepareP`'s site. */
type PrepareP = "turn" | "shape" | "aim";
