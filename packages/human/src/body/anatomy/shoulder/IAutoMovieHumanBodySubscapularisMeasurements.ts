import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * From anterior subscapular fossa to humeral lesser tubercle. It lies between scapula and rib cage, deep to the axilla. One belly's volume or MRI fat fraction cannot by itself locate its tendon.
 *
 * @evidence contracts/common.md#principled-implementation Subscapularis adopts independently supplied belly volume and MRI fat fraction for the anterior scapular muscle.
 * @evidence contracts/common.md#clear-and-simple-design Cuff ownership names this belly while shared muscle measurements define quantity alternatives and provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Volume or composition cannot locate its lesser-tubercle tendon or reconstruct tissue between scapula and rib cage.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies its deep anterior position and the unresolved tendon information.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Subscapularis quantity typing performs no anterior-fossa tissue segmentation or axillary surface evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This anterior cuff alias holds no completed subscapularis attachment registration to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Subscapularis metadata owns no anterior muscle boundary, MRI dataset or active registration.
 * @author Samchon
 */
export type IAutoMovieHumanBodySubscapularisMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
