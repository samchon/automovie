import { AutoMovieViewJointedCourse } from "@automovie/engine";
import type {
  IAutoMovieViewAxis,
  IAutoMovieViewJointedCourse,
} from "@automovie/interface";

/**
 * The runs of a family's course and the material map that carries a station from one person's course to another's by its run.
 *
 * A course is the engine's jointed axis through its centres (`AutoMovieHumanConicLoft.IFamily.centres`): straight between them and
 * turned at each interior centre over the arclength `2 h` of its half length; its stations are arclength from the first centre, mm. A
 * run is the stretch between two consecutive centres. Its ends on the course are exact (`joints`): 0 at the first centre, the middle of
 * each interior centre's turn (the turn's start plus `h`, from the course's own preparation), and the course's whole arclength at the
 * last. The limb law (`test/src/reference-conics/FamilyConicLimbLaw.ts`, `joints`, `courseLength`) read the interior ends as the
 * course's nearest approach to each centre, which is the same point by the turn's symmetry, and the last as the polyline's length, which
 * is longer than the course by every turn's corner cut; `ends` and `length` keep those readings for comparison.
 *
 * A station keeps its normalized place `tau = (s - start) / (end - start)` within its run when the runs move (`map`); before the first
 * run and past the last it keeps the first or last run's tau, which extends that run's linear map. That map's slope jumps at every run
 * end, so a function composed with it loses its first derivative there. `smooth` is the same carry with the two neighbouring runs'
 * ratios blended over each turn's own window, twice differentiable everywhere. When the runs are the same numbers, both maps are the
 * identity and return their input bit for bit.
 */
export namespace AutoMovieHumanCourseRuns {
  /** A point of the figure's frame, mm. */
  export type V3 = readonly [number, number, number] | readonly number[];

  /** Course stations of the run ends, increasing, mm; at least two. */
  export type IRuns = readonly number[];

  /**
   * A station map that also gives its first two derivatives.
   *
   * @evidence contracts/development/design.md#principled-representation The call keeps every `(station) => station` consumer; `jet` adds the derivatives a composed source function needs for its chain rule.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One call signature and one member.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The derivatives are the map's closed form, never a finite difference.
   * @evidence contracts/development/common.md#meaningful-documentation States units of the value and both derivatives.
   */
  export interface IMap {
    /** The person's station of a reference station, mm. */
    (s: number): number;

    /** `[value mm, first derivative (dimensionless), second derivative per mm]` at a reference station. */
    jet: (s: number) => [number, number, number];
  }

  /**
   * The exact run ends of a jointed course: 0, the middle of every interior centre's turn, and the course's arclength.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The engine's own course preparation dates each turn in arclength; a turn is symmetric about its corner's bisector, so its middle `start + h` is the course's point for that centre, and the course ends one last straight run, less the last set-back, past the last turn.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One preparation and one pass over its turns.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An inadmissible course is refused with the engine's reason; no scan or polyline length stands in.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the centres.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one array.
   */
  export function joints(centres: readonly V3[], halves: readonly number[]): number[] {
    const course: IAutoMovieViewJointedCourse.ICourse | string = AutoMovieViewJointedCourse.prepare(
      centres.map((c: V3): [number, number, number] => [c[0]!, c[1]!, c[2]!]),
      halves,
    );
    if (typeof course === "string") throw new Error("course runs: " + course);
    const turns: IAutoMovieViewJointedCourse.ITurn[] = course.turns;
    const last: IAutoMovieViewJointedCourse.ITurn | undefined = turns.at(-1);
    const end: number = last === undefined ? course.lengths[0]! : last.start + 2 * last.half + course.lengths.at(-1)! - last.setback;
    return [0, ...turns.map((turn: IAutoMovieViewJointedCourse.ITurn): number => turn.start + turn.half), end];
  }

  /** The quintic smoothstep's integral from 0: `5 t^4 / 2 - 3 t^5 + t^6`, which is 5/64 at a half and 1/2 at one. */
  const lift = (t: number): number => t * t * t * t * (2.5 + t * (-3 + t));

