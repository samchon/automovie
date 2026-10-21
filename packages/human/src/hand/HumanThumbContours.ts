import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanHandFrame } from "../internal/HumanHandFrame";
import { HumanHandFeatureKernel } from "./HumanHandFeatureKernel";
import type { HumanSurface } from "../internal/HumanSurface";
import { HumanThumbRules } from "./HumanThumbRules";

/** Independent post-branch thumb skin consumes one non-radial vector authority.
 * The common owner retains the wrist, supports and every attachment boundary. */
export namespace HumanThumbContours {
  /** Placement inherits the already generated hand and thumb support rules. */
  export interface Input {
    /** Stable regional identity used by skin and construction. */
    id: string;
    /** The same caller-owned hand frame used by palm and four-digit consumers. */
    handFrame: HumanHandFrame.Result;
    /** Caller-owned thumb_01 geometric support, world millimetres. */
    rootMm: HumanCurve.Vector;
    /** Caller-owned thumb_02 support establishes the actual thumb reference. */
    secondMm: HumanCurve.Vector;
    /** Caller-owned thumb_03 support; the independent thumb-length input has
     * already set the two support chords and is not applied a second time. */
    endMm: HumanCurve.Vector;
    /** Existing hand-circumference dimension, millimetres; transverse scale. */
    handCircumferenceMm: number;
  }

  /** Analytic world derivatives retain physical station and feature-arc units. */
  export interface Jet {
    /** World position, millimetres. */
    positionMm: HumanCurve.Vector;
    /** dP/ds for physical station millimetres. */
    longitudinalDerivative: HumanCurve.Vector;
    /** dP/dphase for phase from zero to four normalized feature arcs. */
    phaseDerivative: HumanCurve.Vector;
    /** d2P/ds2, inverse millimetres. */
    longitudinalSecondDerivative: HumanCurve.Vector;
    /** One-sided d2P/dphase2 at the four C1 feature joins. */
    phaseSecondDerivative: HumanCurve.Vector;
    /** d2P/(ds dphase), per normalized feature arc. */
    longitudinalPhaseDerivative: HumanCurve.Vector;
  }

  /** A real generating port and its physical transverse jet for shared assembly. */
  export interface Port {
    /** Physical station from thumb_01 along the thumb_01-to-03 projection. */
    stationMm: number;
    /** Four actual closed-contour arcs, retaining common feature phase. */
    arcs: HumanSurface.Boundary[];
    /** Actual dP/ds at this port; no source material derivative is asserted. */
    transverseDerivative: (featurePhase: number) => HumanCurve.Vector;
  }

  /** Skin and displayed construction consume these exact same chart functions. */
  export interface Result {
    /** Four quintic feature-arc patches of one regular post-branch domain. */
    patches: HumanSurface.Patch[];
    /** Two principal ports; neither is a cap or a thenar branch attachment. */
    principal: [Port, Port];
    /** Shared endpoint arcs and longitudinal feature curves. */
    boundaries: HumanSurface.Boundary[];
    /** The sole regional geometry evaluator, including exact analytic jets. */
    jet: (stationMm: number, featurePhase: number) => Jet;
    /** Physical retained station range in millimetres. */
    domainMm: [number, number];
    /** Borrowed terminal chart retains the existing support and closure axes. */
    readonly terminalChart: {
      /** The same caller-owned thumb_03 support, world millimetres. */
      readonly originMm: HumanCurve.Vector;
      /** Existing thumb_01-to-03 unit direction. */
      readonly axis: HumanCurve.Vector;
      /** Existing feature-zero axis. */
      readonly axisU: HumanCurve.Vector;
      /** Existing side-oriented positive-quarter axis. */
      readonly axisV: HumanCurve.Vector;
      /** Existing thumb_01-to-03 support chord, millimetres. */
      readonly thumbChordMm: number;
    };
    /** Missing domains and observational qualifications. */
    limitations: string[];
  }

