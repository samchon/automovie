import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSurface } from "../internal/HumanSurface";
import { HumanHandFeatureKernel } from "./HumanHandFeatureKernel";
import { HumanFourGroupRules } from "./HumanFourGroupRules";

/** Independent regular four-digit group candidate after thumb separation and
 * before pinky separation. It creates neither a branch bridge nor a fingertip.
 */
export namespace HumanFourGroupContours {
  /** Actual source/generator major supports, supplied by their common owner. */
  export interface Supports {
    /** Shared hand support, world mm. */
    handMm: HumanCurve.Vector;

    /** Existing thumb01 support, world mm. */
    thumbRootMm: HumanCurve.Vector;

    /** Existing thumb02 support, world mm, fixes its actual first-axis increment. */
    thumbSecondMm: HumanCurve.Vector;

    /** Middle01 major support, world mm, not a skin boundary. */
    middleRootMm: HumanCurve.Vector;

    /** Existing pinky01 support, world mm. */
    pinkyRootMm: HumanCurve.Vector;

    /** Existing index01 support, world mm, fixes the opposite root direction. */
    indexRootMm: HumanCurve.Vector;
  }

  /** These proposed source-feature objects belong to the common assembly. */
  export interface Features {
    /** Geometric thumb branch proxy, world mm; no wrist shift is added. */
    thumbMm: HumanCurve.Vector;

    /** Geometric pinky branch proxy, world mm; not the middle01 plane. */
    pinkyMm: HumanCurve.Vector;
  }

  /** Unit orthonormal frame, borrowed unchanged from the common owner. */
  export interface Frame {
    /** Increasing physical station; source condition is hand→middle01. */
    n: HumanCurve.Vector;

    /** First transverse coordinate; source native U, generated −across. */
    u: HumanCurve.Vector;

    /** Second transverse coordinate; source reflected native V, generated −normal. */
    v: HumanCurve.Vector;
  }

  /** Placement and physical domain are explicit, with no inferred attachment. */
  export interface Input {
    /** Stable identity shared by skin and construction. */
    id: string;

    /** One already owned support population. */
    supports: Supports;

    /** The common owner creates these once and shares the same unchanged object. */
    features: Features;

    /** Source/native condition uses wrist→middle01 N and native hand U,V.
     * Current generator transport supplies the corresponding shared frame;
     * this region neither rotates it nor compensates a support error. */
    frame: Frame;

    /** Positive finite physical hand circumference, mm; second-coordinate scale. */
    handCircumferenceMm: number;

    /** Dimensionless retained feature fraction, inside the observed envelope. */
    startFraction: number;

    /** Dimensionless last feature fraction, inside the envelope and after start. */
    endFraction: number;
  }

  /** Six exact derivatives, retaining each one-sided arc's own physical jet. */
  export interface Jet {
    /** World position, mm. */
    positionMm: HumanCurve.Vector;

    /** dP/ds, dimensionless, with physical s in mm along N. */
    longitudinalDerivative: HumanCurve.Vector;

    /** dP/du, mm, for local dimensionless feature arc u∈[0,1]. */
    phaseDerivative: HumanCurve.Vector;

    /** d²P/ds², mm⁻¹; zero for this identified linear-station law. */
    longitudinalSecondDerivative: HumanCurve.Vector;

    /** d²P/du², mm. */
    phaseSecondDerivative: HumanCurve.Vector;

    /** d²P/(ds du), dimensionless. */
    longitudinalPhaseDerivative: HumanCurve.Vector;
  }

  /** One exact group loop and its actual transverse first jet. */
  export interface Port {
    /** Station measured from the shared hand support along N, mm. */
    stationMm: number;

    /** Corresponding feature coordinate; it is not original material phase. */
    fraction: number;

    /** Actual four boundary arc objects, each with its original local direction. */
    arcs: HumanSurface.Boundary[];

    /** Arc integer 0..3 and dimensionless local 0..1 retain the specified C0 side. */
    jet: (arc: number, local: number) => Jet;
  }

  /** Physical Green-centroid axis two-jet at one in-domain station. */
  export interface AxisJet {
    /** World area centroid, mm. */
    positionMm: HumanCurve.Vector;

    /** dP/ds, dimensionless, with s measured in mm along frame.n. */
    derivative: HumanCurve.Vector;

    /** d²P/ds², mm⁻¹. */
    secondDerivative: HumanCurve.Vector;
  }

  /** A partial regular group authority, available for independent rendering. */
  export interface Result {
    /** Four identified linear-station/quintic-arc skin charts. */
    patches: HumanSurface.Patch[];

