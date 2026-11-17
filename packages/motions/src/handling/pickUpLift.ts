import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBendLower,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../everyday/HumanTrunk";
import { bendLower } from "../everyday/bendLower";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanArmTrajectoryTerms } from "../posture/HumanArmTrajectoryTerms";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
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
    trunk: IAutoMovieMotionHumanBendLower.ISolved | null;

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
   * @evidence contracts/development/implementation.md#principled-implementation The arm's straight reach first, then the bend law's inclination solve on the bottom posture, then the least straightening of the stance's own way down, each closed first on `bendLower.REACH` of the arm and then on the arm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reach test and two solves per reach, in order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only a refusal of the bend's solve is passed over; nothing is clamped, and what none reaches is judged on the plan's hand.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most two original inclination solves and scans/bisections remain, none when the arm alone reaches. One canonical shoulder-name/tuple-FK producer and exact operation reader replace repeated name binding and intermediate joint records; every actual current posture and shoulder query remains.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only genuine canonical body/name/FK metadata is shared. Every raw root/joint value is re-admitted, each far query computes its actual shoulder/distance, and arbitrary stance.at retains its original single share argument and call schedule without a fixed direct base.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous raise owns bounded shoulder-name and exact FK metadata until return/throw. Returned scalar raise data contain no reader, posture answer, callback map, sample history or external handle.
   */
  export function raise(
    context: IAutoMovieMotionHumanActionContext<object>,
    side: AutoMovieHumanSide,
    lifted: IAutoMovieVector3,
    stance: pickUpPosture.IStance | null,
    held: IAutoMovieMotionHumanPosture,
  ): IRaise | null {
    const body: IAutoMovieMotionHumanBody = context.body;
    const arm: number = body.measure.upperArm + body.measure.forearm;
    const readShoulder: ReturnType<typeof HumanTrunk.prepareResolve> = HumanTrunk.prepareResolve(
      body, new Set<AutoMovieHumanoidBone>([`${side}UpperArm`]),
    );
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
    const far: (posture: IAutoMovieMotionHumanPosture) => number = (posture: IAutoMovieMotionHumanPosture): number =>
      Vector3.length(Vector3.subtract(lifted,
        readShoulder(posture, resolution).get(`${side}UpperArm`)!.worldPosition));
    if (far(held) <= arm + 1e-6) return ARM;

    // A foot that stepped stays where it landed: the stance straightens no
    // further than the share of the way at which it lands.
    const floor: number =
      stance?.step === undefined ? 0 : minimumJerk.share(stance.step.on);
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
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The actual stance and bendLower receive optional same-person FK/ROM inputs; raw hip lowering borrows only FK and retains its original native policy.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Optional observation loans belong only to this synchronous call and are never stored in the returned posture, stance or history.
   */
  export function posed(
    body: IAutoMovieMotionHumanBody,
    raise: IRaise,
    at: pickUpPosture.IStance["at"],
    share: number,
    inclined: number,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
  ): IAutoMovieMotionHumanPosture {
    const posture: IAutoMovieMotionHumanPosture = at(share, resolution, projection);
    if (raise.trunk === null || inclined <= 0) return posture;
    const pitch: number = raise.trunk.pitch * inclined;
    return bendLower.lower(
      body,
      posture,
      raise.trunk.strategy,
      pitch,
      inclined,
      raise.trunk.lean * Math.sin((pitch * Math.PI) / 180),
      resolution,
    );
  }

  /**
   * Refuse a lift the plan's hand falls short of.
   *
   * The plan is solved at the grip's close and at `lifted`, and the hand's
   * rise between them is read against the lift: a hand the body cannot
   * raise as far as asked is refused, never lifted less in silence. Only
   * the height counts; position and attitude remain one complete limb goal
   * throughout the lift, with every other limb and digit goal preserved.
   * The hand counts as risen where the
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
   * @evidence contracts/development/implementation.md#efficient-algorithms Two original complete posture solves remain, none without a lift. One fixed hand demand and exact operation reader serve both actual plan/lowering/solver/FK observations; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both readings share only same-body exact FK prerequisites, explicitly passed through current plan.posture and native seeded resolution; actual different times/roots/goals still run their original complete solves and admission.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous judgement releases its hand reader, exact workspace and actual fit/maps on return/throw; no loan, pose, score/time history or handle enters the plan.
   */
  export function judged(
    context: IAutoMovieMotionHumanActionContext<{ prop: string; handle: string; }>,
    side: AutoMovieHumanSide,
    lift: number,
    plan: IAutoMovieMotionHumanActionPlan,
    closed: number,
    lifted: number,
  ): void {
    if (lift <= 0) return;
    const body: IAutoMovieMotionHumanBody = context.body;
    const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([`${side}Hand`]);
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
    const readHand: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body, requested);
    const wrist: (seconds: number) => number = (seconds: number): number =>
      readHand(resolveHumanPosture.seeded(body,
        plan.posture(seconds, undefined, resolution), undefined, undefined, resolution).pose, resolution()).get(
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

}
