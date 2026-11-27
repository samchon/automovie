// Ported from IHMC Open Robotics Software (Apache-2.0), 201903_Stable:
// ihmc-common-walking-control-modules/src/main/java/us/ihmc/
// commonWalkingControlModules/capturePoint/ContinuousCMPBasedICPPlanner.java
// initializeForStanding l.321-330, initializeForTransfer l.334-347,
// initializeForSingleSupport l.372-392, updateTransferPlan l.397-414,
// updateSingleSupportPlan l.418-434, compute l.452-502,
// initializeTransferTrajectory l.504-621 and initializeSwingTrajectory
// l.667-718; AbstractICPPlanner.java initializeParameters l.204-213,
// decayDesiredVelocityIfNeeded l.287-306, getCurrentStateDuration l.499-505
// and isDone l.643-650; ICPPlannerTrajectoryGenerator.java l.39-105;
// ReferenceCentroidalMomentumPivotLocationsCalculator.java
// computeReferenceCMPsStartingFromDoubleSupport l.322-389 and
// computeReferenceCMPsStartingFromSingleSupport l.391-439;
// BalanceManager.java l.234, l.265, l.656-700 and
// requestICPPlannerToHoldCurrentCoM l.815-829;
// WalkingSingleSupportState.java onEntry l.202-274;
// highLevelHumanoidControl/.../TransferToStandingState.java l.42, l.64-71
// and l.73-117; StandingState.java onEntry l.82-93. Parameters cited on
// `DEFAULTS`.
import { AutoMovieEnginePhysicalIcpPlannerCmps as Cmps } from "./AutoMovieEnginePhysicalIcpPlannerCmps";
import { AutoMovieEnginePhysicalIcpPlannerSegments as Segments } from "./AutoMovieEnginePhysicalIcpPlannerSegments";
import { AutoMovieEnginePhysicalIcpPlannerTools as Tools } from "./AutoMovieEnginePhysicalIcpPlannerTools";
import { AutoMovieEnginePhysicalPlanarPolygon as Polygon } from "./AutoMovieEnginePhysicalPlanarPolygon";


/** The planner's plans, parameters and builders.
 * @see https://github.com/ihmcrobotics/ihmc-open-robotics-software/blob/201903_Stable/ihmc-common-walking-control-modules/src/main/java/us/ihmc/commonWalkingControlModules/capturePoint/ContinuousCMPBasedICPPlanner.java
 */
export namespace AutoMovieEnginePhysicalIcpPlanner {
  /**
   * The desired capture point and its rate a time into a plan of IHMC's 201903
   * `ContinuousCMPBasedICPPlanner`, and whether the plan's state is done
   * (`compute` l.452-502, `isDone` l.643-650): the capture point and rate the ICP
   * controller tracks (`AutoMovieEnginePhysicalIcpController`).
   *
   * A one-step recovery runs three plans, made by the namespace's builders as the
   * 201903 walking states make them:
   *
   * 1. `singleSupport`, at the recovery step's start: two pivots on the support
   *    foot, then the final pivot between it and the landing foot.
   * 2. `toStanding`, at touchdown: the capture point held at the centre of mass
   *    projected into the feet's support shrunk by 8 cm, for the final transfer;
   *    `toStandingDone` is the state's exit test.
   * 3. `standing`, after it: the double-support cubic from the held point over the
   *    final transfer, to a target the caller gives. The reference's target is
   *    the final pivot between the feet; in this engine the authored motion plays
   *    the planner's role while standing, so the caller passes the authored
   *    capture point and rate as STANDING begins, and after the cubic the caller
   *    follows the live authored capture point.
   *
   * The rate decays linearly once a state is done when a decay duration is given
   * (l.287-306), never by default; only single support has a rate past its end,
   * so the reference's standing exemption changes nothing.
   *
   * The plan's points ride on the frames the reference attaches them to: the
   * support sole and the world in single support (l.701), the mid-feet frame or
   * the transfer-from sole and the mid-feet frame in double support (l.517-538,
   * l.616-618, `ICPPlannerTrajectoryGenerator` l.44-64, l.80-85). Each update
   * takes the soles as they are now, so a slipping stance foot carries the plan.
   * Points are world floor points (x, z), metres; times seconds since the plan
   * was made.
   *
   * @param plan The plan.
   * @param time The time since the plan was made, seconds.
   * @param soles The left and right sole frames now.
   * @returns The desired capture point, its rate, and whether the state's
   *   duration has run out.
   */
  export function compute(
    plan: IPlan,
    time: number,
    soles: ISoles,
  ): IOutput {
    return computePlan(plan, time, soles);
  }
  /** The two sole frames on the floor. */
  export interface ISoles {
    /** The left sole. */
    left: Polygon.IFrame;

