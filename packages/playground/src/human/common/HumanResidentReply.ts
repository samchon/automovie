import type { IHumanResidentFailure } from "./IHumanResidentFailure";
import type { IHumanResidentSuccess } from "./IHumanResidentSuccess";

/**
 * A correlated successful value or numerical refusal from the resident runtime.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Keeps refusal and successful candidate publication as distinct alternatives.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Shares the discriminated numerical reply between worker and caller.
 * @author Samchon
 */
export type HumanResidentReply<Output> = IHumanResidentSuccess<Output> | IHumanResidentFailure;
