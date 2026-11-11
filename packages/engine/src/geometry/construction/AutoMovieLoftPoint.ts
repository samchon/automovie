import { AutoMovieLoftCapRead } from "./AutoMovieLoftCapRead";
import { AutoMovieLoftChain } from "./AutoMovieLoftChain";
import { AutoMovieLoftCoefficientSource } from "./AutoMovieLoftCoefficientSource";
import { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import { AutoMovieLoftRelief } from "./AutoMovieLoftRelief";
import { AutoMovieLoftSection } from "./AutoMovieLoftSection";
import { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";
import { AutoMovieStationHermite } from "./AutoMovieStationHermite";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";

/**
 * Value-only loft station samplers and the existing bounded lazy point cache.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Public readers state physical units, immutable source equivalence and bounded cache lifetime.
 * @evidence contracts/development/design.md#principled-representation Represents Value-only loft station samplers and the existing bounded lazy point cache: companion namespace of 8 members (`sampler`, `point`, `phaseSampler`, `lazy`, `RECENT`, `SAMPLERS`, ...); units and frames named in its text: world, local, frame, radians, radian. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieLoftPoint` in packages/engine/src/geometry/construction/AutoMovieLoftPoint.ts; its surface is the 8 members listed and the text shows 2 other files naming it, mostly packages/engine (1), packages/human (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieLoftPoint {
  /**
   * World point of the chain at station s as a function of phase.
   *
   * The section, plane and lift of a station cost as much as the whole chain's
   * order, so a caller reading a station at many separate phases takes them
   * from here rather than through {@link AutoMovieLoftChain.ring} one phase at a time.
   *
   * @param chain Chain to evaluate.
   * @param s Station within the chain; world height for horizontal layers.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads a validated original cap directly, or the station's explicit local field/legacy basis with its actual frame/lift/relief owners; the original collapsed tip supplies only its actual phase-constant value.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One prepared value sampler serves many phases without rebuilding its station data.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the existing phase, lift-normal and relief arithmetic; actual source fields are validated by their owning readers.
   * @evidence contracts/development/common.md#meaningful-documentation States station/phase units, borrowed immutable chain data and caller-owned returned vectors.
   * @evidence contracts/development/implementation.md#efficient-algorithms Native source validation/scalar lookup and fixed geometry, or O(N) legacy coefficients, are prepared once; a native phase uses one numeric inverse, while lift keeps its existing basis support.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the station's frame and prepared arrays across every requested phase.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned closure retains the immutable chain, including its source owners, and one station's prepared arrays/frame until its caller releases it; no cache is added here.
   */
  export function sampler(
    chain: IAutoMovieLoftChain,
    s: number,
  ): (t: number) => [number, number, number] {
    const cap: ReturnType<typeof AutoMovieLoftCapRead.phase> =
      AutoMovieLoftCapRead.phase(chain, s);
    if (cap !== null) return (t: number): [number, number, number] => cap(t).p;
    const source: ReturnType<typeof AutoMovieLoftSection.phase> =
      AutoMovieLoftSection.phase(chain, s);
    const c: number[] | null =
      source === null ? AutoMovieLoftChain.coefficients(chain, s) : null;
    const f: AutoMovieLoftFrame.IFrame = AutoMovieLoftChain.frame(chain, s);

    // A lifted section leaves its plane along the frame normal by the
    // spline of its lift values, evaluated as the x block of a section
    // whose z block repeats it.
    const l: number[] | null = AutoMovieLoftChain.lift(chain, s);
    const lifted: number[] | null = l === null ? null : [...l, ...l];
    const n: [number, number, number] = normal(f);

    return (t: number): [number, number, number] => {
      const p: readonly number[] =
        source === null
          ? AutoMovieLoftChain.section(chain, c!, t)
          : source(t).p;
      const q: [number, number, number] = AutoMovieLoftFrame.place(
        f,
        p[0]!,
        p[1]!,
      );
      if (lifted !== null) {
        const h: number = AutoMovieSplineCurve.evaluate(
          lifted,
          chain.order,
          t,
        )[0];
        for (let k: number = 0; k < 3; k++) q[k]! += h * n[k]!;
      }
      // Reliefs move the base point along their axes.
      for (const relief of chain.reliefs ?? []) {
        const d: number = AutoMovieLoftRelief.height(relief, s, t)[0];
        if (d === 0) continue;
        const e: [number, number, number] = AutoMovieLoftRelief.direction(
          relief,
          t,
        )[0];
        for (let k: number = 0; k < 3; k++) q[k]! += d * e[k]!;
      }
      if (source !== null && !q.every(Number.isFinite))
        throw new Error("The actual native point has no finite world value.");
      return q;
    };
  }

  /**
   * One world point of the chain at station s and phase t. Readers of single
   * points (a strip's columns, a trim loop's rim, a difference across a
   * loop) meet the same few stations again and again, so the samplers of the
   * last {@link RECENT} stations read per chain are kept; a chain is never
   * changed once built, so a kept sampler stays its station's.
   *
   * @param chain Chain to evaluate.
   * @param s Station within the chain.
   * @param t Phase in radians.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reuses a station sampler under the immutable chain identity; spline controls are combined lazily with the same explicit coefficient interpolation as the eager reader.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The original eight-insertion sampler cache owns single-point reuse in this one module.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves legacy arithmetic, nonpromoting hits, insertion/eviction and fresh vectors; explicit native data alone selects the actual field and raw phases reach its own wrapping owner.
   * @evidence contracts/development/common.md#meaningful-documentation States immutable chain/cache equivalence and station-mm/phase-radian units; only explicit surviving original ends authorize cap values beyond principal rows.
   * @evidence contracts/development/implementation.md#efficient-algorithms Native misses use the value-only source sampler including validation/scalar lookup; source-absent spline misses retain O(N) holey rows/bitmap and at most four new control combinations per phase.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the same last eight inserted station preparations without promoting hits.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A weak chain key owns at most eight O(N) sampler records; eviction releases a record and returned points are fresh.
   */
  export function point(
    chain: IAutoMovieLoftChain,
    s: number,
    t: number,
  ): [number, number, number] {
    let kept:
      | { s: number; at: (t: number) => [number, number, number] }[]
      | undefined = SAMPLERS.get(chain);
    if (kept === undefined) SAMPLERS.set(chain, (kept = []));
    for (const entry of kept) if (entry.s === s) return entry.at(t);
    const at: (t: number) => [number, number, number] =
      chain.basis === "spline" && !AutoMovieLoftSection.present(chain)
        ? lazy(chain, s)
        : sampler(chain, s);
    kept.unshift({ s, at });
    if (kept.length > RECENT) kept.pop();
    return at(t);
  }

  /**
   * Actual world value and phase tangent without physical station2 admission.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same explicit local field or legacy basis as sampler, its frame value and the actual lift/relief phase derivatives.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One caller-owned station closure serves numerical-station normal consumers independently of analytic station jets.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No missing physical derivative is inferred and neither eight-station module cache receives this plan.
   * @evidence contracts/development/common.md#meaningful-documentation Returns fresh world p/t in mm and mm per radian on regular rows or validated original caps; a collapsed original tip is phase-constant but has no asserted physical station jet.
   * @evidence contracts/development/implementation.md#efficient-algorithms One local value/frame/lift preparation precedes each fixed native inverse or existing basis phase lookup.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The closure shares its prepared station geometry, frame and lift across phases.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller alone retains this plan until release; every result owns fresh vectors and no new module cache exists.
   */
  export function phaseSampler(
    chain: IAutoMovieLoftChain,
    s: number,
  ): (t: number) => {
    p: [number, number, number];
    t: [number, number, number];
  } {
    const cap: ReturnType<typeof AutoMovieLoftCapRead.phase> =
      AutoMovieLoftCapRead.phase(chain, s);
    if (cap !== null) return cap;
    const source: ReturnType<typeof AutoMovieLoftSection.phase> =
      AutoMovieLoftSection.phase(chain, s);
    const c: number[] | null =
      source === null ? AutoMovieLoftChain.coefficients(chain, s) : null;
    const f: AutoMovieLoftFrame.IFrame = AutoMovieLoftChain.frame(chain, s);
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
        const h: [number, number, number, number] =
          AutoMovieSplineCurve.evaluate(lifted, chain.order, t);
        for (let k: number = 0; k < 3; k++) {
          p[k]! += h[0] * n[k]!;
          dt[k]! += h[2] * n[k]!;
        }
      }
      for (const relief of chain.reliefs ?? []) {
        const h: [number, number, number] = AutoMovieLoftRelief.height(
          relief,
          s,
          t,
        );
        const [e, e1] = AutoMovieLoftRelief.direction(relief, t);
        for (let k: number = 0; k < 3; k++) {
          p[k]! += h[0] * e[k]!;
          dt[k]! += h[2] * e[k]! + h[0] * e1[k]!;
        }
      }
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
   * {@link AutoMovieLoftChain.coefficients} and {@link AutoMovieLoftChain.lift} write for the whole row, entry by
   * entry, so every point is the sampler's to the bit.
   */
  function lazy(
    chain: IAutoMovieLoftChain,
    s: number,
  ): (t: number) => [number, number, number] {
    const layers: readonly IAutoMovieLoftChain.ILayer[] = chain.layers;
    const [lo, hi]: [number, number] = AutoMovieLoftChain.bracket(chain, s);
    const a: IAutoMovieLoftChain.ILayer = layers[lo]!;
    const b: IAutoMovieLoftChain.ILayer = layers[hi]!;
    const H: number = b.y - a.y;
    const u: number = Math.min(1, Math.max(0, (s - a.y) / H));
    const f: AutoMovieLoftFrame.IFrame = AutoMovieLoftChain.frame(chain, s);
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
    const source: AutoMovieLoftCoefficientSource.IControls | null =
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
    const lifting: ((k: number) => number) | null = !layers.some(
      (l: IAutoMovieLoftChain.ILayer): boolean => l.lift !== undefined,
    )
      ? null
      : entry(
          (k: number): number => (a.lift !== undefined ? a.lift[k]! : 0),
          (k: number): number => (a.lift !== undefined ? a.liftSlopes![k]! : 0),
          a.liftCurvatures,
          (k: number): number => (b.lift !== undefined ? b.lift[k]! : 0),
          (k: number): number => (b.lift !== undefined ? b.liftSlopes![k]! : 0),
          b.liftCurvatures,
        );

    // The row and the doubled lift, filled where a phase reads them.
    const c: number[] = new Array<number>(2 * N);
    const lifted: number[] | null =
      lifting === null ? null : new Array<number>(2 * N);
    const filled: Uint8Array = new Uint8Array(N);
    const fill: (j: number) => void = (j: number): void => {
      if (filled[j] === 1) return;
      c[j] = section(j);
      c[N + j] = section(N + j);
      if (lifted !== null) {
        const h: number = lifting!(j);
        lifted[j] = h;
        lifted[N + j] = h;
      }
      filled[j] = 1;
    };
    return (t: number): [number, number, number] => {
      // The four controls `AutoMovieSplineCurve.evaluate` reads at t.
      const i: number = Math.min(
        N - 1,
        Math.floor(((((t / (2 * Math.PI)) % 1) + 1) % 1) * N),
      );
      if (Number.isInteger(i))
        for (let d: number = -1; d <= 2; d++) fill((i + d + N) % N);
      const p: [number, number, number, number] = AutoMovieSplineCurve.evaluate(
        c,
        N,
        t,
      );
      const q: [number, number, number] = AutoMovieLoftFrame.place(
        f,
        p[0],
        p[1],
      );
      if (lifted !== null) {
        const h: number = AutoMovieSplineCurve.evaluate(lifted, N, t)[0];
        for (let k: number = 0; k < 3; k++) q[k]! += h * n[k]!;
      }
      // Reliefs move the base point along their axes.
      for (const relief of chain.reliefs ?? []) {
        const d: number = AutoMovieLoftRelief.height(relief, s, t)[0];
        if (d === 0) continue;
        const e: [number, number, number] = AutoMovieLoftRelief.direction(
          relief,
          t,
        )[0];
        for (let k: number = 0; k < 3; k++) q[k]! += d * e[k]!;
      }
      return q;
    };
  }

  /** Stations whose samplers {@link point} keeps per chain. */
  const RECENT: number = 8;

  /** The kept samplers, by chain. */
  const SAMPLERS: WeakMap<
    IAutoMovieLoftChain,
    { s: number; at: (t: number) => [number, number, number] }[]
  > = new WeakMap();

  /** One coefficient in the unchanged left-associated Hermite combination order. */
  function scalar(
    a: AutoMovieStationHermite.IEnd,
    b: AutoMovieStationHermite.IEnd,
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
  function normal(f: AutoMovieLoftFrame.IFrame): [number, number, number] {
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