    /** The right sole. */
    right: Polygon.IFrame;
  }

  /** A frame a double-support plan's end rides on. */
  export type IAttachment = "left" | "right" | "midFeet";

  /** A single-support plan with two pivots per support. */
  export interface ISinglePlan {
    /** The variant. */
    kind: "single";

    /** The support foot, whose sole the plan rides on. */
    side: "left" | "right";

    /** The swing duration, the state's duration, seconds. */
    duration: number;

    /** The rate's decay duration once done, seconds; undefined for none. */
    decay: number | undefined;

    /** The segmented trajectory. */
    segments: Segments.ISegments;
  }

  /** A double-support plan: the hold before standing, or standing. */
  export interface ITransferPlan {
    /** The variant. */
    kind: "transfer";

    /** The transfer duration, the state's duration, seconds. */
    duration: number;

    /** The rate's decay duration once done, seconds; undefined for none. */
    decay: number | undefined;

    /** The cubic's duration, the transfer's, seconds. */
    cubicDuration: number;

    /** The cubic's start, in the coordinates of the frame it rides on. */
    initial: ITransferPlanInitial;

    /** The cubic's end, likewise. */
    final: ITransferPlanFinal;

    /**
     * The mid-feet frame as the plan was made, whose forward axis the mid-feet
     * frame keeps if the soles ever coincide.
     */
    fallback: Polygon.IFrame;
  }

  /** The final object of {@link ITransferPlan}. */
  export type ITransferPlanFinal = { frame: IAttachment; state: Tools.IAttached };

  /** The initial object of {@link ITransferPlan}. */
  export type ITransferPlanInitial = { frame: IAttachment; state: Tools.IAttached };

  /** A plan. */
  export type IPlan = ISinglePlan | ITransferPlan;

  /** The planner's output a time into a plan. */
  export interface IOutput {
    /** The desired capture point, world floor, metres. */
    position: Tools.IFloor;

    /** Its rate, metres per second. */
    velocity: Tools.IFloor;

    /** Whether the state's duration has run out (`isDone`). */
    done: boolean;
  }

  /** The planner's parameters. */
  export interface IParameters extends Cmps.IParameters {
    /** The swing duration, seconds. */
    swing: number;

    /** The step's transfer duration, seconds. */
    transfer: number;

    /** The final transfer duration, seconds. */
    finalTransfer: number;

    /** The share of a transfer spent before its entry corner point. */
    transferSplit: number;

    /** The share of a swing spent on the entry pivot. */
    swingSplit: number;

    /** The longest cubic across the pivot switch, seconds. */
    maximumSplineDuration: number;

    /** The least time on the exit pivot, seconds. */
    minimumTimeOnExit: number;

    /** The rate's decay duration once done, seconds; undefined for none. */
    velocityDecay: number | undefined;

    /**
     * How far the support is shrunk before the centre of mass is projected for
     * the hold, metres.
     */
    holdShrink: number;

    /** The capture point error under which the hold ends, metres. */
    maxErrorToStanding: number;
  }

