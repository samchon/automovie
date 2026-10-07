import type { IAutoMovieHumanFaceAttachmentChart } from "./IAutoMovieHumanFaceAttachmentChart";

/**
 * Source-owned upper and lower material disks, sharing actual canthal paths.
 *
 * @evidence contracts/common.md#principled-implementation Upper and lower registers retain independent actual skin disks and their shared canthal source correspondence.
 * @evidence contracts/common.md#clear-and-simple-design Two named records preserve the lid split without embedding skin geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject identity or painted UV determines the disk association.
 * @evidence contracts/common.md#meaningful-documentation Names each disk's source extent and shared boundary ownership.
 * @evidence contracts/modeling.md#shared-boundaries The publisher selects both disks from the same host and shared canthal edge paths.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping These records associate metadata with lids rather than defining anatomical parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels Registers source coordinates, not numerical shape channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Supplies no independent triangle population.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The chart member owns coordinate and ordinal conventions.
 * @evidenceExclude contracts/modeling.md#rendered-observation Tissue consumers observe the resulting attached shells.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Source disks are topological conventions, not clinical measurements.
 * @evidenceExclude contracts/anatomy.md#permitted-range No physiological range is defined here.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Source registration adds no personal geometry input.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularAttachmentCharts {
  /** Actual upper skin from posterior margin through outer attachment. */
  upper: IAutoMovieHumanFaceAttachmentChart;

  /** Actual lower skin from posterior margin through outer attachment. */
  lower: IAutoMovieHumanFaceAttachmentChart;
}
