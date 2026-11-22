import { AutoMovieGravity } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanJumpAirborne,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRefusal,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBendRead } from "../compose/HumanBendRead";
import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanPreparedPlayback } from "../perform/HumanPreparedPlayback";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { jumpAirborne } from "./jumpAirborne";
import type { jumpTouchdownRotation } from "./jumpTouchdownRotation";
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
 * @param ground Original push and landing writers and their native bare-display fit producers.
 * @param touchdownRequirement The optional geometry requirement for a planted rotating jump.
 * @returns The public posture dispatcher, the turning declarations and the event-prepared display source.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines actual owned open-flight phase, original clock/ballistic units, outside-phase callbacks and the known refusal wrapper.
 * @evidence contracts/development/implementation.md#principled-implementation Preserves the original clamp, push/free/absorb dispatch and c0+v*t-g*t^2/2 COM expressions. prepareJumpFlight owns the achieved-goal construction and actual canonical solve; jumpAirborne owns handed-back rigid turning.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Public and native flight read the same ballistic writer. Its start belongs to push and its end belongs to flight. Ground fit transfers survive only where landing turn leaves their inputs unchanged. located owns only the original four-argument refusal wrapper.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No arbitrary callback is registered, sampled or inferred pure. Before/after callbacks remain ordinary. Forwards the native touchdown requirement unchanged. No law-name selection, pose answer cache, changed callback receiver or scripted turn is introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms Native placement prepares the same constant-size flight anchor and touchdown offset those stages need. A ground phase can lend its actual same-sample leg fit, avoiding the duplicate fit after arm clearance.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The copied clock and ballistic coefficients are fixed for the plan. Canonical flight anchors and the touchdown offset are invariant for their native curve and handback. Every read evaluates its own current shape; a ground sample independently proves its fit can be transferred.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns its existing flight/turning and before/after writers plus fixed clock/COM data. located retains its original source/location, and no query history, raw result, FK loan or handle is kept. Member facts: IPhase states local normalized-clock conversion; IConstruction retains only the original plan surface.
 */
