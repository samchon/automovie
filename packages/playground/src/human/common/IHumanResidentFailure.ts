/**
 * A numerical refusal belonging to one resident request, without a candidate value.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Keeps a refused edit from replacing the committed candidate.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Correlates the failure reason independently of transport connection failure.
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
