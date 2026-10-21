import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSurface } from "../internal/HumanSurface";
import { HumanPalmRules } from "./HumanPalmRules";
import { HumanHandFeatureKernel } from "./HumanHandFeatureKernel";

/** Non-radial proximal-palm contours preserve the observed four-feature phase.
 * The common boundary owner supplies placement and the retained physical domain;
 * this regional candidate creates no thumb, web, digit-root or wrist attachment.
 */
export namespace HumanPalmContours {
  /** The assembly-owned frame is already orthonormal. Reflection is retained. */
  export interface Frame {
    /** Unit wrist-to-middle-root direction, not a digit's distal shaft axis. */
    n: HumanCurve.Vector;
    /** First observed transverse coordinate, opposite the shared hand across axis. */
    u: HumanCurve.Vector;
    /** Second observed coordinate, opposite the shared neutral hand normal. */
    v: HumanCurve.Vector;
  }

  /** Physical dimensions and placement supplied by the common owner. */
  export interface Input {
    /** Stable regional identity. */
    id: string;
    /** Common hand support in world millimetres; it is not a skin centroid. */
    wristMm: HumanCurve.Vector;
    /** One shared generating frame; the regional method does not normalize it. */
    frame: Frame;
    /** Existing wrist-to-middle-root reach, millimetres. */
    palmLengthMm: number;
    /** Existing physical hand-circumference input, millimetres. */
    handCircumferenceMm: number;
    /** Positive retained station selected by the boundary owner, at most the
     * explicitly observed common proximal-domain fraction times palm length. */
    endStationMm: number;
  }

  /** Exact derivatives retain physical station and feature-phase units. */
  export interface Jet {
    /** World millimetres from the same expression consumed by skin. */
    positionMm: HumanCurve.Vector;
    /** dP/ds, millimetres per physical station millimetre. */
    longitudinalDerivative: HumanCurve.Vector;
    /** dP/dphase, millimetres per normalized feature arc; phase runs 0 to 4. */
    phaseDerivative: HumanCurve.Vector;
    /** d²P/ds², inverse millimetres. */
    longitudinalSecondDerivative: HumanCurve.Vector;
    /** d²P/dphase², millimetres per normalized feature arc squared. At an
     * integer phase the increasing-side value is returned, except at phase 4. */
    phaseSecondDerivative: HumanCurve.Vector;
    /** d²P/(ds dphase), inverse normalized feature arcs. */
    longitudinalPhaseDerivative: HumanCurve.Vector;
  }

  /** Regional geometry is a partial candidate, with no implicit attachment. */
  export interface Result {
    /** Four charts consume the same actual longitudinal feature boundaries. */
    patches: HumanSurface.Patch[];
    /** Eight endpoint arcs and four feature trajectories used by the charts. */
    boundaries: HumanSurface.Boundary[];
    /** Only the two retained endpoint layers are principal in this monotone
     * proximal domain; later branch and volume features remain unrepresented. */
    principal: { stationMm: number; arcs: HumanSurface.Boundary[] }[];
    /** Exact regional formula, shared with every chart and construction curve. */
    jet: (stationMm: number, featurePhase: number) => Jet;
    /** Source reproduction, independent response and missing domains stay explicit. */
    limitations: string[];
  }

