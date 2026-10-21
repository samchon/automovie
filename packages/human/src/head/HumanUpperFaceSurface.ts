import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSurface } from "../internal/HumanSurface";
import type { HumanCranialDomain } from "./HumanCranialDomain";
import type { HumanFaceFeatures } from "./HumanFaceFeatures";
import type { HumanHeadFrame } from "./HumanHeadFrame";
import { HumanUpperFaceFeatures } from "./HumanUpperFaceFeatures";

/** One source-identified physical crossjet network owns orbital and forehead charts. */
export namespace HumanUpperFaceSurface {
  type Vector = HumanCurve.Vector;
  type Jet = ReturnType<HumanSurface.Patch["jet"]>;
  interface Field { value: Vector; derivative: Vector }
  interface Endpoint { position: Vector; along: Vector; cross: Vector; crossAlong: Vector }

  /** Existing fold edge and its exact transverse jet in the orbital gauge. */
  export interface FoldPort {
    /** Existing geometric eye side. */
    side: HumanFaceFeatures.Curve["side"];
    /** The actual fold object already referenced by the skin patch. */
    boundary: HumanSurface.Boundary;
    /** Sole exact restriction of the existing full crease, in the same canthal U. */
    crease: HumanSurface.Boundary;
    /** Along-coordinate gauge; no physical arc-length identification is implied. */
    unitU: "canthal-chord-fraction";
    /** Normalized interval gauge of derivativeV; this is not an original h. */
    unitV: "normalized-source-crosscourse-phase";
    /** Exact mm per V and mm per U per V on the outgoing fold side. */
    transverse: (u: number) => { derivativeV: Vector; mixedDerivativeUV: Vector };
  }

  /** Actual brow and the physical jet already shared by its incident intervals. */
  export interface BrowPort {
    /** Existing geometric side. */
    side: HumanFaceFeatures.Curve["side"];
    /** Sole existing brow restriction, optionally through outer canthal U=1. */
    boundary: HumanSurface.Boundary;
    /** Original physical phase gauge of the identified mm-per-mm vector. */
    transverseUnit: "original-source-physical-phase-mm";
    /** Exact physical J and its canthal-U derivative from the same closure. */
    transverse: (u: number) => { derivative: Vector; derivativeU: Vector };
  }

  /** Actual curves and exact jets remain shared by skin and construction. */
  export interface Result {
    /** Bilateral fold-to-brow and brow-to-forehead source domains. */
    patches: HumanSurface.Patch[];
    /** Read-only outgoing fold ports share existing boundary and jet authority. */
    foldPorts: FoldPort[];
    /** Same brow object and physical crossjet, without rebuilding central features. */
    browPorts: BrowPort[];
    /** Sole central restrictions, injected forehead edges and owned side courses. */
    boundaries: HumanSurface.Boundary[];
    /** Conditional fitting, source corner events and unverified parameter limits. */
    limitations: string[];
  }