  /** Half of a turn window's blend that falls on the far side of its joint, as a share of the window's half length: 5/32. */
  const SHARE: number = 5 / 32;

  /**
   * The twice differentiable material map from one course's runs to another's. Each run has one ratio; across the window `[J - h, J + h]`
   * of an interior run end `J` the ratio turns from the run before to the run after by the quintic smoothstep, so the map's first and
   * second derivatives are continuous everywhere. The ratios are solved so every run end goes to its run end exactly: run `i` of length
   * `L` holds its own ratio `k_i` and loses `5 h / 32` of the difference to each neighbour across each of its windows,
   * `L' = k_i L + (k_(i-1) - k_i) 5 h_i / 32 + (k_(i+1) - k_i) 5 h_(i+1) / 32`, a tridiagonal system. A knot inside a window is carried by
   * the blended map, not by its run's tau alone; outside the windows the map is its run's linear carry at the solved ratio. Equal runs
   * return the shared identity.
   *
   * @param from The reference run ends, mm.
   * @param to The person's run ends, mm.
   * @param halves The half length of each interior run end's window on the reference course, mm: the turn's own half length.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The derivative is the two run ratios blended by `10 t^3 - 15 t^4 + 6 t^5`, whose first two derivatives vanish at both window ends; its integral is closed form, and the ratios follow from the run lengths by the Thomas sweep.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One solve at creation; each read finds its run or window and evaluates one polynomial.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Overlapping windows, mismatched runs and a nonpositive solved ratio (a map that would not be monotone) are refused; nothing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear solve in the run count; constant work per read after a linear run search.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Equal runs share one identity; otherwise the solved ratios serve value and jet.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure retains the two run arrays, the halves and the ratios.
   */
  export function smooth(from: IRuns, to: IRuns, halves: readonly number[]): IMap {
    const n: number = from.length - 1;
    if (n < 1 || from.length !== to.length || halves.length !== n - 1) throw new Error("smooth material map needs matching run ends and one window per interior end");
    for (const runs of [from, to])
      if (!runs.every((s: number, k: number): boolean => Number.isFinite(s) && (k === 0 || s > runs[k - 1]!)))
        throw new Error("smooth material map run ends must be finite and increasing");
    if (!halves.every((h: number): boolean => Number.isFinite(h) && h >= 0)) throw new Error("smooth material map windows must be finite and nonnegative");
    if (from.every((s: number, k: number): boolean => Object.is(s, to[k]))) return identity;

    // The window of interior end i (between runs i - 1 and i) has half length h[i]; h[0] and h[n] are the course's ends, without one.
    const h: number[] = [0, ...halves, 0];
    const L: number[] = from.slice(1).map((s: number, i: number): number => s - from[i]!);
    for (let i: number = 0; i < n; ++i) if (!(h[i]! + h[i + 1]! <= L[i]!)) throw new Error("smooth material map windows overlap in run " + i);

    // Tridiagonal rows: lower k_(i-1), diagonal k_i, upper k_(i+1) = the person's run length.
    const lower: number[] = L.map((_: number, i: number): number => SHARE * h[i]!);
    const upper: number[] = L.map((_: number, i: number): number => SHARE * h[i + 1]!);
    const diagonal: number[] = L.map((length: number, i: number): number => length - lower[i]! - upper[i]!);
    const k: number[] = to.slice(1).map((s: number, i: number): number => s - to[i]!);
    for (let i: number = 1; i < n; ++i) {
      const f: number = lower[i]! / diagonal[i - 1]!;
      diagonal[i] = diagonal[i]! - f * upper[i - 1]!;
      k[i] = k[i]! - f * k[i - 1]!;
    }
    for (let i: number = n - 1; i >= 0; --i) k[i] = (k[i]! - (i + 1 < n ? upper[i]! * k[i + 1]! : 0)) / diagonal[i]!;
    if (!k.every((ratio: number): boolean => Number.isFinite(ratio) && ratio > 0)) throw new Error("smooth material map is not monotone: a run's solved ratio is not positive");
    const a: number[] = [...from];
    const b: number[] = [...to];
    const jet = (s: number): [number, number, number] => {
      let run: number = 0;
      while (run < n - 1 && s > a[run + 1]!) ++run;

      // The window at this run's start or end, when the station lies in one.
      const end: number = s - a[run]! < h[run]! ? run : a[run + 1]! - s < h[run + 1]! ? run + 1 : -1;
      if (end < 1 || end > n - 1) return [b[run]! + k[run]! * (s - a[run]!) + (run > 0 ? SHARE * h[run]! * (k[run - 1]! - k[run]!) : 0), k[run]!, 0];
      const w: number = h[end]!;
      const t: number = (s - a[end]! + w) / (2 * w);
      const [before, after]: [number, number] = [k[end - 1]!, k[end]!];
      const blend: number = t * t * t * (10 + t * (-15 + 6 * t));
      return [
        b[end]! + before * (s - a[end]!) + (after - before) * 2 * w * (lift(t) - lift(0.5)),
        before + (after - before) * blend,
        ((after - before) * 30 * t * t * (1 - t) * (1 - t)) / (2 * w),
      ];
    };
    return Object.assign((s: number): number => jet(s)[0], { jet });
  }

