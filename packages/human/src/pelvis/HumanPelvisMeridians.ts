import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSurface } from "../internal/HumanSurface";
import type { HumanPelvisSeams } from "./HumanPelvisSeams";

/** Common anterior/posterior meridians between actual hip and own-thigh ports.
 * Source-face and accepted-span incidence binds sixteen existing guide arcs.
 * Runtime consumes current shared endpoints and directions, never observations.
 */
export namespace HumanPelvisMeridians {
  /** Both directions run from the hip port toward the same owned thigh port. */
  export type Kind = "anterior" | "posterior";

  /** Common actual-port endpoint and declared generated unit-speed gauge. */
  export type Endpoint = HumanPelvisSeams.Endpoint;

  /** An oriented unit plane normal need not point toward common forward. */
  export interface GuidePlane {
    /** Source-defined forward-guide normal in the common frame. */
    normal: HumanCurve.Vector;
    /** Unit-normal plane coordinate, mm. */
    coordinateMm: number;
  }

  /** One full curve authority with exact physical first and second derivatives. */
  export type Result = HumanPelvisSeams.Result;

  /** Common Legendre channels, ordered constant then achieved-shape rows. */
  const coefficients: Record<Kind,readonly (readonly [number,number])[]> = {
    anterior: [[0.0009467372228908794,0.008055861036473632],[-0.001554556603881249,-0.01096920970676247],[0.0010019815971720643,0.01791721405788656],[-0.001728589997416414,-0.014207343215937872]],
    posterior: [[-0.0006141846474595426,-0.0008655255243617863],[-0.0005860741727168554,-0.015718897283096625]],
  };

  /** Inherit the observed plane through the actual support chord and forward.
   * Its normal is projected-forward cross directed bone. This defines a
   * geometric source chart, not a clinical joint or material surface direction.
   */
  export function guidePlane(thighMm: HumanCurve.Vector, calfMm: HumanCurve.Vector): GuidePlane {
    if (!finite(thighMm) || !finite(calfMm)) throw new Error("Pelvic meridian supports require finite common millimetres");
    const bone: HumanCurve.Vector = unit(subtract(calfMm,thighMm));
    const forward: HumanCurve.Vector = unit(subtract([1,0,0],scale(bone,bone[0])));
    const normal: HumanCurve.Vector = unit(cross(forward,bone));
    return {normal,coordinateMm:dot(normal,thighMm)};
  }

  /** Predict original restricted physical h from observed chord excess.
   * L=|P1-P0|+Hip*c. The pooled excess is 0.00009519762975649316 anterior
   * and 0.0016578156235545342 posterior. Whole-person width errors reach
   * 0.112/1.674 mm. This explicit fitted gauge is not exact arc length or an
   * assertion that original native derivative speed was identically one.
   */
  export function phaseWidth(kind: Kind, firstMm: HumanCurve.Vector, lastMm: HumanCurve.Vector, hipMm: number): number {
    if (!valid(kind) || !finite(firstMm) || !finite(lastMm) || !(hipMm>0 && Number.isFinite(hipMm))) throw new Error("Pelvic meridian width requires a valid kind and physical inputs");
    const chord: number = Math.hypot(...subtract(lastMm,firstMm));
    if (!(chord>0 && Number.isFinite(chord))) throw new Error("Coincident or unbounded pelvic meridian endpoints need another domain");
    const width: number = chord+hipMm*(kind==="anterior" ? 9.519762975649316e-5 : 0.0016578156235545342);
    if (!(width>0 && Number.isFinite(width))) throw new Error("Pelvic meridian inputs leave no finite physical phase width");
    return width;
  }

