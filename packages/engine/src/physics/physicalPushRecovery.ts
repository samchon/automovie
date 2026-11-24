// Ported from IHMC Open Robotics Software, tag 201903_Stable (Apache-2.0):
// ihmc-common-walking-control-modules/src/main/java/us/ihmc/
// commonWalkingControlModules/captureRegion/PushRecoveryControlModule.java,
// constants l.29, l.96 and l.101, initializeParametersForDoubleSupportPushRecovery
// l.132-135, updateForDoubleSupport l.137-183, updateForSingleSupport
// l.185-195, computePreferredSwingTimeForRecovering l.197-220,
// checkAndUpdateFootstep l.231-281 and reset l.294-301. See NOTICE.
import { physicalFootstepAdjustor } from "./physicalFootstepAdjustor";
import { physicalGlitchFilter as Glitch } from "./physicalGlitchFilter";
import { physicalOneStepCaptureRegion } from "./physicalOneStepCaptureRegion";
import { physicalPlanarPolygon as Polygon } from "./physicalPlanarPolygon";

/**
 * IHMC's push recovery from 201903, the last release whose walking controller
 * steps out of double support on a push (`WalkingHighLevelHumanoidController`
 * l.390-410, `DoubSuppToSingSuppCond4DistRecov`): the decision to step and
 * which foot swings, and the footstep's placement in the one-step capture
 * region as the swing goes. Each operation takes the module's state and returns
 * the next; none writes its input.
 *
 * The rule's only input that names a body is a foot's side, so a body of more
 * than two feet reuses it over its contact polygon and its feet's centroids.
 */
export namespace physicalPushRecovery {
  /** The module's state across controller updates. */
  export interface IState {
    /** A footstep has been projected into the capture region this swing. */
    recovering: boolean;

    /** The swing is a recovery from a fall out of double support. */
    fall: boolean;

    /**
     * The capture point is back within reach of its plan, filtered over the
     * time of `SAFE_WINDOW` reference updates.
     */
    safe: Glitch.IState;

    /** The capture point's error from its plan exceeds `ICP_ERROR_THRESHOLD`. */
    large: boolean;
  }

  /**
   * The capture point's error from its plan past which a push is a fall, metres
   * (l.96).
   */
  export const ICP_ERROR_THRESHOLD: number = 0.05;

  /**
   * The swing time left below which a footstep is not planned again, seconds
   * (l.29).
   */
  export const MINIMUM_TIME_TO_REPLAN: number = 0.1;

  /**
   * The reference controller's updates the capture point must stay back in
   * for the robot to be safe (l.101).
   */
  export const SAFE_WINDOW: number = 100;

  /**
   * A new module: not recovering, not safe (l.101, l.294-301).
   *
   * @returns The state.
   */
  export function initial(): IState {
    return { recovering: false, fall: false, safe: Glitch.set(), large: false };
  }

  /**
   * The double-support update (l.137-183): with the capture point outside the
   * support polygon and its error from the plan over the threshold, the foot
   * whose outline's centroid is nearer it stays and the other swings; otherwise
   * the robot counts toward safe.
   *
   * @param input The state, the capture point and its plan, the support
   *   polygon, clockwise, and each foot's centroid by its bone, all in one
   *   horizontal frame, a biped's two feet left first, which wins a tie
   *   (l.180); and this controller's period and the reference controller's,
   *   seconds, which keep the safe window's time (`physicalGlitchFilter
   *   .ticks`).
   * @returns The next state and the bone to swing, the foot other than the
   *   closest, if the robot is falling.
   */
  export function doubleSupport(input: {
    state: Readonly<IState>;
    capture: Polygon.IPoint;
    desired: Polygon.IPoint;
    support: readonly Polygon.IPoint[];
    feet: readonly { bone: string; centroid: Polygon.IPoint }[];
    dt: number;
    period: number;
  }): { state: IState; swing?: string } {
    const large: boolean =
      Math.hypot(
        input.desired.x - input.capture.x,
        input.desired.y - input.capture.y,
      ) > ICP_ERROR_THRESHOLD;
    const outside: boolean = !Polygon.inside(input.support, input.capture);
    if (!outside || !large)
      return {
        state: {
          ...input.state,
          large,
          safe: Glitch({
            state: input.state.safe,
            value: true,
            window: Glitch.ticks(SAFE_WINDOW, input.period, input.dt),
          }),
        },
      };

    // The closest foot to the capture point, the first of equals, stays
    // (l.169-182).
    let closest: { bone: string; distance: number } | undefined;
    for (const foot of input.feet) {
      const distance: number = Math.hypot(
        input.capture.x - foot.centroid.x,
        input.capture.y - foot.centroid.y,
      );
      if (!closest || distance < closest.distance)
        closest = { bone: foot.bone, distance };
    }
    const stays: string | undefined = closest?.bone;
    const swing: string | undefined =
      stays !== undefined
        ? input.feet.find(
            (foot: { bone: string; centroid: Polygon.IPoint }): boolean =>
              foot.bone !== stays,
          )?.bone
        : undefined;
    return {
      state: { ...input.state, large, safe: Glitch.set(false) },
      ...(swing !== undefined ? { swing } : {}),
    };
  }

