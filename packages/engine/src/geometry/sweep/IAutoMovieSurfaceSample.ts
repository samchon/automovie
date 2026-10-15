import { IAutoMovieSurfaceCurveRig } from "./IAutoMovieSurfaceCurveRig";
import { IAutoMovieSweepRig } from "./IAutoMovieSweepRig";

/**
 * One point of a patch side or loop as a surface rig plans it: its identity,
 * how it is written per pose, and what it lies on, which decides the
 * direction a bridge leaves it along. Its writer is made lazily, so a point
 * sampled again for a ring or a loop registers nothing twice.
 *
 * @evidence contracts/common.md#principled-implementation Identity, evaluation and the underlying primitive of a sampled point, the three facts welding, posing and bridging need.
 * @evidence contracts/common.md#clear-and-simple-design A sweep point carries its sweep's rig and parameters; a curve point its curve's rig and share.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Points are welded by `key`, never by distance.
 * @evidence contracts/common.md#meaningful-documentation States each field's role.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A record owned by its rig.
 * @author Samchon
 */
export interface IAutoMovieSurfaceSample {
  /** Identity the point is welded by. */
  key: string;

  /**
   * Make the writer of a point that is not a sweep point, registering the slots it reads; called once, when the point first becomes a vertex.
   *
   * @returns A writer of the point for the current pose, three numbers in metres at an offset
   *
   * @evidence contracts/common.md#principled-implementation Binds a non-sweep point's evaluation when it first becomes a vertex.
   * @evidence contracts/common.md#clear-and-simple-design A factory, so repeated samplings register nothing twice.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Called only for new vertices.
   * @evidence contracts/common.md#meaningful-documentation States when it is called.
   * @evidence contracts/performance.md#efficient-algorithms Constant time per call.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `rigAutoMovieSurfaceNetwork`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `rigAutoMovieSurfaceNetwork`.
   */
  writer(): (out: Float64Array, at: number) => void;

  /** For a point of a sweep, its sweep's name, domain point and the spacing this sampling gives its cell, below and above along `u` then along `v`, infinite where it gives none; otherwise null. Sweep points are finalized once every patch has sampled them, so the cell does not depend on patch order. */
  point: { sweep: string; u: number; v: number; cell: [number, number, number, number] } | null;

  /** The sweep and domain point it lies on, for a point of a sweep edge; otherwise null. */
  sweep: { rig: IAutoMovieSweepRig; u: number; v: number } | null;

  /** The curve and share it lies at, for a point of a curve edge; otherwise null. */
  curve: { rig: IAutoMovieSurfaceCurveRig; t: number } | null;
}