  /**
   * Jointly identify two adjacent major intervals with one physical brow jet.
   * Source curves retain their complete original span/local addresses, one-sided
   * corner derivatives and restricted physical h. Positive common width laws
   * transport that jet into each normalized phase, rather than averaging slopes.
   * The source-conditioned H1 solve uses both intervals of all four sources.
   *
   * The caller supplies existing eye/frame/features and actual cranial ports.
   * This owner creates fold/brow/crease restrictions once. The same brow object and
   * physical jet function feed both incident patches. At the forehead, lambda
   * times the supplied actual station jet establishes the transverse derivative;
   * its complete U derivative includes boundary gap, gauge and station mixed jet.
   * Interior residuals vanish with their first jets on both horizontal edges.
   * No source arrays, numerical differences, normal fallback or weld are used.
   */
  export function build(frame: HumanHeadFrame.Result, eyes: HumanFaceFeatures.Result,
    upperFace: HumanUpperFaceFeatures.Result, foreheads: readonly HumanCranialDomain.Forehead[], browEnd: .75 | 1 = .75): Result {
    const patches: HumanSurface.Patch[] = [], boundaries: HumanSurface.Boundary[] = [];
    const foldPorts: FoldPort[] = [], browPorts: BrowPort[] = [];
    for (const chart of HumanUpperFaceFeatures.central(frame, eyes, upperFace, browEnd)) {
      const port: HumanCranialDomain.Forehead | undefined = foreheads.find(
        (value: HumanCranialDomain.Forehead): boolean => value.side === chart.side);
      if (port === undefined || port.boundary.start !== 0.25 || (port.boundary.end !== .75 && port.boundary.end !== 1) || port.boundary.unit !== "canthal-chord-fraction")
        throw new Error("The coupled upper face requires its actual central cranial port");
      const normal: Vector = chart.normal, length: number = chart.lengthMm;
      if (!(normal[2] !== 0 && length > 0 && Number.isFinite(length)))
        throw new Error("The upper-face source chart requires a finite lateral canthal direction");
      const inPlane: (x: number, y: number) => Vector = (x: number, y: number): Vector =>
        [x, y, -(normal[0] * x + normal[1] * y) / normal[2]];
      const physical: (offset: number, u: number) => Field = (offset: number, u: number): Field => {
        const z: number = 4 * (u - 0.5), basis: number[] = [1, z, (3 * z * z - 1) / 2], along: number[] = [0, 4, 12 * z];
        return { value: inPlane(dotSlice(forward, offset, basis), dotSlice(up, offset, basis)),
          derivative: inPlane(dotSlice(forward, offset, along), dotSlice(up, offset, along)) };
      };
      // This single physical brow function is consumed by both interval gauges.
      const browPhysical: (u: number) => Field = (u: number): Field => physical(3, u);
      const endpoints: (region: 0 | 1, u: number) => [Endpoint, Endpoint] = (region: 0 | 1, u: number): [Endpoint, Endpoint] => {
        const fold: Vector = chart.fold.evaluate(u), foldU: Vector = chart.fold.derivative(u);
        const brow: Vector = chart.brow.evaluate(u), browU: Vector = chart.brow.derivative(u);
        const top: Vector = port.boundary.evaluate(u), topU: Vector = port.boundary.derivative(u);
        const height: number = top[1] - brow[1], heightU: number = topU[1] - browU[1];
        if (!(height > 0 && Number.isFinite(height))) throw new Error("The forehead port has no supported positive endpoint height interval");
        const width: [number, number] = exponential(region === 0 ? orbitalWidth : foreheadWidth, u);
        const w: number = width[0] * (region === 0 ? length : height);
        const wu: number = width[1] * (region === 0 ? length : height) + (region === 0 ? 0 : width[0] * heightU);
        const shared: Field = browPhysical(u);
        const scaled: (field: Field) => { cross: Vector; crossAlong: Vector } = (field: Field): { cross: Vector; crossAlong: Vector } => ({
          cross: field.value.map((value: number): number => w * value) as Vector,
          crossAlong: field.value.map((value: number, axis: number): number => wu * value + w * field.derivative[axis]!) as Vector,
        });
        if (region === 0) return [{ position: fold, along: foldU, ...scaled(physical(0, u)) },
          { position: brow, along: browU, ...scaled(shared) }];
        const station: ReturnType<HumanCranialDomain.Forehead["transverse"]> = port.transverse(u);
        const js: Vector = station.derivativeS, jsu: Vector = station.derivativeSU;
        const k: [number, number] = exponential(upperGauge, u);
        if (!(js[1] > 0 && Number.isFinite(js[1]))) throw new Error("The actual forehead station jet has no supported positive up gauge");
        const lambda: number = height * k[0] / js[1];
        const lambdaU: number = (heightU * k[0] + height * k[1]) / js[1] - height * k[0] * jsu[1] / (js[1] * js[1]);
        return [{ position: brow, along: browU, ...scaled(shared) }, { position: top, along: topU,
          cross: js.map((value: number): number => lambda * value) as Vector,
          crossAlong: js.map((value: number, axis: number): number => lambdaU * value + lambda * jsu[axis]!) as Vector }];
      };
      browPorts.push({side:chart.side,boundary:chart.brow,transverseUnit:"original-source-physical-phase-mm",
        transverse:(u: number): {derivative: Vector;derivativeU: Vector} => {
          if (!(Number.isFinite(u) && u >= chart.brow.start && u <= chart.brow.end))
            throw new Error("The shared physical brow port lies outside its source canthal range");
          const value: Field = browPhysical(u);return {derivative:value.value,derivativeU:value.derivative};
        }});
      foldPorts.push({ side: chart.side, boundary: chart.fold, crease: chart.crease,
        unitU: "canthal-chord-fraction", unitV: "normalized-source-crosscourse-phase",
        transverse: (u: number): { derivativeV: Vector; mixedDerivativeUV: Vector } => {
          if (!(Number.isFinite(u) && u >= 0.25 && u <= 0.75))
            throw new Error("The outgoing fold port lies outside its source-corresponding domain");
          const value: Endpoint = endpoints(0, u)[0];
          return { derivativeV: value.cross, mixedDerivativeUV: value.crossAlong };
        } });
      boundaries.push(chart.fold, chart.brow, port.boundary);
      for (const region of [0, 1] as const) {
        const id: string = "head.upperface." + chart.side + (region === 0 ? ".fold-to-brow.central" : ".brow-to-forehead.central");
        const lower: HumanSurface.Boundary = region === 0 ? chart.fold : chart.brow;
        const upper: HumanSurface.Boundary = region === 0 ? chart.brow : port.boundary;
        const jet: (u: number, v: number) => Jet = (u: number, v: number): Jet => {
          if (!(Number.isFinite(u) && u >= 0.25 && u <= 0.75 && Number.isFinite(v) && v >= 0 && v <= 1))
            throw new Error("The coupled upper face lies outside its source-corresponding domain");
          const edge: [Endpoint, Endpoint] = endpoints(region, u), a: Endpoint = edge[0], b: Endpoint = edge[1];
          const h: number[] = [2 * v * v * v - 3 * v * v + 1, -2 * v * v * v + 3 * v * v, v * v * v - 2 * v * v + v, v * v * v - v * v];
          const hv: number[] = [6 * v * v - 6 * v, -6 * v * v + 6 * v, 3 * v * v - 4 * v + 1, 3 * v * v - 2 * v];
          const x: [number, number, number] = residual(forward, region, u, v), y: [number, number, number] = residual(up, region, u, v);
          const r: Vector = inPlane(length * x[0], length * y[0]), ru: Vector = inPlane(length * x[1], length * y[1]), rv: Vector = inPlane(length * x[2], length * y[2]);
          const positionMm: Vector = v === 0 ? a.position : v === 1 ? b.position : a.position.map((value: number, axis: number): number =>
            h[0]! * value + h[1]! * b.position[axis]! + h[2]! * a.cross[axis]! + h[3]! * b.cross[axis]! + r[axis]!) as Vector;
          const derivativeU: Vector = v === 0 ? a.along : v === 1 ? b.along : a.along.map((value: number, axis: number): number =>
            h[0]! * value + h[1]! * b.along[axis]! + h[2]! * a.crossAlong[axis]! + h[3]! * b.crossAlong[axis]! + ru[axis]!) as Vector;
          const derivativeV: Vector = v === 0 ? a.cross : v === 1 ? b.cross : a.position.map((value: number, axis: number): number =>
            hv[0]! * value + hv[1]! * b.position[axis]! + hv[2]! * a.cross[axis]! + hv[3]! * b.cross[axis]! + rv[axis]!) as Vector;
          if (![positionMm, derivativeU, derivativeV].every((value: Vector): boolean => value.every(Number.isFinite)))
            throw new Error("The coupled upper-face law has no finite physical jet");
          return { positionMm, derivativeU, derivativeV };
        };
        const course: (u: number) => HumanSurface.Boundary = (u: number): HumanSurface.Boundary => ({
          id: id + ".course." + u, start: 0, end: 1, unit: "normalized-source-crosscourse-phase",
          evaluate: (v: number): Vector => jet(u, v).positionMm,
          derivative: (v: number): Vector => jet(u, v).derivativeV,
        });
        const first: HumanSurface.Boundary = course(0.25), last: HumanSurface.Boundary = course(0.75);
        boundaries.push(first, last);
        patches.push({ id, u: { start: 0.25, end: 0.75, unit: "canthal-chord-fraction" },
          v: { start: 0, end: 1, unit: "normalized-source-crosscourse-phase" }, jet,
          outwardSign: chart.side === "left" ? 1 : -1,
          boundaries: { u0: { curve: first, orientation: 1 }, u1: { curve: last, orientation: 1 },
            v0: { curve: lower, orientation: 1 }, v1: { curve: upper, orientation: 1 } } });
      }
    }
    return { patches, boundaries, foldPorts, browPorts, limitations: [
      "Only two central source-corresponding intervals per eye are emitted; lower fold tissue, canthi and medial/lateral forehead remain missing domains",
      "Corrected original span/local addresses and one-sided h derivatives replace the superseded global-phase endpoint analysis; one Won right source interval retains a true 46.99-degree corner immediately inside its fold endpoint and is not reproduced as a corner by this regular common chart",
      "The common H1 model has boundary-conditioned source RMS/max 0.558/1.724 mm over 6192 observations and whole-person omitted RMS 0.404–0.869 mm with maximum 1.995 mm",
      "Independent source curves supply 3930 qualified points with conditional RMS/max 0.503/1.626 mm; geometric native-normal RMS/max are 6.97/35.01 degrees with no opposite orientation in that finite source population",
      "Original Recovery tolerance flags, ambiguous native-face membership and unresolved duplicate endpoint roots remain separate limitations; observed source boundaries and actual generated cranial intrinsic jets condition the numerical identification",
      "Brow position and along derivative share one actual object, and physical crossjet shares one function under positive interval gauges; upper transverse and mixed jets directly consume the supplied actual cranial authority",
      "Forehead gauge requires positive actual endpoint Y separation and positive actual station Y derivative; no internal Y monotonicity, arbitrary coordinate offset or fitting-tolerance weld is introduced",
      "Common HeadFrame/feature placement errors, independent fold/roll response, unseen morphology and generated parameter interaction/reversion remain unqualified; actual whole-head and neighboring retained-domain inspection is required",
    ] };
  }

