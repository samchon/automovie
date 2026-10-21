import { HumanPolynomialRoots } from "../internal/HumanPolynomialRoots";
import type { HumanForeheadSideNetwork } from "./HumanForeheadSideNetwork";

/** Bounded whole-V admission of the same owner's formed Y quintic. */
export namespace HumanHeadYAdmission {
  type Q = { n: bigint; d: bigint };
  type Range = { lo: Q; hi: Q };

  /** Same original owner metadata and its unchanged P/Pv evaluator. */
  export interface Input {
    /** The sole actual outer U1 function with optional algebraic metadata enabled. */
    source: HumanForeheadSideNetwork.SidePort;
  }

  /** All algebraic witnesses remain available independently of numerical inverse addresses. */
  export interface Result {
    /** Strict exact-rational lower bound converted downward to a positive double. */
    minimumWorldYDerivativeBoundMm: number;
    /** All roots and unresolved sets of the formed second derivative on original V. */
    derivativeExtrema: HumanPolynomialRoots.Isolation;
    /** All roots of formed Y-target, with original V and full degree preserved. */
    isolateAtY: (worldYmm: number) => HumanPolynomialRoots.Isolation;
    /** One qualified original-function address, checked against actual P/Pv arithmetic. */
    phasesAtY: (worldYmm: number) => readonly number[];
    /** Every actually requested full root isolation and original-function refinement. */
    queries: Array<{worldYmm:number;isolation:HumanPolynomialRoots.Isolation;originalPhase?:number;actualForwardY?:number;residualMm?:number}>;
    /** Original and derived full powers, rather than sampled polynomial reconstruction. */
    coefficients: { y: readonly number[]; formedSecond: readonly number[] };
    /** Whole-interval rational bound details, including resource counts. */
    bound: { numerator: string; denominator: string; cells: number; maxDepth: number };
    /** The scope is not a source-geometry or outward floating evaluator certificate. */
    limitations: string[];
  }

  /** Root isolation and rational interval evaluation have explicit finite budgets. */
  export function build(input: Input): Result {
    const metadata: HumanForeheadSideNetwork.SidePort["worldYPowers"] = input.source.worldYPowers;
    if (metadata === undefined || metadata.scope !== "formed-binary64-original-V-quintic" ||
      metadata.coefficientsMm.length !== 6 || !metadata.coefficientsMm.every(Number.isFinite))
      throw new Error("Y admission requires the same owner's complete original quintic metadata");
    const powers: readonly number[] = metadata.coefficientsMm;
    const first: Q[] = powers.slice(1).map((x: number,i: number): Q => mul(decode(x),fraction(BigInt(i+1),1n)));
    const second: number[] = powers.slice(2).map((x: number,i: number): number => x*(i+2)*(i+1));
    const extrema: HumanPolynomialRoots.Isolation = HumanPolynomialRoots.isolate(second,{start:0,end:1},budget(3));
    if (extrema.status !== "complete" && extrema.status !== "flat")
      throw Object.assign(new Error("Formed Y double-derivative extrema are unresolved: "+extrema.status),
        {derivativeExtrema:extrema,coefficients:{y:powers,formedSecond:second}});
    const zero: Q = fraction(0n,1n), one: Q = fraction(1n,1n);
    const cuts: Q[] = [zero,one];
    for (const root of extrema.roots) for (const endpoint of [root.bracket.lower,root.bracket.upper])
      cuts.push(fraction(BigInt(endpoint.numerator),BigInt(endpoint.denominator)));
    cuts.sort(compare);
    const unique: Q[] = cuts.filter((q: Q,i: number): boolean => i === 0 || compare(q,cuts[i-1]!) !== 0);
    const pending: Array<{lo:Q;hi:Q;depth:number}> = [];
    for (let i: number = 1;i < unique.length;i++) pending.push({lo:unique[i-1]!,hi:unique[i]!,depth:0});
    let lower: Q | undefined, cells: number = 0, depth: number = 0;
    while (pending.length > 0) {
      const cell: {lo:Q;hi:Q;depth:number} = pending.pop()!;
      if (++cells > 8192 || cell.depth > 32)
        throw Object.assign(new Error("Whole-original-V positive derivative admission exhausted its bounded rational subdivisions"),
          {derivativeExtrema:extrema,cells,pendingCells:pending.length+1,stoppedCell:cell});
      depth = Math.max(depth,cell.depth);
      const range: Range = horner(first,{lo:cell.lo,hi:cell.hi});
      if (range.lo.n > 0n) {
        if (lower === undefined || compare(range.lo,lower) < 0) lower = range.lo;
      } else {
        if (range.hi.n <= 0n) throw Object.assign(new Error("The formed original Y polynomial has a nonpositive derivative interval"),
          {derivativeExtrema:extrema,stoppedCell:cell,range});
        const mid: Q = mul(add(cell.lo,cell.hi),fraction(1n,2n));
        pending.push({lo:cell.lo,hi:mid,depth:cell.depth+1},{lo:mid,hi:cell.hi,depth:cell.depth+1});
      }
    }
    if (lower === undefined) throw new Error("No whole-original-V derivative lower bound was admitted");
    let minimum: number = Number(lower.n)/Number(lower.d);
    if (!(minimum > 0 && Number.isFinite(minimum)))
      throw new Error("The exact positive derivative bound has no supported finite conversion");
    while (compare(decode(minimum),lower) > 0) minimum = down(minimum);
    if (!(minimum > 0)) throw new Error("The derivative bound is below the finite positive conversion range");
    const queries: Result["queries"] = [];
    const isolateAtY: Result["isolateAtY"] = (y: number): HumanPolynomialRoots.Isolation => {
      if (!Number.isFinite(y)) throw new Error("Y root target must be finite millimetres");
      const coefficients: number[] = [...powers]; coefficients[0] = coefficients[0]!-y;
      const isolation: HumanPolynomialRoots.Isolation = HumanPolynomialRoots.isolate(coefficients,{start:0,end:1},budget(5));
      queries.push({worldYmm:y,isolation});return isolation;
    };
    const phasesAtY: Result["phasesAtY"] = (y: number): readonly number[] => {
      const roots: HumanPolynomialRoots.Isolation = isolateAtY(y);
      if (roots.status !== "complete" || roots.roots.length !== 1)
        throw Object.assign(new Error("The complete formed Y-target polynomial lacks one original-V root"),
          {worldYmm:y,isolation:roots});
      let v: number = roots.roots[0]!.approximation;
      // This is a numerical refinement of the admitted root against its original function.
      // It is neither a second root isolator nor an exact absence certificate.
      for (let i: number = 0;i < 12;i++) {
        const value: number = input.source.boundary.evaluate(v)[1];
        const slope: number = input.source.boundary.derivative(v)[1];
        if (!(slope > 0 && Number.isFinite(value))) throw new Error("Original-function Y inversion lost its positive local gauge");
        if (value === y) break;
        const next: number = v-(value-y)/slope;
        if (next === v) break;
        if (!(Number.isFinite(next) && next >= 0 && next <= 1))
          throw new Error("The original-function refinement left its admitted root domain");
        v = next;
      }
      const value: number = input.source.boundary.evaluate(v)[1];
      if (Math.abs(value-y) > 128*Number.EPSILON*Math.max(1,Math.abs(value),Math.abs(y)))
        throw new Error("Original factored Y and formed-polynomial address have unresolved arithmetic disagreement");
      Object.assign(queries.at(-1)!,{originalPhase:v,actualForwardY:value,residualMm:value-y});
      return [v];
    };
    return {minimumWorldYDerivativeBoundMm:minimum,derivativeExtrema:extrema,isolateAtY,phasesAtY,queries,
      coefficients:{y:powers,formedSecond:second},
      bound:{numerator:lower.n.toString(),denominator:lower.d.toString(),cells,maxDepth:depth},
      limitations:[
        "The bound covers the exact rational derivative of the supplied formed binary64 Y coefficients on every original V, including extrema brackets and all intervening intervals",
        "Formed Y'' roots are preserved in full; rounded derivative coefficient forming is separate from exact rational derivative interval admission",
        "The factored original evaluator and formed powers have different arithmetic order; actual P/Pv residual checks admit numerical inverse addresses and do not certify every floating evaluation",
        "Root multiplicities, unresolved sets, exact brackets and bounded failures remain available from the shared root owner; no sampled Vandermonde fit or alternate root algorithm is used",
      ]};
  }

