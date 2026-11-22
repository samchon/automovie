import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionHumanBendLower,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRefusal,
  IAutoMovieVector3,
} from "@automovie/interface";

import { createHumanBody } from "../body/createHumanBody";
import { HumanPhysics } from "../law/HumanPhysics";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { hipJoints } from "../posture/hipJoints";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanBalance } from "./HumanBalance";
import { HumanTrunk } from "./HumanTrunk";

/** The body proportions fixed by the selected lowering strategy. */
interface IStrategyGeometry {
  readonly drop: number;
  readonly retreat: number;
  readonly deepest: number;
}

/** A current-pose root adjustment with the caller's synchronous FK source. */
type Lower = ReturnType<typeof lowerHumanPosture.prepare>;

/**
 * A standing body lowered toward a low target by a strategy, and the trunk
 * pitch that brings the shoulder within reach: the posture transforms the
 * bend law solves its reach and balance on, split from the law so each file
 * holds one responsibility.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is lowered and solved and who reads it.
 * @evidence contracts/development/design.md#principled-representation Pure posture transforms keyed by the bend law's concrete strategies, with their provisional shares as tables beside them.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two tables, the reach share, the search's named steps and bounds and three functions, read by the bend law, the crouch's heel lift and the pick-up's lowering.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No body or case is special-cased.
 */
export namespace bendLower {
  /** Wrist placement on the actual lowered bones from this trial. */
  export type WristAt = (posture: IAutoMovieMotionHumanPosture, read: ReturnType<typeof prepareHumanPoseResolution>) => IAutoMovieVector3;

  /** A named bend strategy after resolving the automatic choice. */
  type Strategy = IAutoMovieMotionHumanBendLower.ISolved["strategy"];

  /**
   * The knee flexion each strategy lifts at, degrees: a semi-squat's 90 and a
   * squat's 135, the knee angles that tell the lifting postures apart
   * (Washmuth, McAfee and Bickel 2022, Int J Sports Phys Ther 17:104), and a
   * stoop's 30, inside that classification's stoop, knees flexed under 45
   * degrees (the class is bounded, not measured at a value: 30 is provisional
   * within it).
   */
  export const KNEE: Readonly<Record<Strategy, number>> =
    {
      stoop: 30,
      semiSquat: 90,
      squat: 135,
    };

  /** The ankle's dorsiflexion in a crouch, degrees: the most measured while crouching, 28 +- 10 at a knee flexion of 149 +- 6 (Hyodo, Masuda, Aizawa, Jinno and Morita 2017, Braz J Phys Ther 21:159, electromagnetic tracking of 26 adults), within the range table's loaded maximum (`ANKLE_DORSIFLEXION.loaded`). */
  export const ANKLE: number = 28;

  /**
   * Stoop's posterior hip key as a share of stature. Kim and Yoo (2018,
   * doi:10.1589/jpts.30.534) measured 7.6 cm at the greater trochanter in
   * adults of 1.57 m mean stature and 17.4° mean thoracolumbar flexion.
   * The rig's lumbopelvic rhythm converts that local flexion to trunk
   * inclination. The ratio below scales the key on the existing sine course.
   */
  const STOOP_BACK: number =
    (0.076 / 1.57) /
    Math.sin((17.4 * Math.PI) / (180 * (HumanTrunk.RHYTHM.lumbar + HumanTrunk.RHYTHM.thorax)));