  /**
   * The single-support update (l.185-195): whether the capture point's error
   * from its plan exceeds the threshold.
   *
   * @param input The state, the capture point and its plan.
   * @returns The next state.
   */
  export function singleSupport(input: {
    state: Readonly<IState>;
    capture: Polygon.IPoint;
    desired: Polygon.IPoint;
  }): IState {
    return {
      ...input.state,
      large:
        Math.hypot(
          input.desired.x - input.capture.x,
          input.desired.y - input.capture.y,
        ) > ICP_ERROR_THRESHOLD,
    };
  }

  /** A recovery from double support begins (l.132-135). */
  export function fall(state: Readonly<IState>): IState {
    return { ...state, fall: true };
  }

  /** The module reset when its swing ends (l.294-301). */
  export function reset(state: Readonly<IState>): IState {
    return { ...state, recovering: false, fall: false };
  }

  /**
   * What `checkAndUpdateFootstep` reads of the support foot and the capture
   * point.
   */
  export interface IRegion {
    /** The support foot's side; the reachable region opens to the other. */
    support: "left" | "right";

    /** The capture point in the support sole's frame. */
    capture: Polygon.IPoint;

    /** The pendulum's rate, per second. */
    omega: number;

    /** The support foot's clockwise outline in its sole's frame. */
    foot: readonly Polygon.IPoint[];

    /** The foot width, metres. */
    footWidth: number;

    /** The kinematic step range, metres. */
    range: number;
  }

  /**
   * The swing time a recovery prefers (l.197-220): the time left, reduced by
   * tenths of it while the one-step capture region is empty; the time left
   * itself when it is within one controller update.
   *
   * @param input The swing time left, seconds, the controller's update period,
   *   seconds, and the region's inputs.
   * @returns The preferred time, seconds; negative when no time gives a region,
   *   as the reference's loop leaves it.
   */
  export function preferredSwingTime(input: {
    remaining: number;
    dt: number;
    region: Readonly<IRegion>;
  }): number {
    if (input.remaining <= input.dt) return input.remaining;
    let preferred: number = input.remaining;
    for (; preferred >= 0; preferred -= input.remaining / 10)
      if (
        physicalOneStepCaptureRegion({
          ...input.region,
          remaining: preferred,
        }).length > 0
      )
        break;
    return preferred;
  }

  /**
   * The footstep checked against the one-step capture region and projected into
   * it once per recovery (l.231-281): not while the capture point's error is
   * small, which counts toward safe, nor within `MINIMUM_TIME_TO_REPLAN` of
   * touchdown, nor again once projected.
   *
   * @param input The state, the swing time left, seconds, one second when
   *   unknown (l.239-240), the controller's update period and the reference
   *   controller's, seconds, the region's inputs, the footstep's position and
   *   the swing foot's outline placed at it, in the support sole's frame.
   * @returns The next state, the footstep's position, whether it moved, and the
   *   capture region at the preferred swing time.
   */
  export function checkAndUpdate(input: {
    state: Readonly<IState>;
    remaining?: number;
    dt: number;
    period: number;
    region: Readonly<IRegion>;
    position: Polygon.IPoint;
    outline: readonly Polygon.IPoint[];
  }): {
    state: IState;
    position: Polygon.IPoint;
    adjusted: boolean;
    region: Polygon.IPoint[];
  } {
    const remaining: number = input.remaining ?? 1.0;
    const preferred: number = preferredSwingTime({
      remaining,
      dt: input.dt,
      region: input.region,
    });
    const region: Polygon.IPoint[] = physicalOneStepCaptureRegion({
      ...input.region,
      remaining: preferred,
    });
    const kept = (state: IState): ReturnType<typeof checkAndUpdate> => ({
      state,
      position: { ...input.position },
      adjusted: false,
      region,
    });
    if (!input.state.large)
      return kept({
        ...input.state,
        safe: Glitch({
          state: input.state.safe,
          value: true,
          window: Glitch.ticks(SAFE_WINDOW, input.period, input.dt),
        }),
      });
    if (remaining < MINIMUM_TIME_TO_REPLAN) return kept({ ...input.state });
    if (input.state.recovering) return kept({ ...input.state });
    const adjusted: physicalFootstepAdjustor.IResult = physicalFootstepAdjustor(
      {
        position: input.position,
        outline: input.outline,
        support: Polygon.centroid(input.region.foot),
        region,
      },
    );
    if (!adjusted.adjusted) return kept({ ...input.state });
    return {
      state: { ...input.state, safe: Glitch.set(false), recovering: true },
      position: adjusted.position,
      adjusted: true,
      region,
    };
  }
}
