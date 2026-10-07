/**
 * Immutable numerical input and its correlation identity sent to a resident worker.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Associates one immutable input with the request whose result may be published.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Defines the resident request envelope independently of browser allocation.
 * @author Samchon
 */
export interface IHumanResidentRequest<Input> {
  /** Monotonically assigned identity of this connection's request. */
  id: number;

  /** Numerical input admitted by the selected runtime. */
  input: Input;
}
