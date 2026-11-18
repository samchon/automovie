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

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmObservation } from "../compose/AutoMovieMotionHumanArmObservation";
import { AutoMovieMotionHumanArmPlanned } from "../compose/AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanHand } from "../posture/HumanHand";
import { HumanHandShape } from "../posture/HumanHandShape";

/**
 * A gesture's hands: each moving hand's request on the stroke's goal and its
 * fingers' shape at a second, and the moving arms planned over the whole
 * gesture as one trajectory (`AutoMovieMotionHumanArmPlanned`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the namespace owns for a gesture's moving hands and who plans the arms.
 * @evidence contracts/development/design.md#principled-representation Hand requests in world metres and world rotations, finger angles in clinical degrees and trajectories over the gesture's seconds, over the shared arm-target and posture types.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The prepared hand, the arc bound, the planner call and the arm writer the gesture law reads, with the frame record they pass.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the arm-target, trajectory and posture types; no gesture or body is special-cased.
 */
export namespace gestureHands {
  /**
   * What the gesture is at a second before its arms: the posture, the hands' requests and the transport's share.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's meaning and the envelope's range.
   * @evidence contracts/development/design.md#principled-representation The posture before the arms, one world hand request per moving hand and a dimensionless share in [0, 1].
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three members the planner's frame producer returns and the gesture and brace laws build.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture and hand-request types.
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
   * Prepare one gesture hand: its fixed palm turn and finger-shape tables,
   * and readers that turn a stroke goal into a hand request and fingers at
   * each posture. The request is turned in the hand's own palm plane
   * (mirrored for the left hand), its aimed digit pointed at the world's up
   * or down, and the fingers carried from the posture's own (the relaxed
   * cascade where it holds none) to the gesture's shape by the transport's
   * share.
   *
   * @param body The body used by this gesture plan.
   * @param side The moving hand.
   * @param p The gesture's turn, emblem and digit aim.
   * @param digit The aimed digit's direction in the hand's frame, when one is aimed.
   * @param elbow The Effort's elbow modifier, a share of the upper arm added to the goal's outward elbow hint.
   * @returns The hand and finger readers; an optional caller-owned joint record receives the fingers and is returned.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is fixed per plan and what is read per posture, each input's unit and the output's ownership.
   * @evidence contracts/development/implementation.md#principled-implementation The palm-plane turn is a rotation about the hand's own long axis; the digit aim is HumanHandShape.aim; the elbow hint is the hanging or named preset of AutoMovieMotionHumanBend widened by the goal's and the Effort's shares; the fingers interpolate linearly from the posture's angles to the shape's by the share, the thumb and an emblem taking no extra curl.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The fixed turn and the relaxed and emblem shapes are built once; the hand reader builds a request and calls the same finger writer that planned-arm playback calls alone.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No frame sample or solved pose is kept; each read uses the goal and posture it is given.
   * @evidence contracts/development/implementation.md#efficient-algorithms Preparation builds the relaxed and emblem joints and at most one quaternion. Each working shape compiles its fifteen finger entries once; a finger read writes fifteen triples, into the caller's record when one is given.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The side, turn, emblem and body belong to one gesture plan, and the hand-surface row producer is rebuilt only when the goal's surface or shape changes; posture, target, curl and envelope are read afresh at every call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The gesture holds this reader, one relaxed and one emblem record, one row producer and at most four shape tables until its plan is released; no output or goal is retained.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    p: Pick<IAutoMovieMotionHumanGesture.IParams, "turn" | "shape" | "aim">,
    digit: IAutoMovieVector3 | undefined,
    elbow: number,
  ): IPrepared {
    const turn: IAutoMovieQuaternion | undefined = p.turn === undefined
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
    const shapes: Map<IAutoMovieMotionHumanHand.Shape, readonly IFinger[]> = new Map();
    let target: { surface: IAutoMovieMotionHumanHand.Surface; shape: IAutoMovieMotionHumanHand.Shape;
      emit: ReturnType<typeof AutoMovieMotionHumanArmTarget.prepareSidedTarget> } | undefined;
    const fingers: IPrepared["fingers"] = (
      goal: Pick<IAutoMovieMotionHumanGestureStroke.IHand, "shape" | "curl">,
      envelope: number,
      output?: IAutoMovieMotionHumanPosture["joints"],
    ): IAutoMovieMotionHumanPosture["joints"] => {
      let entries: readonly IFinger[] | undefined = shapes.get(goal.shape);
      if (entries === undefined) {
        const shape: ReturnType<typeof HumanHand.shape> =
          emblem ?? HumanHand.shape(side, goal.shape);
        entries = (Object.keys(shape) as AutoMovieHumanoidBone[]).map(
          (bone: AutoMovieHumanoidBone): IFinger => ({
            bone,
            at: shape[bone]!,
            relaxed: relaxed[bone]!,
            curls: !bone.includes("Thumb") && emblem === undefined,
          }),
        );
        shapes.set(goal.shape, entries);
      }
      const joints: IAutoMovieMotionHumanPosture["joints"] = output ?? {};
      const askedCurl: number = emblem === undefined ? (goal.curl ?? 0) : 0;

      // From the hand the posture before the gesture holds (the relaxed
      // cascade where it holds no finger), so a hand an entry laid flat on
      // a thigh leaves and comes back flat, not curled into the thigh.
      for (const entry of entries) {
        const curl: number = entry.curls ? askedCurl : 0;
        const own: readonly [number, number, number] | undefined = joints[entry.bone];
        const flexion: number = own?.[0] ?? entry.relaxed[0];
        const spread: number = own?.[1] ?? 0;
        joints[entry.bone] = [
          flexion + (entry.at[0] + curl - flexion) * envelope,
          spread + (entry.at[1] - spread) * envelope,
          0,
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
        const turned: IAutoMovieQuaternion = turn === undefined
          ? goal.rotation
          : Quaternion.multiply(goal.rotation, turn);
        const surface: IAutoMovieMotionHumanHand.Surface = goal.surface;
        const shape: IAutoMovieMotionHumanHand.Shape = goal.shape;
        const point: IAutoMovieVector3 = goal.point;
        const rotation: IAutoMovieQuaternion = digit === undefined || p.aim === undefined
          ? turned : HumanHandShape.aim(turned, digit, p.aim.toward);
        const bend: IAutoMovieVector3 = goal.elbow === undefined
          ? AutoMovieMotionHumanBend.hang(body, posture, side, goal.out + elbow)
          : AutoMovieMotionHumanBend.arm(body, posture, side, goal.elbow, goal.out + elbow);
        if (target === undefined || target.surface !== surface || target.shape !== shape)
          target = { surface, shape,
            emit: AutoMovieMotionHumanArmTarget.prepareSidedTarget(body, side, surface, shape) };
        return {
          request: target.emit({ point, rotation, bend }),
          fingers: fingers(goal, envelope, output),
        };
      },
    };
  }

  /**
   * One hand read at a second: the hand's request on the stroke's goal and the fingers' joints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both members and their units.
   * @evidence contracts/development/design.md#principled-representation A world hand request and clinical-degree finger angles.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two members the gesture law and `reaching` read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the hand-request and posture types.
   */
  export interface IHandRead {
    /** The hand's request on the stroke's goal. */
    request: IAutoMovieMotionHumanArmTarget.ISided;

