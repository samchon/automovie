import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";
import type { ConnectedFaceResult } from "@automovie/human/face/runtime/ConnectedFaceResult";

/**
 * One original product result, error or document-admission response.
 *
 * @evidence contracts/common.md#principled-implementation Correlated product values, admission verdicts and execution errors preserve the original numerical owner's alternatives.
 * @evidence contracts/common.md#clear-and-simple-design One request id scopes optional result fields without adding a second model schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A refused or failed computation retains its cause and does not substitute a cached preview.
 * @evidence contracts/common.md#meaningful-documentation Missing value denotes no model result; null admission reason belongs to the owner's accepted document outcome.
 *
 * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Correlated product values, admission verdicts and execution errors preserve the original numerical owner's alternatives.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant A refused or failed computation retains its cause and does not substitute a cached preview.
 * @author Samchon
 */
export interface IHumanViewerNumericalReply {
  /**
   * Request correlation within one owned numerical realm.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Correlates the original product reply with its request in the same owned numerical realm.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Correlates the original product reply with its request in the same owned numerical realm.
   */
  id: number;

  /**
   * A successful build retains the original operation and complete value.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Preserves the original numerical outcome without treating missing output as a successful preview.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Preserves the original numerical outcome without treating missing output as a successful preview.
   */
  success?: boolean;

  /**
   * Original preview or construct; no rejected draft becomes a preview.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Carries the original complete Face or Body/Person product value rather than a viewer-only replacement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Carries the original complete Face or Body/Person product value rather than a viewer-only replacement.
   */
  value?: ConnectedFaceResult | ConnectedBodyResult;

  /**
   * Completed runtime cost, not an admission estimate.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Reports actually completed worker cost rather than an admission or remaining-time estimate.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Reports actually completed worker cost rather than an admission or remaining-time estimate.
   */
  buildMs?: number;

  /**
   * Original document-only admission alternative.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Keeps document-only admission replies distinct from model-producing operations.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Keeps document-only admission replies distinct from model-producing operations.
   */
  admission?: boolean;

  /**
   * Original admission reason; null means admitted by that owner.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Preserves the original domain admission refusal, with null for that owner's accepted outcome.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Preserves the original domain admission refusal, with null for that owner's accepted outcome.
   */
  reason?: string | null;

  /**
   * Failed execution reason, without a manufactured numerical value.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Reports actual execution failure without supplying a fabricated numerical value.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Reports actual execution failure without supplying a fabricated numerical value.
   */
  error?: string;
}
