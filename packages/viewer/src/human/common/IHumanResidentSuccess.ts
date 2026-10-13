/**
 * A resident worker's successful numerical value for one request.
 *
 * @author Samchon
 */
export interface IHumanResidentSuccess<Output> {
  /** Identity of the request that produced the value. */
  id: number;

  /** Successful reply discriminator. */
  success: true;

  /** Evaluated numerical value. */
  value: Output;
}
