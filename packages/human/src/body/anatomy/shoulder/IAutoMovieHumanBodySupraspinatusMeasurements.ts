import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * From supraspinous fossa to humeral greater tubercle, passing beneath the acromion. Its tendon has a different joint relationship from deltoid. One belly's volume or MRI fat fraction cannot by itself locate its tendon.
 *
 * @evidence contracts/common.md#principled-implementation Supraspinatus uses shared muscle-belly volume/PDFF quantities while retaining its superior scapular anatomical identity.
 * @evidence contracts/common.md#clear-and-simple-design The cuff member names supraspinatus and reuses the common muscle measurement contract without duplicating acquisition fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A scalar belly measurement cannot determine its subacromial tendon route or replace deltoid's joint relationship.
 * @evidence contracts/common.md#meaningful-documentation Documentation gives supraspinous-fossa ownership, the greater-tubercle endpoint and missing tendon localization.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Supraspinatus quantity typing computes no subacromial route or superior cuff shape.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The superior cuff alias coordinates no reusable tendon-path solve or muscle reconstruction.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Its measured scalar schema retains no subacromial mesh or tendon solver allocation.
 * @author Samchon
 */
export type IAutoMovieHumanBodySupraspinatusMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
