import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmObservation } from "../compose/AutoMovieMotionHumanArmObservation";
import { AutoMovieMotionHumanArmPlanned } from "../compose/AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { HumanArmTrajectory } from "../posture/HumanArmTrajectory";
import { HumanHand } from "../posture/HumanHand";
import { HumanHandShape } from "../posture/HumanHandShape";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { gesture } from "./gesture";
import type { gestureStroke } from "./gestureStroke";

/**
 * A gesture's hands: each moving hand's request on the stroke's goal and its
 * fingers' shape at a second, and the moving arms planned over the whole
 * gesture as one trajectory (`AutoMovieMotionHumanArmPlanned`).
 */
export namespace gestureHands {
  /** What the gesture is at a second before its arms: the posture, the hands' requests and the transport's share. */
  export interface IPrior {
    /** The posture before the arms. */
    posture: IHumanPosture;
    /** Each moving hand's request on the stroke's goal. */
    requests: AutoMovieMotionHumanArm.ISided[];
    /** The transport's share, 0 at rest and 1 on the stroke. */
    envelope: number;
  }

  /**
   * One moving hand at a second: its request on the stroke's goal, the hand
   * turned in its own palm's plane (mirrored for the left hand) and its
   * aimed digit pointed at the world's up or down, and its fingers from the
   * relaxed cascade to the gesture's shape by the transport's share.
   *
   * @param body The body.
   * @param posture The posture before the arms.
   * @param side The hand.
   * @param goal The stroke's goal for the hand.
   * @param p The gesture's turn, emblem and aim.
   * @param digit The aimed digit's direction in the hand's frame, when one is aimed.
   * @param elbow The effort's elbow modifier, degrees.
   * @param envelope The transport's share.
   * @returns The request and the fingers' joints.
   */
  export function hand(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    goal: gestureStroke.IHand,
    p: Pick<gesture.IParams, "turn" | "shape" | "aim">,
    digit: IAutoMovieVector3 | undefined,
    elbow: number,
    envelope: number,
  ): {
    request: AutoMovieMotionHumanArm.ISided;
    fingers: IHumanPosture["joints"];
  } {
    return prepared(body, side, p, digit, elbow, false).hand(posture, goal, envelope);
  }

  /**
   * Prepare one gesture hand's fixed palm turn and finger-shape readings.
   * Goal points, world rotations, elbow hints and finger curls remain live
   * inputs of the returned reader at every posture.
   *
   * @param body The immutable body used by this gesture plan.
   * @param side The moving hand.
   * @param p The gesture's fixed turn, emblem and digit aim.
   * @param digit The fixed emblem digit direction in the hand's frame.
   * @param elbow The fixed effort elbow modifier.
   * @returns Separate live-goal and finger readers producing fresh requests/triples; an optional caller-owned joint output avoids an intermediate finger map and is returned unchanged as the output identity.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Separates plan-invariant body/hand/shape configuration from current posture, hand goal, curl and envelope inputs and states fresh output ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same palm-plane turn, digit alignment, elbow-preset geometry and relaxed-to-working finger interpolation as hand; only the fixed axis turn and named finger-angle records are prepared.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One fixed turn/relaxed shape and one exact current surface/shape issued-row producer belong to the preparation; each first working shape compiles its finger entries. The complete reader creates a live request and calls the same finger writer that planned-arm playback can call alone.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves surface/shape choices, world goal, actual digit aiming, bend geometry, thumb curl exclusion and interpolation arithmetic without a frame sample or solved-pose cache.
   * @evidence contracts/development/implementation.md#efficient-algorithms Preparation builds fifteen relaxed/emblem joints and one optional quaternion. Each distinct working shape compiles fifteen entries once; finger reads write fifteen fresh triples directly when supplied a caller-owned joint record, and live-goal reads add their actual request without an intermediate finger map/copy or two fresh named-shape maps per frame.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed side, turn, emblem and body belong to one gesture plan. A genuine prepareSidedTarget row supplies fixed local-surface provenance to native planned goals only for this explicit prepared hand; its closed four-shape map shares exact named angle records, while changed posture, target, curl and envelope are recomputed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The gesture owns this reader, its body/configuration references, one relaxed/emblem record, one bounded issued-row/local-surface producer and at most four fifteen-entry shape tables until its plan is released; No current output map or goal is retained, and playback/seeking add no frame history.
   */
  export function prepare(
    body: IHumanBody,
    side: HumanHand.Side,
    p: Pick<gesture.IParams, "turn" | "shape" | "aim">,
    digit: IAutoMovieVector3 | undefined,
    elbow: number,
  ): IPrepared {
    return prepared(body, side, p, digit, elbow, true);
  }

