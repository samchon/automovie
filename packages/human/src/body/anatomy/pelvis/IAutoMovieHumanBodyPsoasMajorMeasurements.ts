import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Psoas major belly from lumbar spine toward the lesser femoral trochanter.
 *
 * This hip flexor crosses trunk, pelvis and thigh; its separate volume cannot be read from skin hip girth or replaced by the iliacus belly.
 *
 * @evidence contracts/common.md#principled-implementation Psoas major reuses muscle quantity provenance while retaining its lumbar-origin and lesser-trochanter anatomical identity.
 * @evidence contracts/common.md#clear-and-simple-design One named flexor belly spans regions through attachments without duplicating iliacus measurement ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Skin hip girth cannot supply psoas volume and iliacus cannot replace its separately owned belly.
 * @evidence contracts/common.md#meaningful-documentation The description names cross-region attachment span and limits of exterior or neighboring-muscle proxies.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Psoas quantity typing performs no hip-flexor path solving or lumbar muscle segmentation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The psoas alias coordinates no shared iliacus substitution or repeated volume integration.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Psoas metadata acquires no lumbar scans, tendon-path buffers or flexor simulation handles.
 * @author Samchon
 */
export type IAutoMovieHumanBodyPsoasMajorMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
