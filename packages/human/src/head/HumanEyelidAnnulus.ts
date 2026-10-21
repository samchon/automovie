import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSurface } from "../internal/HumanSurface";
import type { HumanFaceFeatures } from "./HumanFaceFeatures";

/** Source-identified central upper-eyelid charts with actual shared boundaries. */
export namespace HumanEyelidAnnulus {
  type Jet = ReturnType<HumanSurface.Patch["jet"]>;

  /** Existing outer edge and its exact transverse jet in the annulus gauge. */
  export interface OuterPort {
    /** Existing geometric eye side. */
    side: HumanFaceFeatures.Curve["side"];
    /** The actual outer boundary object already referenced by the skin patch. */
    boundary: HumanSurface.Boundary;
    /** Along-coordinate gauge; no physical arc-length identification is implied. */
    unitU: "canthal-chord-fraction";
    /** Transverse gauge of derivativeV; this is not an original physical h. */
    unitV: "forward-depth-fraction";
    /** Exact mm per V and mm per U per V, evaluated on the outer edge. */
    transverse: (u: number) => { derivativeV: HumanCurve.Vector; mixedDerivativeUV: HumanCurve.Vector };
  }

  /** Two observed regular domains; canthal and lower-annulus domains remain absent. */
  export interface Result {
    /** Skin and construction consume these same analytic patches. */
    patches: HumanSurface.Patch[];

    /** Read-only ports reference the already emitted outer edges and exact jets. */
    outerPorts: OuterPort[];

    /** Actual objects referenced by patch edges, including the restricted inner feature. */
    boundaries: HumanSurface.Boundary[];

    /** Source fit, parameter proxy and missing coverage qualifications. */
    limitations: string[];
  }