    /** Same generating curves for all incident charts and displayed construction. */
    boundaries: HumanSurface.Boundary[];

    /** Actual retained endpoint ports, without an implicit bridge. */
    principal: readonly [Port, Port];

    /** In-domain station in mm derives another exact port; cache it when shared. */
    portAt: (stationMm: number) => Port;

    /** Station in mm, arc integer 0..3, local 0..1 retain both C0-side six-jets. */
    jet: (stationMm: number, arc: number, local: number) => Jet;

    /** Exact Green-centroid axis of the generated curves, not a root average. */
    axis: HumanSurface.Boundary;

    /** Rational degree-three/two centroid and its full physical second jet. */
    axisJet: (stationMm: number) => AxisJet;

    /** Physical domain in mm along the caller's actual N axis. */
    domainMm: readonly [number, number];

    /** The actual borrowed features used by every dependent consumer. */
    features: Features;

    /** Source-native likeness, generated transport and missing branches differ. */
    limitations: readonly string[];
  }

  /** Propose two geometric branch features from common actual support vectors.
   * The assembly calls this once if it accepts this observational proxy and
   * passes the returned object to every consumer. This function owns no rig,
   * retained cut or clinical landmark. Whole-person-held-out error remains
   * 6.247 mm thumb / 4.912 mm pinky, so native-conditional source identification
   * and subsequent generated-frame transport must be reported separately.
   */
  export function proposeFeatures(supports: Supports): Features {
    for (const p of Object.values(supports)) if (p.length !== 3 || !p.every(Number.isFinite)) throw new Error("Group feature supports must be finite registered points");
    const thumbBasis: HumanCurve.Vector[] = [difference(supports.thumbRootMm, supports.handMm), difference(supports.middleRootMm, supports.handMm), difference(supports.thumbSecondMm, supports.thumbRootMm)];
    const pinkyBasis: HumanCurve.Vector[] = [difference(supports.pinkyRootMm, supports.handMm), difference(supports.middleRootMm, supports.handMm), difference(supports.indexRootMm, supports.handMm)];
    const apply = (basis: HumanCurve.Vector[], coefficients: readonly number[]): HumanCurve.Vector => [0, 1, 2].map((k: number): number =>
      supports.handMm[k]! + basis.reduce((sum: number, p: HumanCurve.Vector, i: number): number => sum + coefficients[i]! * p[k]!, 0)) as HumanCurve.Vector;
    return { thumbMm: apply(thumbBasis, HumanFourGroupRules.thumbFeature), pinkyMm: apply(pinkyBasis, HumanFourGroupRules.pinkyFeature) };
  }