  /**
   * The polyline length through the course's centres, mm: the last centre's station by this module's definition.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Sums the straight segment lengths, the definition the limb law used for its last run end.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the centres.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A course with fewer than two centres or a nonfinite length is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the centre count.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure sum coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one number and retains nothing.
   */
  export function length(centres: readonly V3[]): number {
    if (centres.length < 2) throw new Error("a course needs at least two centres");
    let total: number = 0;
    for (let k: number = 1; k < centres.length; ++k)
      total += Math.hypot(
        centres[k]![0]! - centres[k - 1]![0]!,
        centres[k]![1]! - centres[k - 1]![1]!,
        centres[k]![2]! - centres[k - 1]![2]!,
      );
    if (!(Number.isFinite(total) && total > 0)) throw new Error("course length is not finite and positive");
    return total;
  }

  /**
   * The course station nearest a point: a scan every millimetre from 0 to `to`, refined by 60 golden-section steps within the best
   * millimetre either side. A definition, not a tuned search: the limb law's `nearest`, which read f1's limb sites.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The station minimizing the course origin's distance to the point on [0, to], a unimodal refinement around the best millimetre.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scan and one golden-section bracket.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A nonfinite point or length is refused rather than clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms ceil(to) + 1 axis reads for the scan and 120 for the refinement.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure query coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond its scalar result.
   */
  export function nearest(axis: IAutoMovieViewAxis.IAxis, to: number, p: V3): number {
    if (![to, p[0], p[1], p[2]].every((x: number | undefined): boolean => Number.isFinite(x)))
      throw new Error("nearest course station needs a finite point and length");
    const d = (s: number): number => {
      const o: readonly number[] = axis.at(s).origin;
      return Math.hypot(o[0]! - p[0]!, o[1]! - p[1]!, o[2]! - p[2]!);
    };
    let best: number = 0;
    for (let s: number = 0; s <= to; s += 1) if (d(s) < d(best)) best = s;
    let a: number = Math.max(0, best - 1);
    let b: number = Math.min(to, best + 1);
    for (let i: number = 0; i < 60; ++i) {
      const m1: number = a + (b - a) * 0.382;
      const m2: number = a + (b - a) * 0.618;
      if (d(m1) < d(m2)) b = m2;
      else a = m1;
    }
    return (a + b) / 2;
  }

