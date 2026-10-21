import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSurface } from "../internal/HumanSurface";
import type { HumanFaceFeatures } from "./HumanFaceFeatures";
import type { HumanHeadFrame } from "./HumanHeadFrame";
import { HumanEyeCanthalDomain } from "./HumanEyeCanthalDomain";

/** Shared source-identified brow, fold and crease authorities for upper-face charts. */
export namespace HumanUpperFaceFeatures {
  /** Distinct named source populations do not acquire invented endpoint joins. */
  export interface Side {
    /** Existing eye ownership determines the signed side once. */
    side: "left" | "right";
    /** Eyebrow middle line, directed from medial to lateral source endpoint. */
    brow: HumanSurface.Boundary;
    /** Actual source eye-fold profile with its full physical phase normalized. */
    fold: HumanSurface.Boundary;
    /** Source eye-crease profile; distinct from the fold and palpebral rim. */
    crease: HumanSurface.Boundary;
  }

  /** Surface and construction consumers share these actual function objects. */
  export interface Result {
    /** Bilateral feature network in the supplied common eye and head frame. */
    sides: Side[];
    /** The same six boundaries, available for construction emission. */
    curves: HumanSurface.Boundary[];
    /** Source approximation, projection and missing transverse qualification. */
    limitations: string[];
  }

  /** Existing named functions restricted by the same actual canthal planes. */
  export interface Central {
    /** Geometric reflection label inherited from the caller's existing eye. */
    side: "left" | "right";
    /** Actual evaluated canthal chord length, mm. */
    lengthMm: number;
    /** Unit inner-to-outer chord direction in the registered world chart. */
    normal: HumanCurve.Vector;
    /** Exact restriction of the supplied fold function, in canthal fractions. */
    fold: HumanSurface.Boundary;
    /** Exact restriction of the supplied crease function, in canthal fractions. */
    crease: HumanSurface.Boundary;
    /** Exact restriction of the supplied brow function, in canthal fractions. */
    brow: HumanSurface.Boundary;
  }

  /** Generate common upper-face features from all four bound source observations.
   * Joint linear least squares solves both endpoint offsets and six residual
   * coefficients per coordinate using every original physical Hermite interval.
   * X and signed Z residuals use the existing eye chord; Y uses the eye-to-crown
   * physical extent. This separates eye aperture height from brow/fold height.
   * No source curve, vertex or person-indexed controls are read at runtime.
   * The caller supplies its existing eye/frame objects; no duplicate network is
   * generated. Work and retained objects are constant for the six finite curves.
   */
  export function build(frame: HumanHeadFrame.Result, eyes: HumanFaceFeatures.Result): Result {
    const verticalMm: number = frame.crownY - frame.eyeY;
    if (!(Number.isFinite(verticalMm) && verticalMm > 0 && eyes.openings.length === 2))
      throw new Error("Upper-face features require two existing eyes and positive eye-to-crown extent");
    const sides: Side[] = [], curves: HumanSurface.Boundary[] = [];
    for (const opening of eyes.openings) {
      const side: "left" | "right" = opening.upper.side;
      const sign: number = side === "left" ? -1 : 1;
      const start: HumanCurve.Vector = opening.upper.evaluate(0), end: HumanCurve.Vector = opening.upper.evaluate(1);
      const scales: HumanCurve.Vector = [opening.chordLengthMm, verticalMm, sign * opening.chordLengthMm];
      const make: (kind: "brow" | "fold" | "crease") => HumanSurface.Boundary = (kind: "brow" | "fold" | "crease"): HumanSurface.Boundary => ({
        id: "head.upperface." + side + "." + kind, start: 0, end: 1, unit: "normalized-physical-source-phase",
        evaluate: (u: number): HumanCurve.Vector => {
          admit(u);
          return start.map((value: number, axis: number): number => value + u * (end[axis]! - value) +
            scales[axis]! * residual(rules[kind][axis]!, u)[0]) as HumanCurve.Vector;
        },
        derivative: (u: number): HumanCurve.Vector => {
          admit(u);
          return start.map((value: number, axis: number): number => end[axis]! - value +
            scales[axis]! * residual(rules[kind][axis]!, u)[1]) as HumanCurve.Vector;
        },
      });
      const brow: HumanSurface.Boundary = make("brow"), fold: HumanSurface.Boundary = make("fold"), crease: HumanSurface.Boundary = make("crease");
      sides.push({ side, brow, fold, crease }); curves.push(brow, fold, crease);
    }
    return { sides, curves, limitations: [
      "All 1,725 source observations contributed through complete original Hermite physical phases, including both sides of four source identities",
      "Conditional pooled coordinate RMS/max are brow 2.30/7.73, fold 1.73/5.06 and crease 1.34/4.06 mm; these do not measure generated common-frame placement or continuous maxima",
      "The independent aperture-height input does not rescale brow/fold vertical position; these profiles use the shared physical eye-to-crown extent",
      "Source medial-to-lateral direction is geometric; these separate source populations do not have certified endpoint, tissue or scalp joins",
      "Source outer-lid/inner-lid annulus courses and upper-face exterior sheet classification are needed before these boundaries establish skin or cross-tissue jets",
      "Independent minimum-frontal-width response, individual asymmetry, clinical equivalence and unseen morphology prediction remain unqualified",
    ] };
  }