  /**
   * The share of the standing hip height a strategy keeps, from the body's
   * own leg: the knee flexed by the strategy's `KNEE`, split between the
   * shank's forward tilt and the thigh's, half each so the hip stays over the
   * ankle on a thigh and shank of nearly equal length (Winter, Biomechanics
   * and Motor Control of Human Movement, fig. 4.1: 0.245 and 0.246 of
   * stature), the shank's tilt no more than the crouching ankle's `ANKLE`
   * and the heel lift `HEEL` allow.
   *
   * @param body The body, for its ankle height, shank and thigh.
   * @param strategy The strategy.
   * @returns The share, in (0, 1].
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the geometry, its sources, the split rule and the result's range.
   * @evidence contracts/development/implementation.md#principled-implementation The hip's height over the floor is the ankle height plus each segment's length times the cosine of its tilt from the vertical; divided by the same chain straight, it is the share of the standing height.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression over the body's measures and the strategy's angles.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The knee angles are the cited classes', the ankle's the measured crouch's; no body is special-cased.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function hipShare(
    body: IAutoMovieMotionHumanBody,
    strategy: Strategy,
  ): number {
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const knee: number = KNEE[strategy];
    const shank: number = Math.min(knee / 2, ANKLE + HEEL[strategy]);
    const rad: number = Math.PI / 180;
    return (
      (m.ankleHeight + m.shank * Math.cos(shank * rad) + m.thigh * Math.cos((knee - shank) * rad)) /
      (m.ankleHeight + m.shank + m.thigh)
    );
  }

  /**
   * A standing posture lowered by a strategy: the hips dropped by a share of
   * the strategy's drop and moved back along its key, the trunk pitched, the
   * planted legs re-solved by their unchanged goals.
   *
   * @param body The body.
   * @param posture The standing posture.
   * @param strategy The strategy.
   * @param pitch Trunk inclination, degrees, shared by the lumbopelvic rhythm.
   * @param share How far down, 0 to 1.
   * @param back How far the hips move back, metres.
   * @param resolution Optional exact FK source borrowed only by this call's actual raw-pelvis hip observation; this lowering operation performs no ROM projection.
   * @returns The lowered posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is lowered, moved and pitched, each parameter's unit and range, and the squat's heel lift in the implementation comments.
   * @evidence contracts/development/implementation.md#principled-implementation Moves the hips' goal down by the strategy's share of the hip height and back by `back` in the posture's frame, inclines the trunk by the lumbopelvic rhythm with the pelvis limited by hip flexion (HumanTrunk.pelvisLimit), lifts a squat's heels about the ball (HumanFoot.pivot) with the toes bent to stay flat, and re-solves the planted legs, lowering the pelvis where a leg cannot reach.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One posture transform shared by the plan, the balance solve and the reach bisection; the inclination split, foot pivot and leg solve are imported from their owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The drop is `hipShare`'s, from the body's own leg at the cited knee angles; HEEL is a named provisional lift with no source found; no body or case is special-cased. The pelvis limit is read over the lifted ankles, so the hip stays within its flexion range and the foot holds its contact through the squat.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work: one trunk incline, at most two foot pivots and one leg-lowering solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A synchronous parent FK source may share exact raw-pelvis hip dependencies with the current evaluation; every current hip/root/plant and scalar lowering remains calculated, without a retained lowered pose or a new ROM policy.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new posture and retains nothing.
   */
  export function lower(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    strategy: Strategy,
    pitch: number,
    share: number,
    back: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    lateral: number = 0,
  ): IAutoMovieMotionHumanPosture {
    return current(body, posture, strategy, pitch, share, back, resolution, lateral);
  }

  /**
   * Bind a fixed body's strategy at selection. Each descent or return
   * sample still reads its standing pose, actual heel contact and hip FK.
   *
   * @param body The unchanged body supporting the lowering.
   * @param strategy The selected lowering strategy.
   * @returns A reader taking current standing posture, trunk degrees, movement share, posterior metres and optional FK and lateral degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed body, per-evaluation posture and angle, proportion and displacement units.
   * @evidence contracts/development/implementation.md#principled-implementation Keep the strategy's trigonometry and the planted legs' unchanged knee reach separate from current angles, foot pivots and hip positions.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Raw and prepared paths share the current-pose transform; only the canonical body's fixed measures are bound separately.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown bodies keep their live geometry. No frame, pose result, tolerance or changed contact enters preparation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Precompute fixed segment geometry once. Both phases use the original current-posture equations and the same actual ankle targets.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The body factory owns measure lifetime. Every actual sample supplies current hip FK, support and heading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One body and its strategy scalars live with the reader. Current angles, limbs and the synchronous FK source are never retained.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    strategy: Strategy,
  ): (
    posture: IAutoMovieMotionHumanPosture,
    pitch: number,
    share: number,
    back: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    lateral?: number,
  ) => IAutoMovieMotionHumanPosture {
    const native: boolean = createHumanBody.owns(body);
    const geometry: IStrategyGeometry | undefined = native ? {
      drop: hipDrop(body, strategy),
      retreat: retreat(body, strategy),
      deepest: strategy === "stoop" ? stoopReach(body) : 0,
    } : undefined;
    const lowerPlanted: Lower | undefined = native ? lowerHumanPosture.prepare(body) : undefined;
    return (posture, pitch, share, back, resolution, lateral = 0) =>
      current(body, posture, strategy, pitch, share, back, resolution, lateral, geometry, lowerPlanted);
  }

  /** Vertical movement at full depth, metres. */
  function hipDrop(body: IAutoMovieMotionHumanBody, strategy: Strategy): number {
    return (1 - hipShare(body, strategy)) * body.measure.hipHeight;
  }

