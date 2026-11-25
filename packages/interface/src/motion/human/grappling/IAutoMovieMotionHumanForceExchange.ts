import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanForceSite } from "../perform/AutoMovieHumanForceSite";

/**
 * The mechanics of a force exchanged through grips: a pull that draws a partner
 * off balance (kuzushi), the counter-lean that resists it, and a throw's
 * rotation about the thrower's fulcrum.
 *
 * - **Off-balancing.** The partner is a linear inverted pendulum of its own mass
 *   `M` and length `l` (`resolveAutoMovieCenterOfMass.pendulum`), with
 *   eigenfrequency `ω = sqrt(g / l)` (Hof, Gazendam and Sinke 2005). A constant
 *   horizontal pull `F` at rest gives `x'' = ω² x + F / M`, so the centre moves
 *   `x(t) = (F / M ω²)(cosh ωt - 1)` along the pull and its extrapolated centre
 *   `x + x' / ω` is `(F / M ω²)(e^{ωt} - 1)`. It leaves the base where the base
 *   ends along the pull, `e` from the centre, at `T = ln(1 + e M ω² / F) / ω`;
 *   the pull that breaks the base at a declared `T` is `F = e M ω² / (e^{ωT} -
 *   1)`.
 * - **Resistance.** A partner who resists keeps its centre over the base by
 *   leaning against the pull until the moments about the base balance: the pull
 *   at grip height `h` against the weight shifts the centre of pressure `F h /
 *   (M g)` toward the pull (static moment balance, the form of
 *   `HumanLoad.lean`), and the resistance holds while that shift stays within
 *   the base's extent along the pull.
 * - **Throw.** Once the base is broken the thrower's fulcrum carries the partner,
 *   who turns about it as a rigid body: `I φ'' = M g r sin φ + τ`, with `φ` the
 *   angle of the centre from the vertical through the fulcrum, `r` its
 *   distance, `I = I_c + M r²` (parallel axes) and `τ` the pull's moment about
 *   the fulcrum while the pull lasts: a horizontal pull `F` at a grip `h` above
 *   the fulcrum turns the body by `F h`. It starts from the momentum the pull
 *   left, `φ'(0) = v_t / r`, the centre's speed across the fulcrum line, and is
 *   released where the centre comes level with the fulcrum on its far side, `φ
 *   = π / 2`. A swing whose rate falls to zero before the vertical cannot carry
 *   the partner over, so the throw is not produced.
 *
 * The phases' timing (kuzushi, tsukuri, kake) is not taken from a study of
 * seoi-nage: the instants are the mechanics' own, from the forces and the
 * bodies.
 */
export namespace IAutoMovieMotionHumanForceExchange {
  /** A throw's swing about the fulcrum, read by time from the base's break. */
  export interface ISwing {
    /** Seconds from the break to the release. */
    release: number;

    /**
     * The centre's angle from the vertical through the fulcrum at a second
     * since the break, radians.
     */
    angle(seconds: number): number;

    /** The angular rate at a second since the break, radians per second. */
    rate(seconds: number): number;

    /**
     * Both readings from one trajectory evaluation, radians and radians per
     * second.
     *
     * @param seconds Seconds since the base's break.
     * @returns A fresh angle and rate record, held at release afterward.
     */
    sample?(seconds: number): { angle: number; rate: number };
  }

  /**
   * The constant horizontal pull that breaks a base at a declared instant.
   * Input props of HumanForceExchange.breaking. The partner's mass,
   * eigenfrequency, the base's extent along the pull and the instant.
   */
  export type IBreakingProps = {
    /** Kilograms. */
    mass: number;

    /** The pendulum's eigenfrequency, 1/s. */
    frequency: number;

    /** The base's extent along the pull, metres. */
    edge: number;

    /** Seconds from the pull's start to the broken base. */
    seconds: number;
  };

  /**
   * When a constant pull breaks a base: the inverse of `breaking`. Input props
   * of HumanForceExchange.broken. The partner's mass, eigenfrequency, the
   * base's extent along the pull and the pull.
   */
  export type IBrokenProps = {
    /** Kilograms. */
    mass: number;

    /** The pendulum's eigenfrequency, 1/s. */
    frequency: number;

    /** The base's extent along the pull, metres. */
    edge: number;

    /** Newtons. */
    force: number;
  };

  /**
   * The centre's travel along a constant pull from rest: its offset, its speed
   * and its extrapolated offset. Input props of HumanForceExchange.drawn. The
   * partner's mass, eigenfrequency, the pull and the seconds since it started.
   */
  export type IDrawnProps = {
    /** Kilograms. */
    mass: number;

    /** The pendulum's eigenfrequency, 1/s. */
    frequency: number;

    /** Newtons. */
    force: number;

    /** Seconds since the pull started. */
    seconds: number;
  };

  /**
   * The centre's travel along a constant pull from rest: its offset, its speed
   * and its extrapolated offset. Result returned by HumanForceExchange.drawn.
   * Metres, metres per second and metres along the pull.
   */
  export type IDrawnResult = {
    /** Horizontal centre displacement along the pull, metres. */
    offset: number;
    /** Horizontal centre velocity along the pull, metres per second. */
    speed: number;
    /** Extrapolated centre position offset + speed / pendulum frequency, metres. */
    extrapolated: number;
  };

  /**
   * How far a resisting partner's centre of pressure moves toward the pull: the
   * pull's moment at grip height over the weight; null when that passes the
   * base's extent along the pull, where no counter-lean resists. Input props of
   * HumanForceExchange.resisted. The partner's mass, the pull, the grip's
   * height and the base's extent along the pull.
   */
  export type IResistedProps = {
    /** Kilograms. */
    mass: number;

    /** Newtons, horizontal. */
    force: number;

    /** The grip's height above the floor, metres. */
    height: number;

    /** The base's extent from the centre along the pull, metres. */
    edge: number;
  };

  /**
   * A throw's swing about the fulcrum, from the momentum the pull left to the
   * release where the centre comes level with the fulcrum. Input props of
   * HumanForceExchange.swing. The partner's mass, inertia about its centre on
   * the swing's axis, the centre's distance from the fulcrum, its starting
   * angle and rate.
   */
  export type ISwingProps = {
    /** Kilograms. */
    mass: number;

    /** The moment of inertia about the centre on the swing's axis, kg m². */
    inertia: number;

    /** The centre's distance from the fulcrum, metres. */
    radius: number;

    /** The starting angle from the vertical, radians, positive toward the throw. */
    angle: number;

    /** The starting rate, radians per second. */
    rate: number;

    /**
     * The pull's moment about the fulcrum on the swing's axis while it lasts, N
     * m; none when absent.
     */
    torque?: number;

    /** Seconds since the break the pull lasts; none when absent. */
    until?: number;
  };

  /**
   * The pull as the force input's sustained records: the force spread equally
   * over the grip sites, constant over the window. Input props of
   * HumanForceExchange.pull. The pulled person, the grip sites, the horizontal
   * direction, the force and the window.
   */
  export type IPullProps = {
    /** The pulled person. */
    subject: string;

    /** The grip sites on that person. */
    sites: readonly AutoMovieHumanForceSite[];

    /** The horizontal pull direction, unit, world. */
    direction: IAutoMovieVector3;

    /** Newtons in all. */
    force: number;

    /** Film seconds, start. */
    from: number;

    /** Film seconds, end. */
    to: number;
  };
}
