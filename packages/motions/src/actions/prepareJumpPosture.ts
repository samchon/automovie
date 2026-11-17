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
 * strictly outside that branch.
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
 * @evidence contracts/development/common.md#meaningful-documentation Defines actual owned open-flight phase, original clock/ballistic units, outside-phase callbacks and the known refusal wrapper.
 * @evidence contracts/development/implementation.md#principled-implementation Preserves the original clamp, push/free/absorb dispatch and c0+v*t-g*t^2/2 COM expressions. prepareJumpFlight owns the achieved-goal construction and actual canonical solve; jumpAirborne owns handed-back rigid turning.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare the same flight then turning in the original order, copy fixed clock/COM scalars and construct one dispatcher; located owns only the original four-argument refusal wrapper.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No arbitrary callback is registered, sampled or inferred pure. Before/after callbacks remain ordinary. No law-name selection, physical tolerance, pose answer cache, changed callback receiver or scripted turn is introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed construction adds one constant-size scalar snapshot. Reads retain the original branch arithmetic and actual solves; located calls its source exactly once and preserves normal throw order.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The copied clock and ballistic coefficients are fixed for the plan; every read evaluates its own branch and solve.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns its existing flight/turning and before/after writers plus fixed clock/COM data. located retains its original source/location, and no query history, raw result, FK loan or handle is kept. Member facts: IPhase states local normalized-clock conversion; IConstruction retains only the original plan surface.
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
  return { posture, declared: turning.declared };
}

/**
 * Numeric facts of the actual owned dispatch and its unchanged plan surface.
 *
 * @evidence contracts/development/common.md#meaningful-documentation IPhase states local second boundaries, normalized-share divisor and total duration; IConstruction states the existing posture and airborne/flight declarations; located is the refusal-location wrapper.
 * @evidence contracts/development/design.md#principled-representation Copied clock scalars describe the open native branch, without representing a pose, global C1 certificate or caller-supplied readiness flag. The plan construction preserves the existing law types.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The jump consumes IConstruction and gives IPhase's clock; placement consumes located to place a refusal.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts There is no public registration method, arbitrary wrapper claim, derivative sampler or law-name dispatch.
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

  /** Own placement's original exact refusal-location wrapper, without sampling. */
  export function located(source: IHumanActionPlan["posture"], where: HumanRefusal.IWhere): IHumanActionPlan["posture"] {
    return (
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
  }
}
