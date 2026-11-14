import { Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { bendLower } from "../everyday/bendLower";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanArmTrajectoryTerms } from "../posture/HumanArmTrajectoryTerms";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { pickUpPosture } from "./pickUpPosture";

/**
 * The body that carries a pick up's lift, and the judgement of the lift.
 *
 * A lift is a whole-body task: where the arm alone cannot bring the wrist
 * to its lifted place from the body the grip was taken from, the body
 * carries the rest, as whole-body reaching apportions a hand's movement
 * among the arm, the trunk and the legs (Sha and Thomas 2011,
 * arXiv:1108.1940). The freedoms are taken in order: the arm alone; then
 * the trunk inclined toward the lifted place within its sagittal range,
 * as the bend law inclines it (`bendLower.solve`, the hips moved back to
 * keep the body over its feet); then a lowered stance straightened part of
 * the way, never past the landing of a foot it stepped. Each closes on the
 * arm near full extension (`bendLower.REACH`) first and on the straight
 * arm after. Where none of them reaches, a standing body steps for the
 * lift (`pickUpStance`); what is still beyond is left to the arm, and the
 * plan's own hand is judged: a lift it falls short of is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the freedoms, their order, the reach they close on and the refusal.
 * @evidence contracts/development/design.md#principled-representation The raise as the trunk's solved inclination and the stance's share at `lifted`, so the plan poses the body at any share of it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record, its arm-alone value and three functions the pick up reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No body or prop is special-cased: the trunk is the bend law's own solve and the straightening the stance's own way down.
 */
export namespace pickUpLift {
  /**
   * How the body carries a lift past the arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and what it holds when unused.
   * @evidence contracts/development/design.md#principled-representation The two freedoms the lift may take, each in its owner's terms.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read by the plan's posture.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The arm alone is `ARM`, not a sentinel inside a member.
   */
  export interface IRaise {
    /** The trunk's inclination at `lifted`, as the bend law solves it on the stance's bottom posture; null when the trunk is not used. */
    trunk: bendLower.ISolved | null;

    /** The share of the way down the stance holds at `lifted`, 0 to 1: 1 where it does not straighten. */
    share: number;
  }

  /** The arm alone: no trunk, no straightening. */
  export const ARM: IRaise = { trunk: null, share: 1 };

  /** The share of the way down a straightening is scanned by before its bisection (provisional: fine enough that the reach, which turns at most once over the way, cannot close and open again between two steps). */
  export const SCAN: number = 0.05;

  /**
   * The body that brings the wrist to its lifted place.
   *
   * @param context The pick up's context.
   * @param side The lifting arm.
   * @param lifted The wrist's lifted place, world metres.
   * @param stance The stance the grip was taken from, if the body moved for it.
   * @param held The stance's bottom posture, the entry's when it did not.
   * @returns The raise, `ARM` where the arm alone reaches; null where nothing does, for the stance to step for the lift (`pickUpStance`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order of the freedoms and what is returned when none reaches.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing reaching is null, not the arm-alone raise, so the caller can tell the two apart.
   * @evidence contracts/development/implementation.md#principled-implementation The arm's straight reach first, then the bend law's inclination solve on the bottom posture, then the least straightening of the stance's own way down, each closed first on `bendLower.REACH` of the arm and then on the arm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reach test and two solves per reach, in order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only a refusal of the bend's solve is passed over; nothing is clamped, and what none reaches is judged on the plan's hand.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most two inclination solves and two scans with bisections; none where the arm alone reaches.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the bend law's solve and the stance's own postures.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function raise(
    context: IHumanActionContext<object>,
    side: HumanHand.Side,
    lifted: IAutoMovieVector3,
    stance: pickUpPosture.IStance | null,
    held: IHumanPosture,
  ): IRaise | null {
    const body: IHumanBody = context.body;
    const arm: number = body.measure.upperArm + body.measure.forearm;
    const far = (posture: IHumanPosture): number =>
      Vector3.length(Vector3.subtract(lifted, shoulder(body, side, posture)));
    if (far(held) <= arm + 1e-6) return ARM;

    // A foot that stepped stays where it landed: the stance straightens no
    // further than the share of the way at which it lands.
    const floor: number =
      stance?.step === undefined ? 0 : minimumJerk(stance.step.on).s;
    for (const reach of [bendLower.REACH * arm, arm]) {
      // The trunk, inclined toward the lifted place.
      try {
        return {
          trunk: bendLower.solve(body, held, lifted, side, "stoop", reach),
          share: 1,
        };
      } catch (error) {
        if (!(error instanceof HumanRefusal)) throw error;
      }

      // The stance, straightened the least share that reaches: scanned up
      // from the bottom, then bisected from the step before.
      if (stance === null) continue;
      let before: number = 1;
      let reached: number | null = null;
      for (let s: number = 1 - SCAN; s > floor - SCAN; s -= SCAN) {
        const share: number = Math.max(floor, s);
        if (far(stance.at(share)) <= reach) {
          reached = share;
          break;
        }
        before = share;
      }
      if (reached === null) continue;
      let low: number = reached;
      let high: number = before;
      for (let i: number = 0; i < 30; i++) {
        const middle: number = (low + high) / 2;
        if (far(stance.at(middle)) <= reach) low = middle;
        else high = middle;
      }
      return { trunk: null, share: low };
    }
    return null;
  }

  /**
   * The body at a share of the way down and a share of the trunk's
   * inclination.
   *
   * @param body The body.
   * @param raise The raise.
   * @param at The stance's body at a share of the way down.
   * @param share The share of the way down.
   * @param inclined The share of the trunk's inclination, 0 to 1.
   * @returns The posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two shares it poses.
   * @evidence contracts/development/implementation.md#principled-implementation The bend law's own lowering (`bendLower.lower`) applied to the stance's body, its inclination, hip drop and balance shift a share of the solved ones, as the bend lowers.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One stance read and at most one lowering.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Without a trunk, or at none of it, the stance's body is returned unchanged.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per sample.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function called once per sample.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new posture and retains nothing.
   */
  export function posed(
    body: IHumanBody,
    raise: IRaise,
    at: (share: number) => IHumanPosture,
    share: number,
    inclined: number,
  ): IHumanPosture {
    const posture: IHumanPosture = at(share);
    if (raise.trunk === null || inclined <= 0) return posture;
    const pitch: number = raise.trunk.pitch * inclined;
    return bendLower.lower(
      body,
      posture,
      raise.trunk.strategy,
      pitch,
      inclined,
      raise.trunk.lean * Math.sin((pitch * Math.PI) / 180),
    );
  }

