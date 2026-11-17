import {
  AutoMovieGravity,
  Vector3,
  bracketedBisection,
  convexHull2D,
  integrateMotionTrajectory,
} from "@automovie/engine";
import type {
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieMotionHumanForce,
  IAutoMovieMotionHumanForceExchange,
  IAutoMovieVector3,
} from "@automovie/interface";

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
 * @evidence contracts/development/common.md#meaningful-documentation States the three laws with their equations and sources, their inputs and the release rule, and what is not from a study.
 * @evidence contracts/development/design.md#principled-representation The partner as a linear inverted pendulum under a horizontal force, a static moment balance for resistance and a rigid pendulum about a fixed fulcrum for the throw; the pull is the force input's sustained record.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The edge of the base along a pull, the force that breaks it, the centre's path, the resistance's shift, the swing and the pull records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No threshold of its own: the base, the mass, the pendulum and the fulcrum decide each outcome, and a swing that does not pass the vertical is reported, never pushed over.
 */
export namespace HumanForceExchange {
  /**
   * How far the base extends from a centre along a horizontal direction:
   * the distance the centre's floor point travels along it before it
   * leaves the convex hull of the support points.
   *
   * @param centre The centre, world metres; its height is ignored.
   * @param direction The horizontal direction, unit.
   * @param support The support points, world metres.
   * @returns Metres; zero when the centre is already outside or the base is degenerate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the measure, its inputs and the degenerate answers.
   * @evidence contracts/development/implementation.md#principled-implementation The ray from the centre along the direction exits a convex polygon at the nearest positive crossing of its edges.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One hull, one pass over its edges.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A centre outside the base answers zero rather than the far crossing.
   * @evidence contracts/development/implementation.md#efficient-algorithms The hull's sort and a linear pass.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The hull is the engine's `convexHull2D`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function.
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
    return inside && Number.isFinite(nearest) ? nearest : 0;
  }

  /**
   * The constant horizontal pull that breaks a base at a declared instant.
   *
   * @param props The partner's mass, eigenfrequency, the base's extent along the pull and the instant.
   * @returns Newtons.
   * @throws {Error} When the instant, the extent, the mass or the frequency is not positive: a caller's defect.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the law, the inputs and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation `F = e M ω² / (e^{ωT} - 1)`, the linear inverted pendulum's extrapolated centre reaching the base's edge at `T`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One closed form.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Non-positive inputs throw rather than return a force for a base that is already broken.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
   * @param props The partner's mass, eigenfrequency, the base's extent along the pull and the pull.
   * @returns Seconds; infinite when the pull is not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the law, the inputs and the infinite answer.
   * @evidence contracts/development/implementation.md#principled-implementation `T = ln(1 + e M ω² / F) / ω`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One closed form.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A pull of none never breaks the base, so its instant is infinite rather than clamped.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
   * The centre's travel along a constant pull from rest: its offset, its
   * speed and its extrapolated offset.
   *
   * @param props The partner's mass, eigenfrequency, the pull and the seconds since it started.
   * @returns Metres, metres per second and metres along the pull.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three outputs and their units.
   * @evidence contracts/development/implementation.md#principled-implementation `x = (F / M ω²)(cosh ωt - 1)`, `x' = (F / M ω) sinh ωt`, `ξ = x + x' / ω`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three closed forms.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Seconds before the pull read the rest state.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function drawn(
    props: IAutoMovieMotionHumanForceExchange.IDrawnProps,
  ): IAutoMovieMotionHumanForceExchange.IDrawnResult {
    const t: number = Math.max(0, props.seconds);
    const w: number = props.frequency;
    const a: number = props.force / (props.mass * w * w);
    const offset: number = a * (Math.cosh(w * t) - 1);
    const speed: number = a * w * Math.sinh(w * t);
    return { offset, speed, extrapolated: offset + speed / w };
  }

  /**
   * How far a resisting partner's centre of pressure moves toward the pull:
   * the pull's moment at grip height over the weight; null when that passes
   * the base's extent along the pull, where no counter-lean resists.
   *
   * @param props The partner's mass, the pull, the grip's height and the base's extent along the pull.
   * @param gravity Gravitational acceleration; standard when absent.
   * @returns Metres, or null.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the law, the null and the inputs.
   * @evidence contracts/development/implementation.md#principled-implementation Static moment balance about the base: `M g s = F h`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One closed form and one bound.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A shift past the base is reported as null, never clamped to a lean.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function resisted(
    props: IAutoMovieMotionHumanForceExchange.IResistedProps,
    gravity: number = AutoMovieGravity.STANDARD,
  ): number | null {
    const shift: number = (props.force * props.height) / (props.mass * gravity);
    return shift <= props.edge ? shift : null;
  }

  /**
   * A throw's swing about the fulcrum, from the momentum the pull left to
   * the release where the centre comes level with the fulcrum.
   *
   * @param props The partner's mass, inertia about its centre on the swing's axis, the centre's distance from the fulcrum, its starting angle and rate.
   * @param gravity Gravitational acceleration; standard when absent.
   * @returns The swing, or null when the rate falls to none before the vertical.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the law, the start, the release rule and the null.
   * @evidence contracts/development/implementation.md#principled-implementation `(I_c + M r²) φ'' = M g r sin φ + τ`, with the pull's moment `τ` while it lasts, integrated by the engine's fixed-step fourth-order integrator, in spans of the free swing's own time scale `sqrt(I / M g r)` until the angle passes `π / 2` or the rate stops; the release is found by bisection on the integrated angle to the step squared, finer than the step at which the motion is read.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Integrate span by span, detect, bisect, read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A swing that stops short is null, never a scripted push over the fulcrum.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four right-hand sides per integrator step over the swing's few spans; the bisection reads the stored trajectory.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The integrator is `integrateMotionTrajectory` and the root search `bracketedBisection`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The swing holds its spans' trajectories for as long as its plan.
   */
  export function swing(
    props: IAutoMovieMotionHumanForceExchange.ISwingProps,
    gravity: number = AutoMovieGravity.STANDARD,
  ): IAutoMovieMotionHumanForceExchange.ISwing | null {
    const { mass, radius } = props;
    const moment: number = props.inertia + mass * radius * radius;
    const k: number = (mass * gravity * radius) / moment;
    const span: number = 1 / Math.sqrt(k);
    const spans: IAutoMovieIntegrateMotionTrajectory.ITrajectory[] = [];
    let state: readonly number[] = [props.angle, props.rate];
    let t0: number = 0;
    for (;;) {
      const trajectory: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
        integrateMotionTrajectory({
          f: (
            t: number,
            x: readonly number[],
          ): IAutoMovieIntegrateMotionTrajectory.IRate => ({
            dx: [
              x[1]!,
              k * Math.sin(x[0]!) +
                (t < (props.until ?? 0) ? (props.torque ?? 0) / moment : 0),
            ],
          }),
          x0: state,
          t0,
          t1: t0 + span,
          h: integrateMotionTrajectory.STEP,
        });
      spans.push(trajectory);
      const end: readonly number[] = trajectory.at(t0 + span).x;
      if (end[0]! >= Math.PI / 2) break;
      if (!(end[1]! > 0)) return null;
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
    };
  }

  /**
   * The pull as the force input's sustained records: the force spread
   * equally over the grip sites, constant over the window.
   *
   * @param props The pulled person, the grip sites, the horizontal direction, the force and the window.
   * @returns One record per grip site.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built and how the force is spread.
   * @evidence contracts/development/implementation.md#principled-implementation A pull through several grips is their sum, so equal shares over the sites carry the whole force; each is `HumanForce.ISustained`, the one force input.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record per site.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No site is invented when none is given: the result is then empty.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the sites.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function pull(
    props: IAutoMovieMotionHumanForceExchange.IPullProps,
  ): IAutoMovieMotionHumanForce.ISustained[] {
    const each: number =
      props.sites.length === 0 ? 0 : props.force / props.sites.length;
    return props.sites.map(
      (
        at: IAutoMovieMotionHumanForce.At,
      ): IAutoMovieMotionHumanForce.ISustained => ({
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
