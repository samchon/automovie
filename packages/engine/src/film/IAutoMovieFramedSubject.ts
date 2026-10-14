import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * What a `frame` action points the camera at, resolved by the caller: the
 * bottom centre of what the subject draws, its height, its horizontal radius,
 * and, when the subject moves during the shot, that base over shot time.
 *
 * `performShot` builds one per frame or coverage subject. A group is measured
 * as the box its members and named formations fill; a node is measured from its
 * model's rest box, else its rig span, else the stand-in height, carried
 * through its placement; a bone or point subject is a stand-in-height segment
 * at the resolved point. {@link compileCameraMove} reads it: `height`
 * and `radius` fix the distance, `height` the aim, and `at` the path of a
 * `follow` or `truck` move.
 *
 * @evidence contracts/common.md#principled-implementation The camera distance is `max(height * fraction / 2 / tan(fovY / 2), 2 * radius * fraction / 2 / (tan(fovY / 2) * aspect))`, the pinhole fit on each axis with the binding one winning; it assumes the base and extent are world metres and that `at` returns the same bottom-centre point the static `base` names, which `performShot` keeps by shifting the animated root by the constant offset between root and drawn base.
 * @evidence contracts/common.md#clear-and-simple-design Carries only what the solve reads, a base, two extents and an optional trajectory, so the solve never resolves a scene id, model or formation itself and the hero take and every coverage take share one resolved subject.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject kind is special-cased in the solve: a figure, a facade and a crowd all go through the same two-axis fit, and a missing horizontal measurement is stated as an absent or zero `radius` rather than a guessed width.
 * @evidence contracts/common.md#meaningful-documentation States the producer, how each subject kind is measured, which fields set distance, aim and path, the metre and shot-local-second units, when `radius` binds, and what a null `at` does to `follow` and `truck`.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; the solve reads it in constant time per key, and the cost of evaluating `at` is the producer's sampler cost, answered on `performShot`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built once per frame or coverage subject inside one `performShot` call and not cached across shots, because its `at` closure depends on that shot's motions.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The `at` closure retains the shot's motion, object-clip and formation tables for as long as the subject is referenced, which ends when the camera clip is compiled and the entries list is dropped.
 * @author Samchon
 */
export interface IAutoMovieFramedSubject {
  /** World bottom-centre point of the subject at the move's start, in metres. */
  base: IAutoMovieVector3;

  /**
   * Subject height in metres, which sets the vertical fit and the aim height.
   * `performShot` substitutes the stand-in height when what it measured is
   * below 0.1 m.
   */
  height: number;

  /**
   * Half the subject's widest horizontal span about {@link base}, in metres.
   *
   * `performShot` measures it on every subject that draws something: a group
   * from the union of its members' boxes, a single node from its model's own
   * rest box ({@link computeModelRestExtent}) carried through its placement.
   * Absent or zero means nothing horizontal was measured, as for a rig span, a
   * stand-in, a bone or a point, and height alone sets the distance.
   *
   * The fit takes the larger of the vertical and horizontal distances, so for a
   * raster of aspect `a` the radius changes the framing only where
   * `2 * radius > height * a`. A standing figure in a landscape raster stays
   * below that, so its distance comes from its height; a field of two thousand
   * figures a hundred metres across, or a 60 m facade 24 m high, crosses it and
   * is framed from its width.
   */
  radius?: number;

  /**
   * Animated base over shot-local seconds, in the same bottom-centre convention
   * as {@link base}, or null when the subject holds still. With null, a
   * `follow` move keys one static framing and a `truck` move slides past the
   * fixed base.
   */
  at: ((seconds: number) => IAutoMovieVector3) | null;
}
