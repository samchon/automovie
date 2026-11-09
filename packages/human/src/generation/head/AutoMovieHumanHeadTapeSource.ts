import {
  AutoMovieLoftSectionNative,
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
  type IAutoMovieViewPart,
  measureAutoMovieCurveLength64,
} from "@automovie/engine";
import { AutoMovieHumanHeadTapeStation } from "./AutoMovieHumanHeadTapeStation";

/** Physical world-mm vector in the authored upright head frame. */
type Vec3 = [number, number, number];

/** One numerical trial and the exact source used at that station. */
interface ILocated {
  /** Actual selected physical station, calibration mm. */
  station: number;

  /** Present after numerical inversion; exact anchors request their own station directly. */
  source?: AutoMovieHumanHeadTapeStation.IPrepared;
}

/** An original plane residual and its same-trial numeric source. */
interface IResidual {
  /** Actual world-plane residual, calibration mm. */
  value: number;

  /** Exact scalar/native station used to compute that residual. */
  source: AutoMovieHumanHeadTapeStation.IPrepared;
}

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
 * @evidence contracts/performance.md#reuse-equivalent-work All planes borrow the same admitted original source; point-only inversion shares the two exact endpoint station readers and carries its selected trial into the final phase read.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Readers retain one actual part and its original scalar preparations; a measure retains at most two endpoints plus its active bracket and no arbitrary trial-station map or global cache.
 */
export namespace AutoMovieHumanHeadTapeSource {
  /**
   * Same actual mass and admitted complete original scalar family.
   *
   * @evidence contracts/common.md#principled-implementation Keeps generating supports, fullness and actual frame owner together.
   * @evidence contracts/common.md#clear-and-simple-design Two references supply the original reader.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No retained principal section or mesh replaces the original definition.
   * @evidence contracts/common.md#meaningful-documentation Source station and world coordinates use calibration mm.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no work.
   * @evidence contracts/performance.md#reuse-equivalent-work Every course borrows this admitted source.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the part and prepared scalar dependencies.
   */
  export interface IReader {
    /** Identical original mass, calibration mm. */
    part: IAutoMovieViewPart;
    /** Its admitted signed scalar and fullness owners. */
    source: AutoMovieLoftViewSource.ISource;
  }

  /**
   * Specified sagittally inclined plane and actual anterior/posterior anchors.
   *
   * @evidence contracts/common.md#principled-implementation Actual original phase0/pi points determine Y=a+bX.
   * @evidence contracts/common.md#clear-and-simple-design The plane stores physical source bounds and two scalar coefficients.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts These are generating-source anchors, not camera coordinates or reference-fit points.
   * @evidence contracts/common.md#meaningful-documentation a is mm, b is dimensionless and range is increasing physical station mm.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Plane construction owns its two source queries.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Fixed-size numeric data owns no external resources.
   */
  export interface IPlane {
    /** Superior-axis intercept, mm. */
    a: number;
    /** Front-higher sagittal slope, dimensionless. */
    b: number;
    /** Actual phase0 anterior anchor, world mm. */
    front: Vec3;
    /** Actual phase-pi posterior anchor, world mm. */
    back: Vec3;
    /** Physical source station bounds, increasing and closed. */
    range: [number, number];
  }

