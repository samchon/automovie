import { AutoMovieViewSection } from "@automovie/engine";

/**
 * Independent named head points constrain the original section that owns them.
 * These local dimension solves use the engine's actual section definition;
 * neither a mesh, a reference residual nor a translated finished part enters.
 *
 * @evidence contracts/common.md#principled-implementation Closes a supplied point on the actual four-support section, keeping the other independent supports and the point's world frame.
 * @evidence contracts/common.md#clear-and-simple-design Two scalar solves own lateral extent and anterior fullness; the head source owns their height courses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No alternate Human conic, source fitting, queried-value clamp or anatomical offset is introduced.
 * @evidence contracts/common.md#meaningful-documentation Separates original section constraints from complete skin, extrema and reference acceptance.
 * @evidence contracts/performance.md#efficient-algorithms Each local solve prepares fixed-size sections through a bounded bracket and sixty bisections, without generating a head.
 * @evidence contracts/performance.md#reuse-equivalent-work Solved dimensions are shared by all source readings and loft stations of the caller.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only returned scalars survive; there is no global source cache.
 */
export namespace AutoMovieHumanHeadSectionConstraints {
  /** Four signed-guide magnitudes, front/left/back/right, calibration mm. */
  type Extents = [number, number, number, number];

  /**
   * Lateral extent that puts a named point at its supplied half breadth.
   * The fixed forward coordinate is relative to the actual section origin.
   *
   * @evidence contracts/common.md#principled-implementation Solves the original section radius on the ray through the independent named point, changing only the two equal lateral supports. Bisection requires a finite continuous residual on its bracket; basic input bounds alone do not certify the engine's representable G2 domain, and every failed evaluation is exposed.
   * @evidence contracts/common.md#clear-and-simple-design Returns one lateral source value before any loft or tree is constructed.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No whole-ring half-width is substituted for the width at another forward datum.
   * @evidence contracts/common.md#meaningful-documentation States local forward coordinate, target half breadth and preserved quarter inputs.
   * @evidence contracts/performance.md#efficient-algorithms A fixed-size local solve has at most sixty-four bracket expansions and sixty bisections.
   * @evidence contracts/performance.md#reuse-equivalent-work The caller retains the result at its named source station.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary section records are invocation-local.
   */
  export function lateral(extents: Extents, shoulders: Extents, forward: number, half: number): number {
    admit(extents, shoulders);
    if (!(half > 0 && forward > -extents[2] && forward < extents[0])) throw new Error("Head breadth point must lie between its original sagittal supports");
    if (forward === 0) return half;
    const angle: number = Math.atan2(half, forward);
    const target: number = Math.hypot(forward, half);
    const residual: (width: number) => number = (width: number): number => radius([extents[0], width, extents[2], width], shoulders, angle) - target;
    let lo: number = half;
    let hi: number = Math.max(extents[1], 2 * half);
    for (let i: number = 0; residual(hi) < 0 && i < 64; i++) hi *= 2;
    if (!(residual(lo) <= 0 && residual(hi) >= 0 && Number.isFinite(hi))) throw new Error("Head breadth has no finite original-section bracket");
    for (let i: number = 0; i < 60; i++) {
      const middle: number = (lo + hi) / 2;
      if (residual(middle) < 0) lo = middle; else hi = middle;
    }
    return (lo + hi) / 2;
  }

  /**
   * Anterior-quarter fullness through ft, preserving all four supports.
   * The rational quarter's point supplies a dimensionless initial bracket;
   * the actual engine section, including its shared-curvature construction,
   * determines the result. This does not claim that its raw loft is admitted.
   *
   * @evidence contracts/common.md#principled-implementation Solves the actual section radius at the independent ft ray, retaining posterior shoulder inputs and four cranial supports. The rational weight only initializes the bracket; it does not prove the engine's full representable G2 domain or residual continuity. Failed evaluations remain explicit. Shared guide curvature can change posterior spans, which remain part of the complete observation round.
   * @evidence contracts/common.md#clear-and-simple-design Returns the common anterior shoulder for the symmetric two front quarters.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not narrow the full cranial breadth or credit the retired radial taper as active delivery.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes the rational bracket from the engine-owned curve and separate convexity admission.
   * @evidence contracts/performance.md#efficient-algorithms Constant-size section evaluations with bounded bracketing and sixty bisections replace whole-head regeneration.
   * @evidence contracts/performance.md#reuse-equivalent-work One solved shoulder supplies both anterior source quarters.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a scalar; local closures and section records are released with the call.
   */
  export function frontal(extents: Extents, posterior: number, forward: number, half: number): number {
    admit(extents, [posterior, posterior, posterior, posterior]);
    const u: number = forward / extents[0];
    const v: number = half / extents[1];
    if (!(u > 0 && u < 1 && v > 0 && v < 1 && u + v > 1)) throw new Error("Frontal point must lie inside its support box and outside its diagonal chord");
    const weight: number = (u + v - 1) / (2 * Math.sqrt((1 - u) * (1 - v)));
    const angle: number = Math.atan2(half, forward);
    const target: number = Math.hypot(forward, half);
    const residual: (w: number) => number = (w: number): number => {
      const shoulder: number = w / (1 + w);
      return radius(extents, [shoulder, posterior, posterior, shoulder], angle) - target;
    };
    let lo: number = weight;
    let hi: number = weight;
    for (let i: number = 0; residual(lo) > 0 && i < 64; i++) lo /= 2;
    for (let i: number = 0; residual(hi) < 0 && i < 64; i++) hi *= 2;
    if (!(lo > 0 && Number.isFinite(hi) && residual(lo) <= 0 && residual(hi) >= 0)) throw new Error("Frontal point has no finite original-quarter bracket");
    for (let i: number = 0; i < 60; i++) {
      const middle: number = (lo + hi) / 2;
      if (residual(middle) < 0) lo = middle; else hi = middle;
    }
    const result: number = (lo + hi) / 2;
    return result / (1 + result);
  }

  /** Radius of the engine-owned original section; no validity fallback changes its shape. */
  function radius(extents: Extents, shoulders: Extents, angle: number): number {
    const section: AutoMovieViewSection.ISection = AutoMovieViewSection.bare({ extents }, shoulders);
    const value: number = AutoMovieViewSection.radius(section, angle)[0];
    if (!(Number.isFinite(value) && value > 0)) throw new Error(`Head point constraint reached a nonfinite original section: box=[${extents}], shoulders=[${shoulders}], angle=${angle}, radius=${value}, source=${AutoMovieViewSection.fault(section)}`);
    return value;
  }

  /** Basic finite input bounds only. Actual positive curvature, representable G2 end domains and convexity remain separate engine premises; these bounds do not prove residual continuity. */
  function admit(extents: Extents, shoulders: Extents): void {
    if (!extents.every((value: number): boolean => Number.isFinite(value) && value > 0) || !shoulders.every((value: number): boolean => Number.isFinite(value) && value > 0 && value < 1)) throw new Error("Head point constraints require finite positive supports and shoulders inside (0,1)");
  }
}
