import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSurface } from "../internal/HumanSurface";

/** One identified vector field owns the central forehead and its lateral neighbor. */
export namespace HumanForeheadSideNetwork {
  type Vector = HumanCurve.Vector;
  type Jet = ReturnType<HumanSurface.Patch["jet"]>;
  interface FullJet extends Jet { mixedDerivativeUV: Vector; secondDerivativeVV: Vector }
  interface Endpoint { p: Vector; pu: Vector; pv: Vector; puv: Vector }

  /** Existing endpoint curve and outgoing tangent plane, supplied by its owner. */
  export interface Port {
    /** Actual source-corresponding boundary, spanning canthal U=.25 through1. */
    boundary: HumanSurface.Boundary;
    /** The port's original transverse parameter unit; it is never relabeled. */
    transverseUnit: string;
    /** Exact outgoing dP/dt and d²P/(dt dU) in that stated parameter. */
    transverse: (u: number) => { derivative: Vector; derivativeU: Vector };
  }

  /** Actual metric and boundary objects are injected without rebuilding features. */
  export interface Input {
    /** Existing geometric reflection side. */
    side: "left" | "right";
    /** Existing unit canthal chord direction, inner to outer. */
    normal: Vector;
    /** The same actual chord length, millimetres. */
    lengthMm: number;
    /** Existing brow curve and tangent plane shared with the lower orbital chart. */
    brow: Port;
    /** Actual common forehead principal and full meridian transverse authority. */
    forehead: Port;
  }

  /** This side curve is one object and one exact crossjet for both incident charts. */
  export interface SidePort {
    /** Existing geometric side. */
    side: Input["side"];
    /** Actual observed plane of this owned source side. */
    canthalU: .25 | .75 | 1;
    /** Sole curve at its source-observed canthal plane, increasing brow to forehead. */
    boundary: HumanSurface.Boundary;
    /** Along coordinate of this boundary's derivative. */
    unitV: "normalized-source-crosscourse-phase";
    /** Independent across coordinate; derivatives remain mm per canthal fraction. */
    unitU: "canthal-chord-fraction";
    /** Exact d²P/dV², mm per normalized source phase squared. */
    alongSecond: (v: number) => Vector;
    /** Exact Pu/Puv; the two restrictions use the same positive U gauge1. */
    transverse: (v: number) => { derivativeU: Vector; mixedDerivativeUV: Vector };
    /** Optional algebraic expansion by this same owner, ascending original V powers in mm.
     * Forming binary64 coefficients and evaluating the factored function have distinct roundoff.
     */
    worldYPowers?: { coefficientsMm: readonly number[]; scope: "formed-binary64-original-V-quintic" };
  }

  /** Direct diagnostic candidate, with posterior and medial coverage kept separate. */
  export interface Result {
    /** Exact central restrictions U=.25 through .75. */
    central: HumanSurface.Patch[];
    /** Exact source-observed lateral restrictions U=.75 through1. */
    lateral: HumanSurface.Patch[];
    /** Actual medial U=.25 edge for the separately identified medial neighbor. */
    innerPorts: SidePort[];
    /** Actual same-object shared side and exact jets. */
    sidePorts: SidePort[];
    /** Actual outer U=1 edges and full jets for the next source-defined neighbor. */
    outerPorts: SidePort[];
    /** Generating boundaries, consumed unchanged by displayed construction. */
    boundaries: HumanSurface.Boundary[];
    /** Source conditioning, missing regions and unverified generated appearance. */
    limitations: string[];
  }

