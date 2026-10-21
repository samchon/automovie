import type { HumanLimbCurves } from "../limbs/HumanLimbCurves";

/** Station features consume the same exact area polynomials as regional skin. */
export namespace HumanAreaMinimum {
  /** One numerically isolated generated feature, separate from source certainty. */
  export interface Result {
    /** Selected physical support station, mm, without a nominal-knot snap. */
    stationMm: number;
    /** Binary64 root bracket, in physical mm. */
    bracketMm: readonly [number,number];
    /** Actual retained polynomial's area, square millimetres. */
    areaMm2: number;
    /** Numerical and source-feature qualifications. */
    limitations: readonly string[];
  }

  /**
   * Compare every strict stationary root, original span boundary and domain end.
   * Rolle recursion partitions each complete derivative polynomial; bisection
   * then resolves its strict sign crossings. Exact flat spans, indistinguishable
   * minima and endpoint-censored minima are refused rather than replaced by a
   * nominal feature station or an averaged address. Full polynomial degree is
   * retained. Finite binary64 brackets do not certify coefficient uncertainty,
   * shallow multiple roots or a unique extremum in the original anatomy.
   */
  export function build(spans: readonly HumanLimbCurves.AreaSpan[],startMm:number,endMm:number): Result {
    if (!(Number.isFinite(startMm)&&Number.isFinite(endMm)&&startMm<endMm) || spans.length===0)
      throw new Error("A feature search requires an actual bounded area authority");
    const candidates:Array<{station:number;bracket:[number,number];area:number;error:number}>=[];
    let coverage:number=startMm;
    for(const span of spans) {
      const a:number=Math.max(startMm,span.startMm),b:number=Math.min(endMm,span.endMm);
      if(!(a<b)) continue;
      if(a!==coverage) throw new Error("The area feature search has a gap or overlapping authority");
      coverage=b;
      const width:number=span.endMm-span.startMm,ua:number=(a-span.startMm)/width,ub:number=(b-span.startMm)/width;
      const p:readonly number[]=span.coefficientsMm2,d:number[]=derivative(p);
      if(!p.every(Number.isFinite)||d.every((value:number):boolean=>value===0)) throw new Error("A flat or unsupported area interval has no unique feature station");
      const bounds:Array<[number,number]>=roots(d,ua,ub).map((root:[number,number]):[number,number]=>root);
      bounds.push([ua,ua],[ub,ub]);
      for(const bracket of bounds) {
        const u:number=Math.abs(evaluate(d,bracket[0]))<=Math.abs(evaluate(d,bracket[1]))?bracket[0]:bracket[1];
        const station:number=u===ua?a:u===ub?b:span.startMm+width*u;
        const area:number=evaluate(p,u);
        let magnitude:number=0;for(let power:number=p.length-1;power>=0;power--) magnitude=magnitude*Math.abs(u)+Math.abs(p[power]!);
        const error:number=64*p.length*Number.EPSILON*magnitude;
        candidates.push({station,bracket:[span.startMm+width*bracket[0],span.startMm+width*bracket[1]],area,error});
      }
    }
    if(coverage!==endMm||candidates.length===0) throw new Error("The complete feature domain has no area authority");
    candidates.sort((a:typeof candidates[number],b:typeof candidates[number]):number=>a.area-b.area);
    const best:typeof candidates[number]=candidates[0]!;
    if(!(best.area>0)||best.station===startMm||best.station===endMm) throw new Error("The generated distal area minimum is invalid or censored by its observed domain");
    for(const other of candidates.slice(1))
      if(other.station!==best.station && other.area-best.area<=best.error+other.error)
        throw new Error("Multiple generated area minima remain numerically indistinguishable");
    return {stationMm:best.station,bracketMm:best.bracket,areaMm2:best.area,limitations:[
      "The generated minimum is isolated from the same complete degree-ten physical shank area polynomial; this does not repair its unidentified independent Knee/Calf response",
      "The distal class [.75,1] follows the last anterior-profile source transition; its bounds are a support-domain classification, not newly acquired planes",
      "Source Won-right has a shallow observed area plateau; a strict generated minimum does not certify a unique source feature station",
      "Root brackets and Horner roundoff budgets qualify binary64 evaluation only; no interval certificate for recovered source shape or fitted coefficient error is claimed",
    ]};
  }

  /** Isolate strict crossings between all sign-changing derivative roots. */
  function roots(p:readonly number[],a:number,b:number):Array<[number,number]> {
    if(p.length<=1) return [];
    const critical:Array<[number,number]>=roots(derivative(p),a,b);
    const addresses:number[]=[a,...critical.map((bound:[number,number]):number=>Math.abs(evaluate(p,bound[0]))<=Math.abs(evaluate(p,bound[1]))?bound[0]:bound[1]),b];
    const output:Array<[number,number]>=[];
    for(let i:number=0;i<addresses.length-1;i++) {
      let left:number=addresses[i]!,right:number=addresses[i+1]!,fl:number=evaluate(p,left);
      const fr:number=evaluate(p,right);
      if(!((fl<0&&fr>0)||(fl>0&&fr<0))) continue;
      for(let iteration:number=0;iteration<80;iteration++) {
        const middle:number=left+(right-left)/2;
        if(middle===left||middle===right) break;
        const fm:number=evaluate(p,middle);
        if(fm===0) {left=middle;right=middle;break;}
        if((fm<0)===(fl<0)) {left=middle;fl=fm;} else right=middle;
      }
      output.push([left,right]);
    }
    return output;
  }
  /** Differentiate without discarding any nonzero high-order coefficient. */
  function derivative(p:readonly number[]):number[] {
    const d:number[]=p.slice(1).map((value:number,index:number):number=>value*(index+1));
    while(d.length>1&&d.at(-1)===0) d.pop();return d;
  }
  /** Horner evaluation in the span's declared dimensionless local coordinate. */
  function evaluate(p:readonly number[],u:number):number {let value:number=0;for(let i:number=p.length-1;i>=0;i--) value=value*u+p[i]!;return value;}
}
