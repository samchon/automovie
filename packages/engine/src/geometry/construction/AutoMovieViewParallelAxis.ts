import type { IAutoMovieConstructionParallelAxis } from "@automovie/interface";

import type { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import type { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { AutoMovieViewAxis } from "./AutoMovieViewAxis";
import { AutoMovieViewOutline } from "./AutoMovieViewOutline";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/**
 * Parallel source planes: fixed chart axes translated by three admitted source-coordinate curves, independent of the origin course's tangent.
 *
 * @evidence contracts/common.md#principled-implementation Evaluates the same scalar source owner used by ViewLoft for each origin coordinate and keeps the authored orthonormal basis fixed.
 * @evidence contracts/common.md#clear-and-simple-design One builder serves the declarative parallel-axis record without altering straight, level, minimal or jointed axes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No frame is inferred from sampled planes, no axis is renormalized to fit and no origin is recovered from output geometry.
 * @evidence contracts/common.md#meaningful-documentation States source ownership, constant plane directions and the explicit admission/reading failure boundary.
 * @evidence contracts/performance.md#efficient-algorithms Three linear source preparations; a frame query performs three scalar source scans and constant vector copying.
 * @evidence contracts/performance.md#reuse-equivalent-work Each source coordinate is prepared once and reused by every frame query.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned axis owns copied directions and three admitted source curves; from additionally retains its copied original declaration under a weak axis key, never a frame cache.
 */
export namespace AutoMovieViewParallelAxis {
  /**
   * Original declarations keyed weakly by their actual prepared source axis.
   *
   * The weak identity lookup reuses the authored record without searching, sampling or rebuilding an interpolation. It contains only axes actually prepared from their declarations. Each live factory axis retains one copied declaration; a dead weak key releases that metadata. Public from/source own this serialization contract.
   */
  const DECLARATIONS: WeakMap<AutoMovieViewAxis.IAxis, IAutoMovieConstructionParallelAxis> = new WeakMap();

  /**
   * Three source coordinates of an origin in world millimetres.
   *
   * @evidence contracts/common.md#principled-implementation Independent scalar source curves locate a fixed-basis plane at the same authored station.
   * @evidence contracts/common.md#clear-and-simple-design Three existing outline records carry the origin without sampled frame data.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The origin remains authored source data and is not recentered by an emitted section.
   * @evidence contracts/common.md#meaningful-documentation States world space, millimetres and shared station meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This source record has no runtime algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record schedules no work; create prepares it.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The producer owns its original curve data; create copies it for an axis.
   */
  export interface IOrigin {
    /** World X by authored station, both millimetres. */
    x: IAutoMovieViewPart.IOutline;

    /** World Y by the same authored station, millimetres. */
    y: IAutoMovieViewPart.IOutline;

    /** World Z by the same authored station, millimetres. */
    z: IAutoMovieViewPart.IOutline;
  }

  /**
   * Admit fixed planes and their original coordinate curves.
   *
   * @evidence contracts/common.md#principled-implementation Requires finite orthonormal directions to binary64 roundoff and three admitted source curves, then places each origin directly from those curves without tangent transport.
   * @evidence contracts/common.md#clear-and-simple-design Returns an ordinary source axis or the original basis/coordinate admission failure.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not normalize an invalid basis or silently replace a failed coordinate; a later unrepresentable scalar query throws its original source failure for the caller to report.
   * @evidence contracts/common.md#meaningful-documentation Defines authored station, basis admission and source failure behavior.
   * @evidence contracts/performance.md#efficient-algorithms Preparation is linear in the total coordinate knots; each frame reads three value-only source curves and copies two directions.
   * @evidence contracts/performance.md#reuse-equivalent-work Copies each direction and prepares each source once for the returned immutable axis.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Closure lifetime owns the two three-component direction copies and three source preparations; each returned frame owns its vectors.
   */
  export function create(origin: IOrigin, u: AutoMovieSolidVector.Vec3, v: AutoMovieSolidVector.Vec3): AutoMovieViewAxis.IAxis | string {
    const U: AutoMovieSolidVector.Vec3 = [...u];
    const V: AutoMovieSolidVector.Vec3 = [...v];
    const tolerance: number = 64 * Number.EPSILON;
    if (![...U, ...V].every(Number.isFinite) || Math.abs(Math.hypot(...U) - 1) > tolerance || Math.abs(Math.hypot(...V) - 1) > tolerance || Math.abs(U[0] * V[0] + U[1] * V[1] + U[2] * V[2]) > tolerance)
      return "parallel chart directions must be finite, unit and perpendicular";
    const curves: AutoMovieViewOutline.IOutline[] = [];
    for (const coordinate of ["x", "y", "z"] as const) {
      const source: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(origin[coordinate]);
      if ("detail" in source) return `parallel origin ${coordinate}: ${source.detail}`;
      curves.push(source);
    }
    return {
      at: (station: number): AutoMovieLoftFrame.IFrame => {
        const point: AutoMovieSolidVector.Vec3 = [0, 0, 0];
        for (let c: number = 0; c < 3; c++) {
          const value: number | string = AutoMovieViewOutline.value(curves[c]!, station);
          if (typeof value === "string") throw new Error(`parallel origin ${c}: ${value}`);
          point[c] = value;
        }
        return { origin: point, u: [...U], v: [...V] };
      },
    };
  }

  /**
   * Prepare the source axis from its authoritative metre declaration, retaining that same declaration for tree serialization.
   *
   * @evidence contracts/common.md#principled-implementation Copies the declared coordinate curves and basis, converts each station/value/parameter endpoint to millimetres once, and prepares the actual frame from that copied source.
   * @evidence contracts/common.md#clear-and-simple-design Source evaluation and later serialization share one authoritative declaration rather than reverse-engineering an axis function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not sample frames, invent knots or infer a parameter; a failed source remains its builder failure.
   * @evidence contracts/common.md#meaningful-documentation States metre input, millimetre evaluation and exact declaration ownership.
   * @evidence contracts/performance.md#efficient-algorithms Linear copying/conversion in the coordinate knot count plus the three source preparations.
   * @evidence contracts/performance.md#reuse-equivalent-work Retains the original declaration on the prepared axis so serialization does not reevaluate its course.
   * @evidence contracts/performance.md#bound-retention-and-release-resources One copied declaration belongs to each live axis through a WeakMap key; failed preparations retain nothing and dead axes release their metadata.
   */
  export function from(declaration: IAutoMovieConstructionParallelAxis): AutoMovieViewAxis.IAxis | string {
    const original: IAutoMovieConstructionParallelAxis = copy(declaration);
    const axis: AutoMovieViewAxis.IAxis | string = create(
      { x: AutoMovieViewOutline.scale(original.origin.x, 1000, 1000), y: AutoMovieViewOutline.scale(original.origin.y, 1000, 1000), z: AutoMovieViewOutline.scale(original.origin.z, 1000, 1000) },
      [original.u.x, original.u.y, original.u.z],
      [original.v.x, original.v.y, original.v.z],
    );
    if (typeof axis !== "string") DECLARATIONS.set(axis, original);
    return axis;
  }

  /**
   * Copy the actual declaration of an axis prepared by from; return null for an arbitrary or other-kind axis.
   *
   * @evidence contracts/common.md#principled-implementation Reads only factory-owned source metadata under the actual axis identity, preserving coordinate knots and parameters without observing final frames.
   * @evidence contracts/common.md#clear-and-simple-design A nullable typed declaration distinguishes exact source preservation from an unsupported black-box reconstruction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not infer a declaration by sampling or expose mutable factory metadata.
   * @evidence contracts/common.md#meaningful-documentation States the supported producer and null meaning.
   * @evidence contracts/performance.md#efficient-algorithms Constant lookup plus O(n) source copying on success.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the retained authoritative source; it does not rerun interpolation or frame transport.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a fresh declaration owned by the caller; the WeakMap retains no strong axis key.
   */
  export function source(axis: AutoMovieViewAxis.IAxis): IAutoMovieConstructionParallelAxis | null {
    const original: IAutoMovieConstructionParallelAxis | undefined = DECLARATIONS.get(axis);
    return original === undefined ? null : copy(original);
  }

  /**
   * Copy one source declaration without converting its metre units.
   *
   * Copies every coordinate knot list, parameter record and basis to isolate retained metadata and returned declarations from caller mutation. No numeric input is fitted, sampled or replaced. O(n) copying in coordinate knot count produces fresh caller-owned curves and fixed-size basis records; it cannot alias an earlier mutable ownership copy.
   */
  function copy(declaration: IAutoMovieConstructionParallelAxis): IAutoMovieConstructionParallelAxis {
    return { type: "parallel", origin: { x: AutoMovieViewOutline.scale(declaration.origin.x, 1, 1), y: AutoMovieViewOutline.scale(declaration.origin.y, 1, 1), z: AutoMovieViewOutline.scale(declaration.origin.z, 1, 1) }, u: { ...declaration.u }, v: { ...declaration.v } };
  }
}