  /** Sagittal movement at full depth with the strategy's shank tilt, metres. */
  function retreat(body: IAutoMovieMotionHumanBody, strategy: Strategy): number {
    const knee: number = KNEE[strategy];
    const shank: number = Math.min(knee / 2, ANKLE + HEEL[strategy]) * Math.PI / 180;
    return strategy === "stoop" ? 0 :
      body.measure.thigh * Math.sin(knee * Math.PI / 180 - shank) - body.measure.shank * Math.sin(shank);
  }

  /** The squared hip-to-ankle distance of the deepest stoop, square metres. */
  function stoopReach(body: IAutoMovieMotionHumanBody): number {
    const { thigh, shank }: IAutoMovieMotionHumanBody["measure"] = body.measure;
    return thigh * thigh + shank * shank + 2 * thigh * shank * Math.cos((KNEE.stoop * Math.PI) / 180);
  }

  /** Evaluate the current pivots and trunk against that second's actual stance. */
  function current(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    strategy: Strategy,
    pitch: number,
    share: number,
    back: number,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    lateral: number,
    fixed?: IStrategyGeometry,
    lowerPlanted?: Lower,
  ): IAutoMovieMotionHumanPosture {
    if (share <= 0 && pitch === 0 && back === 0) return posture;
    const hips: IAutoMovieVector3 = body.rest.get("hips")!;
    const drop: number = (fixed?.drop ?? hipDrop(body, strategy)) * share;
    // The same two links that set the hip height also set its sagittal
    // position over the planted ankle. Without the horizontal component
    // a squat asks its shank to tip farther forward than its ankle allows.
    const backAtDepth: number = fixed?.retreat ?? retreat(body, strategy);
    const frame: IAutoMovieMotionHumanFrame = { origin: posture.root, yaw: posture.yaw };
    const goal: IAutoMovieVector3 = HumanFrame.point(frame, {
      x: hips.x,
      y: hips.y - drop,
      z: hips.z - back - share * backAtDepth,
    });
    const level: IAutoMovieVector3 = Vector3.subtract(
      goal,
      HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
        hips,
      ),
    );
    // A squat deeper than the ankles' 20 degree dorsiflexion range lets the
    // heels rise, each foot turning about its toes' joint, the contact its
    // goal names (provisional heel lift).
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    const heel: number = HEEL[strategy] * share;
    if (heel > 0)
      for (const leg of ["leftLeg", "rightLeg"] as const) {
        const goal0: IAutoMovieHumanLimbGoal | undefined = posture.limbs[leg];
        if (goal0 === undefined || goal0.rotation === undefined) continue;
        const side: "left" | "right" = leg === "leftLeg" ? "left" : "right";
        const flat: IAutoMovieMotionHumanFoot.IPlacement = {
          ankle: goal0.point,
          rotation: goal0.rotation,
        };
        const lifted: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(
          body,
          side,
          "mtp",
          HumanFoot.point(body, side, "mtp", flat),
          HumanFoot.heading(goal0.rotation),
          -heel,
        );
        limbs[leg] = {
          ...goal0,
          point: lifted.ankle,
          rotation: lifted.rotation,
          contact: HumanFoot.offset(body, side, "mtp"),
        };
      }