export function prepareJumpPosture(
  body: IAutoMovieMotionHumanBody,
  model: IAutoMovieResolveCenterOfMass.IModel,
  shape: jumpAirborne.IShape,
  phase: prepareJumpPosture.IFlight,
  rotation: IAutoMovieMotionHumanJumpAirborne.IRotation | undefined,
  ground: prepareJumpPosture.IGround,
  touchdownRequirement?: jumpTouchdownRotation.IRequirement,
): prepareJumpPosture.IConstruction {
  const flight: ReturnType<typeof prepareJumpFlight> = prepareJumpFlight(
    body,
    model,
    shape,
    phase.flightSeconds,
  );
  const turning: jumpAirborne.ITurning = jumpAirborne.turning(
    rotation,
    phase.from,
    phase.to,
    phase.duration,
    phase.settled,
    touchdownRequirement,
  );
  const fixed: prepareJumpPosture.IPhase = {
    from: turning.from,
    to: turning.to,
    duration: phase.duration,
    flightSeconds: phase.flightSeconds,
  };
  const centre: IAutoMovieVector3 = { ...phase.centre };
  const launch: IAutoMovieVector3 = { ...phase.launch };
  /** Preserve the exact touchdown evaluation and arithmetic of the native COM law. */
  const flying: IAutoMovieMotionHumanActionPlan["posture"] = (
    t: number,
    _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
  ): IAutoMovieMotionHumanPosture => {
    const u: number = t === fixed.to ? fixed.flightSeconds : t - fixed.from;
    const at: IAutoMovieVector3 = {
      x: centre.x + launch.x * u,
      y: centre.y + launch.y * u - 0.5 * AutoMovieGravity.STANDARD * u * u,
      z: centre.z + launch.z * u,
    };
    return turning.turned(
      flight(u / fixed.flightSeconds, at, resolution, projection),
      t,
    );
  };
  const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
    seconds: number,
    _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
  ): IAutoMovieMotionHumanPosture => {
    const t: number = Math.min(fixed.duration, Math.max(0, seconds));
    if (t <= fixed.from)
      return ground.before(t, undefined, resolution, projection);
    if (t <= fixed.to) return flying(t, undefined, resolution, projection);
    return turning.landed(
      ground.after(t, undefined, resolution, projection),
      t,
    );
  };
  /** A retained touchdown turn changes the leg-fit root, so it requires a normal display fit. */
  const landed: HumanPreparedPlayback.IPhase["sample"] = (
    ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
  ): HumanPreparedPlayback.ISample | undefined => {
    const sample: HumanPreparedPlayback.ISample | undefined =
      ground.sampleAfter(...args);
    if (sample === undefined) return undefined;
    const current: IAutoMovieMotionHumanPosture = turning.landed(
      sample.posture,
      args[0],
    );
    return current === sample.posture ? sample : { posture: current };
  };
  const playback: HumanPreparedPlayback.ISource = {
    mode: "fitted",
    prepare: (): void => {
      flight.prepare();
      turning.prepareLanding();
    },
    phases: [
      { from: 0, to: fixed.from, sample: ground.sampleBefore },
      {
        from: fixed.from,
        to: fixed.to,
        sample: (
          ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
        ): HumanPreparedPlayback.ISample => ({ posture: flying(...args) }),
      },
      { from: fixed.to, to: phase.settled, sample: landed },
      { from: phase.settled, to: fixed.duration, sample: landed },
    ],
  };
  return { posture, declared: turning.declared, playback };
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

  /** The phase with the flight's ballistic start and the landing's end, as the jump hands them over. */
  export interface IFlight extends IPhase {
    /** The centre of mass at take-off, world metres. */
    centre: IAutoMovieVector3;

    /** The centre's take-off velocity, metres a second. */
    launch: IAutoMovieVector3;

    /** Where the landing's absorption ends, action-local seconds. */
    settled: number;
  }

  /** Existing plan members produced by the actual dispatcher constructor. */
  export interface IConstruction {
    /** Actual full-phase posture callback, before error location. */
    posture: IAutoMovieMotionHumanActionPlan["posture"];
    /** Original requested flight and handed-back airborne callback. */
    declared: Pick<IAutoMovieMotionHumanActionPlan, "flight" | "airborne">;
    /** The native bare-leaf source, aligned to exactly the same phase boundaries. */
    playback: HumanPreparedPlayback.ISource;
  }

  /** The ground writers and exact same-instant fit producers for the same jump. */
  export interface IGround {
    /** Push posture without a bare display fit transfer. */
    before: IAutoMovieMotionHumanActionPlan["posture"];
    /** Landing posture without a bare display fit transfer. */
    after: IAutoMovieMotionHumanActionPlan["posture"];
    /** Push clearance and its current same-instant leg fit. */
    sampleBefore: HumanPreparedPlayback.IPhase["sample"];
    /** Landing clearance and its current same-instant leg fit. */
    sampleAfter: HumanPreparedPlayback.IPhase["sample"];
  }

  /** Own placement's original exact refusal-location wrapper, without sampling. */
  export function located(
    source: IAutoMovieMotionHumanActionPlan["posture"],
    where: IAutoMovieMotionHumanRefusal.IWhere,
  ): IAutoMovieMotionHumanActionPlan["posture"] {
    const placed: IAutoMovieMotionHumanActionPlan["posture"] = (
      seconds: number,
      channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture => {
      try {
        return source(seconds, channels, resolution, projection);
      } catch (error) {
        throw error instanceof HumanRefusal ? error.locate(where) : error;
      }
    };
    const raw: HumanBendRead.Posture | undefined =
      HumanBendRead.postures.get(source);
    if (raw !== undefined)
      HumanBendRead.postures.set(
        placed,
        (read, seconds): IAutoMovieMotionHumanPosture => {
          try {
            return raw(read, seconds);
          } catch (error) {
            throw error instanceof HumanRefusal ? error.locate(where) : error;
          }
        },
      );
    return placed;
  }
}
