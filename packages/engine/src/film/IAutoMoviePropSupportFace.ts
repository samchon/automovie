import { IAutoMovieFootprint } from "../space/IAutoMovieFootprint";
import { IAutoMovieHeightSurface } from "../space/IAutoMovieHeightSurface";

/**
 * The world face a prop or a built member rests on, as one record every kind of
 * support answers.
 *
 * Three producers state a face in different terms and are read here in one: a
 * region on the ground plan, and a rule saying how high the face stands over
 * that region. `propSupportFace` gives a building support patch its own
 * footprint and height rule, and gives another prop's `stack-top` the extent
 * carried through the host's full staged TRS, the same transform
 * `propOccupancyBounds` measures the resting prop through, so a scaled or turned
 * host's top and the geometry that shows it stay one surface.
 * `builtEnvironmentSupportStatus` gives a built body's bearing part its top as a
 * level rectangle. `propSupportGap` reads every one of them the same way.
 *
 * @evidence contracts/common.md#principled-implementation A face is a plan region plus a height function over it, which is exactly what a resting test needs: `propSupportGap` probes points inside the region with `footprintContains`, including its holes, and reads each probe's height through `surfaceHeightAt`; a tilted stack-top becomes a plane rule from the cross product of the transformed local axes, and a face standing edge-on to the ground is never produced because its height is not a function of `(x, z)`.
 * @evidence contracts/common.md#clear-and-simple-design Two fields shared by three producers, so the gap measurement exists once for patches, prop tops and built parts instead of once per support kind; the height reuses the structural `IAutoMovieHeightSurface` so a patch passes its own surface record without conversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The polygon keeps a patch's holes rather than its convex hull, so a prop over an atrium void is measured against no face instead of a floored hull, and no producer substitutes a default height for a face it cannot measure: it returns `null` instead.
 * @evidence contracts/common.md#meaningful-documentation States the three producers and how each derives the region and the height, why a stack-top travels through the full staged transform, the single consumer, and for each field its plane, its hole semantics and the reader of its height rule.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape with no runtime body; building it is one transform and one hull per stack-top, or a footprint per patch, answered on `propSupportFace`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built per relation during one validation or support query and used immediately by `propSupportGap`; no face is cached across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A patch face references the authored surface record as its height rule and owns a fresh footprint; a prop or built face owns fresh rings and a fresh rule; both are released when the caller's measurement ends.
 */
export interface IAutoMoviePropSupportFace {
  /**
   * The face's plan region in world XZ metres, holes included. A probe in a
   * hole's open interior is not over the face; every rim is. A prop affordance's top is one convex ring;
   * a support patch keeps whatever region its rings describe.
   */
  polygon: IAutoMovieFootprint;

  /**
   * How high the face stands over each point of {@link polygon}, in world
   * metres, in the spelling `surfaceHeightAt` reads: the patch's own surface
   * record, a plane rule for a prop top, or a constant for a built part's top.
   */
  height: IAutoMovieHeightSurface;
}
