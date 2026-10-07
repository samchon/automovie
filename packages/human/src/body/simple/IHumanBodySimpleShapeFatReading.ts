/**
 * Table-model body-fat estimate and the excess its definition gates consume.
 * Both quantities are percentages, with excess measured in percentage points
 * above the table's sex-conditioned essential-fat estimate. These derived
 * values retain the regression owner's qualification and are not observations.
 *
 * @evidence contracts/common.md#principled-implementation Separates the model estimate from its essential-fat subtraction so consumers retain each quantity's meaning.
 * @evidence contracts/common.md#clear-and-simple-design One result record carries the two existing outputs of the fat-model calculation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Transports the computed estimate without substituting a measured personal value.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes percent from percentage-point excess and identifies both as model-derived.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping This result defines no part or assembly.
 * @evidenceExclude contracts/modeling.md#parameter-channels The simple document and table own channels; this carrier defines none.
 * @evidenceExclude contracts/modeling.md#emitted-geometry This result selects no primitive population.
 * @evidenceExclude contracts/modeling.md#spatial-conventions These scalar percentages carry no spatial frame or conversion.
 * @evidenceExclude contracts/modeling.md#shared-boundaries This carrier builds no tissue boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The simple-body consumer owns its displayed output; this record displays none.
 * @evidence contracts/anatomy.md#anatomical-source Preserves the table and fat-calculation owners' regression estimates without claiming a new acquisition or personal body-fat measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The simple input and definition-gate owners admit values; this result imposes no range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This derived result is not an additional person-authoring input.
 * @author Samchon
 */
export interface IHumanBodySimpleShapeFatReading {
  /** Body-fat estimate in percent from the table's age-conditioned model. */
  percent: number;

  /** Percentage-point excess above the table's essential-fat estimate. */
  excess: number;
}