    /** The fingers' clinical angles, degrees. */
    fingers: IAutoMovieMotionHumanPosture["joints"];
  }

  /**
   * One gesture hand's prepared geometry and independently writable fingers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes a complete live hand goal from finger shaping when a planned arm supplies the displayed geometry, with fresh triples and explicit optional caller-owned output maps.
   * @evidence contracts/development/design.md#principled-representation Separates current effector geometry from the hand's own clinical finger shape; both share one fixed plan preparation and the same finger interpolation owner.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Planning and endpoint gestures use hand, while playback of preplanned arms uses fingers without creating discarded world targets or bend hints.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the existing stroke goal's exact shape/curl fields and existing hand result; it contains no solved arm, target proxy, time sample or contact tolerance.
   */
  export interface IPrepared {
    /**
     * A live world-space hand request and fresh clinical finger triples for
     * the actual posture/goal at transport envelope [0,1]. An optional owned
     * output receives/returns the same fresh triples instead of a new map.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines current posture/goal, envelope range, fresh request/triples and optional caller-owned joint output, whose identity is returned without retention.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only; prepare owns actual palm turn, digit aim, bend and finger interpolation.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The declaration specifies one complete hand read; prepare supplies its implementation.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No body here can replace a hand goal, change a surface or skip an actual query.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Prepare documents the actual live-geometry and finger-writing costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The signature shares no result; prepare owns fixed hand metadata and every current input read.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration retains no pose/goal; prepare owns the reader's bounded plan lifetime.
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
     * output receives these fresh triples and is returned instead of a new map.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines actual shape/curl, envelope range, fresh triples, independence from the world goal and optional caller-owned output returned without retention.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only; prepare supplies the same actual relaxed-to-working interpolation as the complete hand reader.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Declares the finger-only read used when planned arms already supply displayed geometry.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The declaration contains no replacement surface, target, curl formula or solved arm.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Prepare documents the bounded named entries and fresh fifteen-joint writing cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Prepare owns shared named angle entries; this signature stores no interpolated answer.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The declaration retains no result or frame; prepare owns and releases its fixed metadata.
     */
    fingers(
      goal: Pick<IAutoMovieMotionHumanGestureStroke.IHand, "shape" | "curl">,
      envelope: number,
      output?: IAutoMovieMotionHumanPosture["joints"],
    ): IAutoMovieMotionHumanPosture["joints"];
  }

