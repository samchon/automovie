import { evaluateAutoMovieBernstein64, type IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";
import type { HumanCurveFamily } from "../internal/HumanCurveFamily";

/** Common eight-piece vector-section authority in the physical source gauge.
 * Common source-frame law, not an accepted skeleton/port adapter. Generated
 * quartics preserve their own endpoint positions and separate physical jets.
 * Original source cubics, widths and one-sided corners remain in the evidence.
 */
export namespace HumanTrunkFeatureLaw {
  type V = HumanCurveFamily.Vector;
  type S = readonly [number, number, number];

  /** Exact derivatives in physical Y and one normalized feature-arc t. */
  export interface LocalJet {
    /** Position, mm. */
    positionMm: V;
    /** dP/dY at fixed local t, mm/mm. */
    derivativeY: V;
    /** dP/dt, mm per normalized local parameter. */
    derivativeT: V;
    /** d²P/dY², inverse mm. */
    derivativeYY: V;
    /** d²P/(dY dt), per normalized local parameter. */
    derivativeYT: V;
    /** d²P/dt², mm per normalized local parameter squared. */
    derivativeTT: V;
    /** d³P/(dY dt²), per normalized local parameter squared. */
    derivativeYTT: V;
  }

  /** Explicit quotient between physical phase, feature address and local t. */
  export interface PhaseMap {
    /** Fixed address psi=2*pi*(arc+t)/8, radians; not geometric polar angle. */
    featureRadians: number;
    /** Physical p, dp/dY and d²p/dY² at fixed local t, in mm chart units. */
    physicalPhaseJetMm: S;
    /** Normalized physical-phase radians phi=2*pi*p/L. */
    physicalRadians: number;
    /** dphi/dt, radians per normalized local parameter. */
    physicalRadiansPerLocal: number;
    /** dphi/dY at fixed t, radians/mm. */
    physicalRadiansStationDerivative: number;
    /** d²phi/dY² at fixed t, radians/mm². */
    physicalRadiansStationSecondDerivative: number;
    /** d²phi/(dY dt), radians/mm per normalized local parameter. */
    physicalRadiansStationLocalDerivative: number;
    /** dt/dphi at fixed Y, inverse radians. */
    localPerPhysicalRadian: number;
    /** dt/dY at fixed normalized physical radians, inverse mm. */
    localStationAtFixedPhysicalRadians: number;
    /** d²t/dY² at fixed normalized physical radians, inverse mm squared. */
    localStationSecondAtFixedPhysicalRadians: number;
    /** dt/dpsi at fixed Y, inverse fixed-feature radians. */
    localPerFeatureRadian: number;
  }

  /** Coefficients and station derivatives at one generated section.
   * evaluateRadians uses the complete moving physical partition. featureSide
   * selects an exact side without epsilon perturbation or jet averaging.
   */
  export interface Section {
    /** One complete generated quartic authority with physical phase widths. */
    primitive: C.Bernstein;
    /** First coefficient variation per physical station mm. */
    firstCoefficientFields: readonly (readonly V[])[];
    /** Second coefficient variation per station mm squared. */
    secondCoefficientFields: readonly (readonly V[])[];
    /** Each arc's W, dW/dY and d²W/dY². */
    physicalWidthJets: readonly S[];
    /** Shared moving node geometry and separately retained physical side jets. */
    featureTraces: readonly FeatureTrace[];
    /** Source-support-normalized coordinate (Y-pelvisY)/nativeHip. */
    mu: number;
    /** Observation metadata, not a clamp or a support certificate. */
    withinObservedMuEnvelope: boolean;
    /** Same node's generated lower-crease event and current tangent class. */
    posteriorEvent: Event;
    /** Branch analytic surface jet using the moving physical partition; an exact join selects its following side. */
    evaluateRadians: (phaseRadians: number) => HumanCurveFamily.Jet;
    /** Exact selected endpoint side; no epsilon query or tangent average. */
    featureSide: (index: number, side: "left" | "right") => HumanCurveFamily.Jet;
    /** Exact local-arc derivatives for eight separate surface patches. */
    localJet: (index: number, t: number) => LocalJet;
    /** Fixed feature-address radians psi, with following side at an exact join. */
    featureJet: (featureRadians: number) => HumanCurveFamily.Jet;
    /** Exact selected side in fixed feature-address radians, not polar angle. */
    featureAddressSide: (index: number, side: "left" | "right") => HumanCurveFamily.Jet;
    /** Declared forward/inverse physical-phase quotient at a local feature address. */
    phaseMap: (index: number, t: number) => PhaseMap;
  }

  /** One declared event in the common longitudinal graph. */
  export interface Event {
    /** Approximate generated C0/G1 class endpoint, mm; not anatomical extinction. */
    deathStationMm: number;
    /** Class of the supplied side jets at this section. */
    featureClass: "C0" | "G1";
  }

  /** Full owner-supplied fields; each outer array is value, first, second. */
  export interface Fields {
    /** Eight shared node position fields, in mm and their station units. */
    positions: readonly (readonly V[])[];
    /** Eight incoming physical phase tangent fields and their station jets. */
    left: readonly (readonly V[])[];
    /** Eight outgoing physical phase tangent fields and their station jets. */
    right: readonly (readonly V[])[];
    /** Eight quartic bubble vector fields, in mm and their station units. */
    bubbles: readonly (readonly V[])[];
    /** Eight positive physical phase width fields, mm and their station jets. */
    widths: readonly S[];
    /** Common support-normalized source coordinate. */
    mu: number;
    /** Explicit observed-envelope metadata supplied by the generating owner. */
    withinObservedMuEnvelope: boolean;
    /** Approximate class event supplied by the owner; source qualification is separate. */
    posteriorEvent: Event;
  }

  /** Same endpoint/width authority with actual arc-middle position fields. */
  export interface MidpointFields extends Omit<Fields, "bubbles"> {
    /** Actual P(Y,t=.5) on each original feature restriction, with exact Y jets.
     * This is independently identified from full source shape and continuity;
     * it is neither an endpoint average nor a material/anatomical landmark.
     */
    midpoints: readonly (readonly V[])[];
  }

  /** Derive all bubbles from the shared intermediate curve and endpoint jets.
   * The exact identity B=16C-8P0-8P1-2WTr+2WTl preserves the complete quartic,
   * physical sides, native widths and degree13 station-product authority.
   * Existing handle/sum and fromFields remain the sole coefficient owner.
   */
  export function fromMidpoints(fields: MidpointFields): Section {
    for (const field of [fields.positions, fields.left, fields.right, fields.midpoints])
      if (field.length !== 3 || field.some((row: readonly V[]): boolean => row.length !== 8 ||
        row.some((p: V): boolean => p.length !== 3 || !p.every(Number.isFinite))))
        throw new Error("Complete endpoint and actual intermediate curve jets required");
    if (fields.widths.length !== 8 || fields.widths.some((w: S): boolean =>
      w.length !== 3 || !w.every(Number.isFinite) || w[0] <= 0))
      throw new Error("Eight positive physical width jets required");
    const bubbles: V[][] = [[], [], []];
    for (let i: number = 0; i < 8; i++) for (let order: number = 0; order < 3; order++) {
      const next: number = (i + 1) % 8;
      const start: V = handle(fields.widths[i]!, fields.right[0]![i]!, fields.right[1]![i]!, fields.right[2]![i]!, order);
      const end: V = handle(fields.widths[i]!, fields.left[0]![next]!, fields.left[1]![next]!, fields.left[2]![next]!, order);
      bubbles[order]!.push(midpointBubble(fields.midpoints[order]![i]!, fields.positions[order]![i]!,
        fields.positions[order]![next]!, start, end, sum));
    }
    return fromFields({ ...fields, bubbles });
  }

  interface FeatureTrace {
    /** Shared physical node position, mm. */
    positionMm: V;
    /** Node-trace derivative per station mm. */
    longitudinalDerivative: V;
    /** Node-trace second derivative per station mm squared. */
    longitudinalSecondDerivative: V;
    /** Incoming physical phase derivative, mm/mm. */
    leftPhysicalDerivative: V;
    /** Outgoing physical phase derivative, mm/mm. */
    rightPhysicalDerivative: V;
  }

  /** Derive the full bubble from one actual intermediate curve and physical handles.
   * The same linear expression consumes physical vector jets or complete powers.
   * It preserves the t=.5 identity without averaging endpoints or dropping terms.
   */
  export function midpointBubble<T>(midpoint: T, start: T, end: T, outgoingHandle: T, incomingHandle: T,
    linear: (values: readonly T[], weights: readonly number[]) => T): T {
    return linear([midpoint, start, end, outgoingHandle, incomingHandle], [16, -8, -8, -2, 2]);
  }

  /** Assemble the full quartic through the same coefficient authority.
   * Handles include the actual positive physical width. The callback retains
   * its vector or polynomial unit and every original coefficient power.
   */
  export function assemble<T>(start: T, end: T, outgoingHandle: T, incomingHandle: T, bubble: T,
    linear: (values: readonly T[], weights: readonly number[]) => T): T[] {
    return [start, linear([start, outgoingHandle], [1, .25]),
      linear([start, end, outgoingHandle, incomingHandle, bubble], [.5, .5, 1 / 6, -1 / 6, 1 / 6]),
      linear([end, incomingHandle], [1, -.25]), end];
  }

  /** Assemble an owning whole-vector field into the same curve authority.
   * The full-family owner supplies shared internal values and both station
   * derivatives. Recursive restriction never refits or bridges a boundary.
   */
  export function fromFields(fields: Fields): Section {
    const { positions, left, right, bubbles, widths }: Fields = fields;
    for (const field of [positions, left, right, bubbles]) {
      if (field.length !== 3 || field.some((row: readonly V[]): boolean => row.length !== 8 ||
        row.some((p: V): boolean => p.length !== 3 || !p.every(Number.isFinite))))
        throw new Error("Eight complete value/first/second vector fields required");
    }
    if (widths.length !== 8 || widths.some((w: S): boolean => w.length !== 3 ||
      !w.every(Number.isFinite) || w[0] <= 0)) throw new Error("Eight positive physical width jets required");
    const coefficients: V[][][] = [[], [], []];
    for (let i: number = 0; i < 8; i++) {
      const next: number = (i + 1) % 8;
      const w: S = widths[i]!;
      for (let order: number = 0; order < 3; order++) {
        const startJet: V = handle(w, right[0]![i]!, right[1]![i]!, right[2]![i]!, order);
        const endJet: V = handle(w, left[0]![next]!, left[1]![next]!, left[2]![next]!, order);
        const p0: V = positions[order]![i]!;
        const p1: V = positions[order]![next]!;
        coefficients[order]!.push(assemble(p0, p1, startJet, endJet, bubbles[order]![i]!, sum));
      }
    }
    const primitive: C.Bernstein = {
      type: "bernstein", name: "trunk.feature-vector", closed: true,
      unit: "mm", phaseUnit: "mm", phaseIntervals: widths.map((w: S): number => w[0]),
      pieces: coefficients[0]!.map((controls: readonly V[]): C.Piece => ({
        primitive: "polynomialBezier", degree: 4, controls,
      })),
    };
    const total: S = [0, 1, 2].map((order: number): number =>
      widths.reduce((a: number, w: S): number => finite(a + w[order]!), 0)) as unknown as S;
    const local: (i: number, t: number) => LocalJet = (i: number, t: number): LocalJet => {
      if (!Number.isInteger(i) || i < 0 || i >= 8 || !Number.isFinite(t) || t < 0 || t > 1)
        throw new Error("One admitted feature arc and normalized local parameter required");
      return {
        positionMm: value(coefficients[0]![i]!, t, 0),
        derivativeY: value(coefficients[1]![i]!, t, 0),
        derivativeT: value(coefficients[0]![i]!, t, 1),
        derivativeYY: value(coefficients[2]![i]!, t, 0),
        derivativeYT: value(coefficients[1]![i]!, t, 1),
        derivativeTT: value(coefficients[0]![i]!, t, 2),
        derivativeYTT: value(coefficients[1]![i]!, t, 2),
      };
    };
    const feature: (i: number, t: number) => HumanCurveFamily.Jet = (
      i: number, t: number,
    ): HumanCurveFamily.Jet => {
      const j: LocalJet = local(i, t);
      const a: number = 8 / (2 * Math.PI);
      return {
        positionMm: j.positionMm, longitudinalDerivative: j.derivativeY,
        phaseDerivativeMmPerRadian: sum([j.derivativeT], [a]),
        longitudinalPhaseDerivativePerRadian: sum([j.derivativeYT], [a]),
        longitudinalSecondDerivative: j.derivativeYY,
        phaseSecondDerivativeMmPerRadianSquared: sum([j.derivativeTT], [a * a]),
        longitudinalPhaseSecondDerivativePerRadianSquared: sum([j.derivativeYTT], [a * a]),
      };
    };
    const evaluate: (i: number, t: number, lambda: number) => HumanCurveFamily.Jet = (
      i: number, t: number, lambda: number,
    ): HumanCurveFamily.Jet => {
      const cumulative: S = [0, 1, 2].map((order: number): number =>
        widths.slice(0, i).reduce((a: number, w: S): number => a + w[order]!, 0)) as unknown as S;
      const w: S = widths[i]!;
      const ts: number = (lambda * total[1] - cumulative[1] - t * w[1]) / w[0];
      const tss: number = (lambda * total[2] - cumulative[2] - t * w[2] - 2 * ts * w[1]) / w[0];
      const a: number = total[0] / (2 * Math.PI * w[0]);
      const as: number = (total[1] * w[0] - total[0] * w[1]) / (2 * Math.PI * w[0] ** 2);
      const p: V = value(coefficients[0]![i]!, t, 0);
      const pt: V = value(coefficients[0]![i]!, t, 1);
      const ptt: V = value(coefficients[0]![i]!, t, 2);
      const pttt: V = value(coefficients[0]![i]!, t, 3);
      const py: V = value(coefficients[1]![i]!, t, 0);
      const pyt: V = value(coefficients[1]![i]!, t, 1);
      const pytt: V = value(coefficients[1]![i]!, t, 2);
      const pyy: V = value(coefficients[2]![i]!, t, 0);
      return {
        positionMm: p,
        longitudinalDerivative: sum([py, pt], [1, ts]),
        phaseDerivativeMmPerRadian: sum([pt], [a]),
        longitudinalPhaseDerivativePerRadian: sum([pyt, ptt, pt], [a, ts * a, as]),
        longitudinalSecondDerivative: sum([pyy, pyt, ptt, pt], [1, 2 * ts, ts * ts, tss]),
        phaseSecondDerivativeMmPerRadianSquared: sum([ptt], [a * a]),
        longitudinalPhaseSecondDerivativePerRadianSquared: sum([pytt, pttt, ptt], [a * a, ts * a * a, 2 * a * as]),
      };
    };
    return {
      primitive, firstCoefficientFields: coefficients[1]!, secondCoefficientFields: coefficients[2]!,
      physicalWidthJets: widths, mu: fields.mu,
      localJet: local,
      featureJet: (psi: number): HumanCurveFamily.Jet => {
        finite(psi);
        const address: number = (((psi / (2 * Math.PI)) % 1 + 1) % 1) * 8;
        const i: number = Math.floor(address);
        return feature(i, address - i);
      },
      featureAddressSide: (i: number, side: "left" | "right"): HumanCurveFamily.Jet => {
        if (!Number.isInteger(i) || i < 0 || i >= 8 || !["left", "right"].includes(side))
          throw new Error("Exact feature index and side required");
        return side === "right" ? feature(i, 0) : feature((i + 7) % 8, 1);
      },
      phaseMap: (i: number, t: number): PhaseMap => {
        if (!Number.isInteger(i) || i < 0 || i >= 8 || !Number.isFinite(t) || t < 0 || t > 1)
          throw new Error("Exact feature arc and local parameter required");
        const w: S = widths[i]!;
        const p: S = [0, 1, 2].map((order: number): number => finite(
          widths.slice(0, i).reduce((s: number, v: S): number => s + v[order]!, 0) + t * w[order]!,
        )) as unknown as S;
        const lambda: number = p[0] / total[0];
        const ts: number = (lambda * total[1] - p[1]) / w[0];
        return {
          featureRadians: 2 * Math.PI * (i + t) / 8,
          physicalPhaseJetMm: p, physicalRadians: 2 * Math.PI * lambda,
          physicalRadiansPerLocal: 2 * Math.PI * w[0] / total[0],
          physicalRadiansStationDerivative: 2 * Math.PI * (p[1] / total[0] - p[0] * total[1] / total[0] ** 2),
          physicalRadiansStationSecondDerivative: 2 * Math.PI * (p[2] / total[0] -
            p[0] * total[2] / total[0] ** 2 - 2 * p[1] * total[1] / total[0] ** 2 + 2 * p[0] * total[1] ** 2 / total[0] ** 3),
          physicalRadiansStationLocalDerivative: 2 * Math.PI * (w[1] / total[0] - w[0] * total[1] / total[0] ** 2),
          localPerPhysicalRadian: total[0] / (2 * Math.PI * w[0]),
          localStationAtFixedPhysicalRadians: ts,
          localStationSecondAtFixedPhysicalRadians: (lambda * total[2] - p[2] - 2 * ts * w[1]) / w[0],
          localPerFeatureRadian: 8 / (2 * Math.PI),
        };
      },
      withinObservedMuEnvelope: fields.withinObservedMuEnvelope,
      posteriorEvent: fields.posteriorEvent,
      featureTraces: positions[0]!.map((p: V, i: number): FeatureTrace => ({
        positionMm: p, longitudinalDerivative: positions[1]![i]!,
        longitudinalSecondDerivative: positions[2]![i]!,
        leftPhysicalDerivative: left[0]![i]!, rightPhysicalDerivative: right[0]![i]!,
      })),
      evaluateRadians: (phaseRadians: number): HumanCurveFamily.Jet => {
        finite(phaseRadians);
        const lambda: number = ((phaseRadians / (2 * Math.PI)) % 1 + 1) % 1;
        const phase: number = lambda * total[0];
        let cumulative: number = 0;
        for (let i: number = 0; i < 8; i++) {
          const width: number = widths[i]![0];
          if (phase < cumulative + width || i === 7)
            return evaluate(i, (phase - cumulative) / width, lambda);
          cumulative += width;
        }
        throw new Error("Unreachable physical partition");
      },
      featureSide: (index: number, side: "left" | "right"): HumanCurveFamily.Jet => {
        if (!Number.isInteger(index) || index < 0 || index >= 8 || !["left", "right"].includes(side))
          throw new Error("Exact feature index and side required");
        const lambda: number = widths.slice(0, index).reduce((s: number, w: S): number => s + w[0], 0) / total[0];
        return side === "right" ? evaluate(index, 0, lambda)
          : evaluate((index + 7) % 8, 1, index === 0 ? 1 : lambda);
      },
    };
  }

  function handle(w: S, t: V, dt: V, ddt: V, order: number): V {
    return order === 0 ? sum([t], [w[0]]) : order === 1
      ? sum([t, dt], [w[1], w[0]]) : sum([t, dt, ddt], [w[2], 2 * w[1], w[0]]);
  }

  function vector(x: number, y: number, z: number): V {
    return [finite(x), finite(y), finite(z)];
  }

  function sum(values: readonly V[], weights: readonly number[]): V {
    return [0, 1, 2].map((axis: number): number => finite(values.reduce(
      (s: number, v: V, i: number): number => s + v[axis]! * weights[i]!, 0,
    ))) as unknown as V;
  }

  function finite(x: number): number {
    if (!Number.isFinite(x)) throw new Error("Nonfinite trunk feature arithmetic");
    return x;
  }

  /** Differentiate coefficients algebraically; evaluation reuses the engine.
   * No source restriction, degree reduction or numerical difference is used.
   */
  function value(controls: readonly V[], t: number, order: number): V {
    let c: readonly V[] = controls;
    for (let i: number = 0; i < order; i++) {
      const degree: number = c.length - 1;
      c = c.slice(1).map((p: V, j: number): V => sum([p, c[j]!], [degree, -degree]));
    }
    const result: C.Vector = evaluateAutoMovieBernstein64({
      primitive: "polynomialBezier", degree: c.length - 1, controls: c,
    }, t).point;
    return vector(result[0], result[1], result[2]);
  }
}
