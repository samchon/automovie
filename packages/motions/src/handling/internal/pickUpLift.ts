import { Vector3, minimumJerk, AutoMovieEngineMath } from "@automovie/engine";
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

import { HumanTrunk } from "../../everyday/HumanTrunk";
import { bendLower } from "../../everyday/internal/bendLower";
import { bendLowerSolve } from "../../everyday/internal/bendLowerSolve";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanArmTrajectoryTerms } from "../../posture/HumanArmTrajectoryTerms";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import type { pickUpPosture } from "./pickUpPosture";

/** The record of `IJudgedContext`'s site. */
type IJudgedContext = {
  prop: string;
  handle: string;
};

/**
 * The body that carries a pick up's lift, and the judgement of the lift.
 *
 * A lift is a whole-body task: where the arm alone cannot bring the wrist to
 * its lifted place from the body the grip was taken from, the body carries the
 * rest, as whole-body reaching apportions a hand's movement among the arm, the
 * trunk and the legs (Sha and Thomas 2011, arXiv:1108.1940). The freedoms are
 * taken in order: the arm alone; then the trunk inclined toward the lifted
 * place within its sagittal range, as the bend law inclines it
 * (`bendLowerSolve`, the hips moved back to keep the body over its feet); then
 * a lowered stance straightened part of the way, never past the landing of a
 * foot it stepped. Each closes on the arm near full extension
 * (`bendLower.REACH`) first and on the straight arm after. Where none of them
 * reaches, a standing body steps for the lift (`pickUpStance`); what is still
 * beyond is left to the arm, and the plan's own hand is judged: a lift it falls
 * short of is refused.
 */
export namespace pickUpLift {
  /** How the body carries a lift past the arm. */
  export interface IRaise {
    /**
     * The trunk's inclination at `lifted`, as the bend law solves it on the
     * stance's bottom posture; null when the trunk is not used.
     */
    trunk: IAutoMovieMotionHumanBendLower.ISolved | null;

    /**
     * The share of the way down the stance holds at `lifted`, 0 to 1: 1 where
     * it does not straighten.
     */
    share: number;
  }

  /** The arm alone: no trunk, no straightening. */
  export const ARM: IRaise = { trunk: null, share: 1 };

  /**
   * The share of the way down a straightening is scanned by before its
   * bisection (provisional: fine enough that the reach, which turns at most
   * once over the way, cannot close and open again between two steps).
   */
  export const SCAN: number = 0.05;

