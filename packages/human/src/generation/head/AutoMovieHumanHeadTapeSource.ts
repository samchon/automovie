import {
  AutoMovieLoftSectionNative,
  AutoMovieLoftViewSource,
  AutoMovieSolidVector,
  measureAutoMovieCurveLength64,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanHeadTapeSource,
  IAutoMovieHumanHeadTapeStation,
  IAutoMovieLoftViewRead,
  IAutoMovieLoftViewSource,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanHeadTapeStation } from "./AutoMovieHumanHeadTapeStation";

/**
 * Actual oblique head-tape courses on the original native generating field.
 *
 * The authored upright frame uses +X anterior, +Y superior and +Z left.
 * A permitted plane is Y=a+bX, b>=0: front higher, without side tilt.
 * This owner measures a specified regular plane; anatomical course search
 * and public-input closure belong to HeadTape, not to a horizontal proxy.
 *
 * @evidence contracts/common.md#principled-implementation Reads original supports/fullness and actual frame jets, implicitly differentiates the specified plane/source intersection and integrates its world derivative through the engine's shared curve-length owner.
 * @evidence contracts/common.md#clear-and-simple-design Original admission, a plane record and its source-course reader are separate from anatomical maximum search.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no mesh, polyline tape, fitted tilt, private loft or unavailable derivative replacement; singular/nonfinite course premises fail explicitly.
 * @evidence contracts/common.md#meaningful-documentation States anatomical frame, physical units, permitted plane family, transversality and numerical quadrature limits.
 * @evidence contracts/performance.md#efficient-algorithms Each source admits once; bounded bracketed point solves precede one actual source2 read per quadrature query. Horizontal courses need only phase values.
 * @evidence contracts/performance.md#reuse-equivalent-work All planes borrow the same admitted original source; point-only inversion shares the two exact endpoint station readers and the selected physical jet supplies the point and both partials together.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Readers retain one actual part and its original scalar preparations. A measure prepares at most two endpoint readers and holds only scalar interior bracket data.
 */
export namespace AutoMovieHumanHeadTapeSource {
  /**
   * Admit the actual complete original field once, without lofting.
   *
   * @evidence contracts/common.md#principled-implementation Uses the same public original-source admission as the native geometry reader.
   * @evidence contracts/common.md#clear-and-simple-design One reader retains its exact part and scalar preparations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Girth-only or failed direct sources are refused instead of replaced.
   * @evidence contracts/common.md#meaningful-documentation Admission does not imply that every proposed oblique course is regular.
   * @evidence contracts/performance.md#efficient-algorithms Original scalar admission is linear in declared knot populations.
   * @evidence contracts/performance.md#reuse-equivalent-work Subsequent course queries reuse the admitted scalar preparations.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns caller-owned source references without global retention.
   */
  export function of(
    part: IAutoMovieViewPart,
  ): IAutoMovieHumanHeadTapeSource.IReader {
    const admitted: IAutoMovieLoftViewSource.IResult | null =
      AutoMovieLoftViewSource.create(part);
    if (admitted === null || admitted.source === null)
      throw new Error(
        `Head tape has no admitted direct original source: ${part.name}`,
      );
    return { part, source: admitted.source };
  }

  /**
   * Construct a plane from actual anterior/posterior original points.
   *
   * @evidence contracts/common.md#principled-implementation Actual phase0 and pi source points define the sagittal plane; equal heights produce the horizontal member explicitly.
   * @evidence contracts/common.md#clear-and-simple-design One plane record supplies all subsequent phase queries.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses invalid source stations, reversed heights or nonpositive sagittal span instead of moving anchors.
   * @evidence contracts/common.md#meaningful-documentation The authored head frame, physical heights and front-higher premise are explicit.
   * @evidence contracts/performance.md#efficient-algorithms Two native value queries and constant scalar arithmetic.
   * @evidence contracts/performance.md#reuse-equivalent-work Both queries borrow the same admitted original reader.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns fixed-size numeric data only.
   */
  export function plane(
    reader: IAutoMovieHumanHeadTapeSource.IReader,
    front: number,
    back: number,
  ): IAutoMovieHumanHeadTapeSource.IPlane {
    if (
      !(
        Number.isFinite(front) &&
        Number.isFinite(back) &&
        front >= back &&
        back >= reader.source.domain[0] &&
        front <= reader.source.domain[1]
      )
    )
      throw new Error(
        "Head tape needs ordered original stations inside its domain",
      );
    return preparePlane(reader, front)(back);
  }

