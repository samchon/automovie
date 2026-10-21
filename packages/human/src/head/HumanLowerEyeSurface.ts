import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSurface } from "../internal/HumanSurface";
import type { HumanEyelidAnnulus } from "./HumanEyelidAnnulus";
import type { HumanFaceFeatures } from "./HumanFaceFeatures";
import type { HumanUpperFaceSurface } from "./HumanUpperFaceSurface";

/** Two source-incidence layers retain the observed crease as a shared C0 edge. */
export namespace HumanLowerEyeSurface {
  type Vector = HumanCurve.Vector;
  type Jet = ReturnType<HumanSurface.Patch["jet"]>;
  interface Field { value: Vector; derivative: Vector }
  interface Endpoint { position: Vector; along: Vector; cross: Vector; crossAlong: Vector }

  /** Existing edge authorities and exact analytic surfaces, without a closure cap. */
  export interface Result {
    /** Outer-rim-to-crease and crease-to-fold central domains on both eyes. */
    patches: HumanSurface.Patch[];
    /** Existing horizontal edges and owned exact side courses. */
    boundaries: HumanSurface.Boundary[];
    /** Source conditioning, corner policy and unsupported generated placement. */
    limitations: string[];
  }

  /**
   * Source-native incidence selects two separate tissue domains. Complete original
   * Hermite span/local addresses and positive physical h identify their common
   * width gauges, independent one-sided crease jets and interior residuals.
   * Twenty-four source crosscourses contribute all positions and V derivatives;
   * no individual controls, source arrays or native normals survive in this rule.
   *
   * The existing annulus outer and upper-face fold ports are injected once. Their
   * actual crease object is shared by both intervals. On the annulus edge, the
   * existing complete transverse vector is transported by a positive Jacobian;
   * its U derivative includes both the endpoint chord derivative and the supplied
   * mixed jet. The lower incoming fold jet remains independent of the existing
   * outgoing upper-face jet because native source continuation is not C1 there.
   * Boundary values and along derivatives call the actual shared objects directly.
   */
  export function build(eyes: HumanFaceFeatures.Result,
    outerPorts: readonly HumanEyelidAnnulus.OuterPort[],
    foldPorts: readonly HumanUpperFaceSurface.FoldPort[]): Result {
    const patches: HumanSurface.Patch[] = [], boundaries: HumanSurface.Boundary[] = [];
    for (const opening of eyes.openings) {
      const side: "left" | "right" = opening.upper.side;
      const outer: HumanEyelidAnnulus.OuterPort | undefined = outerPorts.find(
        (port: HumanEyelidAnnulus.OuterPort): boolean => port.side === side);
      const fold: HumanUpperFaceSurface.FoldPort | undefined = foldPorts.find(
        (port: HumanUpperFaceSurface.FoldPort): boolean => port.side === side);
      if (outer === undefined || fold === undefined)
        throw new Error("Lower eye layers require their existing annulus and fold port owners");
      const edges: HumanSurface.Boundary[] = [outer.boundary, fold.crease, fold.boundary];
      if (!edges.every((edge: HumanSurface.Boundary): boolean => edge.start === 0.25 &&
        edge.end === 0.75 && edge.unit === "canthal-chord-fraction"))
        throw new Error("Lower eye layers require the same source-supported canthal domain");
      const first: Vector = opening.upper.evaluate(0), last: Vector = opening.upper.evaluate(1);
      const chord: Vector = subtract(last, first), length: number = Math.hypot(...chord);
      if (!(length > 0 && Number.isFinite(length))) throw new Error("Lower eye layers require a finite actual eye chord");
      const normal: Vector = chord.map((value: number): number => value / length) as Vector;
      if (normal[2] === 0) throw new Error("Lower eye source charts require a lateral canthal direction");
      const inPlane: (x: number, y: number) => Vector = (x: number, y: number): Vector =>
        [x, y, -(normal[0] * x + normal[1] * y) / normal[2]];
      const physical: (offset: number, u: number) => Field = (offset: number, u: number): Field => {
        const z: number = 4 * (u - 0.5), basis: number[] = [1, z, (3 * z * z - 1) / 2], along: number[] = [0, 4, 12 * z];
        return { value: inPlane(dotSlice(forward, offset, basis), dotSlice(up, offset, basis)),
          derivative: inPlane(dotSlice(forward, offset, along), dotSlice(up, offset, along)) };
      };
      const endpoints: (region: 0 | 1, u: number) => [Endpoint, Endpoint] = (region: 0 | 1, u: number): [Endpoint, Endpoint] => {
        const a: HumanSurface.Boundary = edges[region]!, b: HumanSurface.Boundary = edges[region + 1]!;
        const position: Vector = a.evaluate(u), along: Vector = a.derivative(u);
        const top: Vector = b.evaluate(u), topU: Vector = b.derivative(u);
        const delta: Vector = subtract(top, position), deltaU: Vector = subtract(topU, along);
        const c: number = Math.hypot(...delta);
        if (!(c > 0 && Number.isFinite(c))) throw new Error("The lower eye source gauge requires positive endpoint separation");
        const cu: number = dot(delta, deltaU) / c, ratio: number = Math.exp(widths[region]!);
        const w: number = c * ratio, wu: number = cu * ratio;
        const scaled: (field: Field) => { cross: Vector; crossAlong: Vector } = (field: Field): { cross: Vector; crossAlong: Vector } => ({
          cross: field.value.map((value: number): number => w * value) as Vector,
          crossAlong: field.value.map((value: number, axis: number): number => wu * value + w * field.derivative[axis]!) as Vector,
        });
        const end: Endpoint = { position: top, along: topU, ...scaled(physical(region === 0 ? 0 : 12, u)) };
        if (region === 1) return [{ position, along, ...scaled(physical(9, u)) }, end];
        const target: ReturnType<HumanEyelidAnnulus.OuterPort["transverse"]> = outer.transverse(u);
        const j: Vector = target.derivativeV, ju: Vector = target.mixedDerivativeUV;
        if (!(j[0] > 0 && Number.isFinite(j[0])))
          throw new Error("The actual annulus jet has no supported positive forward gauge");
        const k: number = Math.exp(annulusGauge), lambda: number = c * k / j[0];
        const lambdaU: number = cu * k / j[0] - c * k * ju[0] / (j[0] * j[0]);
        return [{ position, along, cross: j.map((value: number): number => lambda * value) as Vector,
          crossAlong: j.map((value: number, axis: number): number => lambdaU * value + lambda * ju[axis]!) as Vector }, end];
      };
      boundaries.push(...edges);
      for (const region of [0, 1] as const) {
        const id: string = "head.lower-eye." + side + (region === 0 ? ".outer-to-crease.central" : ".crease-to-fold.central");
        const jet: (u: number, v: number) => Jet = (u: number, v: number): Jet => {
          if (!(Number.isFinite(u) && u >= 0.25 && u <= 0.75 && Number.isFinite(v) && v >= 0 && v <= 1))
            throw new Error("Lower eye evaluation lies outside its source-corresponding domain");
          const pair: [Endpoint, Endpoint] = endpoints(region, u), a: Endpoint = pair[0], b: Endpoint = pair[1];
          const h: number[] = [2 * v * v * v - 3 * v * v + 1, -2 * v * v * v + 3 * v * v, v * v * v - 2 * v * v + v, v * v * v - v * v];
          const hv: number[] = [6 * v * v - 6 * v, -6 * v * v + 6 * v, 3 * v * v - 4 * v + 1, 3 * v * v - 2 * v];
          const x: [number, number, number] = residual(forward, region, u, v), y: [number, number, number] = residual(up, region, u, v);
          const r: Vector = inPlane(length * x[0], length * y[0]);
          const ru: Vector = inPlane(length * x[1], length * y[1]), rv: Vector = inPlane(length * x[2], length * y[2]);
          const positionMm: Vector = v === 0 ? a.position : v === 1 ? b.position : a.position.map((value: number, axis: number): number =>
            h[0]! * value + h[1]! * b.position[axis]! + h[2]! * a.cross[axis]! + h[3]! * b.cross[axis]! + r[axis]!) as Vector;
          const derivativeU: Vector = v === 0 ? a.along : v === 1 ? b.along : a.along.map((value: number, axis: number): number =>
            h[0]! * value + h[1]! * b.along[axis]! + h[2]! * a.crossAlong[axis]! + h[3]! * b.crossAlong[axis]! + ru[axis]!) as Vector;
          const derivativeV: Vector = v === 0 ? a.cross : v === 1 ? b.cross : a.position.map((value: number, axis: number): number =>
            hv[0]! * value + hv[1]! * b.position[axis]! + hv[2]! * a.cross[axis]! + hv[3]! * b.cross[axis]! + rv[axis]!) as Vector;
          if (![positionMm, derivativeU, derivativeV].every((value: Vector): boolean => value.every(Number.isFinite)))
            throw new Error("The lower eye common law has no finite physical jet");
          return { positionMm, derivativeU, derivativeV };
        };
        const course: (u: number) => HumanSurface.Boundary = (u: number): HumanSurface.Boundary => ({
          id: id + ".course." + u, start: 0, end: 1, unit: "normalized-source-crosscourse-phase",
          evaluate: (v: number): Vector => jet(u, v).positionMm,
          derivative: (v: number): Vector => jet(u, v).derivativeV,
        });
        const a: HumanSurface.Boundary = course(0.25), b: HumanSurface.Boundary = course(0.75);
        boundaries.push(a, b);
        patches.push({ id, u: { start: 0.25, end: 0.75, unit: "canthal-chord-fraction" },
          v: { start: 0, end: 1, unit: "normalized-source-crosscourse-phase" }, jet,
          outwardSign: side === "left" ? 1 : -1,
          boundaries: { u0: { curve: a, orientation: 1 }, u1: { curve: b, orientation: 1 },
            v0: { curve: edges[region]!, orientation: 1 }, v1: { curve: edges[region + 1]!, orientation: 1 } } });
      }
    }
    return { patches, boundaries, limitations: [
      "Unadopted diagnostic hypothesis only: the actual three-layer network must be compared with the existing fold-to-brow hood in one rendered assembly before judging visible failure",
      "The source-conditioned 42-shape plus three-gauge law has RMS/max 0.169/0.519 mm over 6192 points; whole-person omitted RMS is 0.120-0.375 mm with maximum 0.868 mm, not independent unobserved-person or q validation",
      "The major source crease turn differs by up to 62.06 degrees pooled and 63.83 degrees under person omission; hidden one-sided native crease angles and visible-envelope normals are separate observables",
      "Nineteen internal source observer corner events across 26 span junctions are absent from this regular chart; original Hermite full degree, positive physical h, ordered one-sided jets, native incidence and branch evidence remain preserved in the bound observations",
      "The exact annulus P/Pu/Pv/Puv and single existing crease/fold objects are consumed directly; positive endpoint-chord gauges and their full U derivatives introduce no projection, clamp, weld or coordinate adjustment",
      "Native lower sheets themselves immerse in 18/24 source planes. The fixed hypothesis has 16/24 contacts, with six count mismatches including one extra Daniel-left middle contact. This is unresolved hidden-contact fidelity, not automatic evidence of a visible skin hole",
      "With the currently exported four actual baselines, 1032 profiles have no finite lower-to-hood crossing and all 960 detected lower mutual crossings lie behind the hood under a same-plane constant-Y forward-X ray. This is a finite diagnostic, not continuous embedding or camera visibility certification",
      "Original Recovery tolerance and native-versus-recovered contact differences, common HeadFrame/feature placement, bilateral crease-roll asymmetry, clinical fold/roll semantics, canthi, lower eyelid and side closure remain unsupported",
      "The caller must retain both lower charts and the actual hood for the matched whole-head/neighbor render; no visibility mask, hidden-sheet deletion, native mesh/normal fallback or source population enters this runtime formula",
    ] };
  }