  /**
   * Build the observed regular four-digit group, independently of the missing
   * thumb/pinky/web assemblies. Exact source selection requires index, middle,
   * ring and pinky to share one loop between the thumb and pinky PL events.
   * Twenty complete cubic source contours provide 1,600 physical observations.
   * All original actual h and both C0-side jets remain archived. Native U/V rays
   * through the middle01 major axis identify the four geometric phase anchors;
   * their outermost actual cubic roots are retained with all alternative roots.
   * Global extrema were rejected because different knuckles exchange extrema.
   *
   * Forty vector channels retain independent incoming/outgoing feature jets.
   * Linear physical feature-station behavior has rank80, point RMS3.704/max14.424
   * mm and whole-person-held-out max16.215mm. Quadratic station behavior worsened
   * held-out error and is not used. Root-chord projection supplies the actual
   * transverse scale and hand circumference the thickness scale; neither is
   * connected to a pre-existing arbitrary form. Four full-domain polynomial
   * angular-flow and speed² Bernstein bounds are positive, with raw area lower
   * bound .165061. These ordinary-binary64 premises are not interval proofs.
   *
   * Skin, all construction and every newly requested intermediate port evaluate
   * the same generating expression. The centre axis uses complete polynomial
   * Green area/moments and their rational derivatives, never a root midpoint.
   * Existing thumb and finger02 ports have different axes and are not attached.
   *
   * @evidence contracts/common.md#principled-implementation Whole source loop selection, native guide correspondence and shared linear-station vector least squares identify a new group law; full degrees, C0 sides, physical chain rule and rational Green centroid are retained.
   * @evidence contracts/common.md#clear-and-simple-design One regional authority supplies the missing regular group loop and its six jets while the common owner alone supplies frames, shared feature objects, retained ports and later branch transport.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No original curve or mesh, normal fallback, specimen coefficients, arbitrary shift, four-finger02 union or synthetic bridge enters generation.
   * @evidence contracts/common.md#meaningful-documentation Units, source phase, original C0 preservation versus new approximation, held-out errors, one-sided jets and incomplete integration are explicit.
   */
  export function build(input: Input): Result {
    const O: HumanCurve.Vector = [...input.supports.handMm], N: HumanCurve.Vector = [...input.frame.n];
    const U: HumanCurve.Vector = [...input.frame.u], V: HumanCurve.Vector = [...input.frame.v];
    const vectors: HumanCurve.Vector[] = [O, N, U, V, input.supports.indexRootMm, input.supports.pinkyRootMm, input.features.thumbMm, input.features.pinkyMm];
    if (!input.id || vectors.some((p: HumanCurve.Vector): boolean => p.length !== 3 || !p.every(Number.isFinite)) ||
      ![input.handCircumferenceMm, input.startFraction, input.endFraction].every(Number.isFinite) || input.handCircumferenceMm <= 0 ||
      input.startFraction < HumanFourGroupRules.observedFraction[0] || input.endFraction > HumanFourGroupRules.observedFraction[1] || input.startFraction >= input.endFraction)
      throw new Error("A group requires finite physical inputs and an explicitly retained observed feature interval");
    if ([N, U, V].some((p: HumanCurve.Vector): boolean => Math.abs(dot(p, p) - 1) > 1e-10) || [dot(N, U), dot(N, V), dot(U, V)].some((x: number): boolean => Math.abs(x) > 1e-10))
      throw new Error("The common owner must supply the one orthonormal group frame");
    const G: number = input.handCircumferenceMm, B: number = Math.abs(dot(difference(input.supports.indexRootMm, input.supports.pinkyRootMm), U));
    const s0: number = dot(difference(input.features.thumbMm, O), N), s1: number = dot(difference(input.features.pinkyMm, O), N), D: number = s1 - s0;
    if (!(B > 0 && D > 0 && Number.isFinite(B) && Number.isFinite(D) && D * D > 0 && Number.isFinite(D * D)))
      throw new Error("Actual root span and the ordered branch-feature separation must be positive and representable");
    const domain: readonly [number, number] = [s0 + D * input.startFraction, s0 + D * input.endFraction];
    if (!(domain[0] < domain[1] && domain.every(Number.isFinite))) throw new Error("Group physical domain collapsed in binary64");
    const fraction = (s: number): number => {
      if (!Number.isFinite(s) || s < domain[0] || s > domain[1]) throw new Error("A group station must lie in the retained physical interval");
      // Preserve the owner's exact endpoint address through unit conversion;
      // this is not a shape clamp or a specimen-dependent coordinate shift.
      return s === domain[0] ? input.startFraction : s === domain[1] ? input.endFraction : (s - s0) / D;
    };
    const channels = (tau: number, derivative: boolean): number[] => HumanFourGroupRules.coefficients[0]!.map((a: number, i: number): number =>
      (derivative ? HumanFourGroupRules.coefficients[1]![i]! / D : a + tau * HumanFourGroupRules.coefficients[1]![i]!) * (i % 2 === 0 ? B : G));
    const jet: Result["jet"] = (s: number, arc: number, local: number): Jet => {
      if (!Number.isInteger(arc) || arc < 0 || arc >= 4 || !Number.isFinite(local) || local < 0 || local > 1)
        throw new Error("A group curve needs its explicit arc and local one-sided parameter");
      const tau: number = fraction(s), c: number[] = channels(tau, false), ds: number[] = channels(tau, true);
      return { positionMm: transform(O, N, U, V, s, planar(c, arc, local, 0)), longitudinalDerivative: transform([0, 0, 0], N, U, V, 1, planar(ds, arc, local, 0)),
        phaseDerivative: transform([0, 0, 0], N, U, V, 0, planar(c, arc, local, 1)), longitudinalSecondDerivative: [0, 0, 0],
        phaseSecondDerivative: transform([0, 0, 0], N, U, V, 0, planar(c, arc, local, 2)),
        longitudinalPhaseDerivative: transform([0, 0, 0], N, U, V, 0, planar(ds, arc, local, 1)) };
    };
    const portAt: Result["portAt"] = (s: number): Port => {
      const tau: number = fraction(s);
      return { stationMm: s, fraction: tau, jet: (arc: number, local: number): Jet => jet(s, arc, local),
        arcs: Array.from({ length: 4 }, (_: unknown, arc: number): HumanSurface.Boundary => ({
          id: input.id + ".port." + s + ".arc." + arc, unit: "normalized-feature-arc", start: 0, end: 1,
          evaluate: (local: number): HumanCurve.Vector => jet(s, arc, local).positionMm,
          derivative: (local: number): HumanCurve.Vector => jet(s, arc, local).phaseDerivative,
        })) };
    };
    const principal: readonly [Port, Port] = [portAt(domain[0]), portAt(domain[1])];
    const guides: HumanSurface.Boundary[] = Array.from({ length: 4 }, (_: unknown, arc: number): HumanSurface.Boundary => ({
      id: input.id + ".guide." + arc, unit: "mm", start: domain[0], end: domain[1],
      evaluate: (s: number): HumanCurve.Vector => jet(s, arc, 0).positionMm,
      derivative: (s: number): HumanCurve.Vector => jet(s, arc, 0).longitudinalDerivative,
    }));
    const outwardSign: 1 | -1 = dot(N, cross(U, V)) > 0 ? -1 : 1;
    const patches: HumanSurface.Patch[] = Array.from({ length: 4 }, (_: unknown, arc: number): HumanSurface.Patch => ({
      id: input.id + ".arc." + arc, u: { start: domain[0], end: domain[1], unit: "mm" }, v: { start: 0, end: 1, unit: "normalized-feature-arc" }, outwardSign,
      jet: (s: number, local: number): ReturnType<HumanSurface.Patch["jet"]> => { const j: Jet = jet(s, arc, local); return { positionMm: j.positionMm, derivativeU: j.longitudinalDerivative, derivativeV: j.phaseDerivative }; },
      boundaries: { u0: { curve: principal[0].arcs[arc]!, orientation: 1 }, u1: { curve: principal[1].arcs[arc]!, orientation: 1 },
        v0: { curve: guides[arc]!, orientation: 1 }, v1: { curve: guides[(arc + 1) % 4]!, orientation: 1 } },
    }));
    const area: number[] = [0, 0, 0], mx: number[] = [0, 0, 0, 0], my: number[] = [0, 0, 0, 0];
    const power: number[][] = [channels(0, false), HumanFourGroupRules.coefficients[1]!.map((c: number, i: number): number => c * (i % 2 === 0 ? B : G))];
    for (let arc: number = 0; arc < 4; ++arc) {
      const x: number[][] = phasePower(power, arc, 0), y: number[][] = phasePower(power, arc, 1);
      accumulate(area, green(x, phaseDerivative(y)), 1);
      accumulate(mx, green(phaseProduct(x, x), phaseDerivative(y)), .5);
      accumulate(my, green(phaseProduct(y, y), phaseDerivative(x)), -.5);
    }
    const axisJet: Result["axisJet"] = (s: number): ReturnType<Result["axisJet"]> => {
      const tau: number = fraction(s), a: number = poly(area, tau, 0), da: number = poly(area, tau, 1), dda: number = poly(area, tau, 2);
      if (!(a > 0 && Number.isFinite(a))) throw new Error("The generated group area is not positive and representable");
      const c: number[][] = [mx, my].map((m: number[]): number[] => {
        const value: number = poly(m, tau, 0), first: number = poly(m, tau, 1), second: number = poly(m, tau, 2);
        return [value / a, (first / a - value * da / (a * a)) / D,
          (second / a - 2 * first * da / (a * a) - value * dda / (a * a) + 2 * value * da * da / (a * a * a)) / (D * D)];
      });
      return { positionMm: transform(O, N, U, V, s, [c[0]![0]!, c[1]![0]!]), derivative: transform([0, 0, 0], N, U, V, 1, [c[0]![1]!, c[1]![1]!]),
        secondDerivative: transform([0, 0, 0], N, U, V, 0, [c[0]![2]!, c[1]![2]!]) };
    };
    const axis: HumanSurface.Boundary = { id: input.id + ".green-centroid-axis", unit: "mm", start: domain[0], end: domain[1],
      evaluate: (s: number): HumanCurve.Vector => axisJet(s).positionMm, derivative: (s: number): HumanCurve.Vector => axisJet(s).derivative };
    return { patches, principal, portAt, jet, axis, axisJet, domainMm: domain, features: input.features, boundaries: [...principal[0].arcs, ...principal[1].arcs, ...guides],
      limitations: [
        "Independent regular 4digit group candidate only: first thumb branch, pinky branch, later finger-root/web branches and neighboring joins remain absent",
        "Native frame/feature conditional full-fit RMS3.704/max14.424mm and whole-person held-out max16.215mm are different from generated-frame transport and actual skin likeness",
        "The common owner selects ports and shares the exact feature object; no source sampling plane or middle01 plane is promoted to a common group boundary",
        "Source original h and C0-side jets remain archived. This new four-arc approximation retains independent feature tangents, while interior source corners and near-critical details remain unsupported",
        "Phase follows geometric outer native U/V-ray roots; one Daniel curve has additional source roots retained in the study. It is not material transport or clinical finger correspondence",
        "Local immersion follows positive polynomial flow/speed bounds in real arithmetic. Binary64 bounds are not outward interval certification; actual neighbor/embedding render inspection remains required",
        "Independent native parameter response and outside-cohort morphology prediction remain unqualified; actual root span and G act on different geometric coordinates",
        "No source curve, mesh, normal fallback, person control table, wrist correction or arbitrary bridge is consumed at runtime",
      ] };
  }