  /**
   * Restrict this owner's supplied complete fold/brow/crease functions to the observed
   * quarter/three-quarter canthal planes. An explicit browEnd=1 also includes the
   * observed outer-plane brow span; fold/crease retain their existing ranges.
   * The frame and eye objects must be the
   * same authorities used by build; this operation does not rebuild either.
   * Full polynomial projection positivity is admitted with outward interval
   * bounds before bisection, including the actual endpoint offsets. The implicit
   * derivative retains dP/du=originalDerivative/stationDerivative exactly.
   * Unsupported projection range, nonregularity or exhausted certificate work
   * rejects the chart instead of changing its boundaries or phase direction.
   */
  export function central(frame: HumanHeadFrame.Result, eyes: HumanFaceFeatures.Result, features: Result, browEnd: .75 | 1 = .75): Central[] {
    const vertical: number = frame.crownY - frame.eyeY;
    const result: Central[] = [];
    for (const opening of eyes.openings) {
      const side: Side | undefined = features.sides.find((value: Side): boolean => value.side === opening.upper.side);
      if (side === undefined) throw new Error("A central upper-face chart has no existing named feature owner");
      const start: HumanCurve.Vector = opening.upper.evaluate(0), end: HumanCurve.Vector = opening.upper.evaluate(1);
      const chord: HumanCurve.Vector = end.map((value: number, axis: number): number => value - start[axis]!) as HumanCurve.Vector;
      const length: number = Math.hypot(...chord), sign: number = side.side === "left" ? -1 : 1;
      if (!(length > 0 && Number.isFinite(length) && vertical > 0 && Number.isFinite(vertical)))
        throw new Error("Central upper-face charts require their finite existing metric frame");
      const normal: HumanCurve.Vector = chord.map((value: number): number => value / length) as HumanCurve.Vector;
      const scales: HumanCurve.Vector = [opening.chordLengthMm, vertical, sign * opening.chordLengthMm];
      const restrict: (kind: "fold" | "brow" | "crease") => HumanSurface.Boundary = (kind: "fold" | "brow" | "crease"): HumanSurface.Boundary => {
        const original: HumanSurface.Boundary = side[kind];
        const rangeEnd: number = kind === "brow" ? browEnd : .75;
        const theta: readonly (readonly number[])[] = rules[kind];
        HumanEyeCanthalDomain.admit(theta.map((row: readonly number[]): number[] => row.slice(2)), chord, scales, chord,
          [theta.map((row: readonly number[]): number => row[0]!) as HumanCurve.Vector,
            theta.map((row: readonly number[]): number => row[1]!) as HumanCurve.Vector]);
        const station: (parameter: number) => number = (parameter: number): number =>
          dot(normal, original.evaluate(parameter).map((value: number, axis: number): number => value - start[axis]!) as HumanCurve.Vector) / length;
        if (!(station(original.start) <= 0.25 && station(original.end) >= rangeEnd))
          throw new Error("The existing upper-face feature does not span the observed central canthal domain");
        const sample: (u: number) => { position: HumanCurve.Vector; derivative: HumanCurve.Vector } =
          (u: number): { position: HumanCurve.Vector; derivative: HumanCurve.Vector } => {
            if (!(Number.isFinite(u) && u >= 0.25 && u <= rangeEnd)) throw new Error("Central feature station lies outside its source-supported domain");
            let low: number = original.start, high: number = original.end;
            for (let k: number = 0; k < 56; k++) {
              const middle: number = (low + high) / 2;
              if (station(middle) < u) low = middle; else high = middle;
            }
            const parameter: number = (low + high) / 2;
            const derivative: HumanCurve.Vector = original.derivative(parameter);
            const rate: number = dot(normal, derivative) / length;
            if (!(Number.isFinite(rate) && rate > 0)) throw new Error("The existing central feature has no regular implicit canthal derivative");
            return { position: original.evaluate(parameter), derivative: derivative.map((value: number): number => value / rate) as HumanCurve.Vector };
          };
        return { id: original.id + ".central-canthal", start: 0.25, end: rangeEnd, unit: "canthal-chord-fraction",
          evaluate: (u: number): HumanCurve.Vector => sample(u).position,
          derivative: (u: number): HumanCurve.Vector => sample(u).derivative };
      };
      result.push({ side: side.side, lengthMm: length, normal, fold: restrict("fold"), brow: restrict("brow"), crease: restrict("crease") });
    }
    return result;
  }

