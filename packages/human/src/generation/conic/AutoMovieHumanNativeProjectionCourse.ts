import {
  AutoMovieSolidVector as V,
  AutoMovieViewAxisJet as AxisJet,
  type AutoMovieLoftFrame,
  type AutoMovieViewAxis,
  type IAutoMovieViewPart,
  adjacentAutoMovieFloat64 as adjacent,
} from "@automovie/engine";
import type { AutoMovieConstructionOutlineParameter } from "@automovie/interface";

/**
 * A part's projection as one uniform axial scale of its whole material course about a declared origin.
 *
 * The caller supplies its known straight, constant-frame skin axis; finite consistency readings do not prove
 * straightness of an arbitrary callback. Scalar outlines, cap parameters, material addresses and skeleton frames
 * are not changed by this owner: the section at material station s is placed where the original axis puts
 * station c + lambda (s - c). On a straight constant frame that map moves every section along the axis by
 * (lambda - 1)(s - c) and keeps its outline values, so the part's side profile, cap included, is the affine image
 * (x, r) -> (c + lambda (x - c), r) of the original. A positive affine map keeps the sign of every curvature, so
 * the projected outline has exactly the original's convex and concave runs and inflections (basis: affine
 * invariance of the sign of the planar curvature x'y'' - y'x'', which scales by lambda > 0).
 *
 * The earlier law re-parameterized only the stretch past the rail, with slope one at both ends and a faster
 * middle; its varying slope added two inflections to every convex outline. That law is retired.
 */
export namespace AutoMovieHumanNativeProjectionCourse {
  /** One caller-owned course and sampling observations from the same law. */
  export interface IPrepared {
    /** Same original axis on identity, otherwise the common projected source axis. */
    axis: AutoMovieViewAxis.IAxis;

    /** Scale times the norm of the original constant station tangent, rounded outward: world course-origin mm per material mm, not a surface-point chord bound. */
    maximumSpeed: number;

    /** Interior course joins in native material mm; a uniform scale has none. */
    materialBreaks: readonly number[];
  }

  /** One measured immutable-original datum and its source-bound projection operation. */
  export interface IProjectionOwner {
    /** Original rail-to-native-pole endpoint chord, world mm, measured once. */
    readonly projection: number;

    /** Original-only read attempts, separate from calipers and changed-axis queries. */
    readonly calibration: {
      /** Actual original axis.at endpoint attempts during this preparation. */
      readonly point0ReadAttempts: number;
      /** Actual original axis.jet station2 attempts during this preparation. */
      readonly axis2ReadAttempts: number;
    };

    /**
     * Project the same immutable bank source on its owned current skin axis.
     * originalSource must be the captured descriptor, not a candidate/copy.
     * The current root producer owns its provenance and known straight-frame
     * premise; finite checks do not authenticate arbitrary callbacks globally.
     *
     * @param targetD Requested rail-to-pole world chord, mm; its ratio to the original chord is the scale.
     * @param origin Material station held fixed by the scale, mm; the rail when absent.
     * @param shift World translation of the whole scaled course, mm; none when absent. A part that rides a
     *   host whose skin moves takes the host's displacement here, so scale and carriage stay one rigid-affine map.
     */
    project(
      originalSource: IAutoMovieViewPart,
      currentQualifiedAxis: AutoMovieViewAxis.IAxis,
      targetD: number,
      origin?: number,
      shift?: V.Vec3,
    ): IPrepared;
  }

  /**
   * Own the original endpoint world metric for one reader lifetime.
   * The native descriptor determines T, L=T-R and the actual axis2; no caller
   * supplies a replacement calibration number. Two Point0 and three station2
   * attempts are counted at their actual calls. Inputs remain borrowed immutable.
   *
   * @param original Actual original bank descriptor with a native top cap.
   * @param rail Fixed original material rail R, inside that source domain, mm.
   * @returns The one measured D0 and a closure bound to that original identity.
   * @throws An unavailable/malformed original, nonpositive metric or foreign source.
   */
  export function prepare(original: IAutoMovieViewPart, rail: number): IProjectionOwner {
    const tip: number = original.stations.at(-1)!;
    const length: number = tip - rail;
    if (!([rail, tip, length, original.stations[0]!].every(Number.isFinite) &&
      length > 0 && rail >= original.stations[0]! &&
      (original.pole === "top" || original.pole === "both")))
      throw new Error("Native projection original needs an interior material rail and native top cap");
    let axis2ReadAttempts: number = 0;
    const baseline: AxisJet.IJet = straight(original.axis, rail, tip, (): void => {
      axis2ReadAttempts++;
    });
    let point0ReadAttempts: number = 0;
    point0ReadAttempts++;
    const start: V.Vec3 = original.axis.at(rail).origin;
    point0ReadAttempts++;
    const end: V.Vec3 = original.axis.at(tip).origin;
    const projection: number = Math.hypot(...V.sub(end, start));
    if (!(Number.isFinite(projection) && projection > 0))
      throw new Error("Native projection original has no finite positive endpoint chord");
    return {
      projection,
      calibration: { point0ReadAttempts, axis2ReadAttempts },
      project: (
        originalSource: IAutoMovieViewPart,
        currentQualifiedAxis: AutoMovieViewAxis.IAxis,
        targetD: number,
        origin: number = rail,
        shift: V.Vec3 = [0, 0, 0],
      ): IPrepared => {
        if (originalSource !== original)
          throw new Error("Native projection original source identity mismatch");
        const actual: AxisJet.IJet = currentQualifiedAxis === original.axis
          ? baseline : straight(currentQualifiedAxis, rail, tip);
        return course(currentQualifiedAxis, original, targetD / projection, origin, actual, shift);
      },
    };
  }

