import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSkeleton } from "../internal/HumanSkeleton";
import type { IAutoMovieHumanHeadIdentity } from "../structures/head/IAutoMovieHumanHeadIdentity";
import type { IAutoMovieHumanEyeSupplement } from "../structures/head/IAutoMovieHumanEyeSupplement";
import type { IAutoMovieHumanPair } from "../structures/common/IAutoMovieHumanPair";
import { HumanHeadFrame } from "./HumanHeadFrame";
import { HumanEyeCanthalDomain } from "./HumanEyeCanthalDomain";

/** Common constrained feature networks derived from the recovered facial curves. */
export namespace HumanFaceFeatures {
  /** A generated open polynomial boundary with normalized parameter and exact end positions. */
  export interface Curve {
    /** Geometric feature identity retained by construction and skin boundaries. */
    id: string;

    /** Independent typed side; observed anatomical side labels remain unqualified. */
    side: "left" | "right";

    /** Upper or lower boundary of the same generated aperture. */
    boundary: "upper" | "lower";

    /** Exact generating world position in mm at u in [0,1], inner corner to outer. */
    evaluate: (u: number) => HumanCurve.Vector;

    /** Exact dP/du, millimetres per normalized parameter. */
    derivative: (u: number) => HumanCurve.Vector;
  }

  /** Two open arcs consume one pair of endpoint authorities. */
  export interface Opening {
    /** Shared aperture identity. */
    id: string;

    /** Curves defining the emitted skin boundary; neither arc closes across the aperture. */
    upper: Curve;

    /** Same endpoint authorities and parameter direction as upper. */
    lower: Curve;

    /** Exact generated endpoint chord length, mm. */
    chordLengthMm: number;

    /** Generated upper/lower world-up envelope height, mm. */
    envelopeHeightMm: number;

    /** Shared generated vertical residual scale in mm, after its envelope solve. */
    profileHeightScaleMm: number;

    /** Outer-minus-inner slope in the up/outward-lateral chart, degrees. */
    canthalSlantDegrees: number;

    /** Inner-minus-outer forward coordinate, mm; positive means outer recession. */
    canthalRecessionMm: number;

    /** Forward residual from the orthogonal three-dimensional canthal support line, mm, on the same finite 129-address feature observation used by the height proxy. */
    marginDepthBulgeMm: number;
  }

  /** Feature geometry and scope remain separate from the incomplete surrounding face skin. */
  export interface Result {
    /** Both sides' upper/lower generating curves. */
    curves: Curve[];

    /** Explicit aperture boundaries available to a conforming skin/domain consumer. */
    openings: Opening[];

    /** Fitting residuals and unimplemented feature/skin relations. */
    limitations: string[];
  }