  /**
   * The parameters, with their sources (201903_Stable unless noted; model scale
   * 1):
   *
   * | Parameter               | Value           | Source                                                                               |
   * | ----------------------- | --------------- | ------------------------------------------------------------------------------------ |
   * | two pivots per support  | 2 way points    | Atlas `AtlasContinuousCMPPlannerParameters` l.24, l.56-59 (abstract in the code)     |
   * | exit pivot name         | `EXIT_COP`      | Atlas l.66 via `ContinuousCMPICPPlannerParameters` l.37 (abstract in the code)       |
   * | `entryOffset`           | (0, -0.005) m   | Atlas l.41 (abstract `CoPPlannerParameters` l.64)                                    |
   * | `exitOffset`            | (0, 0.025) m    | Atlas l.42                                                                           |
   * | `entryBounds`           | [0, 0.03] m     | Atlas l.78 (abstract `CoPPlannerParameters` l.50)                                    |
   * | `exitBounds`            | [-0.04, 0.08] m | Atlas l.79                                                                           |
   * | `swing`                 | 0.60 s          | Zulu `ZuluWalkingControllerParameters` l.709-712 (develop; abstract in 201903 l.333) |
   * | `transfer`              | 0.25 s          | Zulu l.703-706 (develop; abstract in 201903 l.327)                                   |
   * | `finalTransfer`         | 0.25 s          | `WalkingControllerParameters` l.349-352: the default transfer                        |
   * | `transferSplit`         | 0.5             | `ContinuousCMPICPPlannerParameters` l.67-71                                          |
   * | `swingSplit`            | 0.5             | l.85-89                                                                              |
   * | `maximumSplineDuration` | 0.5 s           | l.109-112                                                                            |
   * | `stepLengthFactor`      | 1/3             | l.48-49 and l.93-98, the exit pivot's (calculator l.217)                             |
   * | `minimumTimeOnExit`     | 0 s             | `AbstractICPPlannerParameters` l.49-52                                               |
   * | `velocityDecay`         | none            | l.56-59, not a number there                                                          |
   * | `safeDistance`          | 0.01 m          | l.62-66                                                                              |
   * | `chicken`               | 0.5             | `ReferenceCentroidalMomentumPivotLocationsCalculator` l.186-187                      |
   * | `holdShrink`            | 0.08 m          | `BalanceManager` l.265                                                               |
   * | `maxErrorToStanding`    | 0.025 m         | `TransferToStandingState` l.42                                                       |
   *
   * The number of footsteps considered (code default 3,
   * `AbstractICPPlannerParameters` l.21-24) does not change a one-step plan;
   * the toe placements stay off (`putExitCoPOnToes` false, l.69-73) and never
   * apply to a last step.
   */
  export const DEFAULTS: Readonly<IParameters> = {
    entryOffset: { x: 0.0, y: -0.005 },
    exitOffset: { x: 0.0, y: 0.025 },
    entryBounds: { min: 0.0, max: 0.03 },
    exitBounds: { min: -0.04, max: 0.08 },
    swing: 0.6,
    transfer: 0.25,
    finalTransfer: 0.25,
    transferSplit: 0.5,
    swingSplit: 0.5,
    maximumSplineDuration: 0.5,
    stepLengthFactor: 1.0 / 3.0,
    minimumTimeOnExit: 0.0,
    velocityDecay: undefined,
    safeDistance: 0.01,
    chicken: 0.5,
    holdShrink: 0.08,
    maxErrorToStanding: 0.025,
  };

  /**
   * The single-support plan of a recovery step from standing, the one step in
   * the plan (`WalkingSingleSupportState.onEntry` l.202-274,
   * `initializeForSingleSupport` l.372-392): the support foot's entry pivot
   * with no earlier transfer (l.413-414) and its exit pivot toward the step,
   * the final pivot between the support foot and the step (l.428-436), the
   * step's transfer and the final transfer after it (l.382-387), the corner
   * points backward from the final pivot (`initializeSwingTrajectory`
   * l.667-707), and the segmented trajectory from the initial capture point,
   * the transfer's share after its split into the entry pivot's divergence.
   *
   * @param input The support foot, the step's foot as it will land, omega and
   *   the parameters.
   * @returns The plan; time zero is the step's start.
   */
  export function singleSupport(input: {
    support: Cmps.IFoot;
    footstep: Cmps.IFoot;
    omega: number;
    parameters?: Partial<IParameters>;
  }): ISinglePlan {
    const p: IParameters = { ...DEFAULTS, ...input.parameters };
    const entry: Tools.IFloor = Cmps.entry(input.support, p);
    const exit: Tools.IFloor = Cmps.exit(
      input.support,
      Cmps.centroid(input.footstep),
      p,
    );
    const final: Tools.IFloor = Cmps.between(input.support, input.footstep, p);

    // One step with three steps considered: no swing after it, the final
    // transfer after it, and the final pivot repeated (l.489-495).
    const corners = Tools.cornerPoints({
      entries: [entry, final, final],
      exits: [exit, final, final],
      swings: [p.swing, undefined, undefined],
      swingSplits: [p.swingSplit, 0, 0],
      transfers: [p.transfer, p.finalTransfer, 0, 0],
      transferSplits: [p.transferSplit, p.transferSplit, 0, 0],
      count: 2,
      omega: input.omega,
    });
    const initialIcp: Tools.IFloor = Tools.capturePoint(
      input.omega,
      p.transfer * (1.0 - p.transferSplit),
      corners.entries[0]!,
      entry,
    ).position;
    return {
      kind: "single",
      side: input.support.side,
      duration: p.swing,
      decay: p.velocityDecay,
      segments: Segments.initialize({
        omega: input.omega,
        onInitial: p.swing * p.swingSplit,
        onFinal: p.swing * (1.0 - p.swingSplit),
        maximumSplineDuration: p.maximumSplineDuration,
        minimumTimeOnFinal: p.minimumTimeOnExit,
        initialIcp,
        finalCorner: corners.exits[0]!,
        initialCmp: entry,
        finalCmp: exit,
        sole: input.support.frame,
      }),
    };
  }

