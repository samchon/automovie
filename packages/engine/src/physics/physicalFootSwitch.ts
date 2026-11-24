// Ported from IHMC Open Robotics Software (Apache-2.0):
// ihmc-common-walking-control-modules/src/main/java/us/ihmc/
// commonWalkingControlModules/sensors/footSwitch/WrenchBasedFootSwitch.java
// (develop), the filters l.121-129, update() l.145-199 and reset() l.213-217;
// thresholds from zulu/.../ZuluWalkingControllerParameters.java l.811-818.
// Version mix: the rest of the push-recovery path is ported from tag
// 201903_Stable, whose WrenchBasedFootSwitch tests the centre of pressure
// against a fraction of the foot's length instead; this class and its Zulu
// values both come from develop, so they are taken together. See NOTICE.
import { physicalGlitchFilter as Glitch } from "./physicalGlitchFilter";
import { physicalPlanarPolygon as Polygon } from "./physicalPlanarPolygon";

/**
 * One update of IHMC's wrench-based foot switch, which decides a swing foot's
 * touchdown from its measured contact (`physicalBipedTouchdown`): the foot
 * has hit the ground when its normal force passes the low threshold on two
 * successive updates while its centre of pressure lies inside its outline by
 * the threshold distance on three, or when the force passes the high threshold;
 * that decision is itself filtered over two updates.
 *
 * The centre of pressure counts only once the normal force reaches
 * `MINIMUM_FORCE`, as the reference resolves it only then (l.175-179); a
 * threshold distance that is not a number disables the test (l.182-187). The
 * reference's windows count its controller's updates, so each keeps its time
 * here: its count times the reference's period, in this controller's updates
 * (`physicalGlitchFilter.ticks`).
 *
 * @param input The switch's state, the foot's normal force, newtons, its
 *   measured centre of pressure on the floor in a horizontal frame, if any, the
 *   foot's contact outline in the same frame, this controller's period and the
 *   reference controller's, seconds, and the thresholds, the Zulu values by
 *   default.
 * @returns The state after the update, whose `hit.value` is whether the foot
 *   has hit the ground; the input is never written.
 */
export function physicalFootSwitch(input: {
  state: Readonly<physicalFootSwitch.IState>;
  force: number;
  pressure?: Polygon.IPoint;
  outline: readonly Polygon.IPoint[];
  dt: number;
  period: number;
  thresholds?: Partial<physicalFootSwitch.IThresholds>;
}): physicalFootSwitch.IState {
  const window = (count: number): number =>
    Glitch.ticks(count, input.period, input.dt);
  const thresholds: physicalFootSwitch.IThresholds = {
    ...physicalFootSwitch.ZULU,
    ...input.thresholds,
  };
  const low: Glitch.IState = Glitch({
    state: input.state.low,
    value: input.force > thresholds.low,
    window: window(physicalFootSwitch.LOW_WINDOW),
  });
  const high: boolean = input.force > thresholds.high;

  // The centre of pressure is resolved only above the minimum force, and
  // tested by its signed distance into the outline (l.175-194).
  let cop: Glitch.IState;
  if (Number.isNaN(thresholds.distance)) cop = Glitch.set(true);
  else {
    const resolved: Polygon.IPoint =
      Math.max(0, input.force) >= physicalFootSwitch.MINIMUM_FORCE &&
      input.pressure
        ? input.pressure
        : { x: Number.NaN, y: Number.NaN };
    cop = Glitch({
      state: input.state.cop,
      value:
        Polygon.signedDistance(input.outline, resolved) < -thresholds.distance,
      window: window(physicalFootSwitch.COP_WINDOW),
    });
  }
  const hit: Glitch.IState = Glitch({
    state: input.state.hit,
    value: (low.value && cop.value) || high,
    window: window(physicalFootSwitch.HIT_WINDOW),
  });
  return { low, cop, hit };
}

/** The foot switch's state, thresholds and constants. */
export namespace physicalFootSwitch {
  /** The switch's three filters. */
  export interface IState {
    /** The normal force past the low threshold, filtered. */
    low: Glitch.IState;

    /** The centre of pressure inside the outline by the threshold, filtered. */
    cop: Glitch.IState;

    /** The foot has hit the ground, filtered: the switch's output. */
    hit: Glitch.IState;
  }

  /** The switch's thresholds. */
  export interface IThresholds {
    /**
     * The low normal force, newtons, which counts with a valid centre of
     * pressure.
     */
    low: number;

    /** The high normal force, newtons, which counts alone. */
    high: number;

    /**
     * How far inside the outline the centre of pressure must lie, metres; not a
     * number disables the test.
     */
    distance: number;
  }

  /**
   * Zulu's thresholds: a 50 N contact force, a 4 mm centre-of-pressure distance
   * and a 75 N force ignoring the centre of pressure
   * (ZuluWalkingControllerParameters l.814-816).
   */
  export const ZULU: Readonly<IThresholds> = {
    low: 50,
    high: 75,
    distance: 4.0e-3,
  };

  /**
   * The normal force below which no centre of pressure is resolved, newtons
   * (l.37).
   */
  export const MINIMUM_FORCE: number = 5.0;

  /** The low force's filter window, the reference's updates (l.122). */
  export const LOW_WINDOW: number = 2;

  /**
   * The centre-of-pressure test's filter window, the reference's updates
   * (l.125).
   */
  export const COP_WINDOW: number = 3;

  /** The output's filter window, the reference's updates (l.129). */
  export const HIT_WINDOW: number = 2;

  /**
   * A new switch, every filter false.
   *
   * @returns The state.
   */
  export function initial(): IState {
    return { low: Glitch.set(), cop: Glitch.set(), hit: Glitch.set() };
  }

  /**
   * The switch reset at a swing's start, as the single-support state does on
   * entry: the centre-of-pressure filter set false (l.213-217), the others
   * kept.
   *
   * @param state The state.
   * @returns The reset state, a new one.
   */
  export function reset(state: Readonly<IState>): IState {
    return { ...state, cop: Glitch.set(false) };
  }
}