  /**
   * Generate bilateral eye networks from independent eye chords, heights and gap.
   * Shared observed chord directions define tilt. Each endpoint vanishing residual
   * is a pooled constrained polynomial fit to all eight recovered source lids.
   * The vertical envelope scale solves the requested generated height with a
   * bounded monotone scalar solve; the endpoint chord remains exactly independent.
   * Optional slant is the up/outward-lateral chord angle in degrees; recession
   * is positive when the outer corner lies behind the inner corner, in mm.
   * Their right-triangle solve retains the requested 3D chord and input envelope.
   * Optional anterior margin bulge is the forward residual from the orthogonal 3D
   * canthal support line, observed at the same 129 finite feature addresses as height.
   * A direct scalar linear-program bound solves its forward residual scale.
   * Supplied controls must also admit a strictly increasing complete canthal
   * projection through outward-rounded Bernstein interval subdivision. Failure
   * or exhaustion of its finite work budget rejects the request without a clamp.
   * The original common law is retained when these controls are omitted.
   * Fold/roll offsets remain unsupported because their local axes and source
   * course authorities are not yet identified. This operation consumes an
   * injected shared frame when supplied; no skeleton coordinate is changed.
   * An aperture's surrounding surface must consume these curves as boundaries.
   */
  export function build(
    parameters: IAutoMovieHumanHeadIdentity,
    skeleton: HumanSkeleton.Result,
    eyePair?: Partial<IAutoMovieHumanPair<Partial<IAutoMovieHumanEyeSupplement>>>,
    suppliedFrame?: HumanHeadFrame.Result,
  ): Result {
    const frame: HumanHeadFrame.Result = suppliedFrame ?? HumanHeadFrame.build(parameters, skeleton);
    const gap: number = positive(parameters.face.intercanthalWidth, "intercanthal chord");
    const curves: Curve[] = [];
    const openings: Opening[] = [];
    const forward: number = frame.innerEyeForwardMm;
    const unsupported: string[] = [];
    for (const side of ["left", "right"] as const) {
      const sign: number = side === "left" ? -1 : 1;
      const length: number = positive(parameters.face.eyePair[side].palpebralFissureLength, "eye chord");
      const height: number = positive(parameters.face.eyePair[side].palpebralFissureHeight, "eye envelope height");
      const supplement: Partial<IAutoMovieHumanEyeSupplement> | undefined = eyePair?.[side];
      let dx: number = -0.19962808477659433 * length;
      let dy: number = 0.12298160005243754 * length;
      let dz: number = sign * Math.sqrt(length * length - dx * dx - dy * dy);
      if (supplement?.canthalSlantDegrees !== undefined || supplement?.canthalRecessionMm !== undefined) {
        const angle: number = supplement.canthalSlantDegrees === undefined
          ? Math.atan2(dy, Math.abs(dz)) : finiteScalar(supplement.canthalSlantDegrees, "canthal slant") * Math.PI / 180;
        if (!(angle > -Math.PI / 2 && angle < Math.PI / 2))
          throw new Error("Canthal slant must retain the observed outward-lateral chord direction");
        if (supplement.canthalRecessionMm !== undefined) dx = -finiteScalar(supplement.canthalRecessionMm, "canthal recession");
        const transverseSquared: number = length * length - dx * dx;
        if (!(transverseSquared > 0)) throw new Error("Canthal recession must have magnitude smaller than the eye chord");
        const transverse: number = Math.sqrt(transverseSquared);
        dy = transverse * Math.sin(angle); dz = sign * transverse * Math.cos(angle);
      }
      for (const field of ["foldOffsetMm", "rollOffsetMm"] as const)
        if (supplement?.[field] !== undefined) unsupported.push("Supplied " + side + " eye " + field + " is unsupported: its offset axis, source course and datum are not qualified; the value has no generating effect");
      if (!(height > Math.abs(dy))) throw new Error("An eye height cannot contain the generated tilted corner chord");
      const inner: HumanCurve.Vector = [forward, frame.eyeY, frame.supportMm[2] + sign * gap / 2];
      const chord: HumanCurve.Vector = [dx, dy, dz];
      const extent: (gain: number) => number = (gain: number): number => {
        let maximum: number = -Infinity, minimum: number = Infinity;
        for (let i: number = 0; i <= 128; i++) {
          const u: number = i / 128;
          maximum = Math.max(maximum, u * dy + gain * height * residual(upper[1]!, u)[0]);
          minimum = Math.min(minimum, u * dy + gain * height * residual(lower[1]!, u)[0]);
        }
        return maximum - minimum;
      };
      let low: number = 0, high: number = 1;
      while (extent(high) < height && high < 64) high *= 2;
      if (!(extent(high) >= height)) throw new Error("The generated eye envelope has no bounded positive scale");
      for (let i: number = 0; i < 56; i++) {
        const middle: number = (low + high) / 2;
        if (extent(middle) < height) low = middle; else high = middle;
      }
      const gain: number = (low + high) / 2;
      // A forward bulge is measured against the orthogonal 3D canthal support line, not against
      // an unrelated outer-rim depth. Each observation is a*Xscale+b. All
      // inequalities a*Xscale+b <= target form an exact one-dimensional LP;
      // its finite upper endpoint attains the requested sampled envelope.
      const squaredChord: number = dx * dx + dy * dy + dz * dz;
      const metric: Array<{ a: number; b: number }> = [];
      for (const coefficients of [upper, lower]) for (let index: number = 0; index <= 128; index++) {
        const u: number = index / 128;
        const x: number = residual(coefficients[0]!, u)[0];
        const y: number = height * gain * residual(coefficients[1]!, u)[0];
        const z: number = sign * length * residual(coefficients[2]!, u)[0];
        metric.push({ a: (1 - dx * dx / squaredChord) * x, b: -dx * (dy * y + dz * z) / squaredChord });
      }
      let forwardScale: number = length;
      if (supplement?.marginDepthBulgeMm !== undefined) {
        const target: number = positive(supplement.marginDepthBulgeMm, "anterior margin bulge");
        let minimum: number = 0, maximum: number = Infinity;
        for (const sample of metric) {
          if (sample.a > 0) maximum = Math.min(maximum, (target - sample.b) / sample.a);
          else if (sample.a < 0) minimum = Math.max(minimum, (target - sample.b) / sample.a);
          else if (sample.b > target) throw new Error("The existing eye profile cannot attain the supplied margin bulge");
        }
        if (!(Number.isFinite(maximum) && maximum > 0 && maximum >= minimum))
          throw new Error("The supplied margin bulge is outside the identified positive forward-profile domain");
        forwardScale = maximum;
      }
      const marginDepth: number = Math.max(...metric.map((sample: { a: number; b: number }): number => sample.a * forwardScale + sample.b));
      const make: (name: "upper" | "lower", coefficients: readonly (readonly number[])[]) => Curve =
        (name: "upper" | "lower", coefficients: readonly (readonly number[])[]): Curve => ({
          id: "head.eye." + side + "." + name, side, boundary: name,
          evaluate: (u: number): HumanCurve.Vector => {
            admit(u);
            return [0, 1, 2].map((axis: number): number => inner[axis]! + u * chord[axis]! +
              residual(coefficients[axis]!, u)[0] * (axis === 1 ? height * gain : axis === 0 ? forwardScale : length * sign)) as HumanCurve.Vector;
          },
          derivative: (u: number): HumanCurve.Vector => {
            admit(u);
            return [0, 1, 2].map((axis: number): number => chord[axis]! +
              residual(coefficients[axis]!, u)[1] * (axis === 1 ? height * gain : axis === 0 ? forwardScale : length * sign)) as HumanCurve.Vector;
          },
        });
      const upperCurve: Curve = make("upper", upper);
      const lowerCurve: Curve = make("lower", lower);
      if (supplement?.canthalSlantDegrees !== undefined || supplement?.canthalRecessionMm !== undefined || supplement?.marginDepthBulgeMm !== undefined) {
        const start: HumanCurve.Vector = upperCurve.evaluate(0), end: HumanCurve.Vector = upperCurve.evaluate(1);
        const projectionChord: HumanCurve.Vector = end.map((value: number, axis: number): number => value - start[axis]!) as HumanCurve.Vector;
        for (const coefficients of [upper, lower])
          HumanEyeCanthalDomain.admit(coefficients, chord, [forwardScale, height * gain, length * sign], projectionChord);
      }
      curves.push(upperCurve, lowerCurve);
      openings.push({ id: "head.eye." + side, upper: upperCurve, lower: lowerCurve, chordLengthMm: length,
        envelopeHeightMm: extent(gain), profileHeightScaleMm: height * gain,
        canthalSlantDegrees: Math.atan2(dy, Math.abs(dz)) * 180 / Math.PI,
        canthalRecessionMm: -dx, marginDepthBulgeMm: marginDepth });
    }
    return { curves, openings, limitations: [
      ...unsupported,
      "Optional canthal slant uses atan2(outer-minus-inner up, outward lateral), recession is inner-minus-outer forward mm, and margin bulge is the finite 3D-canthal-support-line forward residual; no native or clinical equivalence is inferred",
      "Slant and recession move the endpoint chord with fixed Euclidean length and shared inner datum; anterior margin bulge rescales only the existing forward residual while the requested up-envelope remains independent",
      "The margin envelope uses the same 129 feature addresses as the height proxy; continuous extrema and zero-bulge or incompatible profile requests are not qualified",
      "Supplied eye controls require strictly increasing whole-feature canthal projection, bounded by outward-rounded degree-six Bernstein subdivision; a proved nonpositive station or unresolved finite subdivision budget is refused without changing the requested shape",
      "Eye fold and roll offsets have no identified direction/course/datum and are not substitutes for annulus transverse depth or roll direction",

      "Eye curves are independent common polynomial generation, not copied source vertices or a completed surrounding face surface",
      "Conditioned on each observed chord, pooled eight-lid profiles have coordinate RMS 0.19–0.62 mm and maximum coordinate residual below 1.98 mm; these are not whole-head placement residuals",
      "Height follows the source up-envelope proxy and a finite 129-point extremum observation; clinical pupil-level fissure-height equivalence remains unqualified",
      "Unspecified tilt retains the common bilateral law; supplied canthal controls act per eye, while residual-profile asymmetry, gaze, contact, blinks, iris and eyeball geometry remain unverified",
      "These exact feature curves must become shared skin boundaries; projecting them onto an unrelated closed shell does not establish a conforming aperture",
      "These feature curves alone do not establish orbital skin, canthal tissue, inner-lid cavities or neighboring surface jets",
      "Recorded conditional source-profile residuals do not verify arbitrary supplementary control responses or remove the existing whole-head frame error",
    ] };
  }

