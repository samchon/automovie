import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import type { physicalStanceDemand } from "./physicalStanceDemand";

/**
 * The stance balance of a body under internal actuation: the support wrench
 * that holds an inverted pendulum about a commanded centre of pressure, and
 * where on the planted feet it is borne.
 *
 * - State: the extrapolated centre of mass xi = c + v / omega, omega = sqrt(g /
 *   z0), with z0 the authored pose's centre-of-mass height, moves as xi' =
 *   omega (xi - u) about the centre of pressure u (Hof, Gazendam and Sinke
 *   2005, Eqs. 2-3, 6).
 * - Command: u = xi + k (xi - xi_ref), which returns xi to xi_ref (Pratt et al.,
 *   M2V2, Eq. 1). xi_ref is the authored centre of mass over the planted
 *   polygon, clamped into it. The centre of pressure is kept on the support
 *   polygon shrunk by a margin, off the feet's edges (M2V2, footnote 2), and
 *   where no foot carries more than its leg holds (`physicalLegCapacity`), and
 *   the support is shared between capture, the torso's moment and the command's
 *   convergence in that order (`allocate`).
 * - Wrench: the pendulum's horizontal force m omega^2 (c - u) through the
 *   allocated pivot u, the weight with a height servo held to a narrow band,
 *   and the moment the centre of pressure's offset from the pivot carries: the
 *   torso's servo moment with any swinging hip's reaction, or past the
 *   support's edge a hip strategy (Stephens 2011, Eqs. 5.23, 5.26; `hip`).
 * - Bearing: each planted foot bears on its outline latched at the planted pose
 *   and shrunk by the margin, so each foot's own centre of pressure stays
 *   inside its outline (Stephens 2011, Eqs. 5.6-5.7); an infeasible wrench
 *   gives up the horizontal force before the moment and the moment before the
 *   weight (Stephens 2011, Eq. 5.11).
 */
export namespace physicalStanceBalance {
  /**
   * The margin the commanded and the borne centres of pressure keep from the
   * planted outlines' edges, metres: twice the realized centre of pressure's
   * error from the command in quiet stance, about 0.01 m (Pratt et al., M2V2,
   * footnote 2, give the shrinking but no number).
   */
  export const MARGIN: number = 0.02;

  /**
   * The centre-of-pressure gain k, below one so the command reaches the
   * shrunken edge only past the in-place bound: k <= 1 - 2 MARGIN / b for the
   * smallest stance half-width b.
   */
  export const GAIN: number = 0.8;

  /** The height servo's band about the weight, as a share of it. */
  export const BAND: number = 0.2;

  /**
   * The centre-of-pressure integral's gain per 120 Hz control frame: a slow
   * pure integral on the error between commanded and realized centre of
   * pressure (Stephens 2011, Eq. 5.31, which gives 0.1 to 0.25).
   */
  export const INTEGRAL: number = 0.15;

  /**
   * How far a planted foot may rise before it no longer bears, and how far its
   * edge may lift before it is no longer seated, metres: the project's foot
   * lift verdict bound (`AutoMovieMotionHumanAuditLimits.lift`, 5 mm), not the
   * solver's momentary contact, which flickers on a loaded foot.
   */
  export const LIFT: number = 0.005;

  /**
   * The sole lift above which a seated foot is unseated and below which an
   * unseated one is seated again, metres, each held for `DWELL`: twice the
   * largest quiet-stance lift and twice that again (the canonical Human's 0.12
   * mm, the four-support primitive's 0.034 mm, from their P0 runs), but never
   * below the contact skin, `LIFT`, and half of it: an edge raised by less than
   * the skin still bears within it, so a creep of 0.1 degree over a 27 cm sole,
   * 0.47 mm, does not unseat it, nor does the solver's 0.1 mm contact tolerance
   * (derived).
   */
  export const UNSEAT: number = Math.max(4 * 0.00012, LIFT);

  /** The sole lift below which an unseated foot is seated again, metres. */
  export const RESEAT: number = Math.max(2 * 0.00012, LIFT / 2);

  /** The dwell of a seating change, seconds. */
  export const DWELL: number = 1 / 60;

  /**
   * How long a foot's bearing and flatness shares take to ramp fully in or out,
   * seconds: a contact change bounds the foot's normal force and draws its
   * centre-of-pressure rows in over this window instead of in one step, as
   * whole-body controllers bound a reaction force through a contact transition
   * (Kim, Jorgensen and Sentis 2018, WBDC). Six 120 Hz control frames (stated;
   * no source gives a number).
   */
  export const FADE: number = 0.05;