  /**
   * Build a partial proximal palm from 84 common least-squares coefficients.
   * Fifty-one original pre-branch Hermite contours supply 4,896 observations.
   * Their exact in-plane extrema fix four corresponding feature arcs; original
   * positive Hermite widths establish sampling within each source arc, without
   * claiming material transport. This new identified quintic-by-quadratic law
   * is not a conversion or reduction of the independently preserved source.
   *
   * Four quintics share positions and first derivatives. Their two zero-jet
   * residual vectors retain the observed non-star shape. Whole-domain Bernstein
   * coordinate-envelope inequalities preserve the four feature extrema, with
   * reported ordinary-binary64 feasibility residual at most 1.36e-16. Angular second jets
   * may jump at feature joins, so the method claims C1, not C2. Skin and displayed
   * construction consume identical functions and shared boundary objects.
   *
   * Hand circumference scales the transverse law and palm length scales its
   * physical station. Hand breadth's independent skin response is unresolved:
   * adding its observational predictor worsened person-held-out error. Full-fit
   * point RMS is 4.077 mm, maximum 11.821 mm; held-out maximum is 14.864 mm.
   * Neither fitting nor local immersion qualifies the whole hand or its joins.
   */
  export function build(input: Input): Result {
    const { n, u, v }: Frame = input.frame;
    const vectors: HumanCurve.Vector[] = [input.wristMm, n, u, v];
    if (!input.id || vectors.some((value: HumanCurve.Vector): boolean =>
      value.length !== 3 || !value.every(Number.isFinite)) ||
      ![input.palmLengthMm, input.handCircumferenceMm, input.endStationMm].every(
        (value: number): boolean => Number.isFinite(value) && value > 0,
      ) || input.endStationMm > HumanPalmRules.maximumObservedFraction * input.palmLengthMm)
      throw new Error("A proximal palm requires finite positive dimensions and an explicitly retained observed domain");
    if ([n, u, v].some((axis: HumanCurve.Vector): boolean => Math.abs(dot(axis, axis) - 1) > 1e-10) ||
      [dot(n, u), dot(n, v), dot(u, v)].some((value: number): boolean => Math.abs(value) > 1e-10))
      throw new Error("The common owner must supply an orthonormal palm frame");
    const determinant: number = dot(n, cross(u, v));
    const outwardSign: 1 | -1 = determinant > 0 ? -1 : 1;
    const origin: HumanCurve.Vector = [...input.wristMm];
    const N: HumanCurve.Vector = [...n], U: HumanCurve.Vector = [...u], V: HumanCurve.Vector = [...v];
    const lengthMm: number = input.palmLengthMm, girthMm: number = input.handCircumferenceMm;
    const endMm: number = input.endStationMm;
    const coefficientBound: number = HumanPalmRules.coefficients.reduce(
      (sum: number, row: readonly number[]): number => sum + row.reduce(
        (subtotal: number, value: number): number => subtotal + Math.abs(value), 0,
      ), 0,
    );
    if (!Number.isFinite(girthMm * coefficientBound) ||
      !(lengthMm * lengthMm > 0 && Number.isFinite(lengthMm * lengthMm)))
      throw new Error("The physical palm dimensions exceed the polynomial's representable arithmetic");

    const jet: Result["jet"] = (stationMm: number, phase: number): Jet => {
      if (!Number.isFinite(stationMm) || stationMm < 0 || stationMm > endMm ||
        !Number.isFinite(phase) || phase < 0 || phase > 4)
        throw new Error("Palm station and feature phase must lie in the retained physical domain");
      const arc: number = phase === 4 ? 3 : Math.floor(phase);
      const local: number = phase - arc, z: number = stationMm / lengthMm;
      const section: number[][] = [0, 1, 2].map((order: number): number[] =>
        Array.from({ length: 28 }, (_: unknown, channel: number): number => {
          const a: number = HumanPalmRules.coefficients[0]![channel]!;
          const b: number = HumanPalmRules.coefficients[1]![channel]!;
          const c: number = HumanPalmRules.coefficients[2]![channel]!;
          return order === 0 ? girthMm * (a + z * (b + z * c)) :
            order === 1 ? girthMm * (b + 2 * z * c) / lengthMm :
              2 * girthMm * c / (lengthMm * lengthMm);
        }),
      );
      const P: Pair = HumanHandFeatureKernel.planar(section[0]!, arc, local, 0);
      const Ps: Pair = HumanHandFeatureKernel.planar(section[1]!, arc, local, 0);
      const Pu: Pair = HumanHandFeatureKernel.planar(section[0]!, arc, local, 1);
      const Pss: Pair = HumanHandFeatureKernel.planar(section[2]!, arc, local, 0);
      const Puu: Pair = HumanHandFeatureKernel.planar(section[0]!, arc, local, 2);
      const Psu: Pair = HumanHandFeatureKernel.planar(section[1]!, arc, local, 1);
      return {
        positionMm: combine(origin, N, U, V, stationMm, P),
        longitudinalDerivative: combine([0, 0, 0], N, U, V, 1, Ps),
        phaseDerivative: combine([0, 0, 0], N, U, V, 0, Pu),
        longitudinalSecondDerivative: combine([0, 0, 0], N, U, V, 0, Pss),
        phaseSecondDerivative: combine([0, 0, 0], N, U, V, 0, Puu),
        longitudinalPhaseDerivative: combine([0, 0, 0], N, U, V, 0, Psu),
      };
    };
    const features: HumanSurface.Boundary[] = Array.from({ length: 4 }, (_: unknown, arc: number): HumanSurface.Boundary => ({
      id: input.id + ".feature." + arc, unit: "mm", start: 0, end: endMm,
      evaluate: (s: number): HumanCurve.Vector => jet(s, arc).positionMm,
      derivative: (s: number): HumanCurve.Vector => jet(s, arc).longitudinalDerivative,
    }));
    const principal: Result["principal"] = [0, endMm].map((stationMm: number, layer: number): Result["principal"][number] => ({
      stationMm,
      arcs: Array.from({ length: 4 }, (_: unknown, arc: number): HumanSurface.Boundary => ({
        id: input.id + ".layer." + layer + ".arc." + arc, unit: "normalized-feature-arc", start: 0, end: 1,
        evaluate: (phase: number): HumanCurve.Vector => jet(stationMm, arc + arcParameter(phase)).positionMm,
        derivative: (phase: number): HumanCurve.Vector => jet(stationMm, arc + arcParameter(phase)).phaseDerivative,
      })),
    }));
    const patches: HumanSurface.Patch[] = Array.from({ length: 4 }, (_: unknown, arc: number): HumanSurface.Patch => ({
      id: input.id + ".arc." + arc, u: { start: 0, end: endMm, unit: "mm" },
      v: { start: 0, end: 1, unit: "normalized-feature-arc" }, outwardSign,
      jet: (s: number, phase: number): ReturnType<HumanSurface.Patch["jet"]> => {
        const value: Jet = jet(s, arc + arcParameter(phase));
        return { positionMm: value.positionMm, derivativeU: value.longitudinalDerivative, derivativeV: value.phaseDerivative };
      },
      boundaries: {
        u0: { curve: principal[0]!.arcs[arc]!, orientation: 1 },
        u1: { curve: principal[1]!.arcs[arc]!, orientation: 1 },
        v0: { curve: features[arc]!, orientation: 1 },
        v1: { curve: features[(arc + 1) % 4]!, orientation: 1 },
      },
    }));
    return {
      patches, principal, boundaries: [...principal[0]!.arcs, ...principal[1]!.arcs, ...features], jet,
      limitations: [
        "Partial proximal palm only: thumb split, thenar continuation, digit roots, interdigital webs and wrist attachment remain absent",
        "The caller retains a physical domain; its last curve is not an observed anatomical branch boundary",
        "Four source extrema establish geometric feature correspondence; within-arc phase is not material transport",
        "Common full-fit point RMS 4.077 mm and maximum 11.821 mm; person-held-out maximum 14.864 mm",
        "Hand breadth and palm-thickness independent skin laws remain unidentified; source parameter interventions remain required",
        "Source-observed circumference is 178.87441635131836 to 237.3563575744629 mm; other values are unqualified empirical extrapolation",
        "The piecewise quintic is C1; angular second derivatives are one-sided at the four feature joins",
        "Bernstein derivative bounds establish local immersion in real arithmetic; continuous embedding and neighbor compatibility remain unqualified",
        "No source mesh, source normal, specimen control table or source curve enters generation",
      ],
    };
  }

  /** Two physical in-plane coordinates in the caller's shared frame. */
  type Pair = HumanHandFeatureKernel.Pair;

  /** An arc retains its own declared interval rather than borrowing a neighbor. */
  function arcParameter(value: number): number {
    if (!Number.isFinite(value) || value < 0 || value > 1)
      throw new Error("A palm feature-arc parameter must lie between zero and one");
    return value;
  }

  /** Transform one physical point or derivative through the already owned frame. */
  function combine(origin: HumanCurve.Vector, n: HumanCurve.Vector, u: HumanCurve.Vector, v: HumanCurve.Vector, station: number, plane: Pair): HumanCurve.Vector {
    return [0, 1, 2].map((k: number): number => origin[k]! + n[k]! * station + u[k]! * plane[0] + v[k]! * plane[1]) as HumanCurve.Vector;
  }
  /** Same registered Euclidean metric as the common owner. */
  function dot(a: HumanCurve.Vector, b: HumanCurve.Vector): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  /** Retain the caller's handedness under physical reflection. */
  function cross(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
}