  const widths: readonly number[] = [0.18501640911310355, 0.11954450297666745];
  const annulusGauge: number = 0.23323109229892833;
  const forward: readonly number[] = [-0.37390524136414527,-0.05034596673061844,-0.02154619869924436,-0.0058196048600304105,0.0627506389904974,-0.004189286119906084,-0.03131584229363254,0.00893508095376146,0.01030229369575947,0.3447178016022112,-0.026325616435542605,0.02365784889756606,0.8764910302643532,0.03688034134225491,-0.02818954398153411,0.0155407963903401,-0.01079352799186609,-0.0024714563078506533,-0.007001905218424932,-0.015150376433567567,0.010931651465043801];
  const up: readonly number[] = [0.5611102823124485,-0.04677177514724941,0.11032830846305174,0.017597536390504334,-0.07822209461971028,0.017243991445981325,-0.03437530503836308,-0.007840372296780192,0.030421870801305498,-0.8315007958766973,-0.10639177368769075,-0.010599320509576737,-0.15097600166556085,-0.2889618597917272,0.052336081695810166,-0.043976265234777066,-0.027906094740222286,0.016577911686577306,-0.006755544556020854,-0.009925387022625552,-0.043477186820096866];

  /** Original-source-constrained interior modes vanish with their edge first jets. */
  function residual(theta: readonly number[], region: 0 | 1, u: number, v: number): [number, number, number] {
    const z: number = 4 * (u - 0.5), q: number = 2 * v - 1;
    const r: number = v * v * (1 - v) * (1 - v), rv: number = 2 * v * (1 - v) * (1 - 2 * v);
    const a: number[] = [1, z, (3 * z * z - 1) / 2], au: number[] = [0, 4, 12 * z];
    let value: number = 0, du: number = 0, dv: number = 0;
    for (let i: number = 0; i < 3; i++) {
      const first: number = theta[(region === 0 ? 3 : 15) + 2 * i]!;
      const second: number = theta[(region === 0 ? 4 : 16) + 2 * i]!;
      value += a[i]! * r * (first + q * second);
      du += au[i]! * r * (first + q * second);
      dv += a[i]! * (rv * (first + q * second) + 2 * r * second);
    }
    return [value, du, dv];
  }

  /** Evaluate one common vector-field polynomial in its declared U gauge. */
  function dotSlice(theta: readonly number[], offset: number, basis: readonly number[]): number {
    let result: number = 0;
    for (let i: number = 0; i < basis.length; i++) result += theta[offset + i]! * basis[i]!;
    return result;
  }

  /** Difference of positions or derivatives preserves the caller's units. */
  function subtract(a: Vector, b: Vector): Vector { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }

  /** Registered scalar product retains physical chord-derivative units. */
  function dot(a: Vector, b: Vector): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
}
