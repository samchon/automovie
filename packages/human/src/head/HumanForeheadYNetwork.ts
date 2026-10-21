import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSurface } from "../internal/HumanSurface";
import type { HumanForeheadSideNetwork } from "./HumanForeheadSideNetwork";
import type { HumanHeadYPort } from "./HumanHeadYPort";

/** Readdress two unchanged incident vector charts by their single outer Y function. */
export namespace HumanForeheadYNetwork {
  type Vector = HumanCurve.Vector;
  type Jet = ReturnType<HumanSurface.Patch["jet"]>;

  /** Main supplies actual objects from one original side-field construction. */
  export interface Input {
    /** Existing central patch and lateral patch; no new shape is fitted here. */
    central: HumanSurface.Patch;
    /** The same field's original U=.75 through1 patch. */
    lateral: HumanSurface.Patch;
    /** Same actual quarter curve, retained with an explicit unsupported medial join. */
    inner: HumanForeheadSideNetwork.SidePort;
    /** Same actual three-quarter course object. */
    shared: HumanForeheadSideNetwork.SidePort;
    /** Actual physical-Y port from the admitted original U1 function. */
    outer: HumanHeadYPort.Result;
    /** Main-owned original sampling addresses, including0 and1; no density is added. */
    originalVAddresses: readonly number[];
    /** The main owner's same canonical Y array consumed directly by posterior skin. */
    canonicalYAddresses: readonly number[];
  }

  /** Both charts and every displayed side course use these identical objects. */
  export interface Result {
    /** Unchanged shape with explicit physical outer-Y V coordinate. */
    central: HumanSurface.Patch;
    /** Same readdressing and same shared three-quarter object. */
    lateral: HumanSurface.Patch;
    /** Quarter readdressed course for future medial ownership. */
    inner: HumanSurface.Boundary;
    /** Sole readdressed U=.75 object shared by both charts. */
    shared: HumanSurface.Boundary;
    /** Exact same physical-Y object used by the posterior chart. */
    outer: HumanSurface.Boundary;
    /** Same main-owned canonical Y array, distinct from measured forward values. */
    samplingY: readonly number[];
    /** Preserved original V, shared Y, actual unchanged forward Y and signed residual. */
    addressLedger: HumanHeadYPort.Address[];
    /** Parameter maps are explicit; no normalized/physical unit alias is used. */
    limitations: string[];
  }

  /** U is unchanged; V=outerY(originalV) is independent of U, hence Pu is unchanged. */
  export function build(input: Input): Result {
    const a: HumanSurface.Patch = input.central, b: HumanSurface.Patch = input.lateral;
    const port: HumanHeadYPort.Result = input.outer;
    if (a.u.start !== .25 || a.u.end !== .75 || b.u.start !== .75 || b.u.end !== 1 ||
      a.v.start !== 0 || a.v.end !== 1 || b.v.start !== 0 || b.v.end !== 1 ||
      a.boundaries.u0.curve !== input.inner.boundary ||
      a.boundaries.u1.curve !== input.shared.boundary || b.boundaries.u0.curve !== input.shared.boundary ||
      b.boundaries.u1.curve !== port.originalBoundary ||
      a.boundaries.v0.curve !== b.boundaries.v0.curve || a.boundaries.v1.curve !== b.boundaries.v1.curve)
      throw new Error("Y readdressing requires both exact incident charts from one original field");
    const original: readonly number[] = input.originalVAddresses;
    if (original[0] !== 0 || original.at(-1) !== 1 ||
      original.some((v: number,i: number): boolean => !Number.isFinite(v) || v < 0 || v > 1 || (i > 0 && v <= original[i-1]!)))
      throw new Error("Original V sampling must retain an increasing complete owned address list");
    const samplingY: readonly number[] = input.canonicalYAddresses;
    if (samplingY.length !== original.length || samplingY[0] !== port.boundary.start || samplingY.at(-1) !== port.boundary.end ||
      samplingY.some((y: number,i: number): boolean => !Number.isFinite(y) || (i > 0 && y <= samplingY[i-1]!)))
      throw new Error("The canonical shared Y list must pair every increasing original V and retain the actual domain endpoints");
    const addressLedger: HumanHeadYPort.Address[] = port.admitAddresses(original.map(
      (originalV: number,i: number): {originalV:number;canonicalY:number} => ({originalV,canonicalY:samplingY[i]!})));
    const wrap: (source: HumanSurface.Boundary) => HumanSurface.Boundary =
      (source: HumanSurface.Boundary): HumanSurface.Boundary => ({
        id:source.id+".outer-Y-address",unit:"outer-course-world-Y-mm",start:port.boundary.start,end:port.boundary.end,
        evaluate:(y: number): Vector => source.evaluate(port.originalPhase(y)),
        derivative:(y: number): Vector => {
          const v: number = port.originalPhase(y);
          return scale(source.derivative(v),1/port.physicalAddress(v).derivativeY);
        },
      });
    const inner: HumanSurface.Boundary = wrap(input.inner.boundary);
    const shared: HumanSurface.Boundary = wrap(input.shared.boundary);
    const make: (source: HumanSurface.Patch,left: HumanSurface.Boundary,right: HumanSurface.Boundary) => HumanSurface.Patch =
      (source: HumanSurface.Patch,left: HumanSurface.Boundary,right: HumanSurface.Boundary): HumanSurface.Patch => ({
        ...source,
        // At U<1 this coordinate is outer-course Y; it is not the local point's world Y.
        v:{start:port.boundary.start,end:port.boundary.end,unit:"outer-course-world-Y-mm"},
        jet:(u: number,y: number): Jet => {
          const v: number = port.originalPhase(y), j: Jet = source.jet(u,v);
          const jacobian: number = port.physicalAddress(v).derivativeY;
          if (!(jacobian > 0)) throw new Error("Readdressed front chart lost its positive original Jacobian");
          const edge: HumanSurface.Boundary | undefined = u === source.u.start ? left : u === source.u.end ? right : undefined;
          return {positionMm:edge === undefined ? j.positionMm : edge.evaluate(y),
            derivativeU:j.derivativeU,
            derivativeV:edge === undefined ? scale(j.derivativeV,1/jacobian) : edge.derivative(y)};
        },
        sampling:{u:source.sampling?.u,v:samplingY},
        boundaries:{u0:{curve:left,orientation:1},u1:{curve:right,orientation:1},
          v0:source.boundaries.v0,v1:source.boundaries.v1},
      });
    return {central:make(a,inner,shared),lateral:make(b,shared,port.boundary),
      inner,shared,outer:port.boundary,samplingY,addressLedger,limitations:[
        "The outer-course physical Y coordinate applies to both original charts; away from U1 it is not equal to local point Y",
        "Pu is the unchanged original canthal derivative. Pv is divided by the sole outer-Y Jacobian; the posterior fixed-local-Y cross differs by an along-edge tangent and preserves the same tangent plane",
        "The three-quarter edge is one object, the posterior front is the exact injected YPort object, and original brow/forehead U-edge objects are preserved",
        "The quarter edge has changed coordinate without a joined medial consumer; the old medial boundary/domain defects remain unsupported",
        "The main-owned canonical Y array is borrowed unchanged by both incident samplers. Actual forward Y is recorded with the existing arithmetic residual bound, not required to be bitwise identical to its inverse target",
        "Same function and same addresses establish ownership, not actual mesh regularity, neighbor contact freedom or visual completion",
      ]};
  }
  function scale(a: Vector,t: number): Vector {return a.map((x: number): number => x*t) as Vector;}
}