  /**
   * Original cubic Hermite observations retain every physical h and one-sided
   * jet. Two positive endpoint-Y gauge laws are identified first; twelve common
   * interior scalar coefficients then minimize the physical-span H1 residual.
   * Six-point Gauss integration respects the complete original piece intervals.
   * This generated quintic is an approximation, never reduction of those sources.
   *
   * Every endpoint consumes the caller's exact P/Pu and outgoing full jet. The
   * complete positive gauge derivative preserves its tangent plane and mixed jet.
   * Both incident charts evaluate the same function, including at their shared
   * source canthal plane. This introduces no radial side, bridge, crop or weld.
   */
  export function build(inputs: readonly Input[], options?: { outerYPowers?: boolean }): Result {
    const central: HumanSurface.Patch[] = [], lateral: HumanSurface.Patch[] = [];
    const innerPorts: SidePort[] = [], sidePorts: SidePort[] = [], outerPorts: SidePort[] = [], boundaries: HumanSurface.Boundary[] = [];
    const sides: Set<Input["side"]> = new Set();
    for (const input of inputs) {
      if (sides.has(input.side) || !(input.lengthMm > 0 && Number.isFinite(input.lengthMm)) ||
        input.normal.length !== 3 || !input.normal.every(Number.isFinite) ||
        Math.abs(dot(input.normal,input.normal)-1) > 1e-10 || input.normal[2] === 0)
        throw new Error("Forehead vector charts require unique sides and their actual regular canthal metric");
      sides.add(input.side);
      for (const port of [input.brow,input.forehead])
        if (port.boundary.unit !== "canthal-chord-fraction" || port.boundary.start > .25 ||
          port.boundary.end < 1 || port.transverseUnit.length === 0)
          throw new Error("The source-observed lateral chart requires actual endpoint authorities through canthal U=1");
      const inPlane: (x: number,y: number) => Vector = (x: number,y: number): Vector =>
        [x,y,-(input.normal[0]*x+input.normal[1]*y)/input.normal[2]];
      const endpoints: (u: number) => [Endpoint,Endpoint] = (u: number): [Endpoint,Endpoint] => {
        const ports: [Port,Port] = [input.brow,input.forehead];
        const p: Vector[] = ports.map((port: Port): Vector => port.boundary.evaluate(u));
        const pu: Vector[] = ports.map((port: Port): Vector => port.boundary.derivative(u));
        const height: number = p[1]![1]-p[0]![1], heightU: number = pu[1]![1]-pu[0]![1];
        const scaleMm: number = Math.max(1,Math.hypot(...p[0]!),Math.hypot(...p[1]!),input.lengthMm);
        if (Math.abs(dot(input.normal,p[1]!.map((x: number,i: number): number => x-p[0]![i]!) as Vector)) > 128*Number.EPSILON*scaleMm ||
          pu.some((value: Vector): boolean => Math.abs(dot(input.normal,value)-input.lengthMm) > 128*Number.EPSILON*scaleMm))
          throw new Error("The supplied endpoint authorities do not share the actual canthal-plane metric");
        if (!(height > 0 && Number.isFinite(height) && Number.isFinite(heightU)))
          throw new Error("Forehead endpoint height has no supported positive gauge");
        return ports.map((port: Port,index: number): Endpoint => {
          const j: ReturnType<Port["transverse"]> = port.transverse(u);
          if (!(j.derivative[1] > 0 && [j.derivative,j.derivativeU].every((v: Vector): boolean => v.every(Number.isFinite))))
            throw new Error("The supplied endpoint jet has no supported positive up direction");
          const g: [number,number] = gauge(endpointGauge[index]!,u);
          const lambda: number = height*g[0]/j.derivative[1];
          const lambdaU: number = (heightU*g[0]+height*g[1])/j.derivative[1]-
            height*g[0]*j.derivativeU[1]/(j.derivative[1]*j.derivative[1]);
          if (!(lambda > 0 && Number.isFinite(lambda) && Number.isFinite(lambdaU)))
            throw new Error("The complete endpoint parameter Jacobian is unresolved");
          return {p:p[index]!,pu:pu[index]!,
            pv:scale(j.derivative,lambda),
            puv:add(scale(j.derivative,lambdaU),scale(j.derivativeU,lambda))};
        }) as [Endpoint,Endpoint];
      };
      const evaluate: (u: number,v: number) => FullJet = (u: number,v: number): FullJet => {
        if (!(Number.isFinite(u) && u >= .25 && u <= 1 && Number.isFinite(v) && v >= 0 && v <= 1))
          throw new Error("Forehead vector evaluation is outside its observed source domain");
        const e: [Endpoint,Endpoint] = endpoints(u), a: Endpoint = e[0], b: Endpoint = e[1];
        const h: number[] = [2*v*v*v-3*v*v+1,-2*v*v*v+3*v*v,v*v*v-2*v*v+v,v*v*v-v*v];
        const d: number[] = [6*v*v-6*v,-6*v*v+6*v,3*v*v-4*v+1,3*v*v-2*v];
        const x: [number,number,number,number] = residual(forward,u,v);
        const y: [number,number,number,number] = residual(up,u,v);
        const r: Vector[] = [0,1,2,3].map((k: number): Vector => scale(inPlane(x[k]!,y[k]!),input.lengthMm));
        const blend: (weights: readonly number[],values: readonly Vector[],offset: Vector) => Vector =
          (weights: readonly number[],values: readonly Vector[],offset: Vector): Vector =>
            [0,1,2].map((axis: number): number => weights.reduce((sum: number,w: number,k: number): number =>
              sum+w*values[k]![axis]!,offset[axis]!)) as Vector;
        const positionMm: Vector = v === 0 ? a.p : v === 1 ? b.p : blend(h,[a.p,b.p,a.pv,b.pv],r[0]!);
        const derivativeU: Vector = v === 0 ? a.pu : v === 1 ? b.pu : blend(h,[a.pu,b.pu,a.puv,b.puv],r[1]!);
        const derivativeV: Vector = v === 0 ? a.pv : v === 1 ? b.pv : blend(d,[a.p,b.p,a.pv,b.pv],r[2]!);
        const mixedDerivativeUV: Vector = v === 0 ? a.puv : v === 1 ? b.puv : blend(d,[a.pu,b.pu,a.puv,b.puv],r[3]!);
        const dd: number[] = [12*v-6,-12*v+6,6*v-4,6*v-2];
        const secondDerivativeVV: Vector = blend(dd,[a.p,b.p,a.pv,b.pv],
          scale(inPlane(secondResidual(forward,u,v),secondResidual(up,u,v)),input.lengthMm));
        if (![positionMm,derivativeU,derivativeV,mixedDerivativeUV,secondDerivativeVV].every((value: Vector): boolean => value.every(Number.isFinite)))
          throw new Error("The shared vector law returned a nonfinite exact jet");
        return {positionMm,derivativeU,derivativeV,mixedDerivativeUV,secondDerivativeVV};
      };
      const id: string = "head.forehead-side."+input.side;
      const course: (u: number) => HumanSurface.Boundary = (u: number): HumanSurface.Boundary => ({
        id:id+".course."+u,start:0,end:1,unit:"normalized-source-crosscourse-phase",
        evaluate:(v: number): Vector => evaluate(u,v).positionMm,
        derivative:(v: number): Vector => evaluate(u,v).derivativeV,
      });
      const first: HumanSurface.Boundary = course(.25), shared: HumanSurface.Boundary = course(.75);
      const last: HumanSurface.Boundary = course(1);
      boundaries.push(input.brow.boundary,input.forehead.boundary,first,shared,last);
      const makePort: (u: .25 | .75 | 1,boundary: HumanSurface.Boundary) => SidePort =
        (u: .25 | .75 | 1,boundary: HumanSurface.Boundary): SidePort => ({side:input.side,canthalU:u,boundary,
          unitV:"normalized-source-crosscourse-phase",unitU:"canthal-chord-fraction",
          alongSecond:(v: number): Vector => evaluate(u,v).secondDerivativeVV,
          transverse:(v: number): {derivativeU: Vector;mixedDerivativeUV: Vector} => {
            const j: FullJet = evaluate(u,v);return {derivativeU:j.derivativeU,mixedDerivativeUV:j.mixedDerivativeUV};
          }});
      const outer: SidePort = makePort(1,last);
      if (options?.outerYPowers === true) {
        const [a,b]: [Endpoint,Endpoint] = endpoints(1);
        const powers: number[] = [a.p[1],a.pv[1],-3*a.p[1]+3*b.p[1]-2*a.pv[1]-b.pv[1],
          2*a.p[1]-2*b.p[1]+a.pv[1]+b.pv[1],0,0];
        const residualPowers: number[] = [0,0,0,0,0,0];
        // At U=1 all three Legendre terms are exactly one; retain every V power.
        for (let i: number = 0;i < 3;i++) {
          const p: number = up[2*i]!, q: number = up[2*i+1]!;
          residualPowers[2]! += p-q; residualPowers[3]! += -2*p+4*q;
          residualPowers[4]! += p-5*q; residualPowers[5]! += 2*q;
        }
        for (let i: number = 2;i <= 5;i++) powers[i]! += input.lengthMm*residualPowers[i]!;
        outer.worldYPowers = {coefficientsMm:Object.freeze(powers),scope:"formed-binary64-original-V-quintic"};
      }
      innerPorts.push(makePort(.25,first));sidePorts.push(makePort(.75,shared));outerPorts.push(outer);
      for (const region of [0,1] as const) {
        const lo: number = region === 0 ? .25 : .75, hi: number = region === 0 ? .75 : 1;
        const left: HumanSurface.Boundary = region === 0 ? first : shared;
        const right: HumanSurface.Boundary = region === 0 ? shared : last;
        const jet: (u: number,v: number) => Jet = (u: number,v: number): Jet => {
          if (u < lo || u > hi) throw new Error("The incident vector chart lies outside its owned canthal interval");
          const value: FullJet = evaluate(u,v);
          if (u !== lo && u !== hi) return value;
          const edge: HumanSurface.Boundary = u === lo ? left : right;
          return {...value,positionMm:edge.evaluate(v),derivativeV:edge.derivative(v)};
        };
        const patch: HumanSurface.Patch = {id:id+(region === 0 ? ".central" : ".lateral"),
          u:{start:lo,end:hi,unit:"canthal-chord-fraction"},
          v:{start:0,end:1,unit:"normalized-source-crosscourse-phase"},jet,
          outwardSign:input.side === "left" ? 1 : -1,
          boundaries:{u0:{curve:left,orientation:1},u1:{curve:right,orientation:1},
            v0:{curve:input.brow.boundary,orientation:1},v1:{curve:input.forehead.boundary,orientation:1}}};
        (region === 0 ? central : lateral).push(patch);
      }
    }
    return {central,lateral,innerPorts,sidePorts,outerPorts,boundaries,limitations:[
      "Only the observed central-to-lateral forehead domain U=.25..1 is represented; medial, full posterior scalp, ear and unobserved outer-neighbor attachment remain separate missing domains",
      "All32 original quarter/half/three-quarter/outer crosscourses identify18 common scalar coefficients; their original full Hermite degree, physical h, one-sided jets and fit flags remain unchanged",
      "Source principal boundaries and existing pooled common brow/cranial directions condition this method; omitting one person refits18 scalar coefficients but does not independently omit the fixed preexisting common endpoint authorities",
      "The regular generated quintic does not reproduce every source parametric speed jump or unobserved corner; clinical semantics, unseen morphology and independent q behavior remain unverified",
      "Both incident charts consume one actual side object and identical exact jets with U gauge1; this is a source-corresponding replacement candidate, not a coordinate weld or crop of the previous radial domain",
      "Actual boundary ports through U=1 and their full derivatives must be supplied by the common owner; no existing feature, head frame, skeleton or boundary is rebuilt",
      "Generated orientation, full neighboring surfaces, appearance and parameter return require the main owner's actual matched capture round before adoption",
    ]};
  }

