import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanBalance } from "./HumanBalance";
import { HumanTrunk } from "./HumanTrunk";
import type { bend } from "./bend";

/**
 * A standing body lowered toward a low target by a strategy, and the trunk
 * pitch that brings the shoulder within reach: the posture transforms the
 * bend law solves its reach and balance on, split from the law so each file
 * holds one responsibility.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is lowered and solved and who reads it.
 * @evidence contracts/development/design.md#principled-representation Pure posture transforms keyed by the bend law's concrete strategies, with their provisional shares as tables beside them.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two tables, the scan's step and three functions, read by the bend law and the pick-up's lowering.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No body or case is special-cased.
 */
export namespace bendLower {
  /** Hip height kept by each strategy, a share of the standing hip height (provisional). */
  export const HIPS: Readonly<Record<Exclude<bend.Strategy, "auto">, number>> =
    {
      stoop: 0.97,
      semiSquat: 0.75,
      squat: 0.45,
    };

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
   * @returns The lowered posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is lowered, moved and pitched, each parameter's unit and range, and the squat's heel lift in the implementation comments.
   * @evidence contracts/development/implementation.md#principled-implementation Moves the hips' goal down by the strategy's share of the hip height and back by `back` in the posture's frame, inclines the trunk by the lumbopelvic rhythm with the pelvis limited by hip flexion (HumanTrunk.pelvisLimit), lifts a squat's heels about the ball (HumanFoot.pivot) with the toes bent to stay flat, and re-solves the planted legs, lowering the pelvis where a leg cannot reach.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One posture transform shared by the plan, the balance solve and the reach bisection; the inclination split, foot pivot and leg solve are imported from their owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts HIPS and HEEL are named provisional shares; no body or case is special-cased. The pelvis limit is read over the lifted ankles, so the hip stays within its flexion range and the foot holds its contact through the squat.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work: one trunk incline, at most two foot pivots and one leg-lowering solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure function; callers that need the same lowered posture call it once per sample.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new posture and retains nothing.
   */
  export function lower(
    body: IHumanBody,
    posture: IHumanPosture,
    strategy: Exclude<bend.Strategy, "auto">,
    pitch: number,
    share: number,
    back: number,
  ): IHumanPosture {
    const hips: IAutoMovieVector3 = body.rest.get("hips")!;
    const drop: number = (1 - HIPS[strategy]) * body.measure.hipHeight * share;
    const frame: HumanFrame.IFrame = { origin: posture.root, yaw: posture.yaw };
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
    const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
    const heel: number = HEEL[strategy] * share;
    if (heel > 0)
      for (const leg of ["leftLeg", "rightLeg"] as const) {
        const goal0: IHumanPosture.IGoal | undefined = posture.limbs[leg];
        if (goal0 === undefined || goal0.rotation === undefined) continue;
        const side: "left" | "right" = leg === "leftLeg" ? "left" : "right";
        const flat: HumanFoot.IPlacement = {
          ankle: goal0.point,
          rotation: goal0.rotation,
        };
        const lifted: HumanFoot.IPlacement = HumanFoot.pivot(
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
    const tilt = HumanTrunk.incline(
      posture.joints,
      pitch,
      HumanTrunk.pelvisLimit(body, level, posture.yaw, {
        left: limbs.leftLeg!.point,
        right: limbs.rightLeg!.point,
      }),
    );
    const tipped: IHumanPosture = {
      ...posture,
      pitch: posture.pitch + tilt.pitch,
    };
    const joints: IHumanPosture["joints"] = tilt.joints;

    // With the heels up the toes bend at their joints and stay flat on the floor.
    const toes: IHumanPosture["joints"] =
      heel > 0 ? { leftToes: [heel, 0, 0], rightToes: [heel, 0, 0] } : {};
    return resolveHumanPosture.lower(body, {
      ...tipped,
      joints: { ...joints, ...toes },
      limbs,
      root: Vector3.subtract(
        goal,
        Quaternion.rotateVector(resolveHumanPosture.heading(tipped), hips),
      ),
    });
  }

  /** Heel lift by strategy at full depth, degrees (provisional: only the squat outruns the ankle's dorsiflexion). */
  export const HEEL: Readonly<Record<Exclude<bend.Strategy, "auto">, number>> =
    {
      stoop: 0,
      semiSquat: 0,
      squat: 30,
    };

  /**
   * The least trunk pitch that brings the shoulder within reach of the
   * target under a strategy, over 0 to 150 degrees of inclination: the first
   * of every `SCAN` degrees that reaches, refined by bisection from the one
   * before.
   *
   * @param body The body.
   * @param posture The standing posture.
   * @param target The target.
   * @param side The hand.
   * @param strategy The strategy.
   * @param lean The balance shift per unit sine of the inclination, metres.
   * @returns Degrees.
   * @throws {HumanRefusal} When even 150 degrees leaves the target out of reach.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the quantity solved, the search range, the reach model and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The gap between the shoulder-to-target distance and the arm's reach (0.92 of upper arm plus forearm, near full extension, plus the palm offset), the shoulder read from the lowered trunk's forward kinematics, is scanned every `SCAN` degrees for the first inclination that closes it, then bisected between that one and the one before. The gap does not fall all the way: the shoulder swings down past a target at counter height, so the gap at 150 degrees opens again, and a bisection over the whole range refused a counter a slight lean reaches.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One solve that reuses `lower` for the body and HumanTrunk for the shoulder.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The 0.92 reach share (provisional) and the 150 degree bound are named in the doc; an unreachable target is refused, not clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most 31 scanned and 30 bisected gap evaluations, each one lowered posture and one trunk forward-kinematics pass; the 30 steps bound the error below 5e-9 degrees.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each evaluation depends on its own inclination, so nothing repeats within a call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function pitch(
    body: IHumanBody,
    posture: IHumanPosture,
    target: IAutoMovieVector3,
    side: HumanHand.Side,
    strategy: Exclude<bend.Strategy, "auto">,
    lean: number,
  ): number {
    const reach: number =
      0.92 * (body.measure.upperArm + body.measure.forearm) +
      Vector3.length(HumanHand.offset(body, side, "palm").point);
    const gap = (deg: number): number => {
      const lowered: IHumanPosture = lower(
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
      return Vector3.length(Vector3.subtract(target, shoulder)) - reach;
    };
    if (gap(0) <= 0) return 0;
    let hi: number = SCAN;
    while (hi <= 150 && gap(hi) > 0) hi += SCAN;
    if (hi > 150)
      throw new HumanRefusal({
        kind: "reach",
        axis: "toward",
        value: strategy,
        reason: `A ${strategy} cannot bring the hand to a point ${target.y.toFixed(3)} m high there; step closer to it, or choose a deeper strategy`,
        fix: "step closer to the target, or choose a deeper strategy",
      });
    let lo: number = hi - SCAN;
    for (let i: number = 0; i < 30; i++) {
      const mid: number = (lo + hi) / 2;
      if (gap(mid) > 0) lo = mid;
      else hi = mid;
    }
    return hi;
  }

  /** The step of the inclination scan `pitch` closes the reach on, degrees (provisional: fine enough that the gap, which turns once over the range, cannot close and open again between two steps). */
  export const SCAN: number = 5;

  /** A strategy's solved lowering: the balance shift per unit sine of the inclination and the inclination itself. */
  export interface ISolved {
    /** The strategy. */
    strategy: Exclude<bend.Strategy, "auto">;

    /** How far the hips move back for balance per unit sine of the inclination, metres. */
    lean: number;

    /** The trunk's inclination, degrees. */
    pitch: number;
  }

  /**
   * The lowering that brings a hand within reach of a target under a
   * strategy: the hips' balance shift found on the lowered posture at a
   * nominal 60 degrees, the least inclination that reaches (`pitch`), and,
   * past 5 degrees, the shift again at that inclination and the inclination
   * again with it.
   *
   * @param body The body.
   * @param upright The standing posture lowered.
   * @param target The target.
   * @param side The hand.
   * @param strategy The strategy.
   * @returns The solved lowering.
   * @throws {HumanRefusal} As `pitch`, when the strategy cannot reach the target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two passes, the inputs and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The hips move back to keep the centre of mass over the feet (`HumanBalance.shift`), and the inclination is the least that reaches with that shift; the shift is solved again at the needed inclination, since it grows with the trunk's lean.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two balance solves and two pitch solves, in order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The 60 degree nominal pitch and the 5 degree threshold below which the first shift stands are the bend law's; nothing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two balance scans and two pitch solves.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by the bend law and by the pick-up's own lowering, so both lower a body alike.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function solve(
    body: IHumanBody,
    upright: IHumanPosture,
    target: IAutoMovieVector3,
    side: HumanHand.Side,
    strategy: Exclude<bend.Strategy, "auto">,
  ): ISolved {
    const shift = (deg: number): number =>
      HumanBalance.shift(
        body,
        (back: number): IHumanPosture =>
          lower(body, upright, strategy, deg, 1, back),
      ) / Math.sin((deg * Math.PI) / 180);
    let lean: number = shift(60);
    let deg: number = pitch(body, upright, target, side, strategy, lean);
    if (deg > 5) {
      lean = shift(deg);
      deg = pitch(body, upright, target, side, strategy, lean);
    }
    return { strategy, lean, pitch: deg };
  }
}
