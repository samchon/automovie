import type { IHumanResidentFailure } from "./IHumanResidentFailure.js";
import type { IHumanResidentSuccess } from "./IHumanResidentSuccess.js";

/**
 * A correlated successful value or numerical refusal from the resident runtime.
 *
 * @author Samchon
 */
export type HumanResidentReply<Output> =
  | IHumanResidentSuccess<Output>
  | IHumanResidentFailure;
