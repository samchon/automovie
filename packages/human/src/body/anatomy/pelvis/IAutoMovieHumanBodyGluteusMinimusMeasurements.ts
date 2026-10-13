import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Target or observed gluteus minimus volume or MRI fat fraction, deep to medius.
 *
 * Its iliac origin and anterior greater-trochanter insertion are distinct from medius. The volume is an internal tissue scalar, not an exterior skin control; overlap or a copied medius volume would double-count tissue. The generator must establish its own surface and attachments separately.
 *
 * @evidence contracts/common.md#principled-implementation Minimus inherits muscle volume/fraction provenance while retaining independent deepest-gluteal tissue ownership.
 * @evidence contracts/common.md#clear-and-simple-design One named muscle alias shares scalar definitions without merging the overlying medius component.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Copying medius volume or using exterior skin controls would double-count or replace minimus tissue.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes minimus sites, internal quantity meaning and separately required surface/attachment generation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Minimus quantity typing performs no deep-gluteal surface extraction or skin deformation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The minimus alias coordinates no shared medius/minimus volume solve across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Deep minimus metadata retains no tissue segmentation arrays or anatomical solver resources.
 * @author Samchon
 */
export type IAutoMovieHumanBodyGluteusMinimusMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
