import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSurface } from "../internal/HumanSurface";
import type { HumanMouthFeatures } from "./HumanMouthFeatures";

/** Source-corresponding central external lower lip to mentolabial family hypothesis. */
export namespace HumanLowerFaceSurface {
  type Vector = HumanCurve.Vector;
  type Jet = ReturnType<HumanSurface.Patch["jet"]>;
  interface Endpoint { position: Vector; along: Vector; cross: Vector; crossAlong: Vector }

  /** An actual incoming mentolabial jet; a future chin domain must qualify its other side. */
  export interface MentolabialPort {
    /** Side of the retained source commissural domain. */
    side: "left" | "right";
    /** Actual object already referenced by the candidate skin. */
    boundary: HumanSurface.Boundary;
    /** Independent along parameter, without an arc-length equivalence claim. */
    unitU: "commissural-chord-fraction";
    /** Original whole-interval phase normalized to this candidate's [0,1] V. */
    unitV: "normalized-source-crosscourse-phase";
    /** Exact incoming mm/V and its derivative in mm/U/V. */
    transverse: (u: number) => { derivativeV: Vector; mixedDerivativeUV: Vector };
  }

  /** Two external charts leave vermilion, oral tissue, cheek and chin continuation open. */
  export interface Result {
    /** Skin and construction consume these exact same analytic functions. */
    patches: HumanSurface.Patch[];
    /** Existing lower-lip ports, owned mentolabial restrictions and exact side courses. */
    boundaries: HumanSurface.Boundary[];
    /** Single-owned terminal boundaries and directed incoming jets for the next owner. */
    mentolabialPorts: MentolabialPort[];
    /** Conditional fitting, omitted dynamics and unverified real-render behavior. */
    limitations: string[];
  }