  /**
   * Refuse a lift the plan's hand falls short of.
   *
   * The plan is solved at the grip's close and at `lifted`, and the hand's
   * rise between them is read against the lift: a hand the body cannot
   * raise as far as asked is refused, never lifted less in silence. Only
   * the height counts; what the hand's rotation leaves unmet the wrist
   * takes up (`HumanHandAttitude`). The hand counts as risen where the
   * arm's solver counts a wrist constraint as met
   * (`HumanArmTrajectoryTerms.TOLERANCE`, millimetres of place).
   *
   * @param context The pick up's context.
   * @param side The lifting arm.
   * @param lift The asked lift, metres.
   * @param plan The pick up's plan.
   * @param closed When the grip closes, seconds into the plan.
   * @param lifted When the lift ends, seconds into the plan.
   * @throws {HumanRefusal} When the hand rises short of the lift by more than the solver's tolerance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read, at which instants, against which tolerance and why.
   * @evidence contracts/development/implementation.md#principled-implementation The plan's own posture solved as the performance solves it (`resolveHumanPosture`), the hand's height read from its bones.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two readings and one comparison.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The tolerance is the arm solver's own, in millimetres of place; no mixed bound is borrowed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two posture solves per plan, none without a lift.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function judged(
    context: IHumanActionContext<{ prop: string; handle: string }>,
    side: HumanHand.Side,
    lift: number,
    plan: IHumanActionPlan,
    closed: number,
    lifted: number,
  ): void {
    if (lift <= 0) return;
    const body: IHumanBody = context.body;
    const wrist = (seconds: number): number =>
      poseBones(body, resolveHumanPosture(body, plan.posture(seconds))).get(
        `${side}Hand`,
      )!.worldPosition.y;
    const short: number = 1000 * (lift - (wrist(lifted) - wrist(closed)));
    if (short > HumanArmTrajectoryTerms.TOLERANCE)
      throw new HumanRefusal({
        kind: "reach",
        axis: "lift",
        value: short,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: HumanArmTrajectoryTerms.TOLERANCE,
          unit: "mm",
        },
        reason: `${context.params.prop} taken by ${context.params.handle} cannot be lifted ${lift.toFixed(3)} m: the ${side} hand rises ${short.toFixed(1)} mm short of it, with the trunk and the legs taking what the arm cannot`,
        fix: "lift it less (`lift`), take it with the other hand, or stand where the arm can raise it",
      });
  }

  /** The arm's shoulder joint on a posture, world metres. */
  const shoulder = (
    body: IHumanBody,
    side: HumanHand.Side,
    posture: IHumanPosture,
  ): IAutoMovieVector3 =>
    HumanTrunk.resolve(body, posture).get(`${side}UpperArm`)!.worldPosition;
}
