import { AutoMovieEngineGravity } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanJumpAirborne,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRefusal,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import type { HumanPreparedPlayback } from "../../perform/internal/HumanPreparedPlayback";
import { HumanPosturePreparation } from "../../posture/internal/HumanPosturePreparation";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { jumpAirborne } from "./jumpAirborne";
import { jumpAirborneTurning } from "./jumpAirborneTurning";
import type { jumpTouchdownRotation } from "./jumpTouchdownRotation";
import { prepareJumpFlight } from "./prepareJumpFlight";

/*
 * Construct the actual jump phase dispatcher and its free-flight reader. The
 * middle branch owns the copied ballistic coefficients and the genuine
 * immutable foot-curve construction; supplied before/after writers execute
 * strictly outside that branch.
 * Parameter body: Native unchanged body used by this plan.
 * Parameter model: Its actual physical mass model.
 * Parameter shape: Achieved endpoints and fixed heading of this same jump.
 * Parameter phase: The original local phase times, seconds, and ballistic metre
 * coefficients.
 * Parameter rotation: Actual requested turns, delegated unchanged to jumpAirborne.
 * Parameter ground: Original push and landing writers and their native bare-display
 * fit producers.
 * Parameter touchdownRequirement: The optional geometry requirement for a planted
 * rotating jump.
 * Returns: The public posture dispatcher, the turning declarations and the
 * event-prepared display source.
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
  const turning: jumpAirborneTurning.ITurning = jumpAirborneTurning(
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
  /*
   * Preserve the exact touchdown evaluation and arithmetic of the native COM
   * law: the flight's posture at a second and its solve.
   */
  const placedAt: (
    ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
  ) => HumanPosturePreparation.IPlaced = (
    t: number,
    _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
  ): HumanPosturePreparation.IPlaced => {
    const u: number = t === fixed.to ? fixed.flightSeconds : t - fixed.from;
    const at: IAutoMovieVector3 = {
      x: centre.x + launch.x * u,
      y: centre.y + launch.y * u - 0.5 * AutoMovieEngineGravity.STANDARD * u * u,
      z: centre.z + launch.z * u,
    };
    return turning.turned(
      flight(u / fixed.flightSeconds, at, resolution, projection),
      t,
    );
  };
  /*
   * The flight's posture at a second as the articulation its placed solve
   * reached, so a reader of the plan evaluates it by forward kinematics alone.
   */
  const flying: IAutoMovieMotionHumanActionPlan["posture"] = (
    ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
  ): IAutoMovieMotionHumanPosture =>
    HumanPosturePreparation.articulated(placedAt(...args));
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
  /*
   * A retained touchdown turn changes the leg-fit root, so it requires a normal
   * display fit.
   */
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
      turning.prepareLanding();
    },
    phases: [
      { from: 0, to: fixed.from, sample: ground.sampleBefore },
      {
        from: fixed.from,
        to: fixed.to,
        // The display reads the same articulation the plan's posture gives,
        // so both evaluate one joints-only posture by forward kinematics.
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

/*
 * Numeric facts of the actual owned dispatch and its unchanged plan surface.
 */
export namespace prepareJumpPosture {
  /*
   * Original local clock coefficients of the actual native middle branch.
   */
  export interface IPhase {
    /*
     * Push endpoint, action-local seconds.
     */
    from: number;
    /*
     * Touchdown, action-local seconds.
     */
    to: number;
    /*
     * Complete action duration, seconds.
     */
    duration: number;
    /*
     * Physical flight seconds dividing the local elapsed time into share.
     */
    flightSeconds: number;
  }

  /*
   * The phase with the flight's ballistic start and the landing's end, as the
   * jump hands them over.
   */
  export interface IFlight extends IPhase {
    /*
     * The centre of mass at take-off, world metres.
     */
    centre: IAutoMovieVector3;

    /*
     * The centre's take-off velocity, metres a second.
     */
    launch: IAutoMovieVector3;

    /*
     * Where the landing's absorption ends, action-local seconds.
     */
    settled: number;
  }
  /*
   * The posture dispatcher, airborne declarations and display source for one jump.
   */
  export interface IConstruction {
    /*
     * Actual full-phase posture callback, before error location.
     */
    posture: IAutoMovieMotionHumanActionPlan["posture"];
    /*
     * Original requested flight and handed-back airborne callback.
     */
    declared: Pick<
      IAutoMovieMotionHumanActionPlan,
      PrepareJumpPostureConstructionDeclared
    >;
    /*
     * The native bare-leaf source, aligned to exactly the same phase
     * boundaries.
     */
    playback: HumanPreparedPlayback.ISource;
  }

  /*
   * The ground writers and exact same-instant fit producers for the same jump.
   */
  export interface IGround {
    /*
     * Push posture without a bare display fit transfer.
     */
    before: IAutoMovieMotionHumanActionPlan["posture"];
    /*
     * Landing posture without a bare display fit transfer.
     */
    after: IAutoMovieMotionHumanActionPlan["posture"];
    /*
     * Push clearance and its current same-instant leg fit.
     */
    sampleBefore: HumanPreparedPlayback.IPhase["sample"];
    /*
     * Landing clearance and its current same-instant leg fit.
     */
    sampleAfter: HumanPreparedPlayback.IPhase["sample"];
  }

  /*
   * Own placement's original exact refusal-location wrapper, without sampling.
   */
  export function located(
    source: IAutoMovieMotionHumanActionPlan["posture"],
    where: IAutoMovieMotionHumanRefusal.IWhere,
  ): IAutoMovieMotionHumanActionPlan["posture"] {
    const placed: IAutoMovieMotionHumanActionPlan["posture"] = (
      seconds: number,
      channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      evaluation?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[4],
    ): IAutoMovieMotionHumanPosture =>
      AutoMovieMotionHumanRefusal.located(
        where,
        (): IAutoMovieMotionHumanPosture =>
          source(seconds, channels, resolution, projection, evaluation),
      );
    return placed;
  }

  /*
   * The alternatives of `PrepareJumpPostureConstructionDeclared`'s site.
   */
  type PrepareJumpPostureConstructionDeclared = "flight" | "airborne";
}
