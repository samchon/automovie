import type {
  IAutoMovieLoftChain,
  IAutoMovieLoftCoefficientSource,
  IAutoMovieLoftPhaseReading,
  IAutoMovieLoftSectionFrame,
  IAutoMovieLoftSectionPhase,
  IAutoMovieStationHermite,
} from "@automovie/interface";

import { AutoMovieLoftCapRead } from "./AutoMovieLoftCapRead";
import { AutoMovieLoftChain } from "./AutoMovieLoftChain";
import { AutoMovieLoftCoefficientSource } from "./AutoMovieLoftCoefficientSource";
import { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import { AutoMovieLoftReliefCompose } from "./AutoMovieLoftReliefCompose";
import { AutoMovieLoftSection } from "./AutoMovieLoftSection";
import { AutoMovieLoftSectionOriginal } from "./AutoMovieLoftSectionOriginal";
import { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";
import { AutoMovieStationHermite } from "./AutoMovieStationHermite";

/** World-point phase reader for one physical station. */
type Point = (phase: number) => [number, number, number];

/** Value-only loft station samplers with fixed, phase-local spline support. */
export namespace AutoMovieLoftPoint {
  /** Prepare a chain's Point0 for queries of its immutable original fields. */
  export function prepare(
    chain: IAutoMovieLoftChain,
    sections: ReturnType<typeof AutoMovieLoftSection.prepare>,
    caps: ReturnType<typeof AutoMovieLoftCapRead.prepare>,
    dense: boolean = false,
  ): (station: number) => Point {
    if (
      !dense &&
      chain.basis === "spline" &&
      !AutoMovieLoftSection.present(chain)
    ) {
      const lifts: boolean = hasLift(chain);
      return (station: number): Point => lazy(chain, station, lifts);
    }
    return (station: number): Point => sample(chain, station, sections, caps);
  }

  /**
   * World point of the chain at station s as a function of phase.
   *
   * The section, plane and lift of a station cost as much as the whole chain's
   * order, so a caller reading a station at many separate phases takes them
   * from here rather than through {@link AutoMovieLoftChain.ring} one phase at a
   * time.
   *
   * @param chain Chain to evaluate.
   * @param s Station within the chain; world height for horizontal layers.
   */
  export function sampler(chain: IAutoMovieLoftChain, s: number): Point {
    return sample(chain, s);
  }

  /**
   * Prepare the section and its phase-independent world placement for one
   * station.
   */
  function sample(
    chain: IAutoMovieLoftChain,
    s: number,
    sections?: ReturnType<typeof AutoMovieLoftSection.prepare>,
    caps?: ReturnType<typeof AutoMovieLoftCapRead.prepare>,
  ): Point {
    const cap: ((phi: number) => IAutoMovieLoftPhaseReading) | null =
      caps === undefined ? AutoMovieLoftCapRead.phase(chain, s) : caps.phase(s);
    if (cap !== null) return (t: number): [number, number, number] => cap(t).p;
    const original = AutoMovieLoftSectionOriginal.active(
      chain.originalSection,
      s,
    )
      ? chain.originalSection!
      : undefined;
    const source: ((phi: number) => IAutoMovieLoftSectionPhase) | null =
      original !== undefined
        ? null
        : sections === undefined
          ? AutoMovieLoftSection.phase(chain, s)
          : sections.phase(s);
    const c: number[] | null =
      source === null && original === undefined
        ? AutoMovieLoftChain.coefficients(chain, s)
        : null;
    const f: IAutoMovieLoftSectionFrame = AutoMovieLoftChain.frame(chain, s);

    // A lifted section leaves its plane along the frame normal by the
    // spline of its lift values, evaluated as the x block of a section
    // whose z block repeats it.
    const l: number[] | null = AutoMovieLoftChain.lift(chain, s);
    const lifted: number[] | null = l === null ? null : [...l, ...l];
    const n: [number, number, number] = normal(f);

    return (t: number): [number, number, number] => {
      const p: readonly number[] =
        original !== undefined
          ? original.point(s, t)
          : source === null
            ? AutoMovieLoftChain.section(chain, c!, t)
            : source(t).p;
      const q: [number, number, number] = AutoMovieLoftFrame.place(
        f,
        p[0]!,
        p[1]!,
      );
      if (lifted !== null) {
        const h: number = AutoMovieSplineCurve.scalarJet(
          lifted,
          chain.order,
          t,
        )[0];
        for (let k: number = 0; k < 3; k++) q[k]! += h * n[k]!;
      }
      AutoMovieLoftReliefCompose.point(q, chain.reliefs ?? [], s, t);
      if (
        (source !== null || original !== undefined) &&
        !q.every(Number.isFinite)
      )
        throw new Error("The actual native point has no finite world value.");
      return q;
    };
  }

  /**
   * One world point at station s and phase t. Sparse spline queries combine
   * only the controls active at the requested phase.
   *
   * @param chain Chain to evaluate.
   * @param s Station within the chain.
   * @param t Phase in radians.
   */
  export function point(
    chain: IAutoMovieLoftChain,
    s: number,
    t: number,
  ): [number, number, number] {
    const at: Point =
      chain.basis === "spline" && !AutoMovieLoftSection.present(chain)
        ? lazy(chain, s, hasLift(chain))
        : sampler(chain, s);
    return at(t);
  }

  /** Actual world value and phase tangent without physical station2 admission. */
  export function phaseSampler(
    chain: IAutoMovieLoftChain,
    s: number,
  ): IAutoMovieLoftChain.IPhaseSamplerResult {
    const cap: ((phi: number) => IAutoMovieLoftPhaseReading) | null =
      AutoMovieLoftCapRead.phase(chain, s);
    if (cap !== null) return cap;
    const source: ((phi: number) => IAutoMovieLoftSectionPhase) | null =
      AutoMovieLoftSection.phase(chain, s);
    const c: number[] | null =
      source === null ? AutoMovieLoftChain.coefficients(chain, s) : null;
    const f: IAutoMovieLoftSectionFrame = AutoMovieLoftChain.frame(chain, s);
    const n: [number, number, number] = normal(f);
    const l: number[] | null = AutoMovieLoftChain.lift(chain, s);
    const lifted: number[] | null = l === null ? null : [...l, ...l];
    return (
      t: number,
    ): { p: [number, number, number]; t: [number, number, number] } => {
      const local: { p: readonly number[]; t: readonly number[] } =
        source === null ? legacyPhase(chain, c!, t) : source(t);
      const p: [number, number, number] = AutoMovieLoftFrame.place(
        f,
        local.p[0]!,
        local.p[1]!,
      );
      const dt: [number, number, number] = [0, 0, 0];
      for (let k: number = 0; k < 3; k++)
        dt[k] = f.u[k]! * local.t[0]! + f.v[k]! * local.t[1]!;
      if (lifted !== null) {
        const h: [number, number, number] = AutoMovieSplineCurve.scalarJet(
          lifted,
          chain.order,
          t,
        );
        for (let k: number = 0; k < 3; k++) {
          p[k]! += h[0] * n[k]!;
          dt[k]! += h[1] * n[k]!;
        }
      }
      AutoMovieLoftReliefCompose.phase({ p, t: dt }, chain.reliefs ?? [], s, t);
      if (![...p, ...dt].every(Number.isFinite))
        throw new Error("The actual phase-only world reading is nonfinite.");
      return { p, t: dt };
    };
  }

  /**
   * A spline chain's {@link sampler} whose section and lift controls are
   * combined only as its phases read them: a uniform cubic B-spline reads four
   * controls per coordinate at a phase, so a Newton step or a foot search that
   * meets a new station at a phase or two pays for those few controls instead
   * of the whole row. Each control is the same Hermite combination
   * {@link AutoMovieLoftChain.coefficients} and {@link AutoMovieLoftChain.lift}
   * write for the whole row, entry by entry, so every point is the sampler's to
   * the bit.
   */
  function lazy(chain: IAutoMovieLoftChain, s: number, lifts: boolean): Point {
    const layers: readonly IAutoMovieLoftChain.ILayer[] = chain.layers;
    const [lo, hi]: [number, number] = AutoMovieLoftChain.bracket(chain, s);
    const a: IAutoMovieLoftChain.ILayer = layers[lo]!;
    const b: IAutoMovieLoftChain.ILayer = layers[hi]!;
    const H: number = b.y - a.y;
    const u: number = Math.min(1, Math.max(0, (s - a.y) / H));
    const f: IAutoMovieLoftSectionFrame = AutoMovieLoftChain.frame(chain, s);
    const n: [number, number, number] = normal(f);
    const N: number = chain.order;

    // One entry of the row, as `hermite` combines it.
    const entry: Entry = (
      av: (k: number) => number,
      am: (k: number) => number,
      ac: readonly number[] | undefined,
      bv: (k: number) => number,
      bm: (k: number) => number,
      bc: readonly number[] | undefined,
    ): ((k: number) => number) => {
      if (ac !== undefined && bc !== undefined) {
        const w: number[] = AutoMovieStationHermite.weights(u, H, 0, true);
        return (k: number): number =>
          w[0]! * av(k) +
          w[1]! * am(k) +
          w[2]! * ac[k]! +
          w[3]! * bc[k]! +
          w[4]! * bm(k) +
          w[5]! * bv(k);
      }
      const h00: number = 2 * u ** 3 - 3 * u ** 2 + 1;
      const h10: number = u ** 3 - 2 * u ** 2 + u;
      const h01: number = -2 * u ** 3 + 3 * u ** 2;
      const h11: number = u ** 3 - u ** 2;
      return (k: number): number =>
        h00 * av(k) + h10 * H * am(k) + h01 * bv(k) + h11 * H * bm(k);
    };
    const source: IAutoMovieLoftCoefficientSource.IControls | null =
      AutoMovieLoftCoefficientSource.controls(chain, s);
    const weights: readonly number[] | undefined =
      source === null
        ? undefined
        : AutoMovieLoftCoefficientSource.weights(source, 0);
    const section: Pick =
      source === null
        ? entry(
            (k: number): number => a.coefficients[k]!,
            (k: number): number => a.slopes[k]!,
            a.curvatures,
            (k: number): number => b.coefficients[k]!,
            (k: number): number => b.slopes[k]!,
            b.curvatures,
          )
        : (k: number): number => scalar(source.a, source.b, weights!, k);
    const lifting: Pick | null = lifts
      ? entry(
          (k: number): number => (a.lift !== undefined ? a.lift[k]! : 0),
          (k: number): number => (a.lift !== undefined ? a.liftSlopes![k]! : 0),
          a.liftCurvatures,
          (k: number): number => (b.lift !== undefined ? b.lift[k]! : 0),
          (k: number): number => (b.lift !== undefined ? b.liftSlopes![k]! : 0),
          b.liftCurvatures,
        )
      : null;
    return (t: number): [number, number, number] => {
      const p: [number, number, number, number] = AutoMovieSplineCurve.evaluate(
        section,
        N,
        t,
      );
      const q: [number, number, number] = AutoMovieLoftFrame.place(
        f,
        p[0],
        p[1],
      );
      if (lifting !== null) {
        const h: number = AutoMovieSplineCurve.scalarJet(lifting, N, t)[0];
        for (let k: number = 0; k < 3; k++) q[k]! += h * n[k]!;
      }
      AutoMovieLoftReliefCompose.point(q, chain.reliefs ?? [], s, t);
      return q;
    };
  }

  /** Whether any station can carry the loft's out-of-plane lift. */
  function hasLift(chain: IAutoMovieLoftChain): boolean {
    return chain.layers.some(
      (layer: IAutoMovieLoftChain.ILayer): boolean => layer.lift !== undefined,
    );
  }

  /** One coefficient in the unchanged left-associated Hermite combination order. */
  function scalar(
    a: IAutoMovieStationHermite.IEnd,
    b: IAutoMovieStationHermite.IEnd,
    w: readonly number[],
    k: number,
  ): number {
    return (
      w[0]! * a.value[k]! +
      w[1]! * a.slope[k]! +
      (a.curvature === undefined ? 0 : w[2]! * a.curvature[k]!) +
      (b.curvature === undefined ? 0 : w[3]! * b.curvature[k]!) +
      w[4]! * b.slope[k]! +
      w[5]! * b.value[k]!
    );
  }

  /** Unit normal `v x u` of a section frame: up for a horizontal frame. */
  function normal(f: IAutoMovieLoftSectionFrame): [number, number, number] {
    return [
      f.v[1] * f.u[2] - f.v[2] * f.u[1],
      f.v[2] * f.u[0] - f.v[0] * f.u[2],
      f.v[0] * f.u[1] - f.v[1] * f.u[0],
    ];
  }
}

/** Preserve the actual legacy basis value and first phase derivative. */
function legacyPhase(
  chain: IAutoMovieLoftChain,
  coefficients: number[],
  phase: number,
): { p: [number, number]; t: [number, number] } {
  const q: [number, number, number, number] = AutoMovieLoftChain.section(
    chain,
    coefficients,
    phase,
  );
  return { p: [q[0], q[1]], t: [q[2], q[3]] };
}

/** One lazily read control component. */
type Pick = (k: number) => number;

/** Existing cubic/quintic endpoint-reader preparation. */
type Entry = (
  av: Pick,
  am: Pick,
  ac: readonly number[] | undefined,
  bv: Pick,
  bm: Pick,
  bc: readonly number[] | undefined,
) => Pick;