  /** Two in-plane physical coordinates. */
  type Pair = [number, number];
  /** Retain full exact power derivatives without fitting sampled construction. */
  const poly: typeof HumanHandFeatureKernel.polynomial = HumanHandFeatureKernel.polynomial;
  /** Independent endpoint jets and zero-first-jet residual weights. */
  const weights: readonly (readonly number[])[] = [[1, 0, -3, 2, 0, 0], [0, 0, 3, -2, 0, 0], [0, 1, -2, 1, 0, 0], [0, 0, -1, 1, 0, 0], [0, 0, 1, -2, 1, 0], [0, 0, -1, 4, -5, 2]];

  /** Forty-channel vector arc; old palm's 28-channel layout is not compatible. */
  function planar(c: number[], arc: number, local: number, order: number): Pair {
    const next: number = (arc + 1) % 4, h: number[] = weights.map((w: readonly number[]): number => poly(w, local, order));
    return [0, 1].map((j: number): number => h[0]! * c[2 * arc + j]! + h[1]! * c[2 * next + j]! + h[2]! * c[10 + 4 * arc + j]! +
      h[3]! * c[8 + 4 * next + j]! + h[4]! * c[24 + 4 * arc + j]! + h[5]! * c[26 + 4 * arc + j]!) as Pair;
  }

