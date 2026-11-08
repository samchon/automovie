import type { AutoMovieSolidIntersection } from "./AutoMovieSolidIntersection";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";

type Vec3 = AutoMovieSolidVector.Vec3;
const { add, cross, dot, scale, sub } = AutoMovieSolidVector;

/**
 * The parameter laws of an intersection trace (`AutoMovieSolidIntersection`): the fourth equation `g(P, phi, t) = 0` that fixes which point of the curve a parameter `t` names, with the derivatives the trace's Newton step and its second-order prediction read.
 *
 * Phase gives g=phi-t; angle gives g=(P-c).m(t), a rotating plane equation whose branch is selected by the seed/continuation. Requested arc mode uses g=(P-Q(t)).Q'(t), the normal plane of a periodic spline through equal-chord walked points. That guide parameter approximates arclength rather than proving exact constant speed on the realized intersection.
 *
 * @evidence contracts/common.md#principled-implementation Each parameter is one scalar equation with exact derivatives, so the trace's Newton and its second-order prediction see the same law.
 * @evidence contracts/common.md#clear-and-simple-design One law interface and one builder per parameter kind.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A degenerate angle axis returns null instead of a made reference.
 * @evidence contracts/common.md#meaningful-documentation States each law, its derivatives and its parameter's meaning.
 * @evidence contracts/performance.md#efficient-algorithms Each law term is constant work; the arc law evaluates one spline span.
 * @evidence contracts/performance.md#reuse-equivalent-work The arc control points and angle basis are prepared once per law, but each arc callback independently recomputes all four reference-jet orders at its parameter.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains its control points or axis only.
 */
export namespace AutoMovieSolidTraceLaw {
  /**
   * An equation affine in world point/part phase at fixed t, with the derivatives used by implicit tracing.
   * Residual units differ between phase, angle and reference-arc laws.
   *
   * @evidence contracts/common.md#principled-implementation A scalar constraint plus its point/phase gradient, parameter derivative and second-order remainder closes the three surface-meeting equations.
   * @evidence contracts/common.md#clear-and-simple-design Five callbacks separate the common Newton/predictor consumer from the selected parameter representation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The interface does not validate derivative consistency or transversality; its grad(t) form assumes the point/phase-affine laws provided by the current constructors.
   * @evidence contracts/common.md#meaningful-documentation Names every derivative role, point-affine premise and the fact that raw residual units depend on the law.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callback interface contains no implementation; of/arc own the actual preparation and evaluations.
   * @evidence contracts/performance.md#reuse-equivalent-work One prepared law object is shared across a trace's Newton, rate and continuation readings; callback outputs are not automatically shared.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The retaining trace owns the law callbacks and their prepared basis/control dependencies; the interface acquires no handle or global cache.
   */
  export interface ILaw {
    /**
     * Scalar parameter constraint g(P,phi,t), with units determined by the selected law.
     *
     * @evidence contracts/common.md#principled-implementation Supplies the fourth residual: phase difference, rotating-plane dot product or reference-spline normal-plane dot product.
     * @evidence contracts/common.md#clear-and-simple-design A scalar callback lets the meeting solver append this constraint to its three world-coordinate equations.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero residual selects a local constraint branch, not a global nearest foot or unique intersection certificate.
     * @evidence contracts/common.md#meaningful-documentation Names world point, part phase and trace parameter and explicitly leaves residual units with the law.
     * @evidenceExclude contracts/performance.md#efficient-algorithms This signature has no body; the chosen constructor's g callback owns its arithmetic.
     * @evidence contracts/performance.md#reuse-equivalent-work Calls share their prepared law geometry; current arc callbacks still recompute the reference jet per invocation.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The scalar result retains no state; callback lifetime belongs to its law owner.
     */
    g(p: Vec3, phi: number, t: number): number;

    /**
     * [dg/dP,dg/dphi], valid for the constructors' point/phase-affine constraints.
     *
     * @evidence contracts/common.md#principled-implementation Provides the point gradient and direct phase coefficient used to form the fourth Jacobian row by the surface chain rule.
     * @evidence contracts/common.md#clear-and-simple-design One pair separates the three-dimensional gradient from the direct phase term.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Dependence only on t is part of this law representation; arbitrary nonlinear point/phase constraints are not supported by this signature.
     * @evidence contracts/common.md#meaningful-documentation Gives derivative ordering and the affine-constraint premise.
     * @evidenceExclude contracts/performance.md#efficient-algorithms This declaration chooses no gradient evaluation algorithm; the law constructor does.
     * @evidence contracts/performance.md#reuse-equivalent-work A meeting Jacobian uses one returned gradient for all surface components; separate gradient calls are not memoized by the interface.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The consumer owns the returned pair/vector according to its implementation; the interface establishes no retained gradient cache.
     */
    grad(t: number): [Vec3, number];