  /**
   * The time constant of a foot's measured load, seconds: one 120 Hz cache
   * frame, over which the floor's per-substep normal impulse is low-passed so a
   * single substep's contact flicker does not decide bearing.
   */
  export const LOAD_SECONDS: number = 1 / 120;

  /**
   * The measured load at which a foot starts bearing and below which it stops,
   * as shares of the body's weight: a hysteresis band on the normal force, as
   * contact detection from foot force thresholds it (stated; no source gives
   * numbers).
   */
  export const TOUCH: number = 0.05;

  /**
   * The measured load below which a bearing foot stops bearing, as a share of
   * the body's weight.
   */
  export const RELEASE: number = 0.025;

  /** The centre-of-pressure integral's persisted state. */
  export interface IIntegral {
    /** The bias added to the command, world metres. */
    bias: { x: number; z: number };
    /**
     * The centre of mass's horizontal acceleration, low-passed, metres per
     * second squared.
     */
    acceleration: { x: number; z: number };
    /** Its horizontal velocity at the previous call, metres per second. */
    velocity?: { x: number; z: number };
    /** The limb swinging at the previous call; a change resets the bias. */
    swing?: string;

    /** The last commanded centre of pressure, world metres. */
    command?: { x: number; z: number };
  }

  /**
   * Advance the centre-of-pressure integral: u_bias += K_i (u_cmd - u_real)
   * each control frame, the realized centre of pressure read from the pendulum,
   * u_real = c - c''/omega^2, with c'' low-passed over one frame (Stephens
   * 2011, Eq. 5.31). The bias stays within `MARGIN`, the margin the command
   * keeps from the edges; it is frozen while the command is clamped, while a
   * push lands, while a foot is not flat or a limb swings, and it is reset when
   * a swing starts or lands.
   *
   * @param input The integral's state and this step's balance.
   */
  export function integrate(input: {
    state: IIntegral;
    result: physicalStanceDemand.IResult;
    dt: number;
    frozen: boolean;
    reset: boolean;
    /**
     * The realized centre of pressure from the measured contacts, world metres;
     * absent reads it from the pendulum.
     */
    real?: IAutoMovieVector3;
  }): void {
    const { state, result, dt } = input;
    const share: number = Math.min(1, dt / LOAD_SECONDS);
    if (state.velocity)
      for (const axis of ["x", "z"] as const)
        state.acceleration[axis] +=
          ((result.velocity[axis] - state.velocity[axis]) / dt -
            state.acceleration[axis]) *
          share;
    state.velocity = { x: result.velocity.x, z: result.velocity.z };
    if (input.reset) {
      state.bias = { x: 0, z: 0 };
      return;
    }
    if (input.frozen) return;
    const omega2: number = result.omega * result.omega;
    for (const axis of ["x", "z"] as const) {
      const real: number =
        input.real?.[axis] ??
        result.center[axis] - state.acceleration[axis] / omega2;
      state.bias[axis] += INTEGRAL * share * (result.pressure[axis] - real);
    }
    const size: number = Math.hypot(state.bias.x, state.bias.z);
    if (size > MARGIN) {
      state.bias.x *= MARGIN / size;
      state.bias.z *= MARGIN / size;
    }
  }

  /**
   * Whether the trunk will pass the hip strategy's range within a pendulum
   * time: its tilt from the intended upright plus the whole body's rotation
   * rate over omega, that rate read from the centroidal angular momentum,
   *
   * |k_h| / I_h, not from the trunk's own rate, which a landing's impact
   *
   * Swings back and forth (Stephens 2011, Table 4.1, Eqs. 3.23-3.26; Lee and
   * Goswami 2012).
   *
   * @param input The tilt, radians; the horizontal momentum, kg m^2 / s; the
   *   composite inertia, kg m^2; the pendulum frequency, per second; the range,
   *   radians.
   * @returns Whether a step is asked for.
   */
  export function tipping(input: {
    tilt: number;
    momentum: IAutoMovieVector3;
    inertia: number;
    omega: number;
    range: number;
  }): boolean {
    const rate: number =
      input.inertia > 0
        ? Math.hypot(input.momentum.x, input.momentum.z) / input.inertia
        : 0;
    return input.tilt + rate / input.omega > input.range;
  }

  /**
   * The longest a landed foot whose share has not ramped in holds the next
   * step's decision back, seconds: four fade windows (stated).
   */
  export const UNLOAD: number = 4 * FADE;