  /** Angular power coefficients retain both complete station powers. */
  function phasePower(c: number[][], arc: number, j: number): number[][] {
    const next: number = (arc + 1) % 4;
    return Array.from({ length: 6 }, (_: unknown, k: number): number[] => c.map((row: number[]): number =>
      weights[0]![k]! * row[2 * arc + j]! + weights[1]![k]! * row[2 * next + j]! + weights[2]![k]! * row[10 + 4 * arc + j]! +
      weights[3]![k]! * row[8 + 4 * next + j]! + weights[4]![k]! * row[24 + 4 * arc + j]! + weights[5]![k]! * row[26 + 4 * arc + j]!));
  }
  /** Complete power convolution; no degree reduction. */
  function product(a: number[], b: number[]): number[] { const c: number[] = new Array(a.length + b.length - 1).fill(0); for (let i: number = 0; i < a.length; ++i) for (let j: number = 0; j < b.length; ++j) c[i + j]! += a[i]! * b[j]!; return c; }
  /** Add a complete station polynomial. */
  function accumulate(a: number[], b: number[], scale: number): void { for (let i: number = 0; i < b.length; ++i) a[i]! += scale * b[i]!; }
  /** Retain station powers while differentiating the exact angular polynomial. */
  function phaseDerivative(a: number[][]): number[][] { return a.slice(1).map((c: number[], i: number): number[] => c.map((x: number): number => (i + 1) * x)); }
  /** Full angular and station product. */
  function phaseProduct(a: number[][], b: number[][]): number[][] { const out: number[][] = Array.from({ length: a.length + b.length - 1 }, (): number[] => new Array(a[0]!.length + b[0]!.length - 1).fill(0)); for (let i: number = 0; i < a.length; ++i) for (let j: number = 0; j < b.length; ++j) accumulate(out[i + j]!, product(a[i]!, b[j]!), 1); return out; }
  /** Exact Green integral on one original local generated arc interval [0,1]. */
  function green(a: number[][], b: number[][]): number[] { const p: number[][] = phaseProduct(a, b), out: number[] = new Array(p[0]!.length).fill(0); p.forEach((c: number[], i: number): void => accumulate(out, c, 1 / (i + 1))); return out; }
  /** Shared world frame for both position and derivative units. */
  function transform(o: HumanCurve.Vector, n: HumanCurve.Vector, u: HumanCurve.Vector, v: HumanCurve.Vector, station: number, p: Pair): HumanCurve.Vector { return [0, 1, 2].map((k: number): number => o[k]! + n[k]! * station + u[k]! * p[0] + v[k]! * p[1]) as HumanCurve.Vector; }
  /** Registered metric. */
  function dot(a: HumanCurve.Vector, b: HumanCurve.Vector): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  /** Actual support difference, without a coordinate correction. */
  function difference(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  /** Retain reflected orientation rather than normalizing its sign. */
  function cross(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
}