  /**
   * Generate the common observed post-branch thumb domain. An exact support
   * triangle determines its local chart inside the caller's shared hand frame.
   * Thirty-two committed cubic-Hermite contours were selected by endpoint
   * support containment and backward traversal of official unique, issue-free,
   * orientable genus-zero two-port source slabs. Traversal stops at the actual
   * three/four-port branch; no larger loop or radial tube extends through it.
   *
   * Four exact source extrema establish geometric feature arcs, with original
   * physical Hermite widths retained in their sampling. Eighty-four common
   * coefficients fit quadratic physical-station behavior and quintic vector
   * arcs. This is a new approximation, not a degree conversion of the source.
   * Whole-domain Bernstein derivative-sign inequalities qualify the common
   * feature directions up to recorded binary64 feasibility. The fit retains
   * 2.084 mm point RMS and 5.027 mm maximum; conditional person-held-out maximum
   * is 8.123 mm. Independent native response and whole-hand fidelity are unknown.
   */
  export function build(input: Input): Result {
    const { rootMm, secondMm, endMm, handFrame }: Input = input;
    const vectors: HumanCurve.Vector[] = [rootMm, secondMm, endMm, handFrame.originMm,
      handFrame.longitudinal, handFrame.across, handFrame.normal];
    if (!input.id || vectors.some((value: HumanCurve.Vector): boolean =>
      value.length !== 3 || !value.every(Number.isFinite)) ||
      !(input.handCircumferenceMm > 0 && Number.isFinite(input.handCircumferenceMm)) ||
      (handFrame.side !== "l" && handFrame.side !== "r"))
      throw new Error("Thumb skin requires finite shared supports, a hand frame and positive circumference");
    const delta: HumanCurve.Vector = subtract(endMm, rootMm);
    const lengthMm: number = Math.hypot(...delta);
    const n: HumanCurve.Vector = unit(delta);
    const reference: HumanCurve.Vector = unit(cross(subtract(rootMm, handFrame.originMm), subtract(secondMm, handFrame.originMm)));
    const u: HumanCurve.Vector = unit(cross(reference, n));
    const rawV: HumanCurve.Vector = unit(cross(n, u));
    const sign: number = handFrame.side === "l" ? 1 : -1;
    const v: HumanCurve.Vector = rawV.map((x: number): number => x * sign) as HumanCurve.Vector;
    const outwardSign: 1 | -1 = sign === 1 ? -1 : 1;
    const G: number = input.handCircumferenceMm;
    if (!(lengthMm * lengthMm > 0 && Number.isFinite(lengthMm * lengthMm)) ||
      !HumanThumbRules.coefficients.every((row: readonly number[]): boolean =>
        row.every((value: number): boolean => Number.isFinite(value * G))))
      throw new Error("Thumb dimensions exceed the vector law's representable arithmetic");
    const domainMm: [number, number] = [HumanThumbRules.minimumCommonFraction * lengthMm, lengthMm];
    const origin: HumanCurve.Vector = [...rootMm];
    const jet: Result["jet"] = (stationMm: number, featurePhase: number): Jet => {
      if (!Number.isFinite(stationMm) || stationMm < domainMm[0] || stationMm > domainMm[1] ||
        !Number.isFinite(featurePhase) || featurePhase < 0 || featurePhase > 4)
        throw new Error("Thumb station and feature phase must remain inside the observed regular domain");
      const arc: number = featurePhase === 4 ? 3 : Math.floor(featurePhase);
      const phase: number = featurePhase - arc, t: number = stationMm / lengthMm;
      const section: number[][] = [0, 1, 2].map((order: number): number[] =>
        Array.from({ length: 28 }, (_: unknown, channel: number): number => {
          const a: number = HumanThumbRules.coefficients[0]![channel]!;
          const b: number = HumanThumbRules.coefficients[1]![channel]!;
          const c: number = HumanThumbRules.coefficients[2]![channel]!;
          return order === 0 ? G * (a + t * (b + t * c)) :
            order === 1 ? G * (b + 2 * t * c) / lengthMm : 2 * G * c / (lengthMm * lengthMm);
        }));
      const P: HumanHandFeatureKernel.Pair = HumanHandFeatureKernel.planar(section[0]!, arc, phase, 0);
      const Ps: HumanHandFeatureKernel.Pair = HumanHandFeatureKernel.planar(section[1]!, arc, phase, 0);
      const Pp: HumanHandFeatureKernel.Pair = HumanHandFeatureKernel.planar(section[0]!, arc, phase, 1);
      const Pss: HumanHandFeatureKernel.Pair = HumanHandFeatureKernel.planar(section[2]!, arc, phase, 0);
      const Ppp: HumanHandFeatureKernel.Pair = HumanHandFeatureKernel.planar(section[0]!, arc, phase, 2);
      const Psp: HumanHandFeatureKernel.Pair = HumanHandFeatureKernel.planar(section[1]!, arc, phase, 1);
      return { positionMm: combine(origin, stationMm, P), longitudinalDerivative: combine([0, 0, 0], 1, Ps),
        phaseDerivative: combine([0, 0, 0], 0, Pp), longitudinalSecondDerivative: combine([0, 0, 0], 0, Pss),
        phaseSecondDerivative: combine([0, 0, 0], 0, Ppp), longitudinalPhaseDerivative: combine([0, 0, 0], 0, Psp) };
    };
    const features: HumanSurface.Boundary[] = Array.from({ length: 4 }, (_: unknown, arc: number): HumanSurface.Boundary => ({
      id: input.id + ".feature." + arc, unit: "mm", start: domainMm[0], end: domainMm[1],
      evaluate: (s: number): HumanCurve.Vector => jet(s, arc).positionMm,
      derivative: (s: number): HumanCurve.Vector => jet(s, arc).longitudinalDerivative,
    }));
    const principal: [Port, Port] = domainMm.map((stationMm: number, layer: number): Port => ({
      stationMm,
      arcs: Array.from({ length: 4 }, (_: unknown, arc: number): HumanSurface.Boundary => ({
        id: input.id + ".layer." + layer + ".arc." + arc, unit: "normalized-feature-arc", start: 0, end: 1,
        evaluate: (phase: number): HumanCurve.Vector => jet(stationMm, arc + arcParameter(phase)).positionMm,
        derivative: (phase: number): HumanCurve.Vector => jet(stationMm, arc + arcParameter(phase)).phaseDerivative,
      })),
      transverseDerivative: (featurePhase: number): HumanCurve.Vector => jet(stationMm, featurePhase).longitudinalDerivative,
    })) as [Port, Port];
    const patches: HumanSurface.Patch[] = Array.from({ length: 4 }, (_: unknown, arc: number): HumanSurface.Patch => ({
      id: input.id + ".arc." + arc, u: { start: domainMm[0], end: domainMm[1], unit: "mm" },
      v: { start: 0, end: 1, unit: "normalized-feature-arc" }, outwardSign,
      jet: (s: number, phase: number): ReturnType<HumanSurface.Patch["jet"]> => {
        if (!Number.isFinite(phase) || phase < 0 || phase > 1) throw new Error("A thumb arc phase must remain in its own interval");
        const value: Jet = jet(s, arc + phase);
        return { positionMm: value.positionMm, derivativeU: value.longitudinalDerivative, derivativeV: value.phaseDerivative };
      },
      boundaries: { u0: { curve: principal[0].arcs[arc]!, orientation: 1 }, u1: { curve: principal[1].arcs[arc]!, orientation: 1 },
        v0: { curve: features[arc]!, orientation: 1 }, v1: { curve: features[(arc + 1) % 4]!, orientation: 1 } },
    }));
    return { patches, principal, boundaries: [...principal[0].arcs, ...principal[1].arcs, ...features], jet, domainMm,
      terminalChart: { originMm: endMm, axis: n, axisU: u, axisV: v, thumbChordMm: lengthMm },
      limitations: [
        "Independent post-branch thumb candidate only; thenar root, thumb-versus-four-digit branch, web and wrist attachment remain absent",
        "The thumb_03 port remains open; neither source terminal topology nor a nail/skin tip is generated",
        "Source incidence observes contour identity only; feature phase is geometric, without material transport or source transverse jets",
        "Thirty-two original source Hermite contours and their actual phase widths remain independently preserved; source fit failures are retained",
        "Common point RMS 2.084 mm and maximum 5.027 mm; source-conditioned person-held-out maximum 8.123 mm",
        "Hand circumference scales transverse shape while the caller-owned supports consume thumb length; independent native effects remain unqualified",
        "The common regular domain begins at the latest first isolated annulus port over eight actual source sides, not an anatomical thumb-root landmark",
        "Four quintic feature arcs are C1; second phase derivatives are one-sided at feature joins",
        "Whole-hand silhouette, continuous embedding, neighboring skin compatibility and unseen morphology prediction require separate actual inspection",
      ] };

    /** Place one derivative or point in the same actual support chart. */
    function combine(base: HumanCurve.Vector, axial: number, point: HumanHandFeatureKernel.Pair): HumanCurve.Vector {
      return [0, 1, 2].map((i: number): number => base[i]! + axial * n[i]! + point[0] * u[i]! + point[1] * v[i]!) as HumanCurve.Vector;
    }
  }

  /** Each boundary retains its own normalized feature interval. */
  function arcParameter(phase: number): number {
    if (!Number.isFinite(phase) || phase < 0 || phase > 1)
      throw new Error("A thumb boundary phase must remain inside its own arc");
    return phase;
  }

  /** Physical support subtraction retains the common placement. */
  function subtract(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }
  /** The actual support triangle supplies orientation; no averaged frame. */
  function cross(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
  /** A degenerate support frame refuses rather than borrowing another branch. */
  function unit(a: HumanCurve.Vector): HumanCurve.Vector {
    const length: number = Math.hypot(...a);
    if (!(length > 0 && Number.isFinite(length))) throw new Error("Thumb supports do not define a finite nondegenerate chart");
    return [a[0] / length, a[1] / length, a[2] / length];
  }
}