  /**
   * The hold after a recovery step lands (`TransferToStandingState.onEntry`
   * l.73-117, `BalanceManager.initializeICPPlanForTransferToStanding`
   * l.688-700): the centre of mass projected onto both feet's support shrunk by
   * `holdShrink` (`requestICPPlannerToHoldCurrentCoM` l.815-829) is held at
   * rest for the final transfer (`initializeTransferTrajectory` l.543-555,
   * l.611-620). The hold's start rides on the mid-feet frame or on the
   * transfer-from sole, the step's support sole, whichever origin the last
   * desired capture point is nearer (l.524-537); its end on the mid-feet frame
   * (l.538). The support is built in the left sole's frame, a rigid copy of the
   * reference's mid-feet one.
   *
   * @param input The two feet in contact, the step's support side, the last
   *   desired capture point of single support, the centre of mass on the floor
   *   and the parameters.
   * @returns The plan; time zero is the touchdown.
   */
  export function toStanding(input: {
    feet: { left: Cmps.IFoot; right: Cmps.IFoot };
    support: "left" | "right";
    desired: Tools.IFloor;
    center: Tools.IFloor;
    parameters?: Partial<IParameters>;
  }): ITransferPlan {
    const p: IParameters = { ...DEFAULTS, ...input.parameters };
    const { left, right } = input.feet;
    const support: Polygon.IPoint[] = Polygon.hull([
      ...left.polygon,
      ...right.polygon.map(
        (v: Polygon.IPoint): Polygon.IPoint =>
          Polygon.local(left.frame, Polygon.world(right.frame, v)),
      ),
    ]);
    const hold: Tools.IFloor = Polygon.world(
      left.frame,
      Polygon.project(
        Polygon.shrink(support, p.holdShrink),
        Polygon.local(left.frame, input.center),
      ),
    );
    const soles: ISoles = { left: left.frame, right: right.frame };
    const middle: Polygon.IFrame = Tools.midFeet(left.frame, right.frame, {
      origin: { x: 0, z: 0 },
      forward: { x: 1, z: 0 },
    });
    const distance = (frame: Polygon.IFrame): number =>
      Math.hypot(
        input.desired.x - frame.origin.x,
        input.desired.z - frame.origin.z,
      );
    const initial: IAttachment =
      distance(middle) < distance(soles[input.support])
        ? "midFeet"
        : input.support;
    const rest: Tools.IState = { position: hold, velocity: { x: 0, z: 0 } };
    return transfer(p, soles, middle, initial, rest, rest);
  }

  /**
   * The hold's exit test (`TransferToStandingState.isDone` l.64-71): the plan
   * done and the capture point within `maxErrorToStanding` of the desired one.
   *
   * @param input The planner's output this update, the measured capture point
   *   on the floor and the parameters.
   * @returns Whether to stand.
   */
  export function toStandingDone(input: {
    output: IOutput;
    capture: Tools.IFloor;
    parameters?: Partial<IParameters>;
  }): boolean {
    const p: IParameters = { ...DEFAULTS, ...input.parameters };
    if (!input.output.done) return false;
    return (
      Math.hypot(
        input.capture.x - input.output.position.x,
        input.capture.z - input.output.position.z,
      ) < p.maxErrorToStanding
    );
  }