  const rules: Readonly<Record<"brow" | "fold" | "crease", readonly (readonly number[])[]>> = {
    brow: [[0.5075371711495474,-0.5611790014507031,0.8401378373858255,-0.30087303291026557,0.6992893489839505,-0.45592315411793466,-1.4853512557674475,0.5725630842539204],[0.1944508142715869,0.02805838004812979,0.37563876271047,-0.007520191945109804,-0.29229994922825764,0.13597702513988774,0.3320601062763061,-0.14849161169581904],[-0.012406270982356691,0.5995863679433473,1.042566268270614,0.5212493064043273,0.13804101531172638,-1.0843424540784612,-0.469526284408824,0.9326487915219891]],
    fold: [[0.08434186782485792,0.06255449353491156,0.9889181981166608,-0.004708198072689062,-0.44980971878465575,0.41688325546208604,0.04583906481002633,-0.4064821659271471],[0.025321867550730917,0.018449096482300843,0.1620416930812937,-0.015882934613951568,0.03303304174489753,-0.07168532850244283,-0.01885676666213679,0.05267849017435867],[0.01301481062925977,0.12820826917740208,0.20411120124504678,0.4430836805837606,-0.1001026913890519,-0.8207500103865497,-0.010393855780737014,0.9384107478148852]],
    crease: [[0.049411531960995375,0.0029123093875003813,0.9725285467494956,0.0373223059459627,-0.554910831308196,0.3426126067607455,-0.006108189059585288,-0.3364797943217515],[0.020116637444113326,0.009787430489237447,0.2501668969171898,-0.03667505567758734,0.06610701424285416,-0.019528517508380836,-0.1354856902186587,-0.005205338932124525],[0.028260102490620005,0.12414125855044164,0.15058875220310977,0.5528591607255023,-0.2406482230897953,-0.45052199460148606,0.2501129549248796,0.2076781262805402]],
  };

  /** Complete degree-seven residual with jointly fitted endpoint offsets. */
  function residual(theta: readonly number[], u: number): [number, number] {
    const x: number = 2 * u - 1;
    let value: number = 0, derivative: number = 0;
    for (let k: number = theta.length - 1; k >= 2; k--) { derivative = derivative * x + value; value = value * x + theta[k]!; }
    return [(1 - u) * theta[0]! + u * theta[1]! + u * (1 - u) * value,
      theta[1]! - theta[0]! + (1 - 2 * u) * value + 2 * u * (1 - u) * derivative];
  }

  /** Named source phase domains are finite and never extrapolated. */
  function admit(u: number): void {
    if (!(Number.isFinite(u) && u >= 0 && u <= 1)) throw new Error("Upper-face feature phase must lie in [0,1]");
  }

  /** Registered scalar projection preserves its caller's physical units. */
  function dot(a: HumanCurve.Vector, b: HumanCurve.Vector): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
}