  /**
   * Generate the regular upper-annulus domains bounded by the observed quarter
   * and three-quarter canthal-chord planes. These cuts delimit a partial source
   * domain; they neither fill nor qualify the unsupported canthal transitions.
   *
   * Twenty-four official three-dimensional source crosscourses, with exact
   * inner-upper/outer-upper source-edge incidence, identify twelve shared shape
   * coefficients. Their complete Hermite spans retain their original physical h
   * during identification. The derived chart uses u=canthal-plane chord fraction
   * and v=forward-depth fraction, with dv/ds=P_x'(s)/sourceDepthMm. This differs
   * from pairing equal independent feature phases or assuming X(Y,Z) is a sheet.
   *
   * Existing eye features are injected once. The inner edge is an implicit exact
   * restriction of that actual function, including its analytic Jacobian. Three
   * source courses constrain the quadratic longitudinal law; positive depth uses
   * a pooled log-depth law and the transverse height law is cubic. Every boundary
   * and skin jet calls the same analytic surface function. Further subdivision
   * restricts this function exactly and does not claim additional shape evidence.
   * Source conditioning and leave-one-person-out results are documented in the
   * head curve identification note; absolute placement still belongs to the eye
   * feature/frame authority. One actual Jang baseline emitted these two patches;
   * its positional binding does not qualify source directional or neighbor jets.
   */
  export function build(eyes: HumanFaceFeatures.Result): Result {
    const patches: HumanSurface.Patch[] = [];
    const boundaries: HumanSurface.Boundary[] = [];
    const outerPorts: OuterPort[] = [];
    for (const opening of eyes.openings) {
      const feature: HumanFaceFeatures.Curve = opening.upper;
      const first: HumanCurve.Vector = feature.evaluate(0), last: HumanCurve.Vector = feature.evaluate(1);
      const chord: HumanCurve.Vector = subtract(last, first);
      const length: number = Math.hypot(...chord), height: number = opening.envelopeHeightMm;
      if (!(Number.isFinite(length) && length > 0 && Number.isFinite(height) && height > 0))
        throw new Error("An eyelid annulus requires a finite positive existing eye chord and up-envelope");
      const normal: HumanCurve.Vector = scale(chord, 1 / length);
      if (normal[2] === 0) throw new Error("The observed eyelid chart requires a nonzero lateral chord component");
      const id: string = opening.id + ".annulus.central.upper";
      const u0: number = 0.25, u1: number = 0.75;

      const innerAt: (u: number) => { position: HumanCurve.Vector; derivative: HumanCurve.Vector } =
        (u: number): { position: HumanCurve.Vector; derivative: HumanCurve.Vector } => {
          let low: number = 0, high: number = 1;
          for (let iteration: number = 0; iteration < 56; iteration++) {
            const middle: number = (low + high) / 2;
            const point: HumanCurve.Vector = feature.evaluate(middle);
            const station: number = dot(normal, subtract(point, first)) / length;
            if (station < u) low = middle; else high = middle;
          }
          const parameter: number = (low + high) / 2;
          const position: HumanCurve.Vector = feature.evaluate(parameter);
          const along: HumanCurve.Vector = feature.derivative(parameter);
          const stationDerivative: number = dot(normal, along) / length;
          if (!(Number.isFinite(stationDerivative) && stationDerivative > 0))
            throw new Error("An existing eye feature has no regular increasing central canthal chart");
          return { position, derivative: scale(along, 1 / stationDerivative) };
        };

      const jet: (u: number, v: number) => Jet = (u: number, v: number): Jet => {
        if (!(Number.isFinite(u) && u >= u0 && u <= u1 && Number.isFinite(v) && v >= 0 && v <= 1))
          throw new Error("Eyelid annulus evaluation is outside its observed regular domain");
        const inner: { position: HumanCurve.Vector; derivative: HumanCurve.Vector } = innerAt(u);
        const z: number = 2 * u - 1;
        const powers: number[] = [1, z, z * z], derivatives: number[] = [0, 2, 4 * z];
        const width: number = length * Math.exp(dot3(powers, logDepth));
        const widthDerivative: number = width * dot3(derivatives, logDepth);
        const transverse: number[] = [v, v * (1 - v), v * v * (1 - v)];
        const transverseDerivative: number[] = [1, 1 - 2 * v, 2 * v - 3 * v * v];
        let y: number = 0, yu: number = 0, yv: number = 0;
        for (let i: number = 0; i < 3; i++) for (let j: number = 0; j < 3; j++) {
          const coefficient: number = upOffset[i * 3 + j]!;
          y += height * powers[i]! * transverse[j]! * coefficient;
          yu += height * derivatives[i]! * transverse[j]! * coefficient;
          yv += height * powers[i]! * transverseDerivative[j]! * coefficient;
        }
        // Both offsets lie in the actual canthal-normal plane; signed Z is
        // solved from n dot offset=0, retaining its observed three-dimensional tilt.
        const offset: HumanCurve.Vector = inPlane(v * width, y, normal);
        const offsetU: HumanCurve.Vector = inPlane(v * widthDerivative, yu, normal);
        const derivativeV: HumanCurve.Vector = inPlane(width, yv, normal);
        const result: Jet = { positionMm: add(inner.position, offset),
          derivativeU: add(inner.derivative, offsetU), derivativeV };
        if (!(width > 0) || ![result.positionMm, result.derivativeU, derivativeV].every(finite))
          throw new Error("The identified eyelid chart has no finite positive forward-depth immersion");
        return result;
      };

      const makeU: (value: number, suffix: string) => HumanSurface.Boundary = (value: number, suffix: string): HumanSurface.Boundary => ({
        id: id + suffix, unit: "forward-depth-fraction", start: 0, end: 1,
        evaluate: (v: number): HumanCurve.Vector => jet(value, v).positionMm,
        derivative: (v: number): HumanCurve.Vector => jet(value, v).derivativeV,
      });
      const makeV: (value: number, suffix: string) => HumanSurface.Boundary = (value: number, suffix: string): HumanSurface.Boundary => ({
        id: id + suffix, unit: "canthal-chord-fraction", start: u0, end: u1,
        evaluate: (u: number): HumanCurve.Vector => jet(u, value).positionMm,
        derivative: (u: number): HumanCurve.Vector => jet(u, value).derivativeU,
      });
      const firstCourse: HumanSurface.Boundary = makeU(u0, ".course.0.25");
      const lastCourse: HumanSurface.Boundary = makeU(u1, ".course.0.75");
      const inner: HumanSurface.Boundary = makeV(0, ".inner");
      const outer: HumanSurface.Boundary = makeV(1, ".outer");
      outerPorts.push({ side: feature.side, boundary: outer,
        unitU: "canthal-chord-fraction", unitV: "forward-depth-fraction",
        transverse: (u: number): { derivativeV: HumanCurve.Vector; mixedDerivativeUV: HumanCurve.Vector } => {
          const value: Jet = jet(u, 1);
          const z: number = 2 * u - 1;
          const powers: number[] = [1, z, z * z], derivatives: number[] = [0, 2, 4 * z];
          const width: number = length * Math.exp(dot3(powers, logDepth));
          const widthDerivative: number = width * dot3(derivatives, logDepth);
          const transverseDerivative: number[] = [1, -1, -1];
          let mixedY: number = 0;
          for (let i: number = 0; i < 3; i++) for (let j: number = 0; j < 3; j++)
            mixedY += height * derivatives[i]! * transverseDerivative[j]! * upOffset[i * 3 + j]!;
          return { derivativeV: value.derivativeV,
            mixedDerivativeUV: inPlane(widthDerivative, mixedY, normal) };
        } });
      boundaries.push(firstCourse, lastCourse, inner, outer);
      patches.push({ id, u: { start: u0, end: u1, unit: "canthal-chord-fraction" },
        v: { start: 0, end: 1, unit: "forward-depth-fraction" }, jet,
        // Original native source-face incidence has positive (u,X) orientation
        // on every observed left guide and negative orientation on every right guide.
        outwardSign: feature.side === "left" ? 1 : -1,
        boundaries: { u0: { curve: firstCourse, orientation: 1 }, u1: { curve: lastCourse, orientation: 1 },
          v0: { curve: inner, orientation: 1 }, v1: { curve: outer, orientation: 1 } } });
    }
    return { patches, boundaries, outerPorts, limitations: [
      "Only the central upper-annulus domains between the actual quarter/three-quarter canthal guide planes are emitted; canthi, lower annuli, eye inner disks and surrounding face skin remain absent",
      "Pooled 24-guide shape fit has conditional 3D RMS 0.345 mm and maximum 1.063 mm; leave-one-person-out guide RMS is 0.293–0.549 mm with maximum 1.341 mm",
      "3435 independent sagittal/transverse source points have boundary-conditioned RMS 0.229 mm and maximum 1.069 mm; leave-one-person-out RMS is 0.061–0.403 mm with maximum 1.311 mm",
      "Source derivatives retain actual physical h and transform by the measured forward-depth Jacobian; transverse jet magnitude RMS is 0.18–1.07 mm per depth fraction and direction RMS/max are 10.40/21.20 degrees; this common law does not reproduce every observed roll direction",
      "Source guide endpoints and existing whole-feature fits have independent Recovery approximation error; input inner-feature placement and shape errors remain additional to these conditional shape residuals",
      "Common depth scales with eye chord and up-offset with eye envelope; independent eyelid thickness, clinical definitions, asymmetry and unseen-person prediction are not identified by four samples",
      "One actual Jang baseline has matching skin/construction samples and no degenerate eyelid triangles; its source canthal placement error is 3.51–6.80 mm, and surrounding-boundary jets, additional views, other persons and independent parameter interactions/reversion remain unqualified",
    ] };
  }

  // Joint fit to four persons x two sides x three actual source courses. These
  // twelve shared coefficients identify a new generated law, not a conversion
  // or degree reduction of the stored source Hermite curves.
  const logDepth: readonly number[] = [-3.058633729343153, -0.013114899673002658, 0.8052374855519194];
  const upOffset: readonly number[] = [0.019409530801639662, -0.0185970111336242, -0.003975083318626343,
    -0.008071026623266624, -0.001377267222632515, 0.007379953346910464,
    0.06156132710312541, -0.004826504359645181, 0.007893544372153685];

  function inPlane(x: number, y: number, normal: HumanCurve.Vector): HumanCurve.Vector { return [x, y, -(normal[0] * x + normal[1] * y) / normal[2]]; }
  function add(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function subtract(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function scale(a: HumanCurve.Vector, value: number): HumanCurve.Vector { return [a[0] * value, a[1] * value, a[2] * value]; }
  function dot(a: HumanCurve.Vector, b: HumanCurve.Vector): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function dot3(a: readonly number[], b: readonly number[]): number { return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!; }
  function finite(value: HumanCurve.Vector): boolean { return value.length === 3 && value.every(Number.isFinite); }
}