  /**
   * The shortest transport that keeps one moving arm within the audit's
   * travel bound between an arm and the hand on a stroke goal
   * (`AutoMovieMotionHumanArmObservation.reachingGoal`), which the gesture's
   * preparation and retraction last at least: a time read off the hand's
   * straight distance alone asks an arm whose fingertips sweep a longer arc
   * to pass the bound on any path.
   *
   * @param body The body.
   * @param posture The posture before the arms the arm moves in.
   * @param side The moving hand.
   * @param from The arm at the transport's other end: the entry's or the rest's.
   * @param hand The hand's prepared geometry.
   * @param goal The stroke's goal at the transport's stroke end.
   * @returns Seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the bound, the two ends, why the straight distance does not do, and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation The hand's request on the goal at full envelope, as the stroke asks it, made the arm's goal and measured by the observation the touch and hand-to-face laws time their transports by.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One request, one goal, one measurement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The arc is the arm's fitted blend, not a distance; the bound is the audit's own.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve without the arm, one arm fit and the observation's arc samples per end, at plan time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each end is measured once by its caller.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the request and the goal end with the call.
   */
  export function reaching(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    from: IAutoMovieMotionHumanArmAngles.IAngles,
    hand: IPrepared,
    goal: IAutoMovieMotionHumanGestureStroke.IHand,
  ): number {
    return AutoMovieMotionHumanArmObservation.reachingGoal(
      body,
      posture,
      side,
      from,
      AutoMovieMotionHumanArm.goal(body, side, hand.hand(posture, goal, 1).request),
    );
  }

