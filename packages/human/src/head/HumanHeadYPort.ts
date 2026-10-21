import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSurface } from "../internal/HumanSurface";
import type { HumanForeheadSideNetwork } from "./HumanForeheadSideNetwork";
import type { HumanPosteriorHemisphereSurface } from "./HumanPosteriorHemisphereSurface";

/** Exact physical-Y addresses preserve one original U1 function and its full two-jet. */
export namespace HumanHeadYPort {
  type Vector = HumanCurve.Vector;

  /** One owner-selected canonical address with its unchanged original-function residual. */
  export interface Address {
    /** Exact original normalized phase, including preserved old sampler addresses. */
    originalV: number;
    /** Main-owned shared physical-Y sample parameter, millimetres. */
    canonicalY: number;
    /** Actual unchanged original function Y at originalV, millimetres. */
    actualForwardY: number;
    /** actualForwardY minus canonicalY, without coordinate displacement. */
    residualMm: number;
    /** Existing 128*EPSILON arithmetic-scale admission, millimetres. */
    arithmeticBoundMm: number;
  }

  /** The common root owner supplies whole-domain admission, never a sample lookup. */
  export interface Input {
    /** Existing single U1 curve and exact two-jet. */
    source: HumanForeheadSideNetwork.SidePort;
    /** All roots of that same original full function at requested world Y. */
    phasesAtY: (worldYmm: number) => readonly number[];
    /** Strict whole-original-domain positive dY/dV bound, supplied by its owner. */
    minimumWorldYDerivativeBoundMm: number;
  }

  /** Shared physical function plus exact address/Jacobian metadata for the old incident chart. */
  export interface Result extends HumanPosteriorHemisphereSurface.Front {
    /** Same original object; changing parameter does not create a second geometry authority. */
    originalBoundary: HumanSurface.Boundary;
    /** Exact original V -> physical Y, including both derivatives. */
    physicalAddress: (originalV: number) => { yMm: number; derivativeY: number; secondDerivativeY: number };
    /** Unique exact-function root address, not an interpolated point table. */
    originalPhase: (worldYmm: number) => number;
    /** Admit exact known owner pairs after complete root qualification; no interpolation. */
    admitAddresses: (addresses: readonly { originalV: number; canonicalY: number }[]) => Address[];
    /** Main must bind this address map into both incident edge declarations. */
    limitations: string[];
  }

