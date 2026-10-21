import type { HumanCurve } from "../internal/HumanCurve";

/** Bounded double-double evaluation of the same common shoulder equations.
 * No coefficient, curve, tolerance or physical phase is changed by arithmetic.
 */
export namespace HumanShoulderSkinArithmetic {
  /** Unevaluated high/low binary64 expansion of one scalar in its declared units. */
  export type D = readonly [number,number];
  /** World vector, with positions in mm and derivatives in their declared units. */
  export type V = HumanCurve.Vector;
  /** One vector term in a shared analytic expression. */
  export interface Term {
    /** Unrounded scalar expansion, retaining its physical Jacobian. */
    factor:D;
    /** Generated common world vector, never a source specimen row. */
    vector:V;
  }
  /** Exact expansion of a finite binary64 input. */
  export function of(value:number):D {
    if (!Number.isFinite(value)) throw new Error("Nonfinite shoulder arithmetic input");
    return [value,0];
  }
  /** Round the retained expansion once to the consumer's binary64 scalar. */
  export function value(a:D):number { return a[0]+a[1]; }
  /** Sign reversal preserves the complete retained expansion. */
  export function neg(a:D):D { return [-a[0],-a[1]]; }
  /** Sum expansions using error-free twoSum and one final renormalization. */
  export function add(a:D,b:D):D {
    const s:D=twoSum(a[0],b[0]),t:D=twoSum(a[1],b[1]);
    const u:D=twoSum(s[1],t[0]),v:D=twoSum(s[0],u[0]);
    return twoSum(v[0],v[1]+u[1]+t[1]);
  }
  /** Difference in the same declared scalar units. */
  export function sub(a:D,b:D):D { return add(a,neg(b)); }
  /** Multiply both retained parts with bounded error-free binary64 products. */
  export function mul(a:D,b:D):D {
    return add(add(twoProduct(a[0],b[0]),twoProduct(a[0],b[1])),add(twoProduct(a[1],b[0]),twoProduct(a[1],b[1])));
  }
  /** Three quotient corrections retain the scalar-law constraint precision. */
  export function div(a:D,b:D):D {
    if (b[0] === 0) throw new Error("Singular shoulder arithmetic divisor");
    let q:D=of(a[0]/b[0]);
    for (let i:number=0;i<2;i++) {
      const r:D=sub(a,mul(b,q));q=add(q,of((r[0]+r[1])/b[0]));
    }
    return q;
  }
  /** Scalar multiplication without an intermediate coefficient rounding. */
  export function scale(a:D,b:number):D { return mul(a,of(b)); }
  /** Compensated world dot product of the original stored vector components. */
  export function dot(a:V,b:V):D {
    let result:D=of(0);
    for (let i:number=0;i<3;i++) result=add(result,twoProduct(a[i]!,b[i]!));
    return result;
  }
  /** Evaluate all vector terms before rounding each resulting world component. */
  export function combine(terms:readonly Term[]):V {
    const result:V=[0,0,0];
    for (let axis:number=0;axis<3;axis++) {
      let sum:D=of(0);
      for (const term of terms) sum=add(sum,scale(term.factor,term.vector[axis]!));
      result[axis]=value(sum);
    }
    return result;
  }
  /** Cubic Hermite scalar and its physical derivatives; endpoint owners are exact expansions. */
  export function hermite(a:D,b:D,da:D,db:D,t:number):{value:D;first:D;second:D} {
    const c:D=sub(scale(sub(b,a),3),add(scale(da,2),db));
    const d:D=add(scale(sub(a,b),2),add(da,db));
    return {value:t === 0 ? a : t === 1 ? b : add(a,scale(add(da,scale(add(c,scale(d,t)),t)),t)),
      first:t === 0 ? da : t === 1 ? db : add(da,scale(add(scale(c,2),scale(d,3*t)),t)),
      second:add(scale(c,2),scale(d,6*t))};
  }
  /** Error-free sum while the finite physical-domain operation does not overflow. */
  function twoSum(a:number,b:number):D {
    const s:number=a+b,v:number=s-a,e:number=(a-(s-v))+(b-v);
    if (!Number.isFinite(s) || !Number.isFinite(e)) throw new Error("Shoulder arithmetic sum exceeds its finite domain");
    return [s,e];
  }
  /** Dekker product in a declared normal range; unsupported overflow/underflow is refused. */
  function twoProduct(a:number,b:number):D {
    if (a === 0 || b === 0) return [0,0];
    const p:number=a*b;
    if (!(Number.isFinite(p) && Math.abs(a)<=2**450 && Math.abs(b)<=2**450 && Math.abs(p)>=2**-900)) throw new Error("Shoulder arithmetic product exceeds its error-free normal range");
    const ca:number=134217729*a,cb:number=134217729*b;
    const ah:number=ca-(ca-a),al:number=a-ah,bh:number=cb-(cb-b),bl:number=b-bh;
    const error:number=((ah*bh-p)+ah*bl+al*bh)+al*bl;
    if (!Number.isFinite(error)) throw new Error("Nonfinite shoulder product expansion");
    return [p,error];
  }
}