  /** Fix the original front anchor for a bounded posterior search. */
  export function preparePlane(
    reader: IAutoMovieHumanHeadTapeSource.IReader,
    front: number,
  ): (back: number) => IAutoMovieHumanHeadTapeSource.IPlane {
    if (
      !(
        Number.isFinite(front) &&
        front >= reader.source.domain[0] &&
        front <= reader.source.domain[1]
      )
    )
      throw new Error(
        "Head tape needs ordered original stations inside its domain",
      );
    const p: AutoMovieVector3Tuple = AutoMovieHumanHeadTapeStation.prepare(
      reader,
      front,
    ).point(0);
    return (back: number): IAutoMovieHumanHeadTapeSource.IPlane => {
      if (!(Number.isFinite(back) && back >= reader.source.domain[0] && back <= front))
        throw new Error(
          "Head tape needs ordered original stations inside its domain",
        );
      const q: AutoMovieVector3Tuple = AutoMovieHumanHeadTapeStation.prepare(
        reader,
        back,
      ).point(Math.PI);
      if (!(p[0] > q[0] && p[1] >= q[1]))
        throw new Error(
          "Head tape has no front-higher positive sagittal anchor span",
        );
      const b: number = (p[1] - q[1]) / (p[0] - q[0]);
      return { a: p[1] - b * p[0], b, front: [...p], back: q, range: [back, front] };
    };
  }

  /**
   * Read the actual regular course and its analytic implicit tangent.
   *
   * @evidence contracts/common.md#principled-implementation The exact plane residual selects an original source station; total differentiation gives ds/dphi=-(Pphi.y-b*Pphi.x)/(Ps.y-b*Ps.x), then P'=Pphi+Ps*ds/dphi.
   * @evidence contracts/common.md#clear-and-simple-design Value-only station solving precedes one physical source2/frame read; a horizontal member needs phase geometry only.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No finite differences, missing derivative, sampled replacement field or out-of-domain cap extension supplies the tangent.
   * @evidence contracts/common.md#meaningful-documentation Requires a finite positive station-plane derivative and reports unresolved source roots explicitly; this is not a global intersection certificate.
   * @evidence contracts/performance.md#efficient-algorithms At most48 safeguarded secant/bisection queries and one native physical2 read; a horizontal course has constant work.
   * @evidence contracts/performance.md#reuse-equivalent-work The final physical read supplies the original point and both partial derivatives together.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Numerical scratch and all returned vectors belong to the call; no course cache survives.
   */
  export function at(
    reader: IAutoMovieHumanHeadTapeSource.IReader,
    plane: IAutoMovieHumanHeadTapeSource.IPlane,
    phase: number,
  ): IAutoMovieHumanHeadTapeSource.IReading {
    return course(
      reader,
      plane,
      phase,
      AutoMovieHumanHeadTapeStation.create(reader),
    );
  }

  /** Use one original station jet once the point-only inverse selects its station. */
  function course(
    reader: IAutoMovieHumanHeadTapeSource.IReader,
    plane: IAutoMovieHumanHeadTapeSource.IPlane,
    phase: number,
    sources: IAutoMovieHumanHeadTapeStation.IOutput,
  ): IAutoMovieHumanHeadTapeSource.IReading {
    const station: number = locate(plane, phase, sources.point);
    if (plane.b === 0) {
      const original: IAutoMovieHumanHeadTapeStation.IReading = sources.value(
        station,
        phase,
      );
      return {
        station,
        point: original.point,
        derivative: AutoMovieHumanHeadTapeStation.vector(
          original.frame,
          original.local.t,
        ),
      };
    }
    const inputs: IAutoMovieLoftViewRead.IJets | string = sources.jets(station);
    const frame:
      | ReturnType<NonNullable<IAutoMovieViewPart["axis"]["jet"]>>
      | undefined = reader.part.axis.jet?.(station);
    if (typeof inputs === "string" || frame === null || frame === undefined)
      throw new Error(
        `Head tape physical source/frame derivative unavailable: ${typeof inputs === "string" ? inputs : station}`,
      );
    const local: ReturnType<ReturnType<typeof AutoMovieLoftSectionNative.jet>> =
      AutoMovieLoftSectionNative.jet(inputs)(phase);
    const point: AutoMovieVector3Tuple = AutoMovieSolidVector.add(
      AutoMovieHumanHeadTapeStation.vector(frame.value, local.p),
      frame.value.origin,
    );
    const turn: AutoMovieVector3Tuple = AutoMovieHumanHeadTapeStation.vector(
      frame.value,
      local.t,
    );
    const along: AutoMovieVector3Tuple = frame.first.origin.map(
      (x: number, i: number): number =>
        x +
        frame.first.u[i]! * local.p[0] +
        frame.value.u[i]! * local.s[0] +
        frame.first.v[i]! * local.p[1] +
        frame.value.v[i]! * local.s[1],
    ) as AutoMovieVector3Tuple;
    const denominator: number = along[1] - plane.b * along[0];
    if (!(denominator > 0 && Number.isFinite(denominator)))
      throw new Error(
        "Head tape plane is not a regular positively oriented source loop",
      );
    const rate: number = -(turn[1] - plane.b * turn[0]) / denominator;
    const derivative: AutoMovieVector3Tuple = turn.map(
      (x: number, i: number): number => x + rate * along[i]!,
    ) as AutoMovieVector3Tuple;
    if (!derivative.every(Number.isFinite))
      throw new Error("Head tape has a nonfinite original world tangent");
    return { station, point, derivative };
  }

