import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSurface } from "../internal/HumanSurface";

/** Common pelvic seams identified from source-bound existing Hermite guides.
 * The common assembly supplies actual generated port roots and unit tangents.
 * Source observations, original speeds and actual h remain external evidence;
 * no mesh, source normal, specimen coefficient row or copied curve is read.
 */
export namespace HumanPelvisSeams {
  /** Source ownership defines direction; world lateral signs cannot replace it. */
  export type Kind = "outer-left" | "outer-right" | "inner";

  /** Main-owned root on the actual generated port, with its oriented tangent. */
  export interface Endpoint {
    /** Existing shared port authority, retained without another curve fit. */
    curve: HumanSurface.Boundary;
    /** Root address in that curve's canonical declared physical parameter. */
    parameter: number;
    /** dP/dt for the generated physical phase gauge, mm/mm and unit length.
     * The common owner obtains this direction from surface/guide-plane jets.
     */
    unitTangent: HumanCurve.Vector;
  }

  /** One oriented source-defined plane, transported by the common supports. */
  export interface GuidePlane {
    /** Unit projected-forward normal, pointing toward positive common X. */
    normal: HumanCurve.Vector;
    /** Physical plane equation normal dot P = coordinateMm. */
    coordinateMm: number;
  }

  /** Curve, exact physical derivatives and one declared generated phase width. */
  export interface Result {
    /** Physical generated phase t in [0,L], mm; L is not exact arc length. */
    curve: HumanSurface.Boundary;
    /** Exact d2P/dt2, inverse mm, from the same full polynomial. */
    secondDerivative: (phaseMm: number) => HumanCurve.Vector;
    /** Predicted source-chord-like physical width, mm, separate from native h. */
    phaseWidthMm: number;
    /** Actual endpoint authorities and root addresses supplied by assembly. */
    endpoints: readonly [Endpoint, Endpoint];
    /** Conditional fit coverage and remaining domain/assembly qualifications. */
    limitations: readonly string[];
  }

  /** Interior Legendre channels [along chord, in-plane bend], dimensionless.
   * Multiplication by u²(1-u)² preserves supplied endpoint positions and jets.
   * Two outer and six inner common coefficients produce degree four and six.
   */
  const coefficients: { outer: readonly (readonly [number, number])[]; inner: readonly (readonly [number, number])[] } = {
    outer: [[-0.00032131916286841665, 0.004966052453638694]],
    inner: [[4.999838109877678e-5, 0.07251098862793709], [0.025072298074363182, -7.908693533806245e-6], [0.0010406249169294375, -0.16274999408422386]],
  };

  /** Inherit the official acquisition's exact support-relative plane rule.
   * With b the directed thigh-to-calf chord, n=normalize(eX-(eX dot b)b)
   * and c=n dot thigh. Zero support-relative offset is this observed defining
   * constraint, not an invented world coordinate or an averaged plane. The
   * eight source frames agree within 9.36e-15 mm and 6.95e-18 rad when given
   * their actual supports; this does not validate q-to-support prediction.
   */
  export function guidePlane(thighMm: HumanCurve.Vector, calfMm: HumanCurve.Vector): GuidePlane {
    if (!finite(thighMm) || !finite(calfMm)) throw new Error("Pelvic guide supports must be finite common-frame millimetres");
    const bone: HumanCurve.Vector = unit(subtract(calfMm, thighMm));
    const normal: HumanCurve.Vector = unit(subtract([1, 0, 0], scale(bone, bone[0])));
    return { normal, coordinateMm: dot(normal, thighMm) };
  }

  /** Predict retained source parameter width from actual-q common fits.
   * Outer L=Hip*(0.0906455382+0.00847415049*shape); inner L=Hip*0.0516497959.
   * Inner shape dependence worsens whole-person holdout and is omitted.
   * These widths model the original restricted sum of physical h, not exact
   * source arc length. Generated endpoints use unit speed in this new gauge.
   */
  export function phaseWidth(kind: Kind, hipMm: number, shape: number): number {
    if (!validKind(kind) || !(hipMm > 0 && Number.isFinite(hipMm) && Number.isFinite(shape))) throw new Error("Pelvic phase width requires a valid directed seam and finite physical inputs");
    const width: number = hipMm*(kind === "inner" ? 0.051649795942427114 : 0.09064553821638005+0.008474150491653168*shape);
    if (!(width > 0 && Number.isFinite(width))) throw new Error("These inputs leave no positive admitted pelvic phase width");
    return width;
  }