  /**
   * The run ends of a course: 0 at its first centre, the nearest approach to every interior centre, the polyline length at the last.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each interior run end is the course station nearest its centre, the limb law's `joints`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One `nearest` per interior centre.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Run ends that do not increase are refused, since tau is undefined on an empty run.
   * @evidence contracts/development/implementation.md#efficient-algorithms One scan of the course per interior centre.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one bounded array.
   */
  export function ends(axis: IAutoMovieViewAxis.IAxis, centres: readonly V3[]): number[] {
    const total: number = length(centres);
    const out: number[] = centres.map((c: V3, k: number): number =>
      k === 0 ? 0 : k === centres.length - 1 ? total : nearest(axis, total, c),
    );
    if (!out.every((s: number, k: number): boolean => k === 0 || s > out[k - 1]!))
      throw new Error("course run ends must increase");
    return out;
  }

  /**
   * A station's run and its normalized place in it: the run whose end it does not pass (the first run before the course, the last past
   * it) and `tau = (s - start) / (end - start)`.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The run index and tau of the limb law's `carry`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One linear walk over the run ends.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Fewer than two ends or a nonfinite station is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the run count.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure query coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns two numbers.
   */
  export function place(s: number, runs: IRuns): { run: number; tau: number } {
    if (runs.length < 2 || !Number.isFinite(s)) throw new Error("a run place needs a finite station and two run ends");
    let run: number = 0;
    while (run < runs.length - 2 && s > runs[run + 1]!) ++run;
    return { run, tau: (s - runs[run]!) / (runs[run + 1]! - runs[run]!) };
  }

  /**
   * The material map from one course's runs to another's: each station keeps its run and its tau. Equal runs return the identity, which
   * gives back its input bit for bit, so a person at the reference's lengths keeps every reference station exactly.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Piecewise-linear by run, the limb law's accepted station law (#3151 step 2): a segment's length moves its far joint and the knots of its run follow by tau.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One closure over the two run arrays.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unequal run counts and non-increasing runs are refused; no clamp or extrapolation policy other than the end runs' own linear maps.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear admission; each read is linear in the run count.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The identity case returns one shared identity closure instead of a reconstruction.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure retains copies of the two run arrays only.
   */
  export function map(from: IRuns, to: IRuns): (s: number) => number {
    if (from.length < 2 || from.length !== to.length)
      throw new Error("material map needs matching run ends");
    for (const runs of [from, to])
      if (!runs.every((s: number, k: number): boolean => Number.isFinite(s) && (k === 0 || s > runs[k - 1]!)))
        throw new Error("material map run ends must be finite and increasing");
    if (from.every((s: number, k: number): boolean => Object.is(s, to[k]))) return identity;
    const a: number[] = [...from];
    const b: number[] = [...to];
    return (s: number): number => {
      const { run, tau } = place(s, a);
      return b[run]! + tau * (b[run + 1]! - b[run]!);
    };
  }

  /** The identity station map, shared by every unchanged course: its input bit for bit, slope one, no bend. */
  export const identity: IMap = Object.assign((s: number): number => s, { jet: (s: number): [number, number, number] => [s, 1, 0] });

  /**
   * The first station of `from + k step` (k = 0, 1, ...) not past `to` at which `read` is greatest (`pick` 1) or least (`pick` -1); a
   * later equal value does not replace an earlier one. A sampled definition of a site such as the widest calf girth.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The limb law's `extreme`, read at the same millimetre grid from the run's start so f1's sites are reproduced.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scan.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A nonfinite reading is never selected; a window without one finite reading is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms (to - from) / step + 1 reads.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure scan coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond its scalar result.
   */
  export function extreme(read: (s: number) => number, from: number, to: number, step: number, pick: 1 | -1): number {
    if (![from, to, step].every(Number.isFinite) || !(step > 0) || to < from)
      throw new Error("extreme needs a finite ordered window and a positive step");
    let best: number | null = null;
    let value: number = NaN;
    for (let s: number = from; s <= to; s += step) {
      const v: number = read(s);
      if (!Number.isFinite(v)) continue;
      if (best === null || pick * v > pick * value) {
        best = s;
        value = v;
      }
    }
    if (best === null) throw new Error("extreme found no finite reading in its window");
    return best;
  }
}