  function budget(degree: number): HumanPolynomialRoots.Budget {
    return {maxCoefficientCount:degree+1,maxDegree:degree,maxIntegerBits:16384,maxOperations:1000000,
      maxBisections:4096,maxDepth:128,maxRoots:degree,maxAbsoluteWidth:2**-40};
  }
  function fraction(n: bigint,d: bigint): Q {
    if (d === 0n) throw new Error("A rational denominator vanished");
    if (d < 0n) {n = -n;d = -d;}
    let a: bigint = n < 0n ? -n : n, b: bigint = d;
    while (b !== 0n) {const r: bigint = a%b;a = b;b = r;}
    const q: Q = {n:n/(a || 1n),d:d/(a || 1n)};
    if (q.n.toString(2).length > 16384 || q.d.toString(2).length > 16384)
      throw new Error("Y-bound rational bit budget exhausted");
    return q;
  }
  function decode(x: number): Q {
    if (!Number.isFinite(x)) throw new Error("Only finite binary64 coefficients are admitted");
    const buffer: ArrayBuffer = new ArrayBuffer(8), view: DataView = new DataView(buffer);
    view.setFloat64(0,x,false);
    const bits: bigint = view.getBigUint64(0,false), exponent: number = Number((bits>>52n)&2047n);
    const mantissa: bigint = (bits&((1n<<52n)-1n))+(exponent === 0 ? 0n : 1n<<52n);
    const power: number = exponent === 0 ? -1074 : exponent-1075;
    const sign: bigint = bits>>63n ? -1n : 1n;
    return power >= 0 ? fraction(sign*mantissa*(1n<<BigInt(power)),1n) :
      fraction(sign*mantissa,1n<<BigInt(-power));
  }
  function add(a: Q,b: Q): Q {return fraction(a.n*b.d+b.n*a.d,a.d*b.d);}
  function mul(a: Q,b: Q): Q {return fraction(a.n*b.n,a.d*b.d);}
  function compare(a: Q,b: Q): number {const d: bigint = a.n*b.d-b.n*a.d;return d < 0n ? -1 : d > 0n ? 1 : 0;}
  function horner(powers: readonly Q[],domain: Range): Range {
    let result: Range = {lo:fraction(0n,1n),hi:fraction(0n,1n)};
    for (let i: number = powers.length-1;i >= 0;i--) {
      const products: Q[] = [mul(result.lo,domain.lo),mul(result.lo,domain.hi),mul(result.hi,domain.lo),mul(result.hi,domain.hi)];
      products.sort(compare);
      result = {lo:add(products[0]!,powers[i]!),hi:add(products[3]!,powers[i]!)};
    }
    return result;
  }
  function down(x: number): number {
    const view: DataView = new DataView(new ArrayBuffer(8));view.setFloat64(0,x,false);
    view.setBigUint64(0,view.getBigUint64(0,false)-1n,false);return view.getFloat64(0,false);
  }
}