    /**
     * Partial derivative dg/dt with world point/part phase held fixed.
     *
     * @evidence contracts/common.md#principled-implementation Supplies the explicit parameter derivative on the right-hand side of the first implicit rate solve.
     * @evidence contracts/common.md#clear-and-simple-design Keeps explicit parameter motion separate from the point/phase gradient's chain-rule contribution.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts This partial is not the total derivative along the solved curve; the solver combines both terms.
     * @evidence contracts/common.md#meaningful-documentation States held-fixed variables and the derivative's solver role.
     * @evidenceExclude contracts/performance.md#efficient-algorithms The signature executes no derivative formula.
     * @evidence contracts/performance.md#reuse-equivalent-work Uses the law's prepared geometry; the current arc implementation performs a new reference-jet reading for this callback.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a scalar and acquires no resource independently of the law object.
     */
    gt(p: Vec3, t: number): number;

    /**
     * Second total-derivative remainder after the solver's Jacobian-times-acceleration and grad(P).Q_A terms.
     *
     * @evidence contracts/common.md#principled-implementation Supplies the explicit/mixed parameter terms: zero for phase, the rotating-plane remainder for angle and the reference-spline remainder written on arc.
     * @evidence contracts/common.md#clear-and-simple-design One scalar remainder lets the common rate solver reuse its surface quadratic terms for every parameter kind.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Excludes the part surface's Q_A contribution because the caller adds it with grad; double-counting that term would change the implicit second rate.
     * @evidence contracts/common.md#meaningful-documentation Names the excluded terms and the supplied world velocity dp used by the law's remainder.
     * @evidenceExclude contracts/performance.md#efficient-algorithms This callable type implements no second-derivative calculation.
     * @evidence contracts/performance.md#reuse-equivalent-work The trace shares its already computed world velocity with this callback; current arc evaluation still rebuilds its local reference jet.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned scalar owns no vector, cache or handle.
     */
    extra(p: Vec3, dp: Vec3, t: number): number;

    /**
     * Seed angle from a world point for angle mode; phase/arc constructors return unused zero placeholders.
     *
     * @evidence contracts/common.md#principled-implementation The angle constructor projects a point into its prepared orthogonal footprint basis and uses atan2 to initialize the branch.
     * @evidence contracts/common.md#clear-and-simple-design One seed-query callback keeps the angle basis with the law that later evaluates its plane.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts This is not a general inverse parameterization: phase/arc provide zero because their trace branches do not use this callback to infer the seed parameter.
     * @evidence contracts/common.md#meaningful-documentation States supported mode, world-point input and the other modes' placeholder behavior.
     * @evidenceExclude contracts/performance.md#efficient-algorithms The interface member contains no atan2 implementation or search.
     * @evidence contracts/performance.md#reuse-equivalent-work Angle inference reuses its law's prepared basis instead of reconstructing a separate footprint frame.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returning an angle retains no query point or resource.
     */
    angle(p: Vec3): number;
  }