  /** Build a compact seam consuming current generated endpoints and first jets.
   * First/last directions are hip-to-leg outside and source-owned L-to-R
   * inside. World-Z ordering is deliberately irrelevant to the inner direction.
   * Cubic Hermite inheritance plus the identified quartic/sextic interior
   * preserves exact P and dP/dt. Curvature uses full analytic second derivatives,
   * including the physical 1/L² chain factor; no finite difference is used.
   * Computation is O(D), D<=6, with fixed caller-owned endpoint references and
   * local vectors. This owns no cross field, source component or surface patch.
   */
  export function build(id: string, kind: Kind, first: Endpoint, last: Endpoint, plane: GuidePlane, hipMm: number, shape: number): Result {
    const width: number = phaseWidth(kind, hipMm, shape);
    if (!id || !finite(plane.normal) || !Number.isFinite(plane.coordinateMm) || Math.abs(Math.hypot(...plane.normal)-1) > 64*Number.EPSILON || !(plane.normal[0] > 0)) throw new Error("Pelvic seams require the canonical unit projected-forward guide plane");
    const positions: HumanCurve.Vector[] = [];
    for (const endpoint of [first, last]) {
      if (!(Number.isFinite(endpoint.parameter) && endpoint.parameter >= endpoint.curve.start && endpoint.parameter <= endpoint.curve.end) || !finite(endpoint.unitTangent) || Math.abs(Math.hypot(...endpoint.unitTangent)-1) > 64*Number.EPSILON) throw new Error("A pelvic endpoint requires an actual port root and a unit physical tangent");
      const point: HumanCurve.Vector = [...endpoint.curve.evaluate(endpoint.parameter)];
      if (!finite(point) || Math.abs(dot(plane.normal, point)-plane.coordinateMm) > 64*Number.EPSILON*Math.max(1,Math.hypot(...point),Math.abs(plane.coordinateMm)) || Math.abs(dot(plane.normal, endpoint.unitTangent)) > 64*Number.EPSILON) throw new Error("Actual pelvic endpoint geometry and tangent must lie in the shared guide plane");
      positions.push(point);
    }
    const a: HumanCurve.Vector = positions[0]!, b: HumanCurve.Vector = positions[1]!;
    const along: HumanCurve.Vector = unit(subtract(b, a)), n: HumanCurve.Vector = plane.normal;
    const bend: HumanCurve.Vector = kind === "inner" ? unit(subtract(subtract([0,1,0],scale(n,n[1])),scale(along,along[1]))) : scale(unit(cross(n,along)), kind === "outer-right" ? -1 : 1);
    const theta: readonly (readonly [number, number])[] = kind === "inner" ? coefficients.inner : coefficients.outer;
    const controls: HumanCurve.Vector[] = [a, b, scale(first.unitTangent,width), scale(last.unitTangent,width)];
    const curve: HumanSurface.Boundary = { id, unit: "mm", start: 0, end: width,
      evaluate: (phase: number): HumanCurve.Vector => evaluate(phase)[0],
      derivative: (phase: number): HumanCurve.Vector => evaluate(phase)[1] };
    return { curve, phaseWidthMm: width, secondDerivative: (phase: number): HumanCurve.Vector => evaluate(phase)[2], endpoints: [first,last], limitations: [
      "Endpoint P and physical unit tangents come from current generated shared ports; source endpoint conditioning is not a runtime fallback",
      "Outer quartic source fit RMS 0.292 mm/max 0.604 mm; whole-person holdout refitting both width and residual has RMS 0.226, 0.378, 0.741 and 0.569 mm",
      "Inner degree-six source fit RMS 2.187 mm/max 5.506 mm; equivalent whole-person holdout RMS 1.037, 1.640, 4.611 and 1.595 mm",
      "Source parameter-width fit RMS is 3.827 mm outer and 5.090 mm inner; holdout width errors reach 11.381 and 11.318 mm, so predicted phase width is not an exact native or geometric arc length",
      "Native original h and derivative speeds remain separately preserved; generated unit endpoint speed is a different declared gauge",
      "Observed source leg ports are fractions 0.2503..0.2601 with 0.140..4.627 mm normal offsets from exact 0.25; generated exact-quarter transport is an interpolation prediction",
      "Source port pairing and one connected observed cell union containing three paths do not prove an exact three-port skin domain, semantic genital exclusion or global embedding",
      "Pointwise/material source phase and transverse ribbon jets remain unqualified; inner world-lateral order can reverse, and coincident/contact ports require another domain",
      "The common owner supplies ports, phase roots, cross fields, diagonals, skin/construction, actual parameter changes and hardware render verification",
    ] };

    /** Evaluate the complete inherited and identified polynomial in physical phase. */
    function evaluate(phase: number): [HumanCurve.Vector, HumanCurve.Vector, HumanCurve.Vector] {
      if (!(Number.isFinite(phase) && phase >= 0 && phase <= width)) throw new Error("Pelvic seam evaluation escaped its physical phase domain");
      const u: number = phase/width, u2: number = u*u, u3: number = u2*u;
      const blend: number[][] = [[2*u3-3*u2+1,-2*u3+3*u2,u3-2*u2+u,u3-u2],[6*u2-6*u,-6*u2+6*u,3*u2-4*u+1,3*u2-2*u],[12*u-6,-12*u+6,6*u-4,6*u-2]];
      const basis: [number,number,number][] = [[1,0,0]];
      if (theta.length > 1) basis.push([2*u-1,2,0]);
      if (theta.length > 2) basis.push([6*u2-6*u+1,12*u-6,12]);
      const bubble: [number,number,number] = [u2*(1-u)*(1-u),2*u-6*u2+4*u3,2-12*u+12*u2];
      const result: [HumanCurve.Vector,HumanCurve.Vector,HumanCurve.Vector] = [[0,0,0],[0,0,0],[0,0,0]];
      for (let order: number = 0; order < 3; order++) for (let axis: number = 0; axis < 3; axis++) for (let i: number = 0; i < 4; i++) result[order]![axis]! += blend[order]![i]!*controls[i]![axis]!;
      for (let degree: number = 0; degree < theta.length; degree++) {
        const p: [number,number,number] = basis[degree]!;
        const factors: [number,number,number] = [bubble[0]*p[0],bubble[1]*p[0]+bubble[0]*p[1],bubble[2]*p[0]+2*bubble[1]*p[1]+bubble[0]*p[2]];
        for (let order: number = 0; order < 3; order++) for (let axis: number = 0; axis < 3; axis++) result[order]![axis]! += hipMm*factors[order]!*(along[axis]!*theta[degree]![0]+bend[axis]!*theta[degree]![1]);
      }
      result[1] = scale(result[1],1/width); result[2] = scale(result[2],1/(width*width));
      if (phase === 0) { result[0] = [...a]; result[1] = [...first.unitTangent]; }
      else if (phase === width) { result[0] = [...b]; result[1] = [...last.unitTangent]; }
      return result;
    }
  }

  /** Preserve one common physical frame in small binary64 vector operations. */
  function subtract(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector { return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]; }
  function scale(a: HumanCurve.Vector, value: number): HumanCurve.Vector { return [a[0]*value,a[1]*value,a[2]*value]; }
  function dot(a: HumanCurve.Vector, b: HumanCurve.Vector): number { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
  function cross(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector { return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; }
  function finite(a: HumanCurve.Vector): boolean { return a.length === 3 && a.every(Number.isFinite); }
  function validKind(kind: Kind): boolean { return kind === "outer-left" || kind === "outer-right" || kind === "inner"; }
  function unit(a: HumanCurve.Vector): HumanCurve.Vector {
    const length: number = Math.hypot(...a);
    if (!(length > 0 && Number.isFinite(length))) throw new Error("A coincident/contact pelvic port or singular support frame requires a different domain");
    return scale(a,1/length);
  }
}
