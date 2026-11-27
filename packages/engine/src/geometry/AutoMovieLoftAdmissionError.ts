/**
 * A required loft reading failed its explicit numeric or derivative admission.
 *
 * Surface publication can refuse this reading with null while direct queries
 * still throw. Structural source/binding failures and exceptions from actual
 * callbacks use their original errors and must not be converted to this type.
 */
export class AutoMovieLoftAdmissionError extends Error {
  /**
   * Keep the numeric producer's diagnostic and identify the narrow recovery
   * type.
   */
  public constructor(message: string) {
    super(message);
    this.name = "AutoMovieLoftAdmissionError";
  }
}