  /**
   * Whether a limb about to swing lifts: its bearing share has ramped out and
   * the floor measurably carries it no more, its low-passed load under
   * `RELEASE` of the weight. A foot the floor still carries stays in the stance
   * however long it waits, its step a request planned again each frame (Feng et
   * al. 2015, Figure 2: lift-off delayed, double support kept); a foot lifted
   * while loaded throws the body up off the leg that pushed (Pratt et al.,
   * M2V2, Section VII-A; Herzog et al. 2016, Section 5.3).
   *
   * @param input The limb's bearing share, and its measured load and the
   *   weight, newtons.
   * @returns Whether it lifts.
   */
  export function release(input: {
    bearing: number;
    load: number;
    weight: number;
  }): boolean {
    return input.bearing <= 0 && input.load <= RELEASE * input.weight;
  }

  /**
   * A lifted swing foot's early touchdown: its measured load above `TOUCH` of
   * the weight on two successive substeps before the swing's minimum phase is a
   * contact, an aborted lift or an early touchdown, so the foot joins the
   * support again and the step is planned again, and the floor's force on it is
   * the root task's once more; a single substep's scuff is not (Stephens 2011,
   * Figure 4.6; Feng et al. 2015, Section III-A4). Only a foot that has cleared
   * the floor since its lift-off can touch down: until then its load is the
   * floor it never left, and accepting it lands a null step where it stood. And
   * only one coming down: a toe that scrapes the floor while the foot still
   * rises is a scuff, which neither lands nor restarts the swing (Stephens
   * 2011, Figure 4.6), as Feng's Atlas, scraping a block halfway through,
   * touched down much earlier than planned (Feng et al. 2015, Section III-A4).
   *
   * @param input The foot's measured load and the weight, newtons; whether it
   *   has cleared the floor since lift-off; whether it is coming down; when its
   *   load began, local seconds, if it is pressing; the present local seconds;
   *   and the substep, seconds.
   * @returns When its present load began, absent while it does not press, has
   *   not cleared or still rises, and whether it has touched down.
   */
  export function touchdown(input: {
    load: number;
    weight: number;
    cleared: boolean;
    descending: boolean;
    since: number | undefined;
    seconds: number;
    dt: number;
  }): { since?: number; landed: boolean } {
    if (
      !input.cleared ||
      !input.descending ||
      !(input.load > TOUCH * input.weight)
    )
      return { landed: false };
    const since: number = input.since ?? input.seconds;
    return { since, landed: input.seconds - since >= input.dt - 1e-9 };
  }

  /**
   * Whether the next step may be decided: not before a landed foot's share has
   * ramped in, since until then the landing's transient, not the new support,
   * moves the capture point (Pratt et al., M2V2, Section IX-C), and then only
   * once the capture point has stayed outside for `DWELL`, the first step's own
   * test (Koolen et al., Corollary 3).
   *
   * @param input The landed foot's bearing share, if a foot landed and is
   *   ramping in; when the capture point left the support, local seconds; the
   *   present local seconds.
   * @returns Whether a step may be asked for.
   */
  export function ready(input: {
    landing?: number;
    outside: number | undefined;
    seconds: number;
  }): boolean {
    return (
      (input.landing === undefined || input.landing >= 1) &&
      input.outside !== undefined &&
      input.seconds - input.outside >= DWELL - 1e-9
    );
  }

  /**
   * The trunk orientation error the root task's servo acts on at most, radians
   * (stated).
   */
  export const TORSO_ERROR: number = 0.2;

  /**
   * The intended trunk orientation brought within `limit` of the actual one:
   * the turn from actual to intended, shortened to `limit` about the same axis,
   * so a servo on it acts on a saturated error (Feng et al. 2013, Section
   * III-B).
   *
   * @param actual The trunk's actual world rotation.
   * @param intended Its intended world rotation.
   * @param limit The largest error kept, radians.
   * @returns The rotation the servo aims at.
   */
  export function saturate(
    actual: IAutoMovieQuaternion,
    intended: IAutoMovieQuaternion,
    limit: number,
  ): IAutoMovieQuaternion {
    let turn: IAutoMovieQuaternion = Quaternion.multiply(
      intended,
      Quaternion.inverse(actual),
    );
    if (turn.w < 0) turn = { x: -turn.x, y: -turn.y, z: -turn.z, w: -turn.w };
    const sine: number = Math.hypot(turn.x, turn.y, turn.z);
    const angle: number = 2 * Math.atan2(sine, turn.w);
    if (angle <= limit || !(sine > 0)) return intended;
    const half: number = limit / 2;
    const scale: number = Math.sin(half) / sine;
    return Quaternion.multiply(
      {
        x: turn.x * scale,
        y: turn.y * scale,
        z: turn.z * scale,
        w: Math.cos(half),
      },
      actual,
    );
  }
}
