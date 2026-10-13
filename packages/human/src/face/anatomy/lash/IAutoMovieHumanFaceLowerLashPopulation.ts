import type { IAutoMovieHumanFaceLowerLashProfile } from "./IAutoMovieHumanFaceLowerLashProfile";

/**
 * Authored lower-lid shaft geometry with an independent explicit population.
 *
 * Count includes zero and is independent of the upper lid and of source-card area or vertex count. The lower profile retains its mirrored angular frame and conventional envelopes. Roots sample the registered anterior lower row evenly by arc length; this is not a measured lower-follicle distribution.
 *
 * @evidence contracts/common.md#principled-implementation An explicit lower population extends the retained lower shaft profile and live inferior angular frame.
 * @evidence contracts/common.md#clear-and-simple-design The document pair and population validator keep lower count independent from upper count and source-card vertices.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Evenly arc-sampled registered roots are a rendering convention, not measured lower-follicle distribution.
 * @evidence contracts/common.md#meaningful-documentation Count includes zero within the 1024 resource cap; angles use degrees while profile lengths/radii use millimetres.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Row generation and shaft/contact tests execute in buildHumanFaceLashRows, not this erased input type.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shared lower profile validator supplies geometric envelopes while population admission supplies explicit count.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller documents own profiles; generated row buffers and current query lifetimes belong to the row builder.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceLowerLashPopulation extends IAutoMovieHumanFaceLowerLashProfile {
  /** Requested shaft count, an integer in [0,1024]; this is a rendering budget. */
  strandCount: number;

  /** Initial tangent angle from globe-to-root forward toward live local inferior, in degrees. */
  elevation: number;

  /** Total tangent turn toward live local inferior, in degrees; negative values curve toward superior. */
  curl: number;

  /** Medial/lateral spread in the live tangent frame, in degrees, independent from upper fan. */
  fan: number;
}
