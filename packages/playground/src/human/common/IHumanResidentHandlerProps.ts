import type { HumanResidentReply } from "./HumanResidentReply";

/**
 * Preparation and reply transport for one resident numerical runtime. Each
 * request awaits the same preparation result; its own error boundary retains
 * the initiating correlation id even when preparation rejects.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Supplies numerical evaluation and correlated replies without publishing a partial preview.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Keeps shared initialization distinct from each request's settlement.
 * @author Samchon
 */
export interface IHumanResidentHandlerProps<Input, Output> {
  /**
   * Shared runtime preparation; the resulting evaluator owns input admission.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Supplies the numerical owner whose failures retain the committed editor state.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Preserves asynchronous preparation before each correlated evaluation.
   */
  prepare: Promise<(input: Input) => Promise<Output>>;

  /**
   * Publish the evaluated value or refusal under the original request id.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Reports numerical refusal without changing the editor's committed candidate.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Delivers both reply alternatives through the same request correlation protocol.
   */
  send: (reply: HumanResidentReply<Output>) => void;
}
