import {
  AutoMovieGravity,
  Vector3,
  bracketedBisection,
  convexHull2D,
  integrateMotionTrajectory,
} from "@automovie/engine";
import type {
  AutoMovieHumanForceSite,
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieMotionHumanForceExchange,
  IAutoMovieMotionHumanSustainedForce,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanForceDrawn } from "./HumanForceDrawn";

/** The record of `ISwingResult`'s site. */
type ISwingResult = { angle: number; rate: number };

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
export namespace HumanForceExchange {
  /**
   * How far the base extends from a centre along a horizontal direction: the
   * distance the centre's floor point travels along it before it leaves the
   * convex hull of the support points.
   *
   * @param centre The centre, world metres; its height is ignored.
   * @param direction The horizontal direction, unit.
   * @param support The support points, world metres.
   * @returns Metres; zero when the centre is already outside or the base is
   *   degenerate.
   */
  export function edge(
    centre: IAutoMovieVector3,
    direction: IAutoMovieVector3,
    support: readonly IAutoMovieVector3[],
  ): number {
    const hull: IAutoMovieVector3[] = convexHull2D(support);
    if (hull.length < 3) return 0;
    let nearest: number = Number.POSITIVE_INFINITY;
    let inside: boolean = true;
    for (let i: number = 0; i < hull.length; i++) {
      const a: IAutoMovieVector3 = hull[i]!;
      const b: IAutoMovieVector3 = hull[(i + 1) % hull.length]!;
      const ex: number = b.x - a.x;
      const ez: number = b.z - a.z;

      // Counter-clockwise hull: the inside is on each edge's left.
      const side: number = ex * (centre.z - a.z) - ez * (centre.x - a.x);
      if (side < 0) inside = false;
      const denominator: number = direction.x * ez - direction.z * ex;
      if (Math.abs(denominator) <= Number.EPSILON) continue;
      const t: number =
        ((a.x - centre.x) * ez - (a.z - centre.z) * ex) / denominator;
      const u: number =
        ((a.x - centre.x) * direction.z - (a.z - centre.z) * direction.x) /
        denominator;
      if (t > 0 && u >= 0 && u <= 1) nearest = Math.min(nearest, t);
    }
    return inside && nearest < Infinity ? nearest : 0;
  }

  /**
   * The constant horizontal pull that breaks a base at a declared instant.
   *
   * @param props The partner's mass, eigenfrequency, the base's extent along
   *   the pull and the instant.
   * @returns Newtons.
   * @throws {Error} When the instant, the extent, the mass or the frequency is
   *   not positive: a caller's defect.
   */
  export function breaking(
    props: IAutoMovieMotionHumanForceExchange.IBreakingProps,
  ): number {
    const { mass, frequency, edge, seconds } = props;
    if (!(mass > 0 && frequency > 0 && edge > 0 && seconds > 0))
      throw new Error(
        "A pull breaks a base of positive extent at a positive instant",
      );
    return (
      (edge * mass * frequency * frequency) / Math.expm1(frequency * seconds)
    );
  }

  /**
   * When a constant pull breaks a base: the inverse of `breaking`.
   *
   * @param props The partner's mass, eigenfrequency, the base's extent along
   *   the pull and the pull.
   * @returns Seconds; infinite when the pull is not positive.
   */
  export function broken(
    props: IAutoMovieMotionHumanForceExchange.IBrokenProps,
  ): number {
    const { mass, frequency, edge, force } = props;
    if (!(force > 0)) return Number.POSITIVE_INFINITY;
    return (
      Math.log1p((edge * mass * frequency * frequency) / force) / frequency
    );
  }

  /**
   * The centre's travel along a constant pull from rest: its offset, its speed
   * and its extrapolated offset.
   *
   * @param props The partner's mass, eigenfrequency, the pull and the seconds
   *   since it started.
   * @returns Metres, metres per second and metres along the pull.
   */
  export function drawn(
    props: IAutoMovieMotionHumanForceExchange.IDrawnProps,
  ): IAutoMovieMotionHumanForceExchange.IDrawnResult {
    return HumanForceDrawn.sample(props);
  }

