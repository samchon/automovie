/** Data contracts shared by the MeasureModelContacts operation. */
export namespace IAutoMovieMeasureModelContacts {
  /**
   * What decides a contact report: the distance below which two parts that do
   * not cross count as touching. `measureModelContacts` refuses a
   * missing, negative or non-finite distance.
   */
  export interface IOptions {
    /**
     * The contact distance in metres: a pair whose gap is at most this, and
     * that neither crosses nor contains, is `touching`.
     */
    contact: number;
  }
}