  const endpointGauge: readonly (readonly number[])[] = [[0.03402931683819163,0.03735398096739317,-0.0018693745591774737],[-0.05906864969586123,-0.002605579573855896,0.007646012661448233]];
  const forward: readonly number[] = [-1.1745985183215977,0.015372796976557948,0.21649908969460233,0.34202188109520115,-0.01676983213818177,-0.012630737595281332];
  const up: readonly number[] = [-0.04367356104498302,-0.2675795854639895,-0.18702505257269464,0.4142501436014769,0.019072766489128302,-0.04518415744568314];

  function dot(a: readonly number[],b: readonly number[]): number {return a.reduce((s: number,x: number,i: number): number => s+x*b[i]!,0);}
  function scale(a: Vector,t: number): Vector {return a.map((x: number): number => x*t) as Vector;}
  function add(a: Vector,b: Vector): Vector {return a.map((x: number,i: number): number => x+b[i]!) as Vector;}
  function gauge(theta: readonly number[],u: number): [number,number] {
    const z: number = 2*u-1, a: number[] = [1,z,(3*z*z-1)/2], d: number[] = [0,2,6*z];
    const value: number = Math.exp(dot(theta,a));return [value,value*dot(theta,d)];
  }
  /** Exact second V derivative of the same original residual polynomial. */
  function secondResidual(theta: readonly number[],u: number,v: number): number {
    const z: number = 2*u-1,w: number = 2*v-1;
    const rv: number = 2*v*(1-v)*(1-2*v),rvv: number = 2-12*v+12*v*v;
    const a: number[] = [1,z,(3*z*z-1)/2];
    let value: number = 0;
    for (let i: number = 0;i < 3;i++) value += a[i]!*(rvv*(theta[2*i]!+w*theta[2*i+1]!)+4*rv*theta[2*i+1]!);
    return value;
  }

  /** Residual value, U derivative, V derivative and exact mixed derivative. */
  function residual(theta: readonly number[],u: number,v: number): [number,number,number,number] {
    const z: number = 2*u-1,w: number = 2*v-1,r: number = v*v*(1-v)*(1-v),rv: number = 2*v*(1-v)*(1-2*v);
    const a: number[] = [1,z,(3*z*z-1)/2],au: number[] = [0,2,6*z];
    let value: number = 0,du: number = 0,dv: number = 0,duv: number = 0;
    for (let i: number = 0;i < 3;i++) {
      const p: number = theta[2*i]!,q: number = theta[2*i+1]!;
      value += a[i]!*r*(p+w*q);du += au[i]!*r*(p+w*q);
      dv += a[i]!*(rv*(p+w*q)+2*r*q);duv += au[i]!*(rv*(p+w*q)+2*r*q);
    }
    return [value,du,dv,duv];
  }
}