  /** Cold hand reads retain raw rows; only explicit preparation issues fixed geometry. */
  function prepared(body: IHumanBody, side: HumanHand.Side,
    p: Pick<gesture.IParams, "turn" | "shape" | "aim">,
    digit: IAutoMovieVector3 | undefined, elbow: number, issue: boolean): IPrepared {
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
    const shapes: Map<HumanHand.Shape, readonly IFinger[]> = new Map();
    let target: { surface: HumanHand.Surface; shape: HumanHand.Shape;
      emit: ReturnType<typeof AutoMovieMotionHumanArmTarget.prepareSidedTarget> } | undefined;
    const fingers: IPrepared["fingers"] = (
      goal: Pick<gestureStroke.IHand, "shape" | "curl">,
      envelope: number,
      output?: IHumanPosture["joints"],
    ): IHumanPosture["joints"] => {
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
      const joints: IHumanPosture["joints"] = output ?? {};
      const askedCurl: number = emblem === undefined ? (goal.curl ?? 0) : 0;
      for (const entry of entries) {
        const curl: number = entry.curls ? askedCurl : 0;
        joints[entry.bone] = [
          entry.relaxed[0] + (entry.at[0] + curl - entry.relaxed[0]) * envelope,
          entry.at[1] * envelope,
          0,
        ];
      }
      return joints;
    };
    return {
      fingers,
      hand: (
        posture: IHumanPosture,
        goal: gestureStroke.IHand,
        envelope: number,
        output?: IHumanPosture["joints"],
      ): ReturnType<typeof hand> => {
        const turned: IAutoMovieQuaternion = turn === undefined
          ? goal.rotation
          : Quaternion.multiply(goal.rotation, turn);
        const surface: HumanHand.Surface = goal.surface;
        const shape: HumanHand.Shape = goal.shape;
        const point: IAutoMovieVector3 = goal.point;
        const rotation: IAutoMovieQuaternion = digit === undefined || p.aim === undefined
          ? turned : HumanHandShape.aim(turned, digit, p.aim.toward);
        const bend: IAutoMovieVector3 = goal.elbow === undefined
          ? AutoMovieMotionHumanBend.hang(body, posture, side, goal.out + elbow)
          : AutoMovieMotionHumanBend.arm(body, posture, side, goal.elbow, goal.out + elbow);
        let request: AutoMovieMotionHumanArm.ISided;
        if (issue) {
          if (target === undefined || target.surface !== surface || target.shape !== shape)
            target = { surface, shape,
              emit: AutoMovieMotionHumanArmTarget.prepareSidedTarget(body, side, surface, shape) };
          request = target.emit({ point, rotation, bend });
        } else request = { side, surface, shape, point, rotation, bend };
        return { request, fingers: fingers(goal, envelope, output) };
      },
    };
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
      posture: IHumanPosture,
      goal: gestureStroke.IHand,
      envelope: number,
      output?: IHumanPosture["joints"],
    ): ReturnType<typeof hand>;

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
      goal: Pick<gestureStroke.IHand, "shape" | "curl">,
      envelope: number,
      output?: IHumanPosture["joints"],
    ): IHumanPosture["joints"];
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
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve without the arm, one arm fit and the observation's arc samples, a few milliseconds, against the optimiser rounds a transport too short for its arc sent the plan to.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each end is measured once by its caller.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the request and the goal end with the call.
   */
  export function reaching(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    from: AutoMovieMotionHumanArm.IAngles,
    hand: IPrepared,
    goal: gestureStroke.IHand,
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
   * @param prior The gesture before its arms at a second, borrowing the planner's current FK3/ROM4 operation loans only for that synchronous query.
   * @param envelope The same transport share used by prior, without computing its geometry.
   * @param plan The arms' handover and span flag (`AutoMovieMotionHumanArmPlanned.planned`'s `plan`); absent, nothing is handed on and the span is not taken to stretch.
   * @returns Each arm's trajectory.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the planned span, entry/rest arms, complete frame producer and separate scalar envelope producer.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the existing coupled arm trajectory solver and exact hand-surface goals; each goal reads the complete gesture frame attached to the planner's unchanged before-posture identity.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One frame producer supplies the base posture and both hands, while each arm selects its own request and the envelope remains a scalar time law.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves every goal, trajectory constraint, authored timing and solver call; the separate envelope must be the same time law prior uses, and an unfamiliar posture falls back to the original pure producer.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each planner base read computes one complete gesture frame instead of repeating that geometry per goal and weight; each selected goal builds only its own arm goal, consuming genuine fixed local-surface metadata when its explicit prepared hand issued that row. Arbitrary unissued prior rows retain ordinary cold goal work, and trajectory optimization keeps its existing cost and precision.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Before forwards the planner's actual FK/ROM loans to the complete prior query; a local WeakMap shares its completed numeric frame only with goals receiving that exact posture object. No time key, changed posture or separate plan reuses a frame.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The planning call owns its local WeakMap and borrows current FK/ROM loans only while prior executes. Frames store numeric posture/requests/envelope, never those loans; the map ends with return/throw and trajectories retain solved waypoints only.
   */
  export function planned(
    body: IHumanBody,
    span: AutoMovieMotionHumanArmPlanned.ISpan,
    sides: readonly HumanHand.Side[],
    begin: Partial<Record<HumanHand.Side, AutoMovieMotionHumanArm.IAngles>>,
    rest: Partial<Record<HumanHand.Side, AutoMovieMotionHumanArm.IAngles>>,
    prior: (...args: Parameters<IHumanActionPlan["posture"]>) => IPrior,
    envelope: (seconds: number) => number,
    plan?: Parameters<typeof AutoMovieMotionHumanArmPlanned.planned>[4],
  ): Map<HumanHand.Side, HumanArmTrajectory.Trajectory> {
    // The planner passes the exact posture returned by before to each arm.
    // Keep that posture's hand requests with it, rather than evaluating the
    // complete two-hand gesture again for every goal and scalar weight.
    const frames: WeakMap<IHumanPosture, IPrior> = new WeakMap();
    return AutoMovieMotionHumanArmPlanned.planned(
      body,
      span,
      sides.map(
        (side: HumanHand.Side): AutoMovieMotionHumanArmPlanned.IPlanned => ({
          side,
          rest: begin[side]!,
          back: rest[side]!,
          goal: (posture: IHumanPosture, at: number): IHumanPosture.IGoal => {
            const before: IPrior = frames.get(posture) ?? prior(at);
            const request: AutoMovieMotionHumanArm.ISided =
              before.requests.find(
                (hand: AutoMovieMotionHumanArm.ISided): boolean =>
                  hand.side === side,
              )!;
            return AutoMovieMotionHumanArm.goal(body, side, request);
          },
          weight: envelope,
        }),
      ),
      (at: number, _channels?: Parameters<IHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IHumanActionPlan["posture"]>[2],
        projection?: Parameters<IHumanActionPlan["posture"]>[3]): IHumanPosture => {
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
   */
  export function written(
    posture: IHumanPosture,
    arms: ReadonlyMap<HumanHand.Side, HumanArmTrajectory.Trajectory>,
    seconds: number,
  ): IHumanPosture {
    const joints: IHumanPosture["joints"] = { ...posture.joints };
    const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
    for (const [side, trajectory] of arms) {
      const arm: ReturnType<HumanArmTrajectory.Trajectory> =
        trajectory(seconds);
      joints[`${side}UpperArm`] = arm.upper;
      joints[`${side}LowerArm`] = arm.lower;
      joints[`${side}Hand`] = arm.hand;
      delete limbs[`${side}Arm`];
    }
    return { ...posture, joints, limbs };
  }

  /** Fixed named finger angles and the original extra-curl eligibility. */
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