  // Common H1 identification; the first six entries are physical fold/brow jets.
  const forward: readonly number[] = [0.7457625195975723,0.09651098126486089,0.019659316242008777,0.16117586133720074,-0.10356435746436321,-0.0007784574873692584,-0.9432531435865107,0.3437987388106363,-0.15487938377107546,-0.22772824802313332,0.24073645228896542,-0.037467879384679895,-1.171999123051183,0.018787922618557204,0.11519827579088165,0.16636186628978827,-0.012961519574520892,0.024111815639727315];
  const up: readonly number[] = [0.5720209010467968,-0.09300615100926041,0.01634597401131177,0.9669409559904453,0.002144342370872849,0.000024662648697636354,0.5031026141788999,-0.5337394776754438,0.041416319841790256,0.010170626465572628,-0.0798431086992496,0.0938508942652181,-0.07807596468024602,-0.2005149674596271,-0.05640785701101603,0.14872089091349067,0.005957821790807982,-0.05250452519036622];
  const orbitalWidth: readonly number[] = [-0.6305818948039524,-0.09410344129685745,0.2933232383657413];
  const foreheadWidth: readonly number[] = [0.08040568756408827,0.0033059160623278173,-0.006409417834743191];
  const upperGauge: readonly number[] = [-0.059022400177353836,-0.005185083473343587,-0.014326020002704302];