  /**
   * How far a resisting partner's centre of pressure moves toward the pull: the
   * pull's moment at grip height over the weight; null when that passes the
   * base's extent along the pull, where no counter-lean resists.
   *
   * @param props The partner's mass, the pull, the grip's height and the base's
   *   extent along the pull.
   * @param gravity Gravitational acceleration; standard when absent.
   * @returns Metres, or null.
   */
  export function resisted(
    props: IAutoMovieMotionHumanForceExchange.IResistedProps,
    gravity: number = AutoMovieGravity.STANDARD,
  ): number | null {
    const shift: number = (props.force * props.height) / (props.mass * gravity);
    return shift <= props.edge ? shift : null;
  }
  /**
   * A throw's swing about the fulcrum, from the momentum the pull left to the
   * release where the centre comes level with the fulcrum.
   *
   * @param props The partner's mass, inertia about its centre on the swing's
   *   axis, the centre's distance from the fulcrum, its starting angle and
   *   rate.
   * @param gravity Gravitational acceleration; standard when absent.
   * @returns The swing, or null when, the pull's drive ended, the rate falls to
   *   none before the release.
   */
  export function swing(
    props: IAutoMovieMotionHumanForceExchange.ISwingProps,
    gravity: number = AutoMovieGravity.STANDARD,
  ): IAutoMovieMotionHumanForceExchange.ISwing | null {
    const { mass, radius } = props;
    const moment: number = props.inertia + mass * radius * radius;
    const k: number = (mass * gravity * radius) / moment;
    const span: number = 1 / Math.sqrt(k);
    const until: number = props.until ?? 0;
    const drive: number = (props.torque ?? 0) / moment;
    const rate = (
      t: number,
      x: readonly number[],
    ): IAutoMovieIntegrateMotionTrajectory.IRate => ({
      dx: [x[1]!, k * Math.sin(x[0]!) + (t < until ? drive : 0)],
    });
    const spans: IAutoMovieIntegrateMotionTrajectory.ITrajectory[] = [];
    let state: readonly number[] = [props.angle, props.rate];
    let t0: number = 0;
    for (;;) {
      const trajectory: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
        integrateMotionTrajectory({
          f: rate,
          x0: state,
          t0,
          t1: t0 + span,
          h: integrateMotionTrajectory.STEP,
        });
      spans.push(trajectory);
      const end: readonly number[] = trajectory.at(t0 + span).x;
      if (end[0]! >= Math.PI / 2) break;
      // While the pull still drives it, a body carried the other way by the
      // momentum it broke with is turned back; with the pull gone, a rate
      // fallen to none is a swing that has stopped.
      if (!(end[1]! > 0) && t0 + span >= until) return null;
      state = end;
      t0 += span;
    }
    const at = (seconds: number): readonly number[] => {
      const index: number = Math.min(
        spans.length - 1,
        Math.max(0, Math.floor(seconds / span)),
      );
      return spans[index]!.at(seconds).x;
    };
    const last: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
      spans[spans.length - 1]!;
    const release: number = bracketedBisection(
      (seconds: number): boolean => at(seconds)[0]! < Math.PI / 2,
      last.t0,
      last.t1,
      integrateMotionTrajectory.STEP ** 2,
    );
    return {
      release,
      angle: (seconds: number): number => at(Math.min(release, seconds))[0]!,
      rate: (seconds: number): number => at(Math.min(release, seconds))[1]!,
      sample: (seconds: number): ISwingResult => {
        const state: readonly number[] = at(Math.min(release, seconds));
        return { angle: state[0]!, rate: state[1]! };
      },
    };
  }

  /**
   * The pull as the force input's sustained records: the force spread equally
   * over the grip sites, constant over the window.
   *
   * @param props The pulled person, the grip sites, the horizontal direction,
   *   the force and the window.
   * @returns One record per grip site.
   */
  export function pull(
    props: IAutoMovieMotionHumanForceExchange.IPullProps,
  ): IAutoMovieMotionHumanSustainedForce[] {
    const each: number =
      props.sites.length === 0 ? 0 : props.force / props.sites.length;
    return props.sites.map(
      (at: AutoMovieHumanForceSite): IAutoMovieMotionHumanSustainedForce => ({
        kind: "sustained",
        subject: props.subject,
        at,
        from: props.from,
        to: props.to,
        force: Vector3.scale(props.direction, each),
      }),
    );
  }
}
