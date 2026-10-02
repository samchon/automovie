/**
 * How many samples go round each lingual ring.
 *
 * The count is a tessellation choice, not a measurement. `buildPortraitTongue`
 * lays its vertices out ring by ring with this many samples, so every reader of
 * that layout, `portraitTongueStation` included, takes the count from here.
 *
 * @evidence contracts/common.md#principled-implementation The ring size is a tessellation constant that decides only how finely the sampled ring follows the elliptical section; forty-eight samples keep the chord error of a ring below about 0.2 percent of its radius.
 * @evidence contracts/common.md#clear-and-simple-design One constant read by the builder and the station function, so the vertex layout has one source.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The constant names no subject; it is the sampling density of the ring.
 * @evidence contracts/common.md#meaningful-documentation The comment states that it is a tessellation choice and who reads the layout.
 * @evidence contracts/modeling.md#emitted-geometry Ring size is a resolution parameter of the parametric ellipse; the vertex count is 2 + (rows - 1) times this constant, independent of the tongue's dimensions.
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
export const portraitTongueColumns = 48;