    // The pelvis tilts by what the hips leave it over the ankles as the legs
    // will hold them: a lifted heel raises its ankle and folds the thigh
    // further, so the limit is read after the lift.
    const tilt: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
      posture.joints,
      pitch,
      HumanTrunk.pelvisLimit(body, level, posture.yaw, {
        left: limbs.leftLeg!.point,
        right: limbs.rightLeg!.point,
      }),
    );
    const tipped: IAutoMovieMotionHumanPosture = {
      ...posture,
      pitch: posture.pitch + tilt.pitch,
    };
    const joints: IAutoMovieMotionHumanPosture["joints"] = lateral === 0 ? tilt.joints : { ...tilt.joints };
    if (lateral !== 0) {
      // The lumbar and thoracic sections share the frontal inclination as
      // in a unilateral carry. Preserve each section's flexion and twist.
      for (const bone of ["spine", "chest"] as const) {
        const angles: NonNullable<typeof joints.spine> = joints[bone] ?? [0, 0, 0];
        joints[bone] = [angles[0], angles[1] + lateral * share / 2, angles[2]];
      }
    }

    // With the heels up the toes bend at their joints and stay flat on the floor.
    const toes: IAutoMovieMotionHumanPosture["joints"] =
      heel > 0 ? { leftToes: [heel, 0, 0], rightToes: [heel, 0, 0] } : {};
    let placed: IAutoMovieMotionHumanPosture = {
      ...tipped,
      joints: { ...joints, ...toes },
      limbs,
      root: Vector3.subtract(
        goal,
        Quaternion.rotateVector(resolveHumanPosture.heading(tipped), hips),
      ),
    };
    if (strategy === "stoop" && share > 0) {
      // The horizontal retreat also changes hip-to-ankle length. Recover
      // the key's knee height from the actual planted ankle. The length
      // between these keys starts at the standing leg's displayed length.
      const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(resolution);
      const standing: ReturnType<typeof hipJoints> = hipJoints(body, posture.root, resolveHumanPosture.heading(posture), posture.joints.hips, read());
      const lowered: ReturnType<typeof hipJoints> = hipJoints(body, placed.root, resolveHumanPosture.heading(placed), placed.joints.hips, read());
      const deepest: number = fixed?.deepest ?? stoopReach(body);
      const drop: number = Math.min(...(["left", "right"] as const).map((side: AutoMovieHumanSide): number => {
        const ankle: IAutoMovieVector3 = limbs[`${side}Leg`]!.point;
        const from: IAutoMovieVector3 = Vector3.subtract(standing[side], ankle);
        const current: IAutoMovieVector3 = Vector3.subtract(lowered[side], ankle);
        const initial: number = Vector3.dot(from, from);
        const height: number = initial + (deepest - initial) * share - current.x * current.x - current.z * current.z;
        return height < 0 ? -Infinity : current.y - Math.sqrt(height);
      }));
      if (Number.isFinite(drop)) placed = { ...placed, root: { ...placed.root, y: placed.root.y - drop } };
    }
    return lowerPlanted === undefined
      ? resolveHumanPosture.lower(body, placed, undefined, resolution)
      : lowerPlanted(placed, resolution);
  }

  /** Heel lift by strategy at full depth, degrees (provisional: only the squat outruns the ankle's dorsiflexion). */
  export const HEEL: Readonly<Record<Strategy, number>> =
    {
      stoop: 0,
      semiSquat: 0,
      squat: 30,
    };

  /**
   * The least trunk pitch that brings the shoulder within reach of the
   * target under a strategy, over 0 to `DEEPEST` degrees of inclination: the
   * first of every `SCAN` degrees that reaches, refined by bisection from the
   * one before.
   *
   * @param body The body.
   * @param posture The standing posture.
   * @param target The target.
   * @param side The hand.
   * @param strategy The strategy.
   * @param lean The balance shift per unit sine of the inclination, metres.
   * @param reach How near the shoulder must come to the target, metres; `REACH` of the arm plus the palm's offset when absent, a palm laid on the target.
   * @returns Degrees.
   * @throws {HumanRefusal} When even `DEEPEST` degrees leaves the target out of reach, with the lowest height the hand reaches above the target's floor point over the inclinations tried as the feasible range, or none when the point lies beyond the arm's reach across the floor at all of them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the quantity solved, the search range, the reach model and the refusal with its feasible height.
   * @evidence contracts/development/implementation.md#principled-implementation The gap between the shoulder-to-target distance and the arm's reach (`REACH` of upper arm plus forearm, near full extension, plus the palm offset), the shoulder read from the lowered trunk's forward kinematics, is scanned every `SCAN` degrees for the first inclination that closes it, then bisected between that one and the one before. The gap does not fall all the way: the shoulder swings down past a target at counter height, so the gap at the deepest inclinations opens again, and a bisection over the whole range would refuse a counter a slight lean reaches. Each shoulder within reach across the floor also gives the lowest height the hand reaches there, the reach sphere's bottom under it, kept for the refusal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One solve that reuses `lower` for the body and HumanTrunk for the shoulder.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The reach share is the measured `REACH` and the `DEEPEST` bound is a named provisional constant; an unreachable target is refused with what it can reach, not clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most 31 scanned and 30 bisected gap evaluations, each one lowered posture and one trunk forward-kinematics pass; the 30 steps bound the error below 5e-9 degrees.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each evaluation depends on its own inclination, so nothing repeats within a call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function pitch(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    target: IAutoMovieVector3,
    side: AutoMovieHumanSide,
    strategy: Strategy,
    lean: number,
    reach: number = REACH * (body.measure.upperArm + body.measure.forearm) +
      Vector3.length(HumanHand.offset(body, side, "palm").point),
    wristAt?: WristAt,
    lateral: number = 0,
  ): number {
    // The lowest height the hand reaches above the target's floor point over
    // the inclinations tried: below a shoulder within reach across the floor,
    // the reach's depth under it.
    const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
    const name: AutoMovieHumanoidBone = `${side}UpperArm`;
    const shoulderAt: ReturnType<typeof HumanTrunk.prepareResolve> = HumanTrunk.prepareResolve(body, new Set([name]));
    const lowerAt: ReturnType<typeof prepare> = prepare(body, strategy);
    let lowest: number = Infinity;
    const gap: (deg: number) => number = (deg: number): number => {
      const lowered: IAutoMovieMotionHumanPosture = lowerAt(
        posture,
        deg,
        1,
        lean * Math.sin((deg * Math.PI) / 180),
        read,
        lateral,
      );
      const shoulder: IAutoMovieVector3 = shoulderAt(lowered, read).get(name)!.worldPosition;
      const point: IAutoMovieVector3 = wristAt === undefined ? target : wristAt(lowered, read);
      const across: number = Math.hypot(point.x - shoulder.x, point.z - shoulder.z);
      if (across <= reach)
        lowest = Math.min(lowest, shoulder.y - Math.sqrt(reach * reach - across * across));
      return Vector3.distance(point, shoulder) - reach;
    };
    if (gap(0) <= 0) return 0;
    let hi: number = SCAN;
    while (hi <= DEEPEST && gap(hi) > 0) hi += SCAN;
    if (hi > DEEPEST) {
      const feasible: IAutoMovieMotionHumanRefusal.IRange = {
        kind: "range",
        minimum: lowest,
        maximum: null,
        unit: "m",
      };
      throw new HumanRefusal({
        kind: "reach",
        axis: "target",
        value: target.y,
        ...(lowest === Infinity ? {} : { feasible }),
        reason:
          lowest === Infinity
            ? `A ${strategy} cannot bring the hand over a point ${target.y.toFixed(3)} m high there: it lies beyond the arm's reach across the floor at every inclination`
            : `A ${strategy} cannot bring the hand down to a point ${target.y.toFixed(3)} m high there; the lowest it reaches there is ${lowest.toFixed(3)} m`,
        fix: "step closer to the target, or choose a deeper strategy",
      });
    }
    let lo: number = hi - SCAN;
    for (let i: number = 0; i < 30; i++) {
      const mid: number = (lo + hi) / 2;
      if (gap(mid) > 0) lo = mid;
      else hi = mid;
    }
    return hi;
  }

  /** The share of the arm (upper arm and forearm) a lowered or leaned body brings the shoulder within of its target, so the arm reaches near, not at, full extension: where people reaching as they like stop reaching with the arm alone and lean the trunk in, the preferred critical boundary, 0.89 of full-arm extension, the centre of the measured 0.83 to 0.95 (Petrovic 2012, Miami University dissertation, Experiment 1, Table 1 and Fig. 3, 10 seated adults: 0.92, 0.88 and 0.83 holding 300, 650 and 1000 g, SD 0.06 to 0.07; Mark et al. 1997, J Exp Psychol Hum Percept Perform 23:1365, and Stasik and Mark 2005: 0.95, as Petrovic reports them). The studies reach seated; no standing measure was found. `pitch` reads it, and a pick up's lift closes on it too. */
  export const REACH: number = 0.89;

  /** The step of the inclination scan `pitch` closes the reach on, degrees (provisional: fine enough that the gap, which turns once over the range, cannot close and open again between two steps). */
  export const SCAN: number = 5;

  /** The deepest trunk inclination `pitch` searches, degrees: all the pelvis can tilt before the hip passes its flexion (`HumanTrunk.HIP_FLEXION`) plus the 40 degrees of lumbar flexion at full forward bending (Esola et al. 1996, Spine 21:71), the most a standing trunk inclines. */
  export const DEEPEST: number = HumanTrunk.HIP_FLEXION + 40;

  /** An actual instant and its action event clock for a static lower-key query. */
  export interface IInstant {
    /** Absolute film second at the start of the observed action. */
    start: number;
    /** Local action second at which the lowering is read. */
    seconds: number;
    /** The actual action duration and its named event shares. */
    timing: Parameters<typeof HumanPhysics.prepare>[3];
    /** Resolver of any bound declared on another action or cue. */
    instant?: HumanPhysics.Instant;
  }

  /**
   * Find the least inclination whose moving shoulder reaches the wrist.
   * A low-level query describes one key; a caller observing it as part of a
   * longer action supplies the action's clock and local second. A free key
   * follows the measured stoop retreat or the squat's anchored leg geometry.
   *
   * @param balance Optional sagittal hip shift. Its weight scales only the
   * missing support displacement at the selected posture.
   * @param instant Action clock for the queried key. The standalone key's
   * start and end coincide at zero when absent.
   * @evidence contracts/development/implementation.md#principled-implementation Project the centre onto the actual support hull along the author's heading. Convert that hip translation into the sine-scaled retreat of the lowered key and solve its inclination again only if necessary.
   * @evidence contracts/development/implementation.md#efficient-algorithms A free or supported key needs one reach solve. Only an active, unsupported key asks for another at its corrected retreat.
   */
  export function solve(
    body: IAutoMovieMotionHumanBody,
    upright: IAutoMovieMotionHumanPosture,
    target: IAutoMovieVector3,
    side: AutoMovieHumanSide,
    strategy: Strategy,
    reach?: number,
    balance?: IAutoMovieMotionHumanBalance,
    wristAt?: WristAt,
    lateral: number = 0,
    instant?: IInstant,
  ): IAutoMovieMotionHumanBendLower.ISolved {
    let lean: number = strategy === "stoop" ? STOOP_BACK * body.measure.stature : 0;
    let deg: number = pitch(body, upright, target, side, strategy, lean, reach, wristAt, lateral);
    if (balance === undefined) return { strategy, lean, pitch: deg };
    const window: HumanPhysics.Window = HumanPhysics.prepare(
      { balance }, {}, instant?.start ?? 0, instant?.timing ?? { duration: 0, events: [] }, instant?.instant,
    );
    const weight: number = HumanPhysics.weightAt(window, instant?.seconds ?? 0);
    if (window === null || weight === 0) return { strategy, lean, pitch: deg };
    if (window.by !== "hips")
      throw new HumanRefusal({
        kind: "parameter", axis: "balance.by", value: window.by,
        reason: "a lowering key represents the hips' retreat along the standing heading",
        fix: "give hips for balance.by",
      });
    const sine: number = Math.sin(deg * Math.PI / 180);
    const key: IAutoMovieMotionHumanPosture = lower(body, upright, strategy, deg, 1, lean * sine, undefined, lateral);
    const support: IAutoMovieMotionHumanBalance.ISupport = HumanBalance.support(body, key);
    const shift: HumanPhysics.SupportOffset = HumanPhysics.supportOffset(support, HumanFrame.forward(key.yaw));
    if (sine !== 0 && shift !== null && shift !== 0) {
      lean -= weight * shift / sine;
      deg = pitch(body, upright, target, side, strategy, lean, reach, wristAt, lateral);
    }
    return { strategy, lean, pitch: deg };
  }
}
