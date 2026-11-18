import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanBendLower,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRefusal,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPhysics } from "../law/HumanPhysics";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanBalance } from "./HumanBalance";
import { HumanTrunk } from "./HumanTrunk";

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
  /**
   * The knee flexion each strategy lifts at, degrees: a semi-squat's 90 and a
   * squat's 135, the knee angles that tell the lifting postures apart
   * (Washmuth, McAfee and Bickel 2022, Int J Sports Phys Ther 17:104), and a
   * stoop's 30, inside that classification's stoop, knees flexed under 45
   * degrees (the class is bounded, not measured at a value: 30 is provisional
   * within it).
   */
  export const KNEE: Readonly<Record<Exclude<IAutoMovieMotionHumanBend.Strategy, "auto">, number>> =
    {
      stoop: 30,
      semiSquat: 90,
      squat: 135,
    };

  /** The ankle's dorsiflexion in a crouch, degrees: the most measured while crouching, 28 +- 10 at a knee flexion of 149 +- 6 (Hyodo, Masuda, Aizawa, Jinno and Morita 2017, Braz J Phys Ther 21:159, electromagnetic tracking of 26 adults), within the range table's loaded maximum (`ANKLE_DORSIFLEXION.loaded`). */
  export const ANKLE: number = 28;

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
    strategy: Exclude<IAutoMovieMotionHumanBend.Strategy, "auto">,
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
   * the strategy's drop and moved back for balance, the trunk pitched, the
   * planted legs re-solved by their unchanged goals.
   *
   * @param body The body.
   * @param posture The standing posture.
   * @param strategy The strategy.
   * @param pitch Trunk inclination, degrees, shared by the lumbopelvic rhythm.
   * @param share How far down, 0 to 1.
   * @param back How far the hips move back for balance, metres.
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
    strategy: Exclude<IAutoMovieMotionHumanBend.Strategy, "auto">,
    pitch: number,
    share: number,
    back: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieMotionHumanPosture {
    const hips: IAutoMovieVector3 = body.rest.get("hips")!;
    const drop: number = (1 - hipShare(body, strategy)) * body.measure.hipHeight * share;
    const frame: IAutoMovieMotionHumanFrame = { origin: posture.root, yaw: posture.yaw };
    const goal: IAutoMovieVector3 = HumanFrame.point(frame, {
      x: hips.x,
      y: hips.y - drop,
      z: hips.z - back,
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
    const joints: IAutoMovieMotionHumanPosture["joints"] = tilt.joints;

    // With the heels up the toes bend at their joints and stay flat on the floor.
    const toes: IAutoMovieMotionHumanPosture["joints"] =
      heel > 0 ? { leftToes: [heel, 0, 0], rightToes: [heel, 0, 0] } : {};
    return resolveHumanPosture.lower(
      body,
      {
        ...tipped,
        joints: { ...joints, ...toes },
        limbs,
        root: Vector3.subtract(
          goal,
          Quaternion.rotateVector(resolveHumanPosture.heading(tipped), hips),
        ),
      },
      undefined,
      resolution,
    );
  }

  /** Heel lift by strategy at full depth, degrees (provisional: only the squat outruns the ankle's dorsiflexion). */
  export const HEEL: Readonly<Record<Exclude<IAutoMovieMotionHumanBend.Strategy, "auto">, number>> =
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
    strategy: Exclude<IAutoMovieMotionHumanBend.Strategy, "auto">,
    lean: number,
    reach: number = REACH * (body.measure.upperArm + body.measure.forearm) +
      Vector3.length(HumanHand.offset(body, side, "palm").point),
  ): number {
    // The lowest height the hand reaches above the target's floor point over
    // the inclinations tried: below a shoulder within reach across the floor,
    // the reach's depth under it.
    let lowest: number = Infinity;
    const gap: (deg: number) => number = (deg: number): number => {
      const lowered: IAutoMovieMotionHumanPosture = lower(
        body,
        posture,
        strategy,
        deg,
        1,
        lean * Math.sin((deg * Math.PI) / 180),
      );
      const shoulder: IAutoMovieVector3 = HumanTrunk.resolve(body, lowered).get(
        `${side}UpperArm`,
      )!.worldPosition;
      const across: number = Math.hypot(target.x - shoulder.x, target.z - shoulder.z);
      if (across <= reach)
        lowest = Math.min(lowest, shoulder.y - Math.sqrt(reach * reach - across * across));
      return Vector3.length(Vector3.subtract(target, shoulder)) - reach;
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
        axis: "toward",
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

  /** The inclination the first balance shift is solved at, degrees, before the needed one is known. A numerical starting point, not a body fact: the shift per sine it gives is used only to find the needed inclination, at which the shift is solved again unless that inclination is under `SHALLOW`. */
  export const NOMINAL: number = 60;

  /** The inclination under which the first balance shift is kept instead of solved again, degrees: one `SCAN` step, a numerical policy, under which the shift, which scales with the inclination's sine, is under a tenth of its value at `NOMINAL`. */
  export const SHALLOW: number = SCAN;

  /**
   * The lowering that brings a hand within reach of a target under a
   * strategy: the hips' balance shift found on the lowered posture at
   * `NOMINAL` degrees, the least inclination that reaches (`pitch`), and,
   * past `SHALLOW` degrees, the shift again at that inclination and the
   * inclination again with it.
   *
   * @param body The body.
   * @param upright The standing posture lowered.
   * @param target The target.
   * @param side The hand.
   * @param strategy The strategy.
   * @param reach How near the shoulder must come to the target, metres; `pitch`'s palm reach when absent.
   * @param balance The balancing shift asked (`IAutoMovieMotionHumanBalance`); absent, the hips are not shifted and one pitch solve is made.
   * @returns The solved lowering.
   * @throws {HumanRefusal} As `pitch`, when the strategy cannot reach the target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two passes, the inputs and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Without the balance option the inclination is the least that reaches with the hips where the strategy places them; with it the hips move back to keep the centre of mass over the feet (`HumanBalance.shift`), the inclination is the least that reaches with that shift, and the shift is solved again at the needed inclination, since it grows with the trunk's lean.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two balance solves and two pitch solves, in order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `NOMINAL` and `SHALLOW` are named provisional constants; nothing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms One pitch solve without the balance option; with it two balance scans and two pitch solves.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by the bend law and by the pick-up's own lowering, so both lower a body alike.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function solve(
    body: IAutoMovieMotionHumanBody,
    upright: IAutoMovieMotionHumanPosture,
    target: IAutoMovieVector3,
    side: AutoMovieHumanSide,
    strategy: Exclude<IAutoMovieMotionHumanBend.Strategy, "auto">,
    reach?: number,
    balance?: IAutoMovieMotionHumanBalance,
  ): IAutoMovieMotionHumanBendLower.ISolved {
    // Without the balance option the hips stay over the feet as the
    // strategy places them: no centre of mass is read, the lean is nought.
    if (!HumanPhysics.balanced({ balance }))
      return { strategy, lean: 0, pitch: pitch(body, upright, target, side, strategy, 0, reach) };
    const shift: (deg: number) => number = (deg: number): number =>
      HumanBalance.shift(
        body,
        (back: number): IAutoMovieMotionHumanPosture =>
          lower(body, upright, strategy, deg, 1, back),
      ) / Math.sin((deg * Math.PI) / 180);
    let lean: number = shift(NOMINAL);
    let deg: number = pitch(body, upright, target, side, strategy, lean, reach);
    if (deg > SHALLOW) {
      lean = shift(deg);
      deg = pitch(body, upright, target, side, strategy, lean, reach);
    }
    return { strategy, lean, pitch: deg };
  }
}