  /**
   * Consume actual commissural lower-lip restrictions created once by their coefficient
   * owner. Native named-edge incidence identifies nineteen complete existing
   * Recovery crosscourses from that exterior boundary to the mentolabial fold.
   * The independent mentolabial principal is identified first in the actual
   * commissural frame; eight common one-sided physical jet coefficients and one
   * positive interval gauge then define the cubic family. No interior handles,
   * copied source profiles, radial closure, arbitrary collar or oral cap occur.
   *
   * Original cubic Hermite spans, physical h, direction, endpoint addresses and
   * both one-sided span jets remain unchanged in the source evidence. This new
   * cubic is a common approximation, not an exact restriction or reduction of
   * those observations. Both halves consume the same supplied principal's exact
   * central tangent. No interior adjustment repairs an incompatible boundary.
   */
  export function build(mouth: HumanMouthFeatures.LowerCentral): Result {
    const width: number = mouth.widthMm;
    if (!(width > 0 && Number.isFinite(width) && mouth.centerU > 0.2 && mouth.centerU < 0.8))
      throw new Error("The lower-face family needs finite actual commissural authorities");
    const patches: HumanSurface.Patch[] = [], boundaries: HumanSurface.Boundary[] = [];
    const mentolabialPorts: MentolabialPort[] = [];
    const basis: (u: number) => [number, number] = (u: number): [number, number] => [1, (2 * u - 1) ** 2];
    const along: (u: number) => [number, number] = (u: number): [number, number] => [0, 4 * (2 * u - 1)];
    const inPlane: (x: number, y: number) => Vector = (x: number, y: number): Vector =>
      mouth.forward.map((value: number, axis: number): number => value * x + mouth.up[axis]! * y) as Vector;
    const terminal: (u: number) => { position: Vector; derivative: Vector } =
      (u: number): { position: Vector; derivative: Vector } => {
        if (!(Number.isFinite(u) && u >= 0.2 && u <= 0.8))
          throw new Error("The mentolabial principal lies outside its source-supported central domain");
        const a: [number, number] = basis(u), au: [number, number] = along(u);
        const offset: Vector = inPlane(dot(featureForward, a), dot(featureUp, a));
        const derivative: Vector = inPlane(dot(featureForward, au), dot(featureUp, au));
        return {
          position: mouth.centerMm.map((value: number, axis: number): number =>
            value + width * (mouth.normal[axis]! * (u - 0.5) + offset[axis]!)) as Vector,
          derivative: mouth.normal.map((value: number, axis: number): number =>
            width * (value + derivative[axis]!)) as Vector,
        };
      };
    const lower: HumanSurface.Boundary[] = ["left", "right"].map((side: string): HumanSurface.Boundary => {
      const port: HumanMouthFeatures.LowerPort | undefined = mouth.ports.find(
        (value: HumanMouthFeatures.LowerPort): boolean => value.side === side);
      if (port === undefined) throw new Error("The lower-face family has no actual lower-lip half");
      return port.boundary;
    });
    const top: HumanSurface.Boundary[] = lower.map((edge: HumanSurface.Boundary, side: number): HumanSurface.Boundary => ({
      id: "head.lower-face.mentolabial." + (side === 0 ? "left" : "right") + ".central",
      start: edge.start, end: edge.end, unit: "commissural-chord-fraction",
      evaluate: (u: number): Vector => { admitHalf(u, edge); return terminal(u).position; },
      derivative: (u: number): Vector => { admitHalf(u, edge); return terminal(u).derivative; },
    }));
    if (lower[0]!.start !== 0.2 || lower[0]!.end !== mouth.centerU ||
      lower[1]!.start !== mouth.centerU || lower[1]!.end !== 0.8 ||
      lower.some((edge: HumanSurface.Boundary): boolean => edge.unit !== "commissural-chord-fraction"))
      throw new Error("The lower-face family requires its exact observed central station domains");
    const endpoints: (side: number, u: number) => [Endpoint, Endpoint] = (side: number, u: number): [Endpoint, Endpoint] => {
      const a: Vector = lower[side]!.evaluate(u), au: Vector = lower[side]!.derivative(u);
      const b: Vector = top[side]!.evaluate(u), bu: Vector = top[side]!.derivative(u);
      const delta: Vector = b.map((value: number, axis: number): number => value - a[axis]!) as Vector;
      const deltaU: Vector = bu.map((value: number, axis: number): number => value - au[axis]!) as Vector;
      const chord: number = Math.hypot(...delta), ratio: number = Math.exp(phaseGauge);
      if (!(chord > 0 && Number.isFinite(chord))) throw new Error("The lower-face physical phase gauge has no positive endpoint chord");
      const w: number = chord * ratio, wu: number = dot(delta, deltaU) / chord * ratio;
      const fields: { cross: Vector; crossAlong: Vector }[] = [0, 1].map((index: number): { cross: Vector; crossAlong: Vector } => {
        const value: Vector = inPlane(dot(endpointForward[index]!, basis(u)), dot(endpointUp[index]!, basis(u)));
        const derivative: Vector = inPlane(dot(endpointForward[index]!, along(u)), dot(endpointUp[index]!, along(u)));
        return { cross: value.map((v: number): number => w * v) as Vector,
          crossAlong: value.map((v: number, axis: number): number => wu * v + w * derivative[axis]!) as Vector };
      });
      return [{ position: a, along: au, ...fields[0]! }, { position: b, along: bu, ...fields[1]! }];
    };
    const baseJet: (side: number, u: number, v: number) => Jet = (side: number, u: number, v: number): Jet => {
      if (!(Number.isFinite(u) && u >= lower[side]!.start && u <= lower[side]!.end && Number.isFinite(v) && v >= 0 && v <= 1))
        throw new Error("The lower-face chart lies outside its source-corresponding domain");
      const edges: [Endpoint, Endpoint] = endpoints(side, u), a: Endpoint = edges[0], b: Endpoint = edges[1];
      const h: number[] = [2 * v ** 3 - 3 * v * v + 1, -2 * v ** 3 + 3 * v * v,
        v ** 3 - 2 * v * v + v, v ** 3 - v * v];
      const hv: number[] = [6 * v * v - 6 * v, -6 * v * v + 6 * v, 3 * v * v - 4 * v + 1, 3 * v * v - 2 * v];
      const positionMm: Vector = v === 0 ? a.position : v === 1 ? b.position : a.position.map((value: number, axis: number): number =>
        h[0]! * value + h[1]! * b.position[axis]! + h[2]! * a.cross[axis]! + h[3]! * b.cross[axis]!) as Vector;
      const derivativeU: Vector = v === 0 ? a.along : v === 1 ? b.along : a.along.map((value: number, axis: number): number =>
        h[0]! * value + h[1]! * b.along[axis]! + h[2]! * a.crossAlong[axis]! + h[3]! * b.crossAlong[axis]!) as Vector;
      const derivativeV: Vector = v === 0 ? a.cross : v === 1 ? b.cross : a.position.map((value: number, axis: number): number =>
        hv[0]! * value + hv[1]! * b.position[axis]! + hv[2]! * a.cross[axis]! + hv[3]! * b.cross[axis]!) as Vector;
      if (![positionMm, derivativeU, derivativeV].every((value: Vector): boolean => value.every(Number.isFinite)))
        throw new Error("The lower-face common law has no finite analytic jet");
      return { positionMm, derivativeU, derivativeV };
    };
    const middle: HumanSurface.Boundary = { id: "head.lower-face.middle.central", start: 0, end: 1,
      unit: "normalized-source-crosscourse-phase",
      evaluate: (v: number): Vector => baseJet(0, mouth.centerU, v).positionMm,
      derivative: (v: number): Vector => baseJet(0, mouth.centerU, v).derivativeV };
    boundaries.push(...lower, ...top, middle);
    for (let side: number = 0; side < 2; side++) {
      const name: "left" | "right" = side === 0 ? "left" : "right";
      const id: string = "head.lower-face." + name + ".lower-lip-to-mentolabial.central";
      const jet: (u: number, v: number) => Jet = (u: number, v: number): Jet => {
        const value: Jet = baseJet(side, u, v);
        if (u === mouth.centerU) return { positionMm: middle.evaluate(v),
          derivativeU: value.derivativeU, derivativeV: middle.derivative(v) };
        return value;
      };
      const station: number = side === 0 ? lower[side]!.start : lower[side]!.end;
      const outside: HumanSurface.Boundary = { id: id + ".course", start: 0, end: 1,
        unit: "normalized-source-crosscourse-phase",
        evaluate: (v: number): Vector => jet(station, v).positionMm,
        derivative: (v: number): Vector => jet(station, v).derivativeV };
      boundaries.push(outside);
      patches.push({ id, u: { start: lower[side]!.start, end: lower[side]!.end, unit: "commissural-chord-fraction" },
        v: { start: 0, end: 1, unit: "normalized-source-crosscourse-phase" }, jet, outwardSign: 1,
        boundaries: { u0: { curve: side === 0 ? outside : middle, orientation: 1 },
          u1: { curve: side === 0 ? middle : outside, orientation: 1 },
          v0: { curve: lower[side]!, orientation: 1 }, v1: { curve: top[side]!, orientation: 1 } } });
      mentolabialPorts.push({ side: name, boundary: top[side]!, unitU: "commissural-chord-fraction",
        unitV: "normalized-source-crosscourse-phase",
        transverse: (u: number): { derivativeV: Vector; mixedDerivativeUV: Vector } => {
          const endpoint: Endpoint = endpoints(side, u)[1];
          return { derivativeV: endpoint.cross, mixedDerivativeUV: endpoint.crossAlong };
        } });
    }
    return { patches, boundaries, mentolabialPorts, limitations: [
      "This is an unadopted central external-skin hypothesis, not an oral aperture, vermilion surface, cheek cap or completed chin",
      "Nineteen unique native paths and official full Hermite contour lineages identify the interval; independent named and section fits differ by up to the separately reported source endpoint uncertainty",
      "Observed-principal conditioned cubic shape has position RMS/max 0.580/1.888 mm over 2451 points, with physical directional-jet RMS/max 11.32/42.54 degrees; person-omitted position and direction remain separately reported",
      "The four-scalar mentolabial common principal has pooled RMS/max 3.038/4.505 mm relative to the source commissural frame. With the separate six-scalar lower principal also predicted, the whole family has 2.837/4.605 mm RMS/max. Whole-person omission holds out the same source in all nineteen scalars and has RMS 3.339-4.466 mm, maximum 5.992 mm; none is an unconditioned likeness result",
      "Thirty independent official sagittal courses provide 1820 in-domain points. The fixed whole common-principal family has nearest-shape RMS/max 2.104/4.497 mm and native geometric-normal RMS/max 22.52/50.52 degrees with no opposite normals; 130 points outside the declared central domain remain explicitly unsupported. This is held-course, source-corner-conditioned validation, not independent q or person prediction",
      "The original observations retain their full physical h and both one-sided phase velocities at internal G1 junctions; this regular common cubic does not exactly reproduce every original phase-velocity jump",
      "The supplied lower-lip P/Pu and shared central course are consumed directly. The paired mouth-principal proposal replaces the former artificial central turn by a source-identified symmetric central tangent; the original 1.97-3.65 degree bilateral source turn remains unsupported asymmetry, not averaged source data",
      "A read-only mathematical preflight of four historically exported actual frames has finite positive forward orientation, minimum sampled Jacobian 412.9 square mm, shared-center P/Pv gap zero and normal discrepancy at most 1.71e-6 degrees. This is not a current Human execution, emitted mesh or real-render qualification",
      "Only existing mouth width and existing shared mouth/frame placement drive this hypothesis. Clinical vermilion heights, active mouth opening/laterotrusion, jaw/fold supplements and independent native parameter response remain unsupported",
      "Nasolabial curves do not touch the mouth corners in the existing authority. No invented nasal/cheek/jaw side bridge, native mesh/normal fallback or runtime source data is supplied",
      "Actual generated orientation, skin/construction equality, neighboring domains, full matched camera appearance, independent q changes/interactions/returns and unseen morphology require the main owner's real execution",
    ] };
  }

  const featureForward: readonly number[] = [0.1481945681044176, -0.06533478538214713];
  const featureUp: readonly number[] = [-0.31423820197906494, 0.02723087099880115];
  const phaseGauge: number = 0.027226972801106274;
  const endpointForward: readonly (readonly number[])[] = [
    [-0.5858211769476195, 1.056097582034401], [-0.06381022690333746, -0.4517824732024434],
  ];
  const endpointUp: readonly (readonly number[])[] = [
    [-0.6259705634211752, -0.7286844510218425], [-0.9469547443436883, -0.0058208441677729495],
  ];

  /** Physical vector or coefficient product preserves its declared input units. */
  function dot(a: readonly number[], b: readonly number[]): number {
    return a.reduce((sum: number, value: number, index: number): number => sum + value * b[index]!, 0);
  }

  /** Exact half-domain admission does not extend a source-supported restriction. */
  function admitHalf(u: number, edge: HumanSurface.Boundary): void {
    if (!(Number.isFinite(u) && u >= edge.start && u <= edge.end))
      throw new Error("The mentolabial half lies outside its actual restriction");
  }
}
