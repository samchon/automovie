import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * From infraspinous scapular fossa to humeral greater tubercle. Its deep posterior belly is independent of deltoid and teres minor. One belly's volume or MRI fat fraction cannot by itself locate its tendon.
 *
 * @evidence contracts/common.md#principled-implementation Infraspinatus uses the shared independent belly-volume and MRI fat-fraction quantities rather than a posterior shoulder contour.
 * @evidence contracts/common.md#clear-and-simple-design The cuff member supplies infraspinatus identity while the muscle schema owns nonempty measurements and provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither scalar locates the infraspinatus tendon or replaces the adjacent deltoid and teres minor.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies posterior scapular ownership and explains why scalar measurements leave its tendon unresolved.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Infraspinatus measurement typing chooses no posterior cuff segmentation or tendon-localization method.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The posterior cuff quantity alias coordinates no repeated infraspinatus reconstruction results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Infraspinatus input metadata retains no tendon geometry, muscle voxel set or MRI task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyInfraspinatusMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