  /**
   * The body that brings the wrist to its lifted place.
   *
   * A standing body lowered for the grip lifts with its legs: the stance
   * straightens the least share that raises the shoulder by the lift, so the
   * arm keeps about the angles it gripped with. An arm lifting on its own
   * inside a lowered stance passes the thigh it folded beside, which the arm's
   * planned course refuses. Otherwise, and where the legs do not rise far
   * enough, the arm alone, the trunk's inclination and the stance's least
   * straightening that reaches are tried in that order.
   *
   * @param context The pick up's context.
   * @param side The lifting arm.
   * @param lifted The wrist's lifted place, world metres.
   * @param lift The asked lift, metres.
   * @param stance The stance the grip was taken from, if the body moved for it.
   * @param held The stance's bottom posture, the entry's when it did not.
   * @returns The raise, `ARM` where the arm alone reaches; null where nothing
   *   does, for the stance to step for the lift (`pickUpStance`).
   */
  export function raise(
    context: IAutoMovieMotionHumanActionContext<object>,
    side: AutoMovieHumanSide,
    lifted: IAutoMovieVector3,
    lift: number,
    stance: pickUpPosture.IStance | null,
    held: IAutoMovieMotionHumanPosture,
  ): IRaise | null {
    const body: IAutoMovieMotionHumanBody = context.body;
    const arm: number = body.measure.upperArm + body.measure.forearm;
    const readShoulder: ReturnType<typeof HumanTrunk.prepareResolve> =
      HumanTrunk.prepareResolve(
        body,
        new Set<AutoMovieHumanoidBone>([`${side}UpperArm`]),
      );
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const far: (posture: IAutoMovieMotionHumanPosture) => number = (
      posture: IAutoMovieMotionHumanPosture,
    ): number =>
      Vector3.length(
        Vector3.subtract(
          lifted,
          readShoulder(posture, resolution).get(`${side}UpperArm`)!
            .worldPosition,
        ),
      );
    // A foot that stepped stays where it landed: the stance straightens no
    // further than the share of the way at which it lands.
    const floor: number =
      stance?.step === undefined ? 0 : minimumJerk.share(stance.step.on);

    // A standing body lowered on its legs lifts with them: the least
    // straightening whose shoulder has risen by the lift. A seated body's
    // lean is no lift of the legs.
    if (stance !== null && context.entry.base.kind === "standing") {
      const height = (posture: IAutoMovieMotionHumanPosture): number =>
        readShoulder(posture, resolution).get(`${side}UpperArm`)!.worldPosition
          .y;
      const bottom: number = height(held);
      const short = (share: number): boolean =>
        height(stance.at(share)) - bottom < lift;
      if (!short(floor))
        return {
          trunk: null,
          share: AutoMovieEngineMath.bracketedBisection(
            short,
            1,
            floor,
            Math.abs(1 - floor) / 2 ** 30,
          ),
        };
    }
    if (far(held) <= arm + 1e-6) return ARM;
    for (const reach of [bendLower.REACH * arm, arm]) {
      // The trunk, inclined toward the lifted place.
      try {
        return {
          trunk: bendLowerSolve(body, held, lifted, side, "stoop", reach),
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
      return {
        trunk: null,
        share: AutoMovieEngineMath.bracketedBisection(
          (share: number): boolean => far(stance.at(share)) > reach,
          before,
          reached,
          Math.abs(before - reached) / 2 ** 30,
        ),
      };
    }
    return null;
  }

  /**
   * The body at a share of the way down and a share of the trunk's inclination.
   *
   * @param body The body.
   * @param raise The raise.
   * @param at The stance's body at a share of the way down.
   * @returns The posture reader at a share of the way down and a share of the
   *   trunk's inclination, each from 0 to 1.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    raise: IRaise,
    at: pickUpPosture.IStance["at"],
  ): (
    share: number,
    inclined: number,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
  ) => IAutoMovieMotionHumanPosture {
    const trunk: IRaise["trunk"] = raise.trunk;
    if (trunk === null)
      return (share, _inclined, resolution, projection) =>
        at(share, resolution, projection);
    const lower: ReturnType<typeof bendLower.prepare> = bendLower.prepare(
      body,
      trunk.strategy,
    );
    return (
      share,
      inclined,
      resolution,
      projection,
    ): IAutoMovieMotionHumanPosture => {
      const posture: IAutoMovieMotionHumanPosture = at(
        share,
        resolution,
        projection,
      );
      if (inclined <= 0) return posture;
      const pitch: number = trunk.pitch * inclined;
      return lower(
        posture,
        pitch,
        inclined,
        trunk.lean * Math.sin((pitch * Math.PI) / 180),
        resolution,
      );
    };
  }

  /**
   * Refuse a lift the plan's hand falls short of.
   *
   * The plan is solved at the grip's close and at `lifted`, and the hand's rise
   * between them is read against the lift: a hand the body cannot raise as far
   * as asked is refused, never lifted less in silence. Only the height counts;
   * position and attitude remain one complete limb goal throughout the lift,
   * with every other limb and digit goal preserved. The hand counts as risen
   * where the arm's solver counts a wrist constraint as met
   * (`HumanArmTrajectoryTerms.TOLERANCE`, millimetres of place).
   *
   * @param context The pick up's context.
   * @param side The lifting arm.
   * @param lift The asked lift, metres.
   * @param plan The pick up's plan.
   * @param closed When the grip closes, seconds into the plan.
   * @param lifted When the lift ends, seconds into the plan.
   * @throws {HumanRefusal} When the hand rises short of the lift by more than
   *   the solver's tolerance.
   */
  export function judged(
    context: IAutoMovieMotionHumanActionContext<IJudgedContext>,
    side: AutoMovieHumanSide,
    lift: number,
    plan: IAutoMovieMotionHumanActionPlan,
    closed: number,
    lifted: number,
  ): void {
    if (lift <= 0) return;
    const body: IAutoMovieMotionHumanBody = context.body;
    const requested: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([`${side}Hand`]);
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const readHand: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
      body,
      requested,
    );
    const wrist: (seconds: number) => number = (seconds: number): number =>
      readHand(
        resolveHumanPosture.seeded(
          body,
          plan.posture(seconds, undefined, resolution),
          undefined,
          undefined,
          resolution,
        ).pose,
        resolution(),
      ).get(`${side}Hand`)!.worldPosition.y;
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