  /** Positive source physical-width or endpoint-Jacobian law and exact U derivative. */
  function exponential(theta: readonly number[], u: number): [number, number] {
    const x: number = 2 * u - 1, value: number = Math.exp(theta[0]! + theta[1]! * x + theta[2]! * x * x);
    if (!(value > 0 && Number.isFinite(value))) throw new Error("The source physical gauge is not finite and positive");
    return [value, value * (2 * theta[1]! + 4 * x * theta[2]!)];
  }

  /** Evaluate one common physical vector field without changing its degree. */
  function dotSlice(theta: readonly number[], offset: number, basis: readonly number[]): number {
    let result: number = 0;
    for (let i: number = 0; i < basis.length; i++) result += theta[offset + i]! * basis[i]!;
    return result;
  }

  /** Interior basis preserves both endpoint positions and first jets exactly. */
  function residual(theta: readonly number[], region: 0 | 1, u: number, v: number): [number, number, number] {
    const z: number = 4 * (u - 0.5), w: number = 2 * v - 1, r: number = v * v * (1 - v) * (1 - v), rv: number = 2 * v * (1 - v) * (1 - 2 * v);
    const a: number[] = [1, z, (3 * z * z - 1) / 2], au: number[] = [0, 4, 12 * z];
    let value: number = 0, derivativeU: number = 0, derivativeV: number = 0;
    for (let i: number = 0; i < 3; i++) {
      const first: number = theta[6 + region * 6 + 2 * i]!, second: number = theta[7 + region * 6 + 2 * i]!;
      value += a[i]! * r * (first + w * second);
      derivativeU += au[i]! * r * (first + w * second);
      derivativeV += a[i]! * (rv * (first + w * second) + 2 * r * second);
    }
    return [value, derivativeU, derivativeV];
  }
}