  /**
   * Actual world point and derivative per radian of its source polar phase.
   *
   * @evidence contracts/common.md#principled-implementation The derivative differentiates the same implicit plane/source intersection as the point.
   * @evidence contracts/common.md#clear-and-simple-design Point, station and one tangent expose the course independently of integration.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing source/frame derivatives are never zero-filled.
   * @evidence contracts/common.md#meaningful-documentation Point/station use mm and derivative uses mm per radian.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work at owns original reads.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns owned fixed-size vectors.
   */
  export interface IReading {
    /** Actual physical source station, mm. */
    station: number;
    /** Original world point, mm. */
    point: Vec3;
    /** Total world derivative along the plane course, mm per radian. */
    derivative: Vec3;
  }

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
  export function of(part: IAutoMovieViewPart): IReader {
    const admitted: AutoMovieLoftViewSource.IResult | null =
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
  export function plane(reader: IReader, front: number, back: number): IPlane {
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
    const p: Vec3 = AutoMovieHumanHeadTapeStation.prepare(reader, front).point(0);
    const q: Vec3 = AutoMovieHumanHeadTapeStation.prepare(reader, back).point(Math.PI);
    if (!(p[0] > q[0] && p[1] >= q[1]))
      throw new Error(
        "Head tape has no front-higher positive sagittal anchor span",
      );
    const b: number = (p[1] - q[1]) / (p[0] - q[0]);
    return { a: p[1] - b * p[0], b, front: p, back: q, range: [back, front] };
  }

  /**
   * Read the actual regular course and its analytic implicit tangent.
   *
   * @evidence contracts/common.md#principled-implementation The exact plane residual selects an original source station; total differentiation gives ds/dphi=-(Pphi.y-b*Pphi.x)/(Ps.y-b*Ps.x), then P'=Pphi+Ps*ds/dphi.
   * @evidence contracts/common.md#clear-and-simple-design Value-only station solving precedes one physical source2/frame read; a horizontal member needs phase geometry only.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No finite differences, missing derivative, sampled replacement field or out-of-domain cap extension supplies the tangent.
   * @evidence contracts/common.md#meaningful-documentation Requires a finite positive station-plane derivative and reports unresolved source roots explicitly; this is not a global intersection certificate.
   * @evidence contracts/performance.md#efficient-algorithms At most48 safeguarded secant/bisection queries and one native physical2 read; a horizontal course has constant work.
   * @evidence contracts/performance.md#reuse-equivalent-work The final value read supplies the original frame and point used with the same source's analytic tangent.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Numerical scratch and all returned vectors belong to the call; no course cache survives.
   */
  export function at(reader: IReader, plane: IPlane, phase: number): IReading {
    return course(
      reader,
      plane,
      phase,
      AutoMovieHumanHeadTapeStation.create(reader, plane.range),
    );
  }

  /** The unchanged final phase/physical2 reading, with a caller-owned Point0 inverse. */
  function course(
    reader: IReader,
    plane: IPlane,
    phase: number,
    sources: AutoMovieHumanHeadTapeStation.IOutput,
  ): IReading {
    const selected: ILocated = locate(plane, phase, sources.point);
    const station: number = selected.station;
    const original: AutoMovieHumanHeadTapeStation.IReading = sources.value(station, phase, selected.source);
    const turn: Vec3 = AutoMovieHumanHeadTapeStation.vector(original.frame, original.local.t);
    if (plane.b === 0)
      return { station, point: original.point, derivative: turn };
    const inputs: AutoMovieLoftViewRead.IJets | string =
      AutoMovieLoftViewRead.jets(reader.source, station);
    const frame:
      | ReturnType<NonNullable<IAutoMovieViewPart["axis"]["jet"]>>
      | undefined = reader.part.axis.jet?.(station);
    if (typeof inputs === "string" || frame === null || frame === undefined)
      throw new Error(
        `Head tape physical source/frame derivative unavailable: ${typeof inputs === "string" ? inputs : station}`,
      );
    const local: ReturnType<ReturnType<typeof AutoMovieLoftSectionNative.jet>> =
      AutoMovieLoftSectionNative.jet(inputs)(phase);
    const along: Vec3 = frame.first.origin.map(
      (x: number, i: number): number =>
        x +
        frame.first.u[i]! * local.p[0] +
        frame.value.u[i]! * local.s[0] +
        frame.first.v[i]! * local.p[1] +
        frame.value.v[i]! * local.s[1],
    ) as Vec3;
    const denominator: number = along[1] - plane.b * along[0];
    if (!(denominator > 0 && Number.isFinite(denominator)))
      throw new Error(
        "Head tape plane is not a regular positively oriented source loop",
      );
    const rate: number = -(turn[1] - plane.b * turn[0]) / denominator;
    const derivative: Vec3 = turn.map(
      (x: number, i: number): number => x + rate * along[i]!,
    ) as Vec3;
    if (!derivative.every(Number.isFinite))
      throw new Error("Head tape has a nonfinite original world tangent");
    return { station, point: original.point, derivative };
  }

  /**
   * Integrate the actual source spans with the shared engine rule.
   *
   * @evidence contracts/common.md#principled-implementation Integrates the actual world-mm tangent norm in its radian chart using the engine's existing K/2K Gauss-Legendre owner.
   * @evidence contracts/common.md#clear-and-simple-design Original knot-plane crossings split the four phase quarters before quadrature; length and K/2K difference remain separate observations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither the difference nor a specified-course length is a global maximum or interval error certificate.
   * @evidence contracts/common.md#meaningful-documentation Returns mm and preserves all original source/root/derivative failures.
   * @evidence contracts/performance.md#efficient-algorithms N original knot planes use bounded native phase inversions, then the resulting O(N) pieces use the shared K/2K quadrature policy and at's source-query bound.
   * @evidence contracts/performance.md#reuse-equivalent-work Every derivative query borrows the same actual source and plane; the two exact endpoint Point0 preparations are shared across phases and each selected trial supplies its final phase geometry.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The synchronous measure retains two successful endpoint readers and its active bracket; selected-trial numeric data expires after its final phase read.
   */
  export function measure(
    reader: IReader,
    plane: IPlane,
    subdivisions: number = 1,
  ): ReturnType<typeof measureAutoMovieCurveLength64> {
    const sites: number[] = AutoMovieHumanHeadTapeStation.partition(reader, plane);

    const sources: AutoMovieHumanHeadTapeStation.IOutput = AutoMovieHumanHeadTapeStation.create(reader, plane.range);

    return measureAutoMovieCurveLength64(
      sites
        .slice(1)
        .map(
          (
            high: number,
            index: number,
          ): Parameters<typeof measureAutoMovieCurveLength64>[0][number] => ({
            domain: [sites[index]!, high],
            derivative: (phase: number): Vec3 =>
              course(reader, plane, phase, sources).derivative,
          }),
        ),
      subdivisions,
    );
  }

  /** Safeguarded value-only plane inverse, preserving exact original anchor stations. */
  function locate(
    plane: IPlane,
    phase: number,
    readPoint: (station: number, phi: number) => AutoMovieHumanHeadTapeStation.IValue,
  ): ILocated {
    if (plane.b === 0) return { station: plane.range[0] };
    const angle: number =
      ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    if (angle === 0) return { station: plane.range[1] };
    if (angle === Math.PI) return { station: plane.range[0] };
    const residual: (station: number) => IResidual = (station: number): IResidual => {
      const at: AutoMovieHumanHeadTapeStation.IValue = readPoint(station, phase);
      return { value: at.point[1] - plane.a - plane.b * at.point[0], source: at.source };
    };
    let low: number = plane.range[0];
    let high: number = plane.range[1];
    let a: IResidual = residual(low);
    let b: IResidual = residual(high);
    if (a.value === 0) return { station: low, source: a.source };
    if (b.value === 0) return { station: high, source: b.source };
    if (!(a.value < 0 && b.value > 0))
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
    let weightLow: number = a.value;
    let weightHigh: number = b.value;
    let kept: -1 | 0 | 1 = 0;
    for (let iteration: number = 0; iteration < 48; iteration++) {
      let middle: number =
        low - (weightLow * (high - low)) / (weightHigh - weightLow);
      if (!(middle > low && middle < high)) middle = (low + high) / 2;
      if (!(middle > low && middle < high)) break;
      const at: IResidual = residual(middle);
      if (Math.abs(at.value) <= allowance) return { station: middle, source: at.source };
      if (at.value < 0) {
        low = middle;
        a = at;
        weightLow = at.value;
        if (kept === 1) weightHigh /= 2;
        kept = 1;
      } else {
        high = middle;
        b = at;
        weightHigh = at.value;
        if (kept === -1) weightLow /= 2;
        kept = -1;
      }
    }
    if (Math.min(Math.abs(a.value), Math.abs(b.value)) <= allowance)
      return Math.abs(a.value) < Math.abs(b.value) ? { station: low, source: a.source } : { station: high, source: b.source };
    throw new Error(
      "Head tape original plane inverse did not resolve within its numerical budget",
    );
  }
}