  /**
   * Place material station s where the current axis puts c + lambda (s - c), over the whole source domain.
   *
   * The first jet is lambda times the original constant tangent and the second jet is zero, both exact on the
   * declared straight constant frame; a requested outline parameter converts them once through the engine's
   * jet owner. A constant world shift moves every frame origin and no derivative. lambda === 1 with no shift
   * borrows the current axis literally, so the original stays bit-exact. A scale, a shift or a mapped domain
   * end that is not finite (and, for the scale, positive) refuses rather than clamping.
   */
  function course(
    currentAxis: AutoMovieViewAxis.IAxis,
    original: IAutoMovieViewPart,
    lambda: number,
    origin: number,
    currentJet: AxisJet.IJet,
    shift: V.Vec3,
  ): IPrepared {
    const direction: V.Vec3 = currentJet.first.origin;
    const speed: number = Math.hypot(...direction);
    if (!(Number.isFinite(speed) && speed > 0))
      throw new Error("Native projection course has no finite positive original speed");
    if (!(Number.isFinite(lambda) && lambda > 0 && Number.isFinite(origin) && shift.every(Number.isFinite)))
      throw new Error("Native projection course needs a finite positive scale, a finite origin and a finite shift");
    const still: boolean = shift.every((x: number): boolean => x === 0);
    if (lambda === 1 && still) return { axis: currentAxis, maximumSpeed: speed, materialBreaks: [] };

    // Every station of the source domain, cap included, takes the same map.
    const map = (station: number): number => origin + lambda * (station - origin);
    const ends: readonly number[] = [map(original.stations[0]!), map(original.stations.at(-1)!)];
    const first: V.Vec3 = V.scale(direction, lambda);

    // An outward-rounded bound that lands on an integer N would let the sampler cut each interval into
    // exactly N rows, whose rounded spans exceed span/N by an ulp; the next float keeps it a strict bound.
    const rounded: number = adjacent(lambda * speed, true);
    const maximumSpeed: number = Number.isInteger(rounded) ? adjacent(rounded, true) : rounded;
    if (!([...ends, ...first, maximumSpeed].every(Number.isFinite) && ends[1]! > ends[0]! && maximumSpeed > 0))
      throw new Error("Native projection course scale is not representable on its material domain");
    const zero: V.Vec3 = [0, 0, 0];
    const placed: (station: number) => AutoMovieLoftFrame.IFrame = (station: number): AutoMovieLoftFrame.IFrame => {
      const frame: AutoMovieLoftFrame.IFrame = currentAxis.at(map(station));
      return still ? frame : { ...frame, origin: V.add(frame.origin, shift) };
    };
    const axis: AutoMovieViewAxis.IAxis = {
      at: placed,
      jet: (
        station: number,
        parameter?: AutoMovieConstructionOutlineParameter,
      ): AxisJet.IJet | null =>
        AxisJet.parameter(AxisJet.fixed(placed(station), first, zero), parameter, station),
    };
    return { axis, maximumSpeed, materialBreaks: [] };
  }

  /**
   * Read actual available station2 at the rail, midpoint and tip and reject
   * inconsistent constant-direction/frame premises. These finite checks are
   * not a global proof for arbitrary supplied callbacks. Foreign source
   * exceptions propagate, and unavailable derivatives never become zero.
   */
  function straight(original: AutoMovieViewAxis.IAxis, rail: number, tip: number,
    onRead?: () => void): AxisJet.IJet {
    if (original.jet === undefined)
      throw new Error("Native projection course requires actual original axis2");
    onRead?.();
    const baseline: AxisJet.IJet | null = original.jet(rail);
    if (baseline === null)
      throw new Error("Native projection course original rail axis2 is unavailable");
    for (const station of [rail, rail + (tip - rail) / 2, tip]) {
      if (station !== rail) onRead?.();
      const jet: AxisJet.IJet | null = station === rail ? baseline : original.jet(station);
      if (jet === null)
        throw new Error("Native projection course original axis2 is unavailable at " + station);
      for (const key of ["origin", "u", "v"] as const) {
        if (![...jet.value[key], ...jet.first[key], ...jet.second[key]].every(Number.isFinite) ||
          jet.second[key].some((x: number): boolean => x !== 0))
          throw new Error("Native projection course needs a finite straight constant-frame original");
        for (let i: number = 0; i < 3; i++)
          if (key === "origin"
            ? jet.first[key][i] !== baseline.first[key][i]
            : jet.first[key][i] !== 0 || jet.value[key][i] !== baseline.value[key][i])
            throw new Error("Native projection course original direction or frame varies");
      }
    }
    return baseline;
  }
}
