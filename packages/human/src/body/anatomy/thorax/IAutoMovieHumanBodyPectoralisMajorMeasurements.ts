import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Target or observed pectoralis-major volume or MRI fat fraction, separate from breast.
 *
 * It spans the clavicle, sternum and anterior thorax to insert on the humerus. That cross-group attachment is part of generated anatomy; the body's current rounded chest exterior cannot serve as a measured muscle boundary. This scalar is a muscle-belly volume, not a breast size, skin-depth displacement or arbitrary pectoral morph gain.
 *
 * @evidence contracts/common.md#principled-implementation Pectoralis major uses shared belly-volume/PDFF quantities while retaining a muscle identity distinct from breast tissue.
 * @evidence contracts/common.md#clear-and-simple-design Trunk ownership contains the belly and leaves its cross-group humeral attachment to separate generated relations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rounded chest skin, breast size or pectoral morph gain cannot substitute for an independently measured pectoralis boundary or volume.
 * @evidence contracts/common.md#meaningful-documentation The prose gives clavicular/sternal origins, humeral insertion and separation from external displacement and breast compartments.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Pectoralis quantity typing performs no chest-muscle segmentation or cross-group tendon geometry.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pectoral muscle alias stores no evaluated belly boundary or humeral attachment result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pectoralis scalar inputs own no chest mesh, imaging contour or tendon solver.
 * @author Samchon
 */
export type IAutoMovieHumanBodyPectoralisMajorMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
