import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanForceSite } from "../perform/AutoMovieHumanForceSite";

/**
 * The mechanics of a force exchanged through grips (#3439): a pull that
 * draws a partner off balance (kuzushi), the counter-lean that resists it,
 * and a throw's rotation about the thrower's fulcrum.
 *
 * - **Off-balancing.** The partner is a linear inverted pendulum of its own
 *   mass `M` and length `l` (`resolveAutoMovieCenterOfMass.pendulum`), with
 *   eigenfrequency `ω = sqrt(g / l)` (Hof, Gazendam and Sinke 2005). A
 *   constant horizontal pull `F` at rest gives `x'' = ω² x + F / M`, so the
 *   centre moves `x(t) = (F / M ω²)(cosh ωt - 1)` along the pull and its
 *   extrapolated centre `x + x' / ω` is `(F / M ω²)(e^{ωt} - 1)`. It leaves
 *   the base where the base ends along the pull, `e` from the centre, at
 *   `T = ln(1 + e M ω² / F) / ω`; the pull that breaks the base at a
 *   declared `T` is `F = e M ω² / (e^{ωT} - 1)`.
 * - **Resistance.** A partner who resists keeps its centre over the base by
 *   leaning against the pull until the moments about the base balance: the
 *   pull at grip height `h` against the weight shifts the centre of
 *   pressure `F h / (M g)` toward the pull (static moment balance, the form
 *   of `HumanLoad.lean`), and the resistance holds while that shift stays
 *   within the base's extent along the pull.
 * - **Throw.** Once the base is broken the thrower's fulcrum carries the
 *   partner, who turns about it as a rigid body: `I φ'' = M g r sin φ + τ`, with
 *   `φ` the angle of the centre from the vertical through the fulcrum, `r`
 *   its distance, `I = I_c + M r²` (parallel axes) and `τ` the pull's moment
 *   about the fulcrum while the pull lasts: a horizontal pull `F` at a grip
 *   `h` above the fulcrum turns the body by `F h`. It starts from the
 *   momentum the pull left, `φ'(0) = v_t / r`, the centre's speed across
 *   the fulcrum line, and is released where the centre comes level with the
 *   fulcrum on its far side, `φ = π / 2`. A swing whose rate falls to zero
 *   before the vertical cannot carry the partner over, so the throw is not
 *   produced.
 *
 * The phases' timing (kuzushi, tsukuri, kake) is not taken from a study of
 * seoi-nage: the instants are the mechanics' own, from the forces and the
 * bodies.
 *
 * @evidence contracts/development/common.md#meaningful-documentation release: Seconds from the break to the release. edge: The base's extent along the pull, metres. seconds: Seconds from the pull's start to the broken base.
 * @evidence contracts/development/design.md#principled-representation release: Seconds from the break to the release. edge: The base's extent along the pull, metres. seconds: Seconds from the pull's start to the broken base.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: grappling/HumanForceExchange.ts (HumanForceExchange.breaking, props); grappling/HumanForceExchange.ts (HumanForceExchange.broken, props); grappling/HumanForceExchange.ts (HumanForceExchange.drawn, props); grappling/HumanForceExchange.ts (HumanForceExchange.drawn, return); grappling/HumanForceExchange.ts (HumanForceExchange.resisted, props); grappling/HumanForceExchange.ts (HumanForceExchange.swing, props).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanForceSite, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanForceExchange {
  /**
   * A throw's swing about the fulcrum, read by time from the base's break.
   *
   * @evidence contracts/development/common.md#meaningful-documentation release: Seconds from the break to the release.
   * @evidence contracts/development/design.md#principled-representation release: Seconds from the break to the release.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: grappling/HumanForceExchange.ts (HumanForceExchange.swing, return); grappling/HumanForceThrow.ts (HumanForceThrow.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanForceExchange.swing.
   */
  export interface ISwing {
    /** Seconds from the break to the release. */
    release: number;

    /**
     * The centre's angle from the vertical through the fulcrum at a second since the break, radians.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanForceExchange.ISwing.angle: The centre's angle from the vertical through the fulcrum at a second since the break, radians.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanForceExchange.ISwing.angle is used through packages/motions/src/grappling/HumanForceExchange.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanForceExchange.ISwing.angle is used through packages/motions/src/grappling/HumanForceExchange.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanForceExchange.ISwing.angle is used through packages/motions/src/grappling/HumanForceExchange.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanForceExchange.ISwing.angle is used through packages/motions/src/grappling/HumanForceExchange.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanForceExchange.ISwing.angle is used through packages/motions/src/grappling/HumanForceExchange.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanForceExchange.ISwing.angle is used through packages/motions/src/grappling/HumanForceExchange.ts.
     */
    angle(seconds: number): number;

    /**
     * The angular rate at a second since the break, radians per second.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanForceExchange.ISwing.rate: The angular rate at a second since the break, radians per second.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanForceExchange.ISwing.rate is used through packages/motions/src/grappling/HumanForceExchange.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanForceExchange.ISwing.rate is used through packages/motions/src/grappling/HumanForceExchange.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanForceExchange.ISwing.rate is used through packages/motions/src/grappling/HumanForceExchange.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanForceExchange.ISwing.rate is used through packages/motions/src/grappling/HumanForceExchange.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanForceExchange.ISwing.rate is used through packages/motions/src/grappling/HumanForceExchange.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanForceExchange.ISwing.rate is used through packages/motions/src/grappling/HumanForceExchange.ts.
     */
    rate(seconds: number): number;
  }

  /**
   * The constant horizontal pull that breaks a base at a declared instant. Input props of HumanForceExchange.breaking. The partner's mass, eigenfrequency, the base's extent along the pull and the instant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation edge: The base's extent along the pull, metres. seconds: Seconds from the pull's start to the broken base.
   * @evidence contracts/development/design.md#principled-representation edge: The base's extent along the pull, metres. seconds: Seconds from the pull's start to the broken base.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: grappling/HumanForceExchange.ts (HumanForceExchange.breaking, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanForceExchange.breaking.
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
   * When a constant pull breaks a base: the inverse of `breaking`. Input props of HumanForceExchange.broken. The partner's mass, eigenfrequency, the base's extent along the pull and the pull.
   *
   * @evidence contracts/development/common.md#meaningful-documentation edge: The base's extent along the pull, metres.
   * @evidence contracts/development/design.md#principled-representation edge: The base's extent along the pull, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: grappling/HumanForceExchange.ts (HumanForceExchange.broken, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanForceExchange.broken.
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
   * The centre's travel along a constant pull from rest: its offset, its speed and its extrapolated offset. Input props of HumanForceExchange.drawn. The partner's mass, eigenfrequency, the pull and the seconds since it started.
   *
   * @evidence contracts/development/common.md#meaningful-documentation seconds: Seconds since the pull started.
   * @evidence contracts/development/design.md#principled-representation seconds: Seconds since the pull started.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: grappling/HumanForceExchange.ts (HumanForceExchange.drawn, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanForceExchange.drawn.
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
   * The centre's travel along a constant pull from rest: its offset, its speed and its extrapolated offset. Result returned by HumanForceExchange.drawn. Metres, metres per second and metres along the pull.
   *
   * @evidence contracts/development/common.md#meaningful-documentation offset: Horizontal centre displacement along the pull, metres. speed: Horizontal centre velocity along the pull, metres per second. extrapolated: Extrapolated centre position offset + speed / pendulum frequency, metres.
   * @evidence contracts/development/design.md#principled-representation offset: Horizontal centre displacement along the pull, metres. speed: Horizontal centre velocity along the pull, metres per second. extrapolated: Extrapolated centre position offset + speed / pendulum frequency, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: grappling/HumanForceExchange.ts (HumanForceExchange.drawn, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanForceExchange.drawn.
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
   * How far a resisting partner's centre of pressure moves toward the pull: the pull's moment at grip height over the weight; null when that passes the base's extent along the pull, where no counter-lean resists. Input props of HumanForceExchange.resisted. The partner's mass, the pull, the grip's height and the base's extent along the pull.
   *
   * @evidence contracts/development/common.md#meaningful-documentation height: The grip's height above the floor, metres. edge: The base's extent from the centre along the pull, metres.
   * @evidence contracts/development/design.md#principled-representation height: The grip's height above the floor, metres. edge: The base's extent from the centre along the pull, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: grappling/HumanForceExchange.ts (HumanForceExchange.resisted, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanForceExchange.resisted.
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
   * A throw's swing about the fulcrum, from the momentum the pull left to the release where the centre comes level with the fulcrum. Input props of HumanForceExchange.swing. The partner's mass, inertia about its centre on the swing's axis, the centre's distance from the fulcrum, its starting angle and rate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation radius: The centre's distance from the fulcrum, metres. angle: The starting angle from the vertical, radians, positive toward the throw. torque: The pull's moment about the fulcrum on the swing's axis while it lasts, N m; none when absent.
   * @evidence contracts/development/design.md#principled-representation radius: The centre's distance from the fulcrum, metres. angle: The starting angle from the vertical, radians, positive toward the throw. torque: The pull's moment about the fulcrum on the swing's axis while it lasts, N m; none when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: grappling/HumanForceExchange.ts (HumanForceExchange.swing, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanForceExchange.swing.
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

    /** The pull's moment about the fulcrum on the swing's axis while it lasts, N m; none when absent. */
    torque?: number;

    /** Seconds since the break the pull lasts; none when absent. */
    until?: number;
  };

  /**
   * The pull as the force input's sustained records: the force spread equally over the grip sites, constant over the window. Input props of HumanForceExchange.pull. The pulled person, the grip sites, the horizontal direction, the force and the window.
   *
   * @evidence contracts/development/common.md#meaningful-documentation from: Film seconds, start. to: Film seconds, end.
   * @evidence contracts/development/design.md#principled-representation from: Film seconds, start. to: Film seconds, end.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: grappling/HumanForceExchange.ts (HumanForceExchange.pull, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanForceSite, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
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
