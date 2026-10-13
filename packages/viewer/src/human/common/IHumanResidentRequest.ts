/**
 * Immutable numerical input and its correlation identity sent to a resident worker.
 *
 * @author Samchon
 */
export interface IHumanResidentRequest<Input> {
  /** Monotonically assigned identity of this connection's request. */
  id: number;

  /** Numerical input admitted by the selected runtime. */
  input: Input;
}