  /**
   * For J=PvY>0, Py=Pv/J and Pyy=(Pvv-Py*PvvY)/J². The fixed-height
   * canthal cross direction is K=Pu-Pv*(PuY/J); Ky=Kv/J, with the full
   * Puv/Pvv quotient derivative. No new geometric fit, endpoint projection,
   * source copy, finite-difference derivative or parameter epsilon is used.
   *
   * The old incident patch still uses original V. Main must explicitly publish
   * its V->Y edge-address map or readdress that patch consistently. Assigning
   * only this wrapper's name/object while keeping an unstated parameter alias
   * is not a completed shared-boundary contract.
   */
  export function build(input: Input): Result {
    const source: HumanForeheadSideNetwork.SidePort = input.source;
    if (source.canthalU !== 1 || source.boundary.start !== 0 || source.boundary.end !== 1 ||
      !(input.minimumWorldYDerivativeBoundMm > 0 && Number.isFinite(input.minimumWorldYDerivativeBoundMm)))
      throw new Error("Physical-Y front port requires full original U1 monotonic admission");
    const lower: number = source.boundary.evaluate(0)[1], upper: number = source.boundary.evaluate(1)[1];
    if (!(Number.isFinite(lower) && Number.isFinite(upper) && upper > lower))
      throw new Error("The actual source U1 has no regular physical-Y range");
    const qualified: Map<number,number> = new Map();
    const known: Map<number,number> = new Map();
    const qualify: (y: number) => number = (y: number): number => {
      if (!(Number.isFinite(y) && y >= lower && y <= upper))
        throw new Error("Physical-Y address exceeds its original source function");
      if (y === lower) return 0;
      if (y === upper) return 1;
      const previous: number | undefined = qualified.get(y);
      if (previous !== undefined) return previous;
      const roots: readonly number[] = input.phasesAtY(y);
      if (roots.length !== 1 || !(roots[0]! >= 0 && roots[0]! <= 1 && Number.isFinite(roots[0]!)))
        throw new Error("Physical-Y address does not have one qualified original phase");
      qualified.set(y,roots[0]!);return roots[0]!;
    };
    const measure: (originalV: number,canonicalY: number) => Address =
      (originalV: number,canonicalY: number): Address => {
        if (!(Number.isFinite(originalV) && originalV >= 0 && originalV <= 1))
          throw new Error("An owner address is outside the full original V domain");
        const actualForwardY: number = source.boundary.evaluate(originalV)[1];
        const derivative: number = source.boundary.derivative(originalV)[1];
        const residualMm: number = actualForwardY-canonicalY;
        const arithmeticBoundMm: number = 128*Number.EPSILON*Math.max(1,Math.abs(canonicalY),Math.abs(actualForwardY));
        if (!Number.isFinite(actualForwardY) || !(derivative > 0) || Math.abs(residualMm) > arithmeticBoundMm)
          throw new Error("Original owner address fails the existing physical-Y arithmetic residual admission");
        return {originalV,canonicalY,actualForwardY,residualMm,arithmeticBoundMm};
      };
    const originalPhase: (y: number) => number = (y: number): number => {
      const candidate: number = qualify(y), v: number = known.get(y) ?? candidate;
      measure(v,y);return v;
    };
    const admitAddresses: Result["admitAddresses"] =
      (addresses: readonly {originalV:number;canonicalY:number}[]): Address[] => addresses.map(
        (address: {originalV:number;canonicalY:number}): Address => {
          // Even a known exact old sample retains the same whole-root admission.
          qualify(address.canonicalY);
          const ledger: Address = measure(address.originalV,address.canonicalY);
          const previous: number | undefined = known.get(address.canonicalY);
          if (previous !== undefined && previous !== address.originalV)
            throw new Error("One canonical Y was assigned two different known original owner addresses");
          known.set(address.canonicalY,address.originalV);return ledger;
        });
    const jet: (y: number) => {p: Vector;py: Vector;pyy: Vector;cross: Vector;crossY: Vector} =
      (y: number): {p: Vector;py: Vector;pyy: Vector;cross: Vector;crossY: Vector} => {
        const v: number = originalPhase(y), p: Vector = source.boundary.evaluate(v);
        const pv: Vector = source.boundary.derivative(v), pvv: Vector = source.alongSecond(v);
        const q: ReturnType<HumanForeheadSideNetwork.SidePort["transverse"]> = source.transverse(v);
        const j: number = pv[1];
        if (!(j > 0)) throw new Error("The physical-Y function lost its positive Jacobian");
        const py: Vector = scale(pv,1/j);
        const pyy: Vector = scale(subtract(pvv,scale(py,pvv[1])),1/(j*j));
        const a: number = q.derivativeU[1]/j;
        const av: number = q.mixedDerivativeUV[1]/j-q.derivativeU[1]*pvv[1]/(j*j);
        const cross: Vector = subtract(q.derivativeU,scale(pv,a));
        const crossY: Vector = scale(subtract(q.mixedDerivativeUV,
          add(scale(pvv,a),scale(pv,av))),1/j);
        if (![p,py,pyy,cross,crossY].every((x: Vector): boolean => x.every(Number.isFinite)))
          throw new Error("Physical-Y readdressing produced a nonfinite exact chain jet");
        return {p,py,pyy,cross,crossY};
      };
    return {side:source.side,originalBoundary:source.boundary,originalPhase,admitAddresses,
      boundary:{id:source.boundary.id+".world-Y-address",unit:"world-Y-mm",start:lower,end:upper,
        evaluate:(y: number): Vector => jet(y).p,derivative:(y: number): Vector => jet(y).py},
      alongSecond:(y: number): Vector => jet(y).pyy,
      transverse:(y: number): {derivativeU: Vector;mixedDerivativeUY: Vector} => {
        const j: ReturnType<typeof jet> = jet(y);return {derivativeU:j.cross,mixedDerivativeUY:j.crossY};
      },
      physicalAddress:(v: number): {yMm: number;derivativeY: number;secondDerivativeY: number} => {
        if (!(Number.isFinite(v) && v >= 0 && v <= 1)) throw new Error("Original U1 phase exceeds its declared range");
        return {yMm:source.boundary.evaluate(v)[1],derivativeY:source.boundary.derivative(v)[1],
          secondDerivativeY:source.alongSecond(v)[1]};
      },
      limitations:[
        "This is an exact-function coordinate adapter, not a fitted alternate front course",
        "The positive full-domain derivative certificate and every original-function root are supplied by the common owner; finite queried checks do not replace them",
        "Main must make the same physical Boundary/address map authoritative in both incident skin and construction consumers before claiming a joined edge",
        "Original normalized source phase, world-Y mm, canthal fraction and their full Jacobians remain distinct units",
        "Canonical shared Y sample arrays are separate from actual forward Y values. Known exact owner pairs retain old V addresses; added inverse pairs preserve their signed residual and existing arithmetic bound without moving a point",
        "The exact-key caches retain admitted actual owner addresses and equivalent completed root queries only; they perform no interpolation, nearest lookup or alternate root isolation. Original domain endpoints retain their exact owner endpoint admission",
      ]};
  }

  function scale(a: Vector,t: number): Vector {return a.map((x: number): number => x*t) as Vector;}
  function add(a: Vector,b: Vector): Vector {return a.map((x: number,i: number): number => x+b[i]!) as Vector;}
  function subtract(a: Vector,b: Vector): Vector {return a.map((x: number,i: number): number => x-b[i]!) as Vector;}
}