  // For v in [0,1], the residual is v(1-v) sum(theta[k](2v-1)^k).
  // End positions are imposed directly; source chord projection establishes v.
  // X/Z residuals use the actual source chord length, Y uses its actual envelope.
  const upper: readonly (readonly number[])[] = [
    [0.9653445100160963,0.41060550351280534,-0.9404492418259165,1.360224621854481,0.6393384550638508,-0.9615070255414001],
    [2.5526369038963823,-0.6093951774177917,-1.302701002532838,2.797422961968752,2.109815391026216,-2.9824364997080592],
    [0.0973516712023057,0.08608484045099055,-0.10244295305184914,0.24118242312838767,-0.017494027293329162,-0.12588618315966912],
  ];
  const lower: readonly (readonly number[])[] = [
    [0.709568655553996,0.27152406043903876,-1.000050143685779,1.401330847101852,0.9011798441523607,-1.662800839250147],
    [-1.434438406174943,-1.0502093980939082,2.1731659811020916,-1.2305847515906119,-3.409669841308409,2.5580844942335634],
    [0.2084333387079817,0.10335412251494452,-0.29682525164612245,0.29330959410165364,0.327261340219941,-0.40510682916358565],
  ];

  /** Evaluate the complete endpoint-constrained residual and its normalized derivative. */
  function residual(coefficients: readonly number[], u: number): [number, number] {
    const x: number = 2 * u - 1;
    let value: number = 0, derivative: number = 0;
    for (let k: number = coefficients.length - 1; k >= 0; k--) {
      derivative = derivative * x + value;
      value = value * x + coefficients[k]!;
    }
    return [u * (1 - u) * value, (1 - 2 * u) * value + 2 * u * (1 - u) * derivative];
  }

  /** Feature evaluation uses the declared finite normalized domain. */
  function admit(u: number): void {
    if (!(Number.isFinite(u) && u >= 0 && u <= 1)) throw new Error("Feature parameter must lie in [0,1]");
  }

  /** Independent signed chart coordinates must be finite before chord construction. */
  function finiteScalar(value: number, name: string): number {
    if (!Number.isFinite(value)) throw new Error("A finite physical " + name + " is required");
    return value;
  }

  /** Positive metric dimensions precede feature construction. */
  function positive(value: number, name: string): number {
    if (!(value > 0 && Number.isFinite(value))) throw new Error("A positive physical " + name + " is required");
    return value;
  }
}