  /** Preserve actual endpoint P/D with a common degree-five/four interior law.
   * Main owns plane roots, endpoint roles, phase changes and transverse ribbons.
   * Exact P_t/P_tt differentiate the entire polynomial, including 1/L and 1/L².
   * Computation is fixed O(D), D<=5; no source files, mesh or normals are read.
   */
  export function build(id: string, kind: Kind, first: Endpoint, last: Endpoint, plane: GuidePlane, hipMm: number, shape: number): Result {
    if (!id || !valid(kind) || !Number.isFinite(shape) || !finite(plane.normal) || !Number.isFinite(plane.coordinateMm) || Math.abs(Math.hypot(...plane.normal)-1)>64*Number.EPSILON) throw new Error("Pelvic meridians require a finite common unit guide plane");
    const positions: HumanCurve.Vector[] = [];
    for (const endpoint of [first,last]) {
      if (!(Number.isFinite(endpoint.parameter) && endpoint.parameter>=endpoint.curve.start && endpoint.parameter<=endpoint.curve.end) || !finite(endpoint.unitTangent) || Math.abs(Math.hypot(...endpoint.unitTangent)-1)>64*Number.EPSILON) throw new Error("A pelvic meridian endpoint requires an actual root and unit tangent");
      const p: HumanCurve.Vector = [...endpoint.curve.evaluate(endpoint.parameter)];
      if (!finite(p) || Math.abs(dot(plane.normal,p)-plane.coordinateMm)>64*Number.EPSILON*Math.max(1,Math.hypot(...p),Math.abs(plane.coordinateMm)) || Math.abs(dot(plane.normal,endpoint.unitTangent))>64*Number.EPSILON) throw new Error("Actual meridian endpoints and tangents must lie in their common guide plane");
      positions.push(p);
    }
    const a: HumanCurve.Vector = positions[0]!, b: HumanCurve.Vector = positions[1]!;
    const width: number = phaseWidth(kind,a,b,hipMm), along: HumanCurve.Vector = unit(subtract(b,a));
    const bend: HumanCurve.Vector = unit(subtract(subtract([1,0,0],scale(plane.normal,plane.normal[0])),scale(along,along[0])));
    const degree: number = kind==="anterior" ? 1 : 0, rows: readonly (readonly [number,number])[] = coefficients[kind];
    const controls: HumanCurve.Vector[] = [a,b,scale(first.unitTangent,width),scale(last.unitTangent,width)];
    const curve: HumanSurface.Boundary = {id,unit:"mm",start:0,end:width,evaluate:(t:number):HumanCurve.Vector=>evaluate(t)[0],derivative:(t:number):HumanCurve.Vector=>evaluate(t)[1]};
    return {curve,phaseWidthMm:width,endpoints:[first,last],secondDerivative:(t:number):HumanCurve.Vector=>evaluate(t)[2],limitations:[
      "Actual generated hip/own-thigh P and geometric unit tangents are inherited; the original source-port-conditioned fit is not a runtime fallback",
      "Anterior degree-five source RMS/max 0.436/1.211 mm; whole-person width-and-shape refit holdout RMS 0.970, 0.815, 0.470, 0.361 mm",
      "Posterior degree-four source RMS/max 0.531/1.705 mm; corresponding whole-person holdout RMS 0.868, 0.748, 0.817, 0.640 mm",
      "Independent original port/guide fits differ at conditioned endpoints by up to 0.262 mm; native source incidence and finite fit budgets remain distinct from exact generated P/D inheritance",
      "Physical phase predicts original restricted sum h; generated unit endpoint speed is a separate gauge and not an exact arc-length or native-speed claim",
      "Source thigh ports have actual fractions 0.250319..0.260026; transport to exact generated quarter ports remains an interpolation prediction",
      "These meridians supply no transverse ribbon, corner twist, whole 3D interior, exact lateral disk, posterior central domain, genital semantic exclusion or embedding qualification",
      "Main owns actual port/plane roots and roles, common skeleton, shared W fields, skin/construction and hardware parameter verification",
    ]};

    /** Evaluate the same full polynomial in generated physical phase. */
    function evaluate(t: number): [HumanCurve.Vector,HumanCurve.Vector,HumanCurve.Vector] {
      if (!(Number.isFinite(t) && t>=0 && t<=width)) throw new Error("Pelvic meridian evaluation escaped its physical phase");
      const u: number=t/width,u2:number=u*u,u3:number=u2*u;
      const h: number[][]=[[2*u3-3*u2+1,-2*u3+3*u2,u3-2*u2+u,u3-u2],[6*u2-6*u,-6*u2+6*u,3*u2-4*u+1,3*u2-2*u],[12*u-6,-12*u+6,6*u-4,6*u-2]];
      const bubble: number[]=[u2*(1-u)*(1-u),2*u-6*u2+4*u3,2-12*u+12*u2];
      const result: [HumanCurve.Vector,HumanCurve.Vector,HumanCurve.Vector]=[[0,0,0],[0,0,0],[0,0,0]];
      for(let order:number=0;order<3;order++) for(let axis:number=0;axis<3;axis++) for(let i:number=0;i<4;i++) result[order]![axis]!+=h[order]![i]!*controls[i]![axis]!;
      for(let i:number=0;i<=degree;i++) {
        const p:number=i===0?1:2*u-1,dp:number=i===0?0:2;
        const f:number[]=[bubble[0]!*p,bubble[1]!*p+bubble[0]!*dp,bubble[2]!*p+2*bubble[1]!*dp];
        for(let order:number=0;order<3;order++) for(let axis:number=0;axis<3;axis++) result[order]![axis]!+=hipMm*f[order]!*(along[axis]!*(rows[i]![0]+shape*rows[i+degree+1]![0])+bend[axis]!*(rows[i]![1]+shape*rows[i+degree+1]![1]));
      }
      result[1]=scale(result[1],1/width);result[2]=scale(result[2],1/(width*width));
      if(t===0){result[0]=[...a];result[1]=[...first.unitTangent];}
      else if(t===width){result[0]=[...b];result[1]=[...last.unitTangent];}
      return result;
    }
  }

  /** Small fixed-size operations retain one common physical frame. */
  function subtract(a:HumanCurve.Vector,b:HumanCurve.Vector):HumanCurve.Vector{return[a[0]-b[0],a[1]-b[1],a[2]-b[2]];}
  function scale(a:HumanCurve.Vector,s:number):HumanCurve.Vector{return[a[0]*s,a[1]*s,a[2]*s];}
  function dot(a:HumanCurve.Vector,b:HumanCurve.Vector):number{return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
  function cross(a:HumanCurve.Vector,b:HumanCurve.Vector):HumanCurve.Vector{return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
  function finite(a:HumanCurve.Vector):boolean{return a.length===3&&a.every(Number.isFinite);}
  function valid(kind:Kind):boolean{return kind==="anterior"||kind==="posterior";}
  function unit(a:HumanCurve.Vector):HumanCurve.Vector{const n:number=Math.hypot(...a);if(!(n>0&&Number.isFinite(n)))throw new Error("A singular pelvic meridian frame requires another domain");return scale(a,1/n);}
}