  /**
   * Integrate the actual source spans with the shared engine rule.
   *
   * @evidence contracts/common.md#principled-implementation Integrates the actual world-mm tangent norm in its radian chart using the engine's existing K/2K Gauss-Legendre owner.
   * @evidence contracts/common.md#clear-and-simple-design Original knot-plane crossings split the four phase quarters before quadrature; length and K/2K difference remain separate observations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither the difference nor a specified-course length is a global maximum or interval error certificate.
   * @evidence contracts/common.md#meaningful-documentation Returns mm and preserves all original source/root/derivative failures.
   * @evidence contracts/performance.md#efficient-algorithms N original knot planes use bounded native phase inversions, then the resulting O(N) pieces use the shared K/2K quadrature policy and at's source-query bound.
   * @evidence contracts/performance.md#reuse-equivalent-work Every derivative query borrows the same actual source and plane. The two exact endpoint Point0 preparations are shared across phases and each selected station supplies a single physical section read.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The synchronous measure prepares its declared endpoints and holds an active bracket of scalar station and residual values.
   */
  export function measure(
    reader: IAutoMovieHumanHeadTapeSource.IReader,
    plane: IAutoMovieHumanHeadTapeSource.IPlane,
    subdivisions: number = 1,
  ): IAutoMovieHumanHeadTapeSource.MeasureResult {
    const sites: number[] = AutoMovieHumanHeadTapeStation.partition(
      reader,
      plane,
    );

    const sources: IAutoMovieHumanHeadTapeStation.IOutput =
      AutoMovieHumanHeadTapeStation.create(
        reader,
        plane.b === 0 ? [plane.range[0], plane.range[0]] : plane.range,
      );

    return measureAutoMovieCurveLength64(
      sites
        .slice(1)
        .map(
          (
            high: number,
            index: number,
          ): Parameters<typeof measureAutoMovieCurveLength64>[0][number] => ({
            domain: [sites[index]!, high],
            derivative: (phase: number): AutoMovieVector3Tuple =>
              course(reader, plane, phase, sources).derivative,
          }),
        ),
      subdivisions,
    );
  }

  /** Safeguarded value-only plane inverse, preserving exact original anchor stations. */
  function locate(
    plane: IAutoMovieHumanHeadTapeSource.IPlane,
    phase: number,
    readPoint: (
      station: number,
      phi: number,
    ) => IAutoMovieHumanHeadTapeStation.IValue,
  ): number {
    if (plane.b === 0) return plane.range[0];
    const angle: number =
      ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    if (angle === 0) return plane.range[1];
    if (angle === Math.PI) return plane.range[0];
    const residual = (station: number): number => {
      const { point } = readPoint(station, phase);
      return point[1] - plane.a - plane.b * point[0];
    };
    let low: number = plane.range[0];
    let high: number = plane.range[1];
    let a: number = residual(low);
    let b: number = residual(high);
    if (a === 0) return low;
    if (b === 0) return high;
    if (!(a < 0 && b > 0))
      throw new Error(
        "Head tape phase does not bracket its original plane intersection",
      );
    const allowance: number =
      32 *
      Number.EPSILON *
      Math.max(
        1,
        Math.abs(plane.a),
        Math.abs(plane.front[1]),
        Math.abs(plane.back[1]),
      );
    // Illinois regula falsi (Dowell and Jarratt, BIT 11, 1971) on the sign
    // bracket: each step is the false-position point of the two ends, and an
    // end kept for a second consecutive step has its stored residual halved.
    // It replaces the former secant with a forced bisection on every fourth
    // step. Both keep the bracket and stop at the same residual allowance;
    // Illinois converges superlinearly at this simple root, so each course
    // node needs fewer native section preparations. Only the halved weight
    // differs from the true residual; every accepted station is still
    // checked on its own actual residual.
    let weightLow: number = a;
    let weightHigh: number = b;
    let kept: -1 | 0 | 1 = 0;
    for (let iteration: number = 0; iteration < 48; iteration++) {
      let middle: number =
        low - (weightLow * (high - low)) / (weightHigh - weightLow);
      if (!(middle > low && middle < high)) middle = (low + high) / 2;
      if (!(middle > low && middle < high)) break;
      const at: number = residual(middle);
      if (Math.abs(at) <= allowance) return middle;
      if (at < 0) {
        low = middle;
        a = at;
        weightLow = at;
        if (kept === 1) weightHigh /= 2;
        kept = 1;
      } else {
        high = middle;
        b = at;
        weightHigh = at;
        if (kept === -1) weightLow /= 2;
        kept = -1;
      }
    }
    if (Math.min(Math.abs(a), Math.abs(b)) <= allowance)
      return Math.abs(a) < Math.abs(b) ? low : high;
    throw new Error(
      "Head tape original plane inverse did not resolve within its numerical budget",
    );
  }
}
