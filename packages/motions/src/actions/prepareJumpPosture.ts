import { AutoMovieGravity, type resolveAutoMovieCenterOfMass } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { jumpAirborne } from "./jumpAirborne";
import { prepareJumpFlight } from "./prepareJumpFlight";

/**
 * Construct the actual jump phase dispatcher and its free-flight reader.
 * The middle branch owns the copied ballistic coefficients and the genuine
 * immutable foot-curve construction; supplied before/after writers execute
 * strictly outside that branch and acquire no derivative authority.
 *
 * @param body Native unchanged body used by this plan.
 * @param model Its actual physical mass model.
 * @param shape Achieved endpoints and fixed heading of this same jump.
 * @param phase The original local phase times, seconds, and ballistic metre coefficients.
 * @param rotation Actual requested turns, delegated unchanged to jumpAirborne.
 * @param before Original push writer; receives local seconds and the same FK loan.
 * @param after Original absorption writer with those same arguments.
 * @returns The original posture dispatcher and turning declarations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines actual owned open-flight phase, original clock/ballistic units, outside-phase callbacks, native reader facts, known refusal wrapper and independent descriptor observations.
 * @evidence contracts/development/implementation.md#principled-implementation Preserves the original clamp, push/free/absorb dispatch and c0+v*t-g*t^2/2 COM expressions. prepareJumpFlight owns the achieved-goal construction and actual canonical solve; jumpAirborne owns handed-back rigid turning. Only this actual middle-branch constructor can issue phase facts, and only the known exact error-location wrapper may preserve them.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare the same flight then turning in the original order, copy fixed clock/COM scalars, construct one dispatcher, and privately associate its actual phase. The companion phase reader copies facts; located owns only the original four-argument refusal wrapper.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No arbitrary callback is registered, sampled or inferred pure. Before/after callbacks remain ordinary; unknown outer wrappers lose provenance. No law-name selection, physical tolerance, pose answer cache, changed callback receiver or scripted turn is introduced. Phase facts alone certify no derivative, root or displayed stage.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed construction adds one constant-size scalar snapshot and weak phase entry. Reads retain the original branch arithmetic and actual solves. phase is constant work; located calls its source exactly once and preserves normal throw order. Gains remain unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Actual private constructor origin and copied coefficients establish only the native dispatcher domain. The source's actual current raw/canonical/cell/root and displayed-stage checks still govern rate use. Unknown callbacks receive the same error wrapper without a phase entry.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns its existing flight/turning and before/after writers plus fixed clock/COM data. Weak entries own constant-size phase facts while their actual reader lives; phase returns a fresh copy, located retains its original source/location, and no query history, raw result, FK loan or handle enters this map. Member facts: IPhase states local normalized-clock conversion; IConstruction retains only the original plan surface.
 */
export function prepareJumpPosture(
  body: IHumanBody,
  model: resolveAutoMovieCenterOfMass.IModel,
  shape: jumpAirborne.IShape,
  phase: prepareJumpPosture.IPhase & { centre: IAutoMovieVector3; launch: IAutoMovieVector3 },
  rotation: jumpAirborne.IRotation | undefined,
  before: (seconds: number, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]) => IHumanPosture,
  after: (seconds: number, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]) => IHumanPosture,
): prepareJumpPosture.IConstruction {
  const flight: ReturnType<typeof prepareJumpFlight> = prepareJumpFlight(body, model, shape, phase.flightSeconds);
  const turning: jumpAirborne.ITurning = jumpAirborne.turning(rotation, phase.from, phase.to, phase.duration);
  const fixed: prepareJumpPosture.IPhase = { from: phase.from, to: phase.to,
    duration: phase.duration, flightSeconds: phase.flightSeconds };
  const centre: IAutoMovieVector3 = { ...phase.centre };
  const launch: IAutoMovieVector3 = { ...phase.launch };
  const posture: IHumanActionPlan["posture"] = (
    seconds: number, _channels?: Parameters<IHumanActionPlan["posture"]>[1],
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<IHumanActionPlan["posture"]>[3],
  ): IHumanPosture => {
    const t: number = Math.min(fixed.duration, Math.max(0, seconds));
    if (t <= fixed.from) return before(t, resolution);
    if (t <= fixed.to) {
      const u: number = t - fixed.from;
      const at: IAutoMovieVector3 = {
        x: centre.x + launch.x * u,
        y: centre.y + launch.y * u - 0.5 * AutoMovieGravity.STANDARD * u * u,
        z: centre.z + launch.z * u,
      };
      return turning.turned(flight(u / fixed.flightSeconds, at, resolution, projection), t);
    }
    return after(t, resolution);
  };
  PHASES.set(posture, fixed);
  return { posture, declared: turning.declared };
}

/**
 * Numeric facts of the actual owned dispatch and its unchanged plan surface.
 *
 * @evidence contracts/development/common.md#meaningful-documentation IPhase states local second boundaries, normalized-share divisor and total duration; IConstruction states the existing posture and airborne/flight declarations. phase and located describe only facts actually issued by the constructor or exact wrapper.
 * @evidence contracts/development/design.md#principled-representation Copied clock scalars describe the open native branch, without representing a pose, global C1 certificate or caller-supplied readiness flag. The plan construction preserves the existing law types.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The jump consumes IConstruction; the original displayed evaluator observes IPhase after actual callback invocation, and placement consumes located to retain only genuine native provenance through its exact error wrapper.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts There is no public registration method, arbitrary wrapper claim, derivative sampler or law-name dispatch. Unknown reader identity returns no numerical descriptor.
 */
export namespace prepareJumpPosture {
  /** Original local clock coefficients of the actual native middle branch. */
  export interface IPhase {
    /** Push endpoint, action-local seconds. */
    from: number;
    /** Touchdown, action-local seconds. */
    to: number;
    /** Complete action duration, seconds. */
    duration: number;
    /** Physical flight seconds dividing the local elapsed time into share. */
    flightSeconds: number;
  }

  /** Existing plan members produced by the actual dispatcher constructor. */
  export interface IConstruction {
    /** Actual full-phase posture callback, before error location. */
    posture: IHumanActionPlan["posture"];
    /** Original requested flight and handed-back airborne callback. */
    declared: Pick<IHumanActionPlan, "flight" | "airborne">;
  }

  /** Observe a copied phase only for an actual constructor or known wrapper. */
  export function phase(source: IHumanActionPlan["posture"]): IPhase | undefined {
    const value: IPhase | undefined = PHASES.get(source);
    return value === undefined ? undefined : { ...value };
  }

  /** Own placement's original exact refusal-location wrapper, without sampling. */
  export function located(source: IHumanActionPlan["posture"], where: HumanRefusal.IWhere): IHumanActionPlan["posture"] {
    const wrapped: IHumanActionPlan["posture"] = (
      seconds: number, channels?: Parameters<IHumanActionPlan["posture"]>[1],
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: Parameters<IHumanActionPlan["posture"]>[3],
    ): IHumanPosture => {
      try {
        return source(seconds, channels, resolution, projection);
      } catch (error) {
        throw error instanceof HumanRefusal ? error.locate(where) : error;
      }
    };
    const value: IPhase | undefined = PHASES.get(source);
    if (value !== undefined) PHASES.set(wrapped, value);
    return wrapped;
  }
}

/** Actual constructor and exact wrapper readers own only fixed scalar facts. */
const PHASES: WeakMap<IHumanActionPlan["posture"], prepareJumpPosture.IPhase> = new WeakMap();
