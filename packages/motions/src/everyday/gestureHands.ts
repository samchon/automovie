import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmPlanned } from "../compose/AutoMovieMotionHumanArmPlanned";
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
    return prepare(body, side, p, digit, elbow).hand(posture, goal, envelope);
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
   * @returns Separate live-goal and finger readers producing fresh requests and finger tuples.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Separates plan-invariant body/hand/shape configuration from current posture, hand goal, curl and envelope inputs and states fresh output ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same palm-plane turn, digit alignment, elbow-preset geometry and relaxed-to-working finger interpolation as hand; only the fixed axis turn and named finger-angle records are prepared.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One fixed turn and relaxed shape belong to the preparation; each first working shape compiles its finger entries. The complete reader creates a live request and calls the same finger writer that planned-arm playback can call alone.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves surface/shape choices, world goal, actual digit aiming, bend geometry, thumb curl exclusion and interpolation arithmetic without a frame sample or solved-pose cache.
   * @evidence contracts/development/implementation.md#efficient-algorithms Preparation builds fifteen relaxed/emblem joints and one optional quaternion. Each distinct working shape compiles fifteen entries once; finger reads allocate only fifteen fresh output triples, and live-goal reads add their actual request without two fresh named-shape maps per frame.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed side, turn, emblem and body belong to one gesture plan; its closed four-shape map shares only the exact named angle records, while changed posture, target, curl and envelope are recomputed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The gesture owns this reader, its body/configuration references, one relaxed/emblem record and at most four fifteen-entry shape tables until its plan is released; playback and seeking add no frame history.
   */
  export function prepare(
    body: IHumanBody,
    side: HumanHand.Side,
    p: Pick<gesture.IParams, "turn" | "shape" | "aim">,
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
    const shapes: Map<HumanHand.Shape, readonly IFinger[]> = new Map();
    const fingers: IPrepared["fingers"] = (
      goal: Pick<gestureStroke.IHand, "shape" | "curl">,
      envelope: number,
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
      const joints: IHumanPosture["joints"] = {};
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
      ): ReturnType<typeof hand> => {
        const turned: IAutoMovieQuaternion = turn === undefined
          ? goal.rotation
          : Quaternion.multiply(goal.rotation, turn);
        const request: AutoMovieMotionHumanArm.ISided = {
          side,
          surface: goal.surface,
          shape: goal.shape,
          point: goal.point,
          rotation: digit === undefined || p.aim === undefined
            ? turned
            : HumanHandShape.aim(turned, digit, p.aim.toward),
          bend: goal.elbow === undefined
            ? AutoMovieMotionHumanBend.hang(body, posture, side, goal.out + elbow)
            : AutoMovieMotionHumanBend.arm(body, posture, side, goal.elbow, goal.out + elbow),
        };
        return { request, fingers: fingers(goal, envelope) };
      },
    };
  }

  /**
   * One gesture hand's prepared geometry and independently writable fingers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes a complete live hand goal from finger shaping when a planned arm supplies the displayed geometry, with fresh output ownership.
   * @evidence contracts/development/design.md#principled-representation Separates current effector geometry from the hand's own clinical finger shape; both share one fixed plan preparation and the same finger interpolation owner.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Planning and endpoint gestures use hand, while playback of preplanned arms uses fingers without creating discarded world targets or bend hints.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the existing stroke goal's exact shape/curl fields and existing hand result; it contains no solved arm, target proxy, time sample or contact tolerance.
   */
  export interface IPrepared {
    /**
     * A live world-space hand request and fresh clinical finger triples for
     * the actual posture/goal at transport envelope [0,1].
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines current posture/goal, envelope range and fresh world-request/clinical-joint outputs for planning or endpoint carry.
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
    ): ReturnType<typeof hand>;

    /**
     * Fresh clinical finger joints from this actual shape/curl and envelope
     * [0,1], without requesting independent world hand geometry.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines shape/clinical-curl input, envelope range, fresh finger triples and independence from the world goal.
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
    ): IHumanPosture["joints"];
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
   * @returns Each arm's trajectory.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the planned span, entry/rest arms, complete frame producer and separate scalar envelope producer.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the existing coupled arm trajectory solver and exact hand-surface goals; each goal reads the complete gesture frame attached to the planner's unchanged before-posture identity.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One frame producer supplies the base posture and both hands, while each arm selects its own request and the envelope remains a scalar time law.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves every goal, trajectory constraint, authored timing and solver call; the separate envelope must be the same time law prior uses, and an unfamiliar posture falls back to the original pure producer.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each planner base read computes one complete gesture frame instead of repeating that geometry per goal and weight; each selected goal builds only its own arm goal. Trajectory optimization retains its existing cost and precision.
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