  /**
   * The reference-guide law used for requested arc parameterization through
   * equal-chord walked points; it is not an exact arclength reparameterization. The
   * periodic cubic B-spline `Q` through them (`AutoMovieSplineCurve`'s
   * interpolation, component by component), and `g = (P - Q(t)) . Q'(t)`,
   * whose zero is the point's foot on `Q`. With `P' = A_s s' + A_phi phi'`:
   * `g_t = -Q' . Q' + (P - Q) . Q''` and, past the terms of `J x''` and
   * `Q_A . Q'`, `d^2 g / dt^2` keeps `2 P' . Q'' - 3 Q' . Q'' + (P - Q) . Q'''`.
   *
   * @param points The loop's equal-chord points, mm.
   * @returns The law.
   *
   * @evidence contracts/common.md#principled-implementation Prepares a periodic cubic reference Q and the normal-plane equation (P-Q).Q'=0, with analytic partials and the stated second-order remainder; a regular transverse local branch is required.
   * @evidence contracts/common.md#clear-and-simple-design One local reference-jet reader supplies the equation/derivative callbacks without another geometric intersection representation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal-chord guide samples and stationary normal planes do not certify exact arclength or a nearest reference foot; this remains an approximation to the public requested arc parameter, not a proof of that requirement.
   * @evidence contracts/common.md#meaningful-documentation Gives the spline, equation, derivatives, mm input and requested-arclength limitation.
   * @evidence contracts/performance.md#efficient-algorithms O(N) fixed-filter preparation stores N reference controls; each callback uses constant four-control work but computes all four reference derivative orders even when fewer are read.
   * @evidence contracts/performance.md#reuse-equivalent-work Reference controls are prepared once, while g/grad/gt/extra independently reevaluate the same parameter's basis/jet; no per-parameter jet sharing is implemented.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned law closures retain O(N) prepared reference controls for their owner's lifetime; callback basis/jet arrays are fixed-size temporaries and no global cache grows.
   */
  export function arc(points: readonly Vec3[]): ILaw {
    const n: number = points.length;
    const xy: number[] = AutoMovieSplineCurve.interpolate(
      points.map((p: Vec3): [number, number] => [p[0], p[1]]),
    );
    const z: number[] = AutoMovieSplineCurve.interpolate(
      points.map((p: Vec3): [number, number] => [p[2], 0]),
    );
    const control: Vec3[] = Array.from(
      { length: n },
      (_: unknown, k: number): Vec3 => [xy[k]!, xy[n + k]!, z[k]!],
    );
    const at = (t: number): [Vec3, Vec3, Vec3, Vec3] => {
      const u: number = ((((t / (2 * Math.PI)) % 1) + 1) % 1) * n;
      const i: number = Math.min(n - 1, Math.floor(u));
      const f: number = u - i;
      const g: number = 1 - f;
      const k: number = n / (2 * Math.PI);
      const w: number[][] = [
        [
          (g * g * g) / 6,
          (3 * f * f * f - 6 * f * f + 4) / 6,
          (-3 * f * f * f + 3 * f * f + 3 * f + 1) / 6,
          (f * f * f) / 6,
        ],
        [
          (-g * g) / 2,
          (3 * f * f - 4 * f) / 2,
          (-3 * f * f + 2 * f + 1) / 2,
          (f * f) / 2,
        ],
        [g, 3 * f - 2, 1 - 3 * f, f],
        [-1, 3, -3, 1],
      ];
      const out: [Vec3, Vec3, Vec3, Vec3] = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];
      for (let d: number = 0; d < 4; d++)
        for (let j: number = 0; j < 4; j++) {
          const c: Vec3 = control[(((i - 1 + j) % n) + n) % n]!;
          const s: number = w[d]![j]! * k ** d;
          out[d]![0] += s * c[0];
          out[d]![1] += s * c[1];
          out[d]![2] += s * c[2];
        }
      return out;
    };
    return {
      g: (p: Vec3, _phi: number, t: number): number => {
        const [q, q1] = at(t);
        return dot(sub(p, q), q1);
      },
      grad: (t: number): [Vec3, number] => [at(t)[1], 0],
      gt: (p: Vec3, t: number): number => {
        const [q, q1, q2] = at(t);
        return -dot(q1, q1) + dot(sub(p, q), q2);
      },
      extra: (p: Vec3, dp: Vec3, t: number): number => {
        const [q, q1, q2, q3] = at(t);
        return 2 * dot(dp, q2) - 3 * dot(q1, q2) + dot(sub(p, q), q3);
      },
      angle: (): number => 0,
    };
  }

  /**
   * The law of the phase or the angle parameter; the arc parameter's law needs the walked loop ({@link arc}).
   *
   * @param parameter The parameter.
   * @returns The law, or null for the arc parameter or a degenerate axis.
   *
   * @evidence contracts/common.md#principled-implementation Phase uses its direct difference; angle normalizes the supplied axis/projected reference and builds analytic rotating-plane callbacks with an atan2 seed branch.
   * @evidence contracts/common.md#clear-and-simple-design One closed parameter dispatch returns phase/angle laws and delegates walked-guide preparation to arc.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Returns null for arc or failed normal/reference normalization; it does not validate every extreme-scale axis, enforce a half-plane inequality or prove transversality of a selected branch.
   * @evidence contracts/common.md#meaningful-documentation Gives supported kinds, nullable failures and the exact phase/angle equations above.
   * @evidence contracts/performance.md#efficient-algorithms Fixed-size basis preparation and constant callback arithmetic; current angle readings allocate small vectors rather than retaining a query cache.
   * @evidence contracts/performance.md#reuse-equivalent-work The angle basis is prepared once for all callbacks; its centre remains the supplied tuple reference, so changing authoring data is not a cache invalidation mechanism.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Phase closures hold no geometry; angle closures retain two basis vectors and the borrowed centre for the law's lifetime, without a growing map or acquired handle.
   */
  export function of(
    parameter: AutoMovieSolidIntersection.Parameter,
  ): ILaw | null {
    if (parameter.kind === "arc") return null;
    if (parameter.kind === "phase")
      return {
        g: (_p: Vec3, phi: number, t: number): number => phi - t,
        grad: (): [Vec3, number] => [[0, 0, 0], 1],
        gt: (): number => -1,
        extra: (): number => 0,
        angle: (): number => 0,
      };
    const n: Vec3 | null = AutoMovieSolidVector.unit(parameter.normal);
    if (n === null) return null;
    const e1: Vec3 | null = AutoMovieSolidVector.unit(
      sub(parameter.reference, scale(n, dot(parameter.reference, n))),
    );
    if (e1 === null) return null;
    const e2: Vec3 = cross(n, e1);
    const c: Vec3 = parameter.centre;
    const d = (t: number): Vec3 =>
      add(scale(e1, Math.cos(t)), scale(e2, Math.sin(t)));
    const m = (t: number): Vec3 =>
      add(scale(e1, -Math.sin(t)), scale(e2, Math.cos(t)));
    return {
      g: (p: Vec3, _phi: number, t: number): number => dot(sub(p, c), m(t)),
      grad: (t: number): [Vec3, number] => [m(t), 0],
      gt: (p: Vec3, t: number): number => -dot(sub(p, c), d(t)),
      extra: (p: Vec3, dp: Vec3, t: number): number =>
        -2 * dot(dp, d(t)) - dot(sub(p, c), m(t)),
      angle: (p: Vec3): number =>
        Math.atan2(dot(sub(p, c), e2), dot(sub(p, c), e1)),
    };
  }
}