  /**
   * The moving arms planned over the whole gesture as one trajectory: from
   * the entry's arms to the stroke's goals, held on them through the stroke,
   * and on to the rest arms, read off the gesture's own posture before its
   * arms.
   *
   * @param body The body.
   * @param span The gesture's preparation start, stroke start, retraction start and end.
   * @param sides The moving hands.
   * @param begin Each arm at the entry.
   * @param rest Each arm at rest.
   * @param prior The gesture before its arms at a second, borrowing the planner's FK workspace and ROM projector for that call.
   * @param envelope The same transport share `prior` returns, read without building its geometry.
   * @param plan The arms' handover and span flag (`AutoMovieMotionHumanArmPlanned.planned`'s `plan`); absent, nothing is handed on and the span is not taken to stretch.
   * @returns Each arm's trajectory.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the planned span, the entry and rest arms, the frame producer and the separate envelope.
   * @evidence contracts/development/implementation.md#principled-implementation The coupled arm trajectory solver of `AutoMovieMotionHumanArmPlanned`, each arm's goal the gesture's hand request for that arm at the planner's posture.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One frame producer supplies the base posture and both hands' requests, each arm selects its own request, and the envelope stays a scalar time law.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every goal, constraint and timing is the gesture's; the envelope must be the time law `prior` uses. Limitation: the planner asks for the posture and then for each arm's goal on it separately, so the frame `prior` built for that posture is kept with it in a WeakMap local to this call, keyed by the posture object, and a posture the planner did not produce is rebuilt by `prior`; passing the frame to the goal belongs to the planner's interface.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each planner posture read builds one gesture frame, which both arms' goals read instead of rebuilding it; trajectory optimisation costs what the planner states.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A frame is shared only with goals asked on the very posture object it built; no time key or other plan reuses it.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The WeakMap is local to the planning call and holds numeric frames only; it is released when planning returns or throws, and the trajectories keep their solved waypoints only.
   */
  export function planned(
    body: IAutoMovieMotionHumanBody,
    span: IAutoMovieMotionHumanArmPlanned.ISpan,
    sides: readonly AutoMovieHumanSide[],
    begin: Partial<Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>>,
    rest: Partial<Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>>,
    prior: (...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>) => IPrior,
    envelope: (seconds: number) => number,
    plan?: Parameters<typeof AutoMovieMotionHumanArmPlanned.planned>[4],
  ): Map<AutoMovieHumanSide, IAutoMovieMotionHumanArmTrajectory.Trajectory> {
    // The planner passes the exact posture returned by before to each arm.
    // Keep that posture's hand requests with it, rather than evaluating the
    // complete two-hand gesture again for every goal and scalar weight.
    const frames: WeakMap<IAutoMovieMotionHumanPosture, IPrior> = new WeakMap();
    return AutoMovieMotionHumanArmPlanned.planned(
      body,
      span,
      sides.map(
        (side: AutoMovieHumanSide): IAutoMovieMotionHumanArmPlanned.IPlanned => ({
          side,
          rest: begin[side]!,
          back: rest[side]!,
          goal: (posture: IAutoMovieMotionHumanPosture, at: number): IAutoMovieHumanLimbGoal => {
            const before: IPrior = frames.get(posture) ?? prior(at);
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
      (at: number, _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3]): IAutoMovieMotionHumanPosture => {
        const before: IPrior = prior(at, undefined, resolution, projection);
        frames.set(before.posture, before);
        return before.posture;
      },
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is written and from what.
   * @evidence contracts/development/implementation.md#principled-implementation Each planned arm's upper arm, forearm and hand angles at the second replace the posture's, and the arm's limb goal is dropped, since the joints now hold the arm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the planned arms.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fit or correction: the trajectory is the planner's.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trajectory read and three joint writes per arm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure write with nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new posture and retains nothing.
   */
  export function written(
    posture: IAutoMovieMotionHumanPosture,
    arms: ReadonlyMap<AutoMovieHumanSide, IAutoMovieMotionHumanArmTrajectory.Trajectory>,
    seconds: number,
  ): IAutoMovieMotionHumanPosture {
    const joints: IAutoMovieMotionHumanPosture["joints"] = { ...posture.joints };
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    for (const [side, trajectory] of arms) {
      const arm: ReturnType<IAutoMovieMotionHumanArmTrajectory.Trajectory> =
        trajectory(seconds);
      joints[`${side}UpperArm`] = arm.upper;
      joints[`${side}LowerArm`] = arm.lower;
      joints[`${side}Hand`] = arm.hand;
      delete limbs[`${side}Arm`];
    }
    return { ...posture, joints, limbs };
  }

  /** One finger joint's working and relaxed angles, and whether it takes a stroke's extra curl. */
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
