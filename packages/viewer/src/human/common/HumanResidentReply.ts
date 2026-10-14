import type { IHumanResidentFailure } from "./IHumanResidentFailure.js";
import type { IHumanResidentSuccess } from "./IHumanResidentSuccess.js";

/**
 * A correlated successful value or numerical refusal from the resident runtime.
 *
 * @evidence contracts/common.md#principled-implementation The success discriminator selects either a typed numerical value or an error string with the same request id; createHumanResidentWorker correlates that id before settling a pending request.
 * @evidence contracts/common.md#clear-and-simple-design The union composes the two existing reply records instead of mixing optional value and error fields that could describe contradictory outcomes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Numerical refusals do not carry a fabricated candidate value. This static union does not validate untrusted native event data at runtime.
 * @evidence contracts/common.md#meaningful-documentation The comment states correlation and mutually exclusive success/refusal meaning; member types describe id, payload and error ownership.
 * @evidence contracts/performance.md#efficient-algorithms Discriminator and id inspection are constant work; transferable output size and numerical evaluation dominate transport costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Every envelope belongs to one actual request. A repeated id or equal payload does not authorize a second settlement or sharing request effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Reply data belongs to the request consumer after settlement. The union retains no worker or callback; pending-map removal and stale-reply rejection belong to the resident coordinator.
 *
 * @author Samchon
 */
export type HumanResidentReply<Output> =
  | IHumanResidentSuccess<Output>
  | IHumanResidentFailure;