  /**
   * The standing plan (`StandingState.onEntry` l.82-93, `initializeForStanding`
   * l.321-330, `initializeTransferTrajectory` l.556-564, l.616-620): the
   * double-support cubic from the desired capture point and rate the previous
   * plan last gave to a target capture point and rate, over the final transfer,
   * both ends on the mid-feet frame (l.520-523, l.538).
   *
   * The reference's target is the final pivot between the feet at rest
   * (`AutoMovieEnginePhysicalIcpPlannerCmps.between` with the right foot first, l.345-350,
   * l.399-401). In this engine the authored motion plays the planner's role
   * while standing, so the target is the caller's: the authored capture point
   * and rate when STANDING begins. After the cubic's end the plan rests at that
   * target (`VelocityConstrainedPositionTrajectoryGenerator` l.207-213);
   * following the live authored capture point from then on is the caller's.
   *
   * @param input The sole frames as STANDING begins; the previous plan's last
   *   output, fixed at the state's start; the target capture point and rate;
   *   and the parameters.
   * @returns The plan; time zero is the state's start.
   */
  export function standing(input: {
    soles: ISoles;
    from: Tools.IState;
    to: Tools.IState;
    parameters?: Partial<IParameters>;
  }): ITransferPlan {
    const p: IParameters = { ...DEFAULTS, ...input.parameters };
    const middle: Polygon.IFrame = Tools.midFeet(
      input.soles.left,
      input.soles.right,
      { origin: { x: 0, z: 0 }, forward: { x: 1, z: 0 } },
    );
    return transfer(p, input.soles, middle, "midFeet", input.from, input.to);
  }
}

function computePlan(
  plan: AutoMovieEnginePhysicalIcpPlanner.IPlan,
  time: number,
  soles: AutoMovieEnginePhysicalIcpPlanner.ISoles,
): AutoMovieEnginePhysicalIcpPlanner.IOutput {
  let output: Tools.IState;
  if (plan.kind === "single")
    output = Segments.compute(plan.segments, time, soles[plan.side]);
  else {
    // The cubic's ends carried to where their frames now are (l.80-85).
    const middle: Polygon.IFrame = Tools.midFeet(
      soles.left,
      soles.right,
      plan.fallback,
    );
    const carry = (end: AutoMovieEnginePhysicalIcpPlanner.ITransferPlan["initial"]) =>
      Tools.detach(
        end.frame === "midFeet" ? middle : soles[end.frame],
        end.state,
      );
    const from: Tools.IState = carry(plan.initial);
    const to: Tools.IState = carry(plan.final);
    output = Tools.cubic(
      {
        duration: plan.cubicDuration,
        initial: from.position,
        initialVelocity: from.velocity,
        final: to.position,
        finalVelocity: to.velocity,
      },
      time,
    );
  }
  const remaining: number = plan.duration - time;

  // The rate's linear decay once done (l.287-306).
  let velocity: Tools.IFloor = output.velocity;
  if (plan.decay !== undefined && -remaining > 0.0) {
    const factor: number = Math.min(
      Math.max(1.0 - -remaining / plan.decay, 0.0),
      1.0,
    );
    velocity = { x: velocity.x * factor, z: velocity.z * factor };
  }
  return {
    position: output.position,
    velocity,
    done: remaining <= 0.0,
  };
}

/**
 * A double-support plan over the final transfer (l.611-620): the double-support
 * cubic between two capture points and rates (`ICPPlannerTrajectoryGenerator`
 * l.39-105), its start attached to the given frame and its end to the mid-feet
 * frame (`setInitialConditions` and `setFinalConditions` l.44-64). The
 * reference builds its first mid-feet frame on an identity rotation, the
 * fallback's world-forward axis.
 */
function transfer(
  p: AutoMovieEnginePhysicalIcpPlanner.IParameters,
  soles: AutoMovieEnginePhysicalIcpPlanner.ISoles,
  middle: Polygon.IFrame,
  initial: AutoMovieEnginePhysicalIcpPlanner.IAttachment,
  from: Tools.IState,
  to: Tools.IState,
): AutoMovieEnginePhysicalIcpPlanner.ITransferPlan {
  const frame = (attachment: AutoMovieEnginePhysicalIcpPlanner.IAttachment): Polygon.IFrame =>
    attachment === "midFeet" ? middle : soles[attachment];
  return {
    kind: "transfer",
    duration: p.finalTransfer,
    decay: p.velocityDecay,
    cubicDuration: p.finalTransfer,
    initial: { frame: initial, state: Tools.attach(frame(initial), from) },
    final: { frame: "midFeet", state: Tools.attach(middle, to) },
    fallback: middle,
  };
}
