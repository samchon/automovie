/**
 * A numerical refusal belonging to one resident request, without a candidate value.
 *
 * @author Samchon
 */
export interface IHumanResidentFailure {
  /** Identity of the refused request. */
  id: number;

  /** Refusal discriminator. */
  success: false;

  /** Runtime's reported refusal reason. */
  error: string;
}
