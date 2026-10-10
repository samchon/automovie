/**
 * Table-model body-fat estimate and the excess its definition gates consume.
 * Both quantities are percentages, with excess measured in percentage points
 * above the table's sex-conditioned essential-fat estimate. These derived
 * values retain the regression owner's qualification and are not observations.
 *
 * @author Samchon
 */
export interface IHumanBodySimpleShapeFatReading {
  /** Body-fat estimate in percent from the table's age-conditioned model. */
  percent: number;

  /** Percentage-point excess above the table's essential-fat estimate. */
  excess: number;
}
