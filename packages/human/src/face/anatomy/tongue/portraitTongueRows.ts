/**
 * How many rings the lingual surface is sampled along, root to tip.
 *
 * The count is a tessellation choice, not a measurement: it decides how finely
 * the sampled surface follows the authored profile and nothing about the shape
 * that profile describes.
 *
 * @evidence contracts/common.md#principled-implementation The ring count is a tessellation constant that decides only how finely the surface follows the authored longitudinal profile.
 * @evidence contracts/common.md#clear-and-simple-design One constant read by the builder and the station function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The constant names no subject; it is the sampling density along the length.
 * @evidence contracts/common.md#meaningful-documentation The comment states that it is a tessellation choice and not a measurement.
 * @evidence contracts/modeling.md#emitted-geometry Ring count is a resolution parameter of the parametric surface; the vertex count is 2 + (rows - 1) times the ring size, independent of the tongue's dimensions.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The constant defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The constant defines no channel.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The constant carries no unit or frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The constant builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The constant owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The constant carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The constant admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a form through this constant.
 * @author Samchon
 */
export const portraitTongueRows = 32;
