import { IAutoMovieReviewNote } from "../harness/IAutoMovieReviewNote";

/**
 * Evidence-first human or agent decision about one performed shot.
 *
 * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-evidence-producer-authority Exposes `IAutoMovieShotReviewWrite` as the portable data boundary for the agent evidence producer authority requirement.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Types `IAutoMovieShotReviewWrite` for the spec authoring runtime evidence authority invariant system contract.
 */
export interface IAutoMovieShotReviewWrite {
  /**
   * Reviewed script beat.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-evidence-producer-authority Exposes `beat` as the portable data boundary for the agent evidence producer authority requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Types `beat` for the spec authoring runtime evidence authority invariant system contract.
   */
  beat: string;

  /**
   * Concrete observations from current render evidence.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-evidence-producer-authority Exposes `observations` as the portable data boundary for the agent evidence producer authority requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Types `observations` for the spec authoring runtime evidence authority invariant system contract.
   */
  observations: string;

  /**
   * Pass only when no correction note remains open.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-evidence-producer-authority Exposes `verdict` as the portable data boundary for the agent evidence producer authority requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Types `verdict` for the spec authoring runtime evidence authority invariant system contract.
   */
  verdict: "pass" | "revise";

  /**
   * Located corrections; non-empty exactly when verdict is revise.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-evidence-producer-authority Exposes `notes` as the portable data boundary for the agent evidence producer authority requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Types `notes` for the spec authoring runtime evidence authority invariant system contract.
   */
  notes: IAutoMovieReviewNote[];
}
